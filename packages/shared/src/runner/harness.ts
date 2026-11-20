import type { CaseResult, Harness, HarnessEnv, RunRequest, RunResult } from './types.js'

/**
 * Test harness for coding tasks (contracts/code-runner.md → Harness semantics).
 *
 * IMPORTANT: this function must stay self-contained — no references to module-level values and no
 * imports other than types — because the browser runner embeds `createHarness.toString()` into a
 * Blob worker inside a sandboxed iframe. Node (content:validate) calls it directly.
 */
export function createHarness(env: HarnessEnv): Harness {
  const MAX_CONSOLE_LINES = 100
  const MAX_LINE = 500
  const MAX_VALUE = 1000

  class AssertionError extends Error {
    constructor(
      message: string,
      readonly expected?: unknown,
      readonly actual?: unknown,
      readonly hasValues = false,
    ) {
      super(message)
      this.name = 'AssertionError'
    }
  }

  /** Error check that also works for errors from another realm (vm contexts, iframes). */
  function isErrorLike(value: unknown): value is { name: string; message: string } {
    return (
      value instanceof Error ||
      (typeof value === 'object' &&
        value !== null &&
        typeof (value as { message?: unknown }).message === 'string' &&
        typeof (value as { name?: unknown }).name === 'string')
    )
  }

  function serialize(value: unknown): string {
    const seen = new WeakSet<object>()
    const walk = (v: unknown, depth: number): string => {
      if (v === undefined) return 'undefined'
      if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v)
      if (typeof v === 'bigint') return `${v}n`
      if (typeof v === 'string') return JSON.stringify(v)
      if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`
      if (typeof v === 'symbol') return v.toString()
      if (v === null || typeof v !== 'object') return String(v)
      if (seen.has(v)) return '[Circular]'
      if (depth > 6) return '[…]'
      seen.add(v)
      if (Array.isArray(v)) return `[${v.map((x) => walk(x, depth + 1)).join(', ')}]`
      if (v instanceof Date)
        return `Date(${Number.isNaN(v.getTime()) ? 'Invalid' : v.toISOString()})`
      if (isErrorLike(v)) return `${v.name}: ${v.message}`
      if (v instanceof Map) {
        return `Map {${[...v].map(([k, x]) => `${walk(k, depth + 1)} => ${walk(x, depth + 1)}`).join(', ')}}`
      }
      if (v instanceof Set) return `Set {${[...v].map((x) => walk(x, depth + 1)).join(', ')}}`
      if (v instanceof Promise) return 'Promise {…}'
      const entries = Object.keys(v).map(
        (k) =>
          `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${walk((v as Record<string, unknown>)[k], depth + 1)}`,
      )
      const proto = Object.getPrototypeOf(v)
      const prefix =
        proto && proto !== Object.prototype && proto.constructor?.name
          ? `${proto.constructor.name} `
          : ''
      return `${prefix}{${entries.join(', ')}}`
    }
    const text = walk(value, 0)
    return text.length > MAX_VALUE ? `${text.slice(0, MAX_VALUE)}…` : text
  }

  function deepEqual(a: unknown, b: unknown, seen = new Map<object, object>()): boolean {
    if (Object.is(a, b)) return true
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false
    if (seen.get(a) === b) return true
    seen.set(a, b)
    if (a instanceof Date) return a.getTime() === (b as Date).getTime()
    if (a instanceof RegExp) return String(a) === String(b)
    if (a instanceof Map) {
      const mb = b as Map<unknown, unknown>
      if (a.size !== mb.size) return false
      for (const [k, v] of a) if (!mb.has(k) || !deepEqual(v, mb.get(k), seen)) return false
      return true
    }
    if (a instanceof Set) {
      const sb = b as Set<unknown>
      if (a.size !== sb.size) return false
      for (const v of a) if (!sb.has(v)) return false
      return true
    }
    if (Array.isArray(a)) {
      const ab = b as unknown[]
      return a.length === ab.length && a.every((v, i) => deepEqual(v, ab[i], seen))
    }
    const ka = Object.keys(a)
    const kb = Object.keys(b)
    if (ka.length !== kb.length) return false
    return ka.every(
      (k) =>
        Object.prototype.hasOwnProperty.call(b, k) &&
        deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], seen),
    )
  }

  function matches(error: unknown, match?: string | RegExp): boolean {
    if (match === undefined) return true
    const message = isErrorLike(error) ? error.message : String(error)
    return typeof match === 'string' ? message.includes(match) : match.test(message)
  }

  const assert = {
    equal(actual: unknown, expected: unknown, message?: string) {
      if (!Object.is(actual, expected)) {
        throw new AssertionError(message ?? 'Values are not strictly equal', expected, actual, true)
      }
    },
    deepEqual(actual: unknown, expected: unknown, message?: string) {
      if (!deepEqual(actual, expected)) {
        throw new AssertionError(message ?? 'Values are not deeply equal', expected, actual, true)
      }
    },
    ok(value: unknown, message?: string) {
      if (!value) throw new AssertionError(message ?? 'Expected a truthy value', true, value, true)
    },
    throws(fn: () => unknown, match?: string | RegExp, message?: string) {
      try {
        fn()
      } catch (error) {
        if (matches(error, match)) return
        throw new AssertionError(
          message ?? 'Function threw an unexpected error',
          match,
          error,
          true,
        )
      }
      throw new AssertionError(message ?? 'Expected the function to throw')
    },
    async rejects(
      target: Promise<unknown> | (() => Promise<unknown>),
      match?: string | RegExp,
      message?: string,
    ) {
      try {
        await (typeof target === 'function' ? target() : target)
      } catch (error) {
        if (matches(error, match)) return
        throw new AssertionError(
          message ?? 'Promise rejected with an unexpected error',
          match,
          error,
          true,
        )
      }
      throw new AssertionError(message ?? 'Expected the promise to reject')
    },
  }

  /** Virtual clock: fake timer functions + Date.now/performance.now driven by tick(). */
  function createClock() {
    let now = 0
    let nextId = 1
    const timers = new Map<
      number,
      { at: number; fn: (...a: unknown[]) => void; args: unknown[]; interval?: number }
    >()

    const schedule = (fn: unknown, ms: unknown, args: unknown[], interval: boolean) => {
      if (typeof fn !== 'function') throw new TypeError('Callback must be a function')
      const delay = Math.max(0, Number(ms) || 0)
      const id = nextId++
      timers.set(id, {
        at: now + delay,
        fn: fn as (...a: unknown[]) => void,
        args,
        ...(interval ? { interval: Math.max(1, delay) } : {}),
      })
      return id
    }

    const nextDue = (until: number) => {
      let best: [number, { at: number }] | undefined
      for (const entry of timers) {
        if (
          entry[1].at <= until &&
          (!best || entry[1].at < best[1].at || (entry[1].at === best[1].at && entry[0] < best[0]))
        ) {
          best = entry
        }
      }
      return best?.[0]
    }

    const fire = (id: number) => {
      const timer = timers.get(id)!
      now = timer.at
      if (timer.interval) timer.at += timer.interval
      else timers.delete(id)
      timer.fn(...timer.args)
    }

    const flushMicrotasks = async () => {
      for (let i = 0; i < 20; i++) await null
    }

    const api = {
      setTimeout: (fn: unknown, ms?: unknown, ...args: unknown[]) => schedule(fn, ms, args, false),
      setInterval: (fn: unknown, ms?: unknown, ...args: unknown[]) => schedule(fn, ms, args, true),
      clearTimeout: (id: unknown) => void timers.delete(id as number),
      clearInterval: (id: unknown) => void timers.delete(id as number),
    }

    const clock = {
      now: () => now,
      /** Advance time by `ms`, running due timers in order (synchronously). */
      tick(ms: number) {
        const until = now + Math.max(0, ms)
        let guard = 0
        for (let id = nextDue(until); id !== undefined; id = nextDue(until)) {
          if (++guard > 10_000) throw new Error('clock.tick: too many timers (infinite interval?)')
          fire(id)
        }
        now = until
      },
      /** Like tick, but flushes promise microtasks before and after each timer. */
      async tickAsync(ms: number) {
        const until = now + Math.max(0, ms)
        let guard = 0
        await flushMicrotasks()
        for (let id = nextDue(until); id !== undefined; id = nextDue(until)) {
          if (++guard > 10_000)
            throw new Error('clock.tickAsync: too many timers (infinite interval?)')
          fire(id)
          await flushMicrotasks()
        }
        now = until
      },
      /** Run every pending timer (and microtasks) until none are left. */
      async runAll() {
        let guard = 0
        await flushMicrotasks()
        for (let id = nextDue(Infinity); id !== undefined; id = nextDue(Infinity)) {
          if (++guard > 10_000)
            throw new Error('clock.runAll: too many timers (infinite interval?)')
          fire(id)
          await flushMicrotasks()
        }
      },
      pending: () => timers.size,
    }

    class FakeDate extends Date {
      constructor(...args: unknown[]) {
        if (args.length === 0) super(now)
        else super(...(args as [string]))
      }
      static override now() {
        return now
      }
    }

    return { clock, api, FakeDate, performance: { now: () => now } }
  }

  function createConsole(lines: string[]) {
    const push = (level: string, args: unknown[]) => {
      if (lines.length >= MAX_CONSOLE_LINES) return
      const text = args.map((a) => (typeof a === 'string' ? a : serialize(a))).join(' ')
      const line = level === 'log' ? text : `[${level}] ${text}`
      lines.push(line.length > MAX_LINE ? `${line.slice(0, MAX_LINE)}…` : line)
      if (lines.length === MAX_CONSOLE_LINES) lines.push('… output truncated')
    }
    return {
      log: (...a: unknown[]) => push('log', a),
      info: (...a: unknown[]) => push('info', a),
      warn: (...a: unknown[]) => push('warn', a),
      error: (...a: unknown[]) => push('error', a),
      debug: (...a: unknown[]) => push('debug', a),
    }
  }

  const PARAMS = [
    'assert',
    'clock',
    'console',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'Date',
    'performance',
  ]

  async function runCase(
    request: RunRequest,
    test: { name: string; code: string },
    consoleLines: string[],
  ): Promise<CaseResult> {
    const started = env.now()
    const timeoutMs = request.perCaseTimeoutMs ?? 1000
    const { clock, api, FakeDate, performance } = createClock()
    const source =
      `'use strict';\nreturn (async () => {\n${request.code}\n;\n` +
      `if (typeof ${request.entry} === 'undefined') throw new ReferenceError('${request.entry} is not defined — keep the function name from the starter code');\n` +
      `${test.code}\n})()`

    let timer: unknown
    try {
      const fn = env.compile(source, PARAMS)
      const run = Promise.resolve(
        fn(
          assert,
          clock,
          createConsole(consoleLines),
          api.setTimeout,
          api.clearTimeout,
          api.setInterval,
          api.clearInterval,
          FakeDate,
          performance,
        ),
      )
      const timeout = new Promise((_, reject) => {
        timer = env.setTimeout(
          () =>
            reject(
              new Error(
                `Timed out after ${timeoutMs} ms (unresolved promise or waiting on a real timer?)`,
              ),
            ),
          timeoutMs,
        )
      })
      await Promise.race([run, timeout])
      return { name: test.name, status: 'passed', durationMs: env.now() - started }
    } catch (error) {
      const durationMs = env.now() - started
      if (error instanceof AssertionError) {
        return {
          name: test.name,
          status: 'failed',
          message: error.message,
          ...(error.hasValues
            ? { expected: serialize(error.expected), actual: serialize(error.actual) }
            : {}),
          durationMs,
        }
      }
      const message = isErrorLike(error)
        ? `${error.name}: ${error.message}`
        : `Thrown: ${serialize(error)}`
      return { name: test.name, status: 'error', message, durationMs }
    } finally {
      env.clearTimeout(timer)
    }
  }

  return {
    async run(request: RunRequest): Promise<RunResult> {
      const started = env.now()
      const consoleLines: string[] = []
      const cases: CaseResult[] = []
      for (const test of request.tests) cases.push(await runCase(request, test, consoleLines))
      return { cases, console: consoleLines, totalMs: env.now() - started }
    },
  }
}
