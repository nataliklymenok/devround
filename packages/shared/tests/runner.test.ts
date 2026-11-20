import { describe, expect, it } from 'vitest'
import { createHarness, type RunRequest } from '../src/index.js'

const harness = createHarness({
  compile: (source, params) => new Function(...params, source) as (...args: unknown[]) => unknown,
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  now: () => performance.now(),
})

function run(code: string, tests: Record<string, string>, extra: Partial<RunRequest> = {}) {
  return harness.run({
    code,
    entry: extra.entry ?? 'solution',
    tests: Object.entries(tests).map(([name, c]) => ({ name, code: c })),
    ...extra,
  })
}

describe('assert', () => {
  it('reports passed, failed (with expected/actual) and error', async () => {
    const result = await run('function solution(a, b) { return a + b }', {
      passes: 'assert.equal(solution(1, 2), 3)',
      fails: 'assert.equal(solution(1, 2), 4)',
      errors: 'solution.nope()',
    })
    expect(result.cases.map((c) => c.status)).toEqual(['passed', 'failed', 'error'])
    expect(result.cases[1]).toMatchObject({ expected: '4', actual: '3' })
    expect(result.cases[2]!.message).toMatch(/TypeError/)
  })

  it('compares deeply including Map, Set, Date and nested arrays', async () => {
    const result = await run('const solution = (x) => x', {
      objects: 'assert.deepEqual(solution({ a: [1, { b: 2 }] }), { a: [1, { b: 2 }] })',
      maps: "assert.deepEqual(new Map([['a', 1]]), new Map([['a', 1]]))",
      sets: 'assert.deepEqual(new Set([1, 2]), new Set([2, 1]))',
      dates: 'assert.deepEqual(new Date(5), new Date(5))',
      different: 'assert.deepEqual({ a: 1 }, { a: 1, b: undefined })',
    })
    expect(result.cases.map((c) => c.status)).toEqual(['passed', 'passed', 'passed', 'passed', 'failed'])
  })

  it('supports throws and rejects with message matching', async () => {
    const result = await run(
      "function solution(x) { if (x < 0) throw new RangeError('negative'); return x }",
      {
        throws: "assert.throws(() => solution(-1), 'negative')",
        throwsRegex: 'assert.throws(() => solution(-1), /neg/)',
        notThrown: 'assert.throws(() => solution(1))',
        rejects: "await assert.rejects(Promise.reject(new Error('boom')), 'boom')",
        wrongMessage: "assert.throws(() => solution(-1), 'positive')",
      },
    )
    expect(result.cases.map((c) => c.status)).toEqual(['passed', 'passed', 'failed', 'passed', 'failed'])
  })
})

describe('fake clock', () => {
  const debounce = `
    function solution(fn, wait) {
      let t
      return (...args) => {
        clearTimeout(t)
        t = setTimeout(() => fn(...args), wait)
      }
    }`

  it('drives setTimeout/clearTimeout deterministically', async () => {
    const result = await run(debounce, {
      debounce: `
        const calls = []
        const d = solution((x) => calls.push(x), 100)
        d(1); d(2)
        clock.tick(99)
        assert.deepEqual(calls, [])
        d(3)
        clock.tick(100)
        assert.deepEqual(calls, [3])
        assert.equal(clock.now(), 199)
      `,
    })
    expect(result.cases[0]!.status).toBe('passed')
  })

  it('runs intervals and fakes Date.now / performance.now', async () => {
    const result = await run('const solution = () => Date.now() + performance.now()', {
      interval: `
        let n = 0
        const id = setInterval(() => n++, 10)
        clock.tick(35)
        clearInterval(id)
        clock.tick(100)
        assert.equal(n, 3)
        assert.equal(solution(), 270)
        assert.equal(new Date().getTime(), 135)
      `,
    })
    expect(result.cases[0]).toMatchObject({ status: 'passed' })
  })

  it('tickAsync flushes promise callbacks between timers', async () => {
    const result = await run(
      `async function solution() {
         await new Promise((r) => setTimeout(r, 50))
         await Promise.resolve()
         return 'done'
       }`,
      {
        async: `
          let value
          solution().then((v) => (value = v))
          await clock.tickAsync(50)
          assert.equal(value, 'done')
        `,
      },
    )
    expect(result.cases[0]!.status).toBe('passed')
  })
})

describe('isolation between cases', () => {
  it('evaluates user code freshly for every case', async () => {
    const result = await run('let counter = 0; function solution() { return ++counter }', {
      first: 'assert.equal(solution(), 1)',
      second: 'assert.equal(solution(), 1)',
    })
    expect(result.cases.every((c) => c.status === 'passed')).toBe(true)
  })

  it('reports a helpful error when the entry function is missing', async () => {
    const result = await run('function renamed() {}', { case: 'assert.ok(true)' })
    expect(result.cases[0]!.message).toMatch(/solution is not defined/)
  })

  it('reports syntax errors as errors', async () => {
    const result = await run('function solution( {', { case: 'assert.ok(true)' })
    expect(result.cases[0]!.status).toBe('error')
    expect(result.cases[0]!.message).toMatch(/SyntaxError/)
  })

  it('times out a case whose promise never settles', async () => {
    const result = await run('const solution = () => new Promise(() => {})', { hangs: 'await solution()' }, { perCaseTimeoutMs: 50 })
    expect(result.cases[0]).toMatchObject({ status: 'error', message: expect.stringMatching(/Timed out after 50 ms/) })
  })
})

describe('console capture', () => {
  it('captures output and caps lines and length', async () => {
    const result = await run(
      "function solution() { for (let i = 0; i < 150; i++) console.log('line', i); console.log('x'.repeat(600)) }",
      { logs: 'solution()' },
    )
    expect(result.console[0]).toBe('line 0')
    expect(result.console).toHaveLength(101)
    expect(result.console.at(-1)).toBe('… output truncated')
  })

  it('serializes objects and caps long values', async () => {
    const result = await run("const solution = () => 'x'.repeat(2000)", {
      long: "assert.equal(solution(), 'y')",
      obj: 'console.log({ a: [1, 2], m: new Map([[1, 2]]) })',
    })
    expect(result.cases[0]!.actual!.length).toBeLessThanOrEqual(1001)
    expect(result.console).toContain('{a: [1, 2], m: Map {1 => 2}}')
  })
})

describe('self-containment (browser embedding)', () => {
  it('works when rebuilt from createHarness.toString()', async () => {
    const rebuilt = new Function(`return (${createHarness.toString()})`)() as typeof createHarness
    const h = rebuilt({
      compile: (source, params) => new Function(...params, source) as (...args: unknown[]) => unknown,
      setTimeout: (fn, ms) => setTimeout(fn, ms),
      clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
      now: () => performance.now(),
    })
    const result = await h.run({
      code: 'function solution(f, ms) { let t; return () => { clearTimeout(t); t = setTimeout(f, ms) } }',
      entry: 'solution',
      tests: [{ name: 'timers', code: 'let n = 0; const d = solution(() => n++, 10); d(); d(); clock.tick(10); assert.equal(n, 1)' }],
    })
    expect(result.cases[0]!.status).toBe('passed')
  })
})

describe('cross-realm errors', () => {
  it('formats error-like objects from another realm', async () => {
    const result = await run('function solution() { throw { name: "ForeignError", message: "from vm" } }', {
      foreign: 'solution()',
    })
    expect(result.cases[0]!.message).toBe('ForeignError: from vm')
  })
})
