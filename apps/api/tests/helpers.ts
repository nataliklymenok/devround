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
  // High limits so suites that sign in before every test are not throttled.
  return {
    ...base,
    RATE_LIMIT_PER_MINUTE: 10_000,
    AUTH_RATE_LIMIT_PER_MINUTE: 10_000,
    ...overrides,
  }
}

export async function buildTestApp(overrides: Partial<Config> = {}): Promise<FastifyInstance> {
  return buildApp({
    config: testConfig(overrides),
    db: testDb(),
    verifier: new FakeGoogleVerifier(),
  })
}

/** Headers every mutating request from our web app carries (origin check). */
export const jsonHeaders = { origin: TEST_ORIGIN, 'content-type': 'application/json' }

/** Sign in through the real endpoint with the fake verifier; returns the session cookie header. */
export async function signIn(app: FastifyInstance, email: string): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/google',
    headers: jsonHeaders,
    payload: { credential: `test:${email}` },
  })
  if (res.statusCode !== 200) throw new Error(`sign-in failed: ${res.statusCode} ${res.body}`)
  const cookie = res.cookies.find((c) => c.name === 'dr_session')
  if (!cookie) throw new Error('no session cookie')
  return `dr_session=${cookie.value}`
}
