import { createDb } from '../../src/db.js'
import { syncLibrary } from './sync-library.js'
import { argValue, formatIssues, resolveContentDir, validateLibrary } from './validate-library.js'

const dir = resolveContentDir(argValue('dir'))
const { library, issues } = await validateLibrary(dir)
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
  const r = await syncLibrary(db, library)
  console.log(
    `✓ content synced: ${r.created} created, ${r.updated} updated, ${r.unchanged} unchanged, ${r.unpublished} unpublished`,
  )
} catch (error) {
  console.error(`✗ sync failed: ${(error as Error).message}`)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
