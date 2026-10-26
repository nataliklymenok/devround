import { execFileSync } from 'node:child_process'
import path from 'node:path'
import YAML from 'yaml'
import { loadLibrary } from './load.js'
import { collectIds, findRemovedIds, type ContentIds } from './rules.js'
import { argValue, formatIssues, resolveContentDir } from './validate-library.js'

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

/** Lesson and module ids of the library as it exists at `ref`. */
function idsAtRef(ref: string, contentRel: string): ContentIds {
  const files = git(['ls-tree', '-r', '--name-only', ref, '--', contentRel]).split('\n').filter(Boolean)
  const ids: ContentIds = { lessons: [], modules: [] }
  for (const file of files) {
    const rel = path.posix.relative(contentRel, file)
    if (rel.split('/').length !== 3) continue // <track>/<technology>/<file>
    if (rel.endsWith('.md')) ids.lessons.push(path.posix.basename(rel, '.md'))
    if (rel.endsWith('/modules.yaml')) {
      const parsed = YAML.parse(git(['show', `${ref}:${file}`])) as { modules?: { id?: string }[] }
      ids.modules.push(...(parsed.modules ?? []).flatMap((m) => (m.id ? [m.id] : [])))
    }
  }
  return ids
}

const base = argValue('base')
if (!base) {
  console.error('usage: content:check-ids --base <git-ref> [--dir <content-dir>]')
  process.exit(2)
}

const dir = resolveContentDir(argValue('dir'))
const repoRoot = git(['rev-parse', '--show-toplevel']).trim()
const contentRel = path.relative(repoRoot, dir).split(path.sep).join('/')

const { library, issues: loadIssues } = await loadLibrary(dir)
if (!library) {
  console.error(`✗ cannot load content:\n${formatIssues(loadIssues)}`)
  process.exit(1)
}

const issues = findRemovedIds(idsAtRef(base, contentRel), collectIds(library), library)
if (issues.length > 0) {
  console.error(`✗ content ids removed without retirement (base ${base}):\n${formatIssues(issues)}`)
  process.exit(1)
}
console.log(`✓ no content ids removed without retirement (base ${base})`)
