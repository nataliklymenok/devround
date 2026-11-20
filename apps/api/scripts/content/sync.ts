import { createDb } from '../../src/db.js'
import { syncLibrary } from './sync-library.js'
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
if (!library) {
  console.error(`✗ sync aborted, ${issues.length} content issue(s):\n${formatIssues(issues)}`)
  process.exit(1)
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('✗ DATABASE_URL is not set')
  process.exit(1)
}

const db = createDb(url)
try {
  const r = await syncLibrary(db, library, { requireReviewed })
  console.log(
    `✓ content synced — lessons: ${r.created} created, ${r.updated} updated, ${r.unchanged} unchanged, ` +
      `${r.unpublished} unpublished; tasks: ${r.tasks.created + r.tasks.updated} changed, ` +
      `${r.tasks.unpublished} unpublished; exercises: ${r.exercises.created + r.exercises.updated} changed, ` +
      `${r.exercises.unpublished} unpublished` +
      (r.drafts > 0 ? `; ${r.drafts} drafts (review before merging into main)` : ''),
  )
} catch (error) {
  console.error(`✗ sync failed: ${(error as Error).message}`)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
