import { createDb } from '../src/db.js'
import { syncLibrary } from './content/sync-library.js'
import { formatIssues, validateLibrary } from './content/validate-library.js'

/** Resets the E2E database and loads the fixture library. Refuses to touch non-test databases. */
const url = process.env.DATABASE_URL
if (!url || !/test/i.test(url)) {
  console.error('✗ e2e-reset only runs against a *test* DATABASE_URL')
  process.exit(1)
}

const { library, issues } = await validateLibrary('tests/fixtures/content')
if (!library) {
  console.error(formatIssues(issues))
  process.exit(1)
}

const db = createDb(url)
try {
  const tables = ['QuizAttempt', 'LessonProgress', 'PlanLesson', 'PlanTechnology', 'Plan', 'Session', 'User', 'Lesson', 'Module', 'Technology', 'Track', 'Level']
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`)
  await syncLibrary(db, library)
  console.log('✓ e2e database reset with fixture content')
} finally {
  await db.$disconnect()
}
