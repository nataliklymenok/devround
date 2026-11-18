import path from 'node:path'
import { loadLibrary, type ContentIssue, type LoadedLibrary } from './load.js'
import { checkLibrary, DEFAULT_COVERAGE, findDrafts, type CoverageRules } from './rules.js'
import { verifySolutions } from './verify-solutions.js'

export function resolveContentDir(argDir?: string): string {
  return path.resolve(argDir ?? process.env.CONTENT_DIR ?? '../../content')
}

export interface ValidateOptions {
  coverage?: CoverageRules
  /** Fail on drafts (items without `reviewed:`) — CI gate for PRs into main. */
  requireReviewed?: boolean
  /** Run reference/naive solutions (default true; tests that only need the data can skip it). */
  verifySolutions?: boolean
}

export async function validateLibrary(
  dir: string,
  { coverage = DEFAULT_COVERAGE, requireReviewed = false, verifySolutions: verify = true }: ValidateOptions = {},
): Promise<{ library: LoadedLibrary | null; issues: ContentIssue[] }> {
  const { library, issues } = await loadLibrary(dir)
  if (library) {
    issues.push(...checkLibrary(library, coverage))
    if (verify) issues.push(...(await verifySolutions(library)))
    if (requireReviewed) issues.push(...findDrafts(library))
  }
  return { library: issues.length === 0 ? library : null, issues }
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

export function formatIssues(issues: ContentIssue[]): string {
  return issues.map((i) => `  ${i.file}: [${i.rule}] ${i.message}`).join('\n')
}

/** Value of `--name <value>` from argv. */
export function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}
