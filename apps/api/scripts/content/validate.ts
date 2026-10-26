import { argValue, formatIssues, resolveContentDir, validateLibrary } from './validate-library.js'

const dir = resolveContentDir(argValue('dir'))
const { library, issues } = await validateLibrary(dir)

if (issues.length > 0) {
  console.error(`✗ ${issues.length} content issue(s) in ${dir}:\n${formatIssues(issues)}`)
  process.exit(1)
}
console.log(`✓ content valid: ${library!.lessons.length} lessons in ${dir}`)
