import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildTestApp, jsonHeaders, resetDb, signIn, syncContent } from '../helpers.js'

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

async function createPlan(technologyIds: string[]) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/plans',
    headers: { ...jsonHeaders, cookie },
    payload: { trackId: 'frontend', levelId: 'middle', technologyIds },
  })
  expect(res.statusCode).toBe(201)
  return res.json()
}

describe('002 additions to catalog and lessons (US1)', () => {
  it('GET /catalog returns recommends per technology', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/catalog', headers: { cookie } })
    const react = res.json().tracks[0].technologies.find((t: { id: string }) => t.id === 'react')
    expect(react.recommends).toEqual(['javascript'])
  })

  it('GET /lessons/:id returns references and the draft flag', async () => {
    await createPlan(['javascript'])
    const draft = (
      await app.inject({ method: 'GET', url: '/api/v1/lessons/js-values', headers: { cookie } })
    ).json()
    expect(draft.isDraft).toBe(true)
    expect(draft.references).toEqual([{ title: 'MDN', url: 'https://developer.mozilla.org/' }])
    const reviewed = (
      await app.inject({ method: 'GET', url: '/api/v1/lessons/js-scope', headers: { cookie } })
    ).json()
    expect(reviewed.isDraft).toBe(false)
  })

  it('plan lessons carry the draft flag', async () => {
    const plan = await createPlan(['javascript'])
    const lessons = plan.modules.flatMap(
      (m: { lessons: { id: string; isDraft: boolean }[] }) => m.lessons,
    )
    expect(lessons.find((l: { id: string }) => l.id === 'js-values').isDraft).toBe(true)
    expect(lessons.filter((l: { isDraft: boolean }) => l.isDraft)).toHaveLength(1)
  })
})
