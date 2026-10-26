import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'
import { FakeGoogleVerifier } from '../src/auth/fake-google-verifier.js'
import { loadConfig, type Config } from '../src/config.js'
import { createDb, type Db } from '../src/db.js'
import { syncLibrary } from '../scripts/content/sync-library.js'
import { formatIssues, validateLibrary } from '../scripts/content/validate-library.js'

export const FIXTURE_CONTENT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures/content',
)

let db: Db | undefined

export function testDb(): Db {
  db ??= createDb(process.env.TEST_DATABASE_URL!)
  return db
}

const TABLES = [
  'QuizAttempt',
  'LessonProgress',
  'PlanLesson',
  'PlanTechnology',
  'Plan',
  'Session',
  'User',
  'Lesson',
  'Module',
  'Technology',
  'Track',
  'Level',
]

export async function resetDb(target: Db = testDb()): Promise<void> {
  await target.$executeRawUnsafe(
    `TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
  )
}

export async function syncContent(dir = FIXTURE_CONTENT_DIR, target: Db = testDb()) {
  const { library, issues } = await validateLibrary(dir)
  if (!library) throw new Error(`fixture content invalid:\n${formatIssues(issues)}`)
  return syncLibrary(target, library)
}

export const TEST_ORIGIN = 'http://localhost:5173'

export function testConfig(overrides: Partial<Config> = {}): Config {
  const base = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    AUTH_PROVIDER: 'fake',
    WEB_ORIGIN: TEST_ORIGIN,
  })
  return { ...base, ...overrides }
}

export async function buildTestApp(): Promise<FastifyInstance> {
  return buildApp({ config: testConfig(), db: testDb(), verifier: new FakeGoogleVerifier() })
}

/** Headers every mutating request from our web app carries (origin check). */
export const jsonHeaders = { origin: TEST_ORIGIN, 'content-type': 'application/json' }
