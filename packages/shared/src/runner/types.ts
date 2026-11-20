export interface TestCase {
  name: string
  code: string
}

export interface CaseResult {
  name: string
  status: 'passed' | 'failed' | 'error'
  message?: string
  expected?: string
  actual?: string
  durationMs: number
}

export interface RunResult {
  cases: CaseResult[]
  console: string[]
  totalMs: number
}

export interface RunRequest {
  code: string
  entry: string
  tests: TestCase[]
  perCaseTimeoutMs?: number
}

/** Compiles `source` into a function taking the given parameter names (`new Function` or `vm`). */
export type Compile = (source: string, params: string[]) => (...args: unknown[]) => unknown

export interface HarnessEnv {
  compile: Compile
  setTimeout: (fn: () => void, ms: number) => unknown
  clearTimeout: (id: unknown) => void
  now: () => number
}

export interface Harness {
  run(request: RunRequest): Promise<RunResult>
}
