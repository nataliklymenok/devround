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
  await createPlan(cookie)
})
afterAll(() => app.close())

async function createPlan(as: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/plans',
    headers: { ...jsonHeaders, cookie: as },
    payload: {
      trackId: 'frontend',
      levelId: 'middle',
      technologyIds: ['javascript', 'react'],
      replaceExisting: true,
    },
  })
  expect(res.statusCode).toBe(201)
}

const get = (id: string, as = cookie) =>
  app.inject({ method: 'GET', url: `/api/v1/tasks/${id}`, headers: { cookie: as } })
const post = (path: string, payload: object = {}, as = cookie) =>
  app.inject({
    method: 'POST',
    url: `/api/v1/tasks/${path}`,
    headers: { ...jsonHeaders, cookie: as },
    payload,
  })

describe('GET /tasks/:id', () => {
  it('shows statement, starter code and visible tests but no hints or solution (V6)', async () => {
    const res = await get('js-debounce-fx')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toContain('clearTimeout(timer)') // reference solution code
    expect(res.body).not.toContain('Keep the timer id in a closure') // first hint
    expect(res.json()).toMatchObject({
      id: 'js-debounce-fx',
      title: 'Implement debounce',
      technology: 'JavaScript',
      mode: 'tests',
      entry: 'debounce',
      hintsTotal: 2,
      hints: [],
      solution: null,
      acceptanceCriteria: null,
      taskUpdated: false,
      isDraft: false,
      progress: {
        status: null,
        hintsRevealed: 0,
        solutionRevealed: false,
        draftCode: null,
        lastCheck: null,
      },
      prevTaskId: 'js-sum-array',
      nextTaskId: 'react-counter-fx',
    })
    expect(res.json().tests).toHaveLength(5)
    expect(res.json().statement).toContain('## Problem')
  })

  it('returns acceptance criteria and no tests for self-check tasks', async () => {
    const res = (await get('react-counter-fx')).json()
    expect(res).toMatchObject({ mode: 'self-check', entry: null, tests: null })
    expect(res.acceptanceCriteria).toHaveLength(3)
  })

  it('returns 404 outside the active plan and for other users, 410 when unpublished', async () => {
    expect((await get('nope')).statusCode).toBe(404)
    const eve = await signIn(app, 'eve@example.com')
    expect((await get('js-debounce-fx', eve)).statusCode).toBe(404)
    await testDb().codingTask.update({
      where: { id: 'js-sum-array' },
      data: { isPublished: false },
    })
    const gone = await get('js-sum-array')
    expect(gone.statusCode).toBe(410)
  })
})

describe('reveals', () => {
  it('reveals hints one at a time and then 409 NO_MORE_HINTS', async () => {
    const first = await post('js-debounce-fx/hints')
    expect(first.json()).toEqual({
      hint: 'Keep the timer id in a closure.',
      index: 0,
      hintsRevealed: 1,
    })
    expect((await post('js-debounce-fx/hints')).json().index).toBe(1)
    const none = await post('js-debounce-fx/hints')
    expect(none.statusCode).toBe(409)
    expect(none.json().error.code).toBe('NO_MORE_HINTS')
    expect((await get('js-debounce-fx')).json().hints).toHaveLength(2)
  })

  it('reveals the solution', async () => {
    const res = await post('js-debounce-fx/solution')
    expect(res.statusCode).toBe(200)
    expect(res.json().solution).toContain('clearTimeout(timer)')
    expect((await get('js-debounce-fx')).json()).toMatchObject({
      progress: { solutionRevealed: true },
    })
  })
})

describe('status rules (FR-012, FR-013)', () => {
  it('allows solved_own without reveals', async () => {
    const res = await post('js-debounce-fx/status', { status: 'solved_own' })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('solved_own')
  })

  it('rejects solved_own after a hint or the solution was revealed (V10)', async () => {
    await post('js-debounce-fx/hints')
    const res = await post('js-debounce-fx/status', { status: 'solved_own' })
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('HINTS_USED')
    expect((await post('js-debounce-fx/status', { status: 'solved_with_hints' })).statusCode).toBe(
      200,
    )
  })

  it('reset starts a new attempt and keeps the status', async () => {
    await post('js-debounce-fx/solution')
    await post('js-debounce-fx/status', { status: 'revisit' })
    await post('js-debounce-fx/draft', { code: 'function debounce() {}' })
    const res = await post('js-debounce-fx/reset')
    expect(res.json()).toEqual({
      status: 'revisit',
      hintsRevealed: 0,
      solutionRevealed: false,
      draftCode: null,
      lastCheck: null,
    })
    expect((await post('js-debounce-fx/status', { status: 'solved_own' })).statusCode).toBe(200)
  })

  it('rejects unknown statuses', async () => {
    expect((await post('js-debounce-fx/status', { status: 'done' })).statusCode).toBe(400)
  })
})

describe('drafts and check results (V11, FR-015b)', () => {
  it('saves and restores a draft', async () => {
    expect(
      (await post('js-debounce-fx/draft', { code: 'function debounce(fn) { return fn }' }))
        .statusCode,
    ).toBe(204)
    expect((await get('js-debounce-fx')).json().progress.draftCode).toBe(
      'function debounce(fn) { return fn }',
    )
  })

  it('rejects drafts over 20 000 characters and drafts for self-check tasks', async () => {
    expect((await post('js-debounce-fx/draft', { code: 'x'.repeat(20_001) })).statusCode).toBe(400)
    expect((await post('react-counter-fx/draft', { code: 'x' })).statusCode).toBe(400)
  })

  it('flags taskUpdated when the task changed after the draft was saved', async () => {
    await post('js-debounce-fx/draft', { code: 'function debounce() {}' })
    await testDb().codingTask.update({
      where: { id: 'js-debounce-fx' },
      data: { contentHash: 'changed' },
    })
    expect((await get('js-debounce-fx')).json().taskUpdated).toBe(true)
  })

  it('stores the last check result and validates passed <= total', async () => {
    expect((await post('js-debounce-fx/check-result', { passed: 3, total: 5 })).statusCode).toBe(
      204,
    )
    expect((await get('js-debounce-fx')).json().progress.lastCheck).toEqual({ passed: 3, total: 5 })
    expect((await post('js-debounce-fx/check-result', { passed: 6, total: 5 })).statusCode).toBe(
      400,
    )
  })

  it('shows status and last check in the plan', async () => {
    await post('js-debounce-fx/check-result', { passed: 5, total: 5 })
    await post('js-debounce-fx/status', { status: 'solved_own' })
    const plan = (
      await app.inject({ method: 'GET', url: '/api/v1/plans/current', headers: { cookie } })
    ).json()
    expect(plan.tasks.find((t: { id: string }) => t.id === 'js-debounce-fx').progress).toEqual({
      status: 'solved_own',
      lastCheck: { passed: 5, total: 5 },
    })
  })
})

describe('isolation', () => {
  it('does not let another user change my progress', async () => {
    const eve = await signIn(app, 'eve@example.com')
    expect((await post('js-debounce-fx/hints', {}, eve)).statusCode).toBe(404)
    expect((await post('js-debounce-fx/status', { status: 'solved_own' }, eve)).statusCode).toBe(
      404,
    )
  })
})
