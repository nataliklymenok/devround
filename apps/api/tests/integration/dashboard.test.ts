import { cp, mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  FIXTURE_CONTENT_DIR,
  buildTestApp,
  jsonHeaders,
  resetDb,
  signIn,
  syncContent,
  retireFixtureLesson,
} from '../helpers.js'

let app: FastifyInstance
let cookie: string
const tmpDirs: string[] = []

beforeAll(async () => {
  app = await buildTestApp()
})
beforeEach(async () => {
  await resetDb()
  await syncContent()
  cookie = await signIn(app, 'ann@example.com')
})
afterAll(async () => {
  await app.close()
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })))
})

function dashboard(as = cookie) {
  return app.inject({ method: 'GET', url: '/api/v1/dashboard', headers: { cookie: as } })
}

async function createPlan() {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/plans',
    headers: { ...jsonHeaders, cookie },
    payload: { trackId: 'frontend', levelId: 'middle', technologyIds: ['react'] },
  })
  expect(res.statusCode).toBe(201)
}

async function submit(lessonId: string, answers: number[]) {
  const res = await app.inject({
    method: 'POST',
    url: `/api/v1/lessons/${lessonId}/attempts`,
    headers: { ...jsonHeaders, cookie },
    payload: { answers },
  })
  expect(res.statusCode).toBe(201)
}

describe('GET /dashboard', () => {
  it('requires auth and an active plan', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/v1/dashboard' })).statusCode).toBe(401)
    const res = await dashboard()
    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('NOT_FOUND')
  })

  it('reflects quiz results (V10)', async () => {
    await createPlan()
    await submit('react-jsx', [0, 1, 2]) // 100
    await submit('react-props', [0, 0, 0]) // 33
    const res = await dashboard()
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      target: { track: 'Frontend', level: 'Middle', technologies: ['React'] },
      overall: { completed: 2, total: 9, percent: 22 }, // 6 lessons + 1 task + 2 exercises
      modules: [
        { id: 'react-basics', title: 'React basics', completed: 2, total: 3 },
        { id: 'react-advanced', title: 'Advanced React', completed: 0, total: 3 },
      ],
      areas: [
        { kind: 'theory', technology: 'React', completed: 2, total: 6 },
        { kind: 'coding', technology: null, completed: 0, total: 1 },
        { kind: 'design', technology: null, completed: 0, total: 2 },
      ],
      averageBestScore: 67,
      topicsToReview: [{ kind: 'lesson', id: 'react-props', title: 'React Props', score: 33 }],
      continue: { kind: 'lesson', id: 'react-state' },
      isComplete: false,
    })
  })

  it('excludes a lesson unpublished by a content re-sync (V12)', async () => {
    await createPlan()
    await submit('react-jsx', [0, 1, 2])

    const dir = await mkdtemp(path.join(os.tmpdir(), 'devround-content-'))
    tmpDirs.push(dir)
    await cp(FIXTURE_CONTENT_DIR, dir, { recursive: true })
    // Coverage only applies to available technologies; mark React unavailable to retire a lesson.
    await retireFixtureLesson(dir, 'react', 'react-jsx')
    await syncContent(dir)

    const body = (await dashboard()).json()
    expect(body.overall).toEqual({ completed: 0, total: 8, percent: 0 })
    expect(body.continue).toEqual({ kind: 'lesson', id: 'react-props' })
    const plan = await app.inject({
      method: 'GET',
      url: '/api/v1/plans/current',
      headers: { cookie },
    })
    const jsx = plan.json().modules[0].lessons[0]
    expect(jsx).toMatchObject({ id: 'react-jsx', isAvailable: false })
  })

  it("does not leak other users' progress", async () => {
    await createPlan()
    await submit('react-jsx', [0, 1, 2])
    const bob = await signIn(app, 'bob@example.com')
    await app.inject({
      method: 'POST',
      url: '/api/v1/plans',
      headers: { ...jsonHeaders, cookie: bob },
      payload: { trackId: 'frontend', levelId: 'middle', technologyIds: ['react'] },
    })
    expect((await dashboard(bob)).json().overall.completed).toBe(0)
  })
})
