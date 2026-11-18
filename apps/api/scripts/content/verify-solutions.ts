import vm from 'node:vm'
import { createHarness, type Compile } from '@devround/shared'
import type { ContentIssue, LoadedLibrary, LoadedTask } from './load.js'

/** Content code is ours and fast; 2 s keeps CI quick even if a solution loops forever. */
const SYNC_TIMEOUT_MS = 2000

/**
 * Compile in a fresh vm context; every call into the compiled function runs inside the context
 * with a synchronous time limit, so an infinite loop in content code fails instead of hanging CI.
 */
const compile: Compile = (source, params) => {
  const context = vm.createContext({})
  const fn = vm.runInContext(`(function (${params.join(', ')}) {\n${source}\n})`, context, {
    timeout: SYNC_TIMEOUT_MS,
  }) as unknown
  return (...args: unknown[]) => {
    context.__fn = fn
    context.__args = args
    return vm.runInContext('__fn(...__args)', context, { timeout: SYNC_TIMEOUT_MS })
  }
}

const harness = createHarness({
  compile,
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  now: () => performance.now(),
})

async function verifyTask(task: LoadedTask): Promise<ContentIssue[]> {
  if (task.data.mode !== 'tests' || task.solutionCode === null) return []
  const { entry, tests, naiveSolution } = task.data
  const issues: ContentIssue[] = []

  const reference = await harness.run({
    code: task.solutionCode,
    entry,
    tests,
    perCaseTimeoutMs: SYNC_TIMEOUT_MS,
  })
  for (const c of reference.cases.filter((c) => c.status !== 'passed')) {
    issues.push({
      file: task.file,
      rule: 'reference-solution',
      message: `reference solution fails "${c.name}": ${c.message ?? c.status}${c.expected !== undefined ? ` (expected ${c.expected}, actual ${c.actual})` : ''}`,
    })
  }

  const naive = await harness.run({
    code: naiveSolution,
    entry,
    tests,
    perCaseTimeoutMs: SYNC_TIMEOUT_MS,
  })
  if (naive.cases.every((c) => c.status === 'passed')) {
    issues.push({
      file: task.file,
      rule: 'naive-solution',
      message: 'naiveSolution passes every test — the tests are too weak (SC-008)',
    })
  }
  return issues
}

/** Reference solutions must pass all cases; naive solutions must fail at least one (SC-004, SC-008). */
export async function verifySolutions(lib: LoadedLibrary): Promise<ContentIssue[]> {
  const issues: ContentIssue[] = []
  for (const task of lib.tasks) issues.push(...(await verifyTask(task)))
  return issues
}
