import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildTestApp, jsonHeaders, resetDb, signIn, syncContent, testDb } from '../helpers.js'

let app: FastifyInstance
let cookie: string

beforeAll(async () => {
  app = await buildTestApp()
})
beforeEach(async () => {
  await resetDb()
  await syncContent()
  cookie = await signIn(app, 'ann@example.com')
})
afterAll(() => app.close())

const middleReact = { trackId: 'frontend', levelId: 'middle', technologyIds: ['react'] }

function createPlan(payload: unknown, as = cookie) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/plans',
    headers: { ...jsonHeaders, cookie: as },
    payload: payload as object,
  })
}

function currentPlan(as = cookie) {
  return app.inject({ method: 'GET', url: '/api/v1/plans/current', headers: { cookie: as } })
}

describe('GET /catalog', () => {
  it('requires auth', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/v1/catalog' })).statusCode).toBe(401)
  })

  it('returns tracks with technologies and levels in catalog order', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/catalog', headers: { cookie } })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.levels.map((l: { id: string }) => l.id)).toEqual(['junior', 'middle', 'senior'])
    expect(
      body.tracks.map((t: { id: string; isAvailable: boolean }) => [t.id, t.isAvailable]),
    ).toEqual([
      ['frontend', true],
      ['qa', false],
    ])
    expect(body.tracks[0].technologies).toEqual([
      { id: 'javascript', name: 'JavaScript', isAvailable: true },
      { id: 'react', name: 'React', isAvailable: true },
      { id: 'html-css', name: 'HTML & CSS', isAvailable: false },
    ])
  })
})

