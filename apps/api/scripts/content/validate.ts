import { findDrafts } from './rules.js'
import {
  argValue,
  formatIssues,
  hasFlag,
  resolveContentDir,
  validateLibrary,
} from './validate-library.js'

const dir = resolveContentDir(argValue('dir'))
const requireReviewed = hasFlag('require-reviewed')
const { library, issues } = await validateLibrary(dir, { requireReviewed })

if (issues.length > 0) {
  console.error(`✗ ${issues.length} content issue(s) in ${dir}:\n${formatIssues(issues)}`)
  process.exit(1)
}
const drafts = requireReviewed ? 0 : findDrafts(library!).length
console.log(
  `✓ content valid: ${library!.lessons.length} lessons, ${library!.tasks.length} tasks, ` +
    `${library!.exercises.length} exercises in ${dir}` +
    (drafts > 0 ? ` (${drafts} drafts — review before merging into main)` : ''),
)
