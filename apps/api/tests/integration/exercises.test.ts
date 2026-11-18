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
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/plans',
    headers: { ...jsonHeaders, cookie },
    payload: { trackId: 'frontend', levelId: 'middle', technologyIds: ['javascript'] },
  })
  expect(res.statusCode).toBe(201)
})
afterAll(() => app.close())

const get = (id: string, as = cookie) =>
  app.inject({ method: 'GET', url: `/api/v1/exercises/${id}`, headers: { cookie: as } })
const post = (path: string, payload: object = {}, as = cookie) =>
  app.inject({
    method: 'POST',
    url: `/api/v1/exercises/${path}`,
    headers: { ...jsonHeaders, cookie: as },
    payload,
  })

describe('GET /exercises/:id', () => {
  it('shows prompt, timebox, section titles and checklist but no section bodies (FR-018)', async () => {
    const res = await get('sd-fx-autocomplete')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toContain('requirements notes')
    const body = res.json()
    expect(body).toMatchObject({
      id: 'sd-fx-autocomplete',
      title: 'Design an autocomplete',
      timeboxMinutes: 45,
      isDraft: false,
      progress: { sectionsRevealed: [], bestScore: null, completed: false, lastCovered: [] },
      prevExerciseId: null,
      nextExerciseId: 'sd-fx-feed',
    })
    expect(body.prompt).toContain('fixture app')
    expect(body.sections).toHaveLength(8)
    expect(body.sections.every((s: { body: unknown }) => s.body === null)).toBe(true)
    expect(body.sections[0]).toEqual({ key: 'requirements', title: 'Requirements', body: null })
    expect(body.checklist).toHaveLength(8)
  })

  it('applies 404 / 410 / isolation rules', async () => {
    expect((await get('nope')).statusCode).toBe(404)
    const eve = await signIn(app, 'eve@example.com')
    expect((await get('sd-fx-autocomplete', eve)).statusCode).toBe(404)
    await testDb().designExercise.update({
      where: { id: 'sd-fx-feed' },
      data: { isPublished: false },
    })
    expect((await get('sd-fx-feed')).statusCode).toBe(410)
  })
})

describe('section reveal', () => {
  it('reveals one section at a time and remembers it', async () => {
    const res = await post('sd-fx-autocomplete/sections/requirements/reveal')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      key: 'requirements',
      body: 'Design an autocomplete: requirements notes.',
    })
    const view = (await get('sd-fx-autocomplete')).json()
    expect(view.progress.sectionsRevealed).toEqual(['requirements'])
    expect(view.sections[0].body).toContain('requirements notes')
    expect(view.sections[1].body).toBeNull()
  })

  it('does not duplicate a revealed key and rejects unknown keys', async () => {
    await post('sd-fx-autocomplete/sections/state/reveal')
    await post('sd-fx-autocomplete/sections/state/reveal')
    expect((await get('sd-fx-autocomplete')).json().progress.sectionsRevealed).toEqual(['state'])
    const bad = await post('sd-fx-autocomplete/sections/nope/reveal')
    expect(bad.statusCode).toBe(400)
  })
})

describe('self-assessment (FR-019)', () => {
  it('scores covered / total, completes the exercise and keeps the best score', async () => {
    const first = await post('sd-fx-autocomplete/assessment', {
      covered: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
    })
    expect(first.statusCode).toBe(201)
    expect(first.json()).toMatchObject({
      score: 75,
      coveredCount: 6,
      total: 8,
      progress: { completed: true, bestScore: 75 },
    })

    const second = await post('sd-fx-autocomplete/assessment', { covered: ['c1'] })
    expect(second.json()).toMatchObject({
      score: 13,
      progress: { bestScore: 75, lastCovered: ['c1'] },
    })

    const completedAt = (await testDb().exerciseProgress.findFirstOrThrow()).completedAt
    await post('sd-fx-autocomplete/assessment', { covered: [] })
    expect((await testDb().exerciseProgress.findFirstOrThrow()).completedAt).toEqual(completedAt)
  })

  it('rejects unknown or duplicate checklist ids', async () => {
    expect(
      (await post('sd-fx-autocomplete/assessment', { covered: ['c1', 'zzz'] })).statusCode,
    ).toBe(400)
    expect(
      (await post('sd-fx-autocomplete/assessment', { covered: ['c1', 'c1'] })).statusCode,
    ).toBe(400)
  })

  it('shows completion and best score in the plan', async () => {
    await post('sd-fx-autocomplete/assessment', { covered: ['c1', 'c2', 'c3', 'c4'] })
    const plan = (
      await app.inject({ method: 'GET', url: '/api/v1/plans/current', headers: { cookie } })
    ).json()
    expect(plan.exercises[0]).toMatchObject({
      id: 'sd-fx-autocomplete',
      progress: { completed: true, bestScore: 50 },
    })
  })
})