describe('POST /plans', () => {
  it('creates a plan with only matching lessons in catalog order (201)', async () => {
    const res = await createPlan({ ...middleReact, technologyIds: ['react', 'javascript'] })
    expect(res.statusCode).toBe(201)
    const plan = res.json()
    expect(plan.target).toEqual({
      track: 'Frontend',
      level: 'Middle',
      technologies: ['JavaScript', 'React'],
    })
    expect(plan.modules.map((m: { id: string }) => m.id)).toEqual([
      'js-basics',
      'js-async',
      'react-basics',
      'react-advanced',
    ])
    const lessons = plan.modules.flatMap((m: { lessons: { order: number }[] }) => m.lessons)
    expect(lessons).toHaveLength(12) // fixture: every lesson has "middle"
    expect(lessons.map((l: { order: number }) => l.order)).toEqual(
      lessons.map((_: unknown, i: number) => i + 1),
    )
    expect(lessons[0]).toEqual({
      id: 'js-values',
      order: 1,
      title: 'Js Values',
      description: 'Fixture lesson about Js Values.',
      estimatedMinutes: 15,
      isAvailable: true,
      isDraft: true,
      progress: { completed: false, bestScore: null },
    })
  })

  it('includes live coding tasks and system design exercises for the level (002)', async () => {
    const plan = (
      await createPlan({ ...middleReact, technologyIds: ['react', 'javascript'] })
    ).json()
    expect(plan.tasks.map((t: { id: string }) => t.id)).toEqual([
      'js-sum-array',
      'js-debounce-fx',
      'react-counter-fx',
    ])
    expect(plan.tasks[1]).toEqual({
      id: 'js-debounce-fx',
      order: 2,
      title: 'Implement debounce',
      technology: 'JavaScript',
      difficulty: 'medium',
      estimatedMinutes: 20,
      mode: 'tests',
      isAvailable: true,
      isDraft: false,
      progress: { status: null, lastCheck: null },
    })
    expect(plan.tasks[2].mode).toBe('self-check')
    expect(plan.exercises.map((e: { id: string }) => e.id)).toEqual([
      'sd-fx-autocomplete',
      'sd-fx-feed',
    ])

    const junior = (
      await createPlan({
        ...middleReact,
        levelId: 'junior',
        technologyIds: ['javascript'],
        replaceExisting: true,
      })
    ).json()
    expect(junior.tasks.map((t: { id: string }) => t.id)).toEqual(['js-sum-array'])
    expect(junior.exercises.map((e: { id: string }) => e.id)).toEqual(['sd-fx-feed'])
  })

  it('only includes lessons for the chosen level', async () => {
    const plan = (await createPlan({ ...middleReact, levelId: 'junior' })).json()
    expect(plan.modules.map((m: { id: string }) => m.id)).toEqual(['react-basics'])
  })

  it('produces identical plans for identical choices (V6)', async () => {
    const other = await signIn(app, 'bob@example.com')
    const a = (await createPlan(middleReact)).json()
    const b = (await createPlan(middleReact, other)).json()
    expect(b.modules).toEqual(a.modules)
  })

  it.each([
    ['empty technologies', { ...middleReact, technologyIds: [] }],
    ['duplicate technologies', { ...middleReact, technologyIds: ['react', 'react'] }],
    ['missing level', { trackId: 'frontend', technologyIds: ['react'] }],
    ['unknown level', { ...middleReact, levelId: 'principal' }],
  ])('rejects %s with 400', async (_name, payload) => {
    const res = await createPlan(payload)
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it.each([
    ['unavailable track', { trackId: 'qa', levelId: 'middle', technologyIds: ['react'] }],
    ['unavailable technology', { ...middleReact, technologyIds: ['html-css'] }],
    ['unknown technology', { ...middleReact, technologyIds: ['svelte'] }],
  ])('rejects %s with 422', async (_name, payload) => {
    const res = await createPlan(payload)
    expect(res.statusCode).toBe(422)
    expect(res.json().error.code).toBe('TRACK_UNAVAILABLE')
  })

  it('returns 409 when an active plan exists and replaceExisting is false', async () => {
    await createPlan(middleReact)
    const res = await createPlan(middleReact)
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('ACTIVE_PLAN_EXISTS')
  })

  it('archives the previous plan when replaceExisting is true (V7)', async () => {
    const first = (await createPlan(middleReact)).json()
    const res = await createPlan({
      ...middleReact,
      technologyIds: ['javascript'],
      replaceExisting: true,
    })
    expect(res.statusCode).toBe(201)
    const old = await testDb().plan.findUniqueOrThrow({ where: { id: first.id } })
    expect(old.status).toBe('archived')
    expect(old.archivedAt).not.toBeNull()
    expect(await testDb().plan.count({ where: { status: 'active' } })).toBe(1)
  })

  it('creates exactly one plan on a concurrent double submit', async () => {
    const results = await Promise.all([createPlan(middleReact), createPlan(middleReact)])
    expect(results.map((r) => r.statusCode).sort()).toEqual([201, 409])
    expect(await testDb().plan.count()).toBe(1)
  })
})

describe('GET /plans/current', () => {
  it('returns 404 without a plan', async () => {
    const res = await currentPlan()
    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('NOT_FOUND')
  })

  it("returns only the signed-in user's plan", async () => {
    const created = (await createPlan(middleReact)).json()
    expect((await currentPlan()).json().id).toBe(created.id)
    const other = await signIn(app, 'eve@example.com')
    expect((await currentPlan(other)).statusCode).toBe(404)
  })

  it('marks unpublished lessons as unavailable', async () => {
    await createPlan(middleReact)
    await testDb().lesson.update({ where: { id: 'react-jsx' }, data: { isPublished: false } })
    const lessons = (await currentPlan())
      .json()
      .modules.flatMap((m: { lessons: unknown[] }) => m.lessons)
    expect(lessons.find((l: { id: string }) => l.id === 'react-jsx').isAvailable).toBe(false)
  })

  it('updates /me hasActivePlan', async () => {
    await createPlan(middleReact)
    const me = await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } })
    expect(me.json().hasActivePlan).toBe(true)
  })
})
