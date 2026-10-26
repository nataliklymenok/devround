import path from 'node:path'
import { loadLibrary, type ContentIssue, type LoadedLibrary } from './load.js'
import { checkLibrary, DEFAULT_COVERAGE, type CoverageRules } from './rules.js'

export function resolveContentDir(argDir?: string): string {
  return path.resolve(argDir ?? process.env.CONTENT_DIR ?? '../../content')
}

export async function validateLibrary(
  dir: string,
  coverage: CoverageRules = DEFAULT_COVERAGE,
): Promise<{ library: LoadedLibrary | null; issues: ContentIssue[] }> {
  const { library, issues } = await loadLibrary(dir)
  if (library) issues.push(...checkLibrary(library, coverage))
  return { library: issues.length === 0 ? library : null, issues }
}

export function formatIssues(issues: ContentIssue[]): string {
  return issues.map((i) => `  ${i.file}: [${i.rule}] ${i.message}`).join('\n')
}

/** Value of `--name <value>` from argv. */
export function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}
