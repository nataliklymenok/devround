import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { hashSessionToken } from '../../src/services/session-service.js'
import { buildTestApp, jsonHeaders, resetDb, signIn, testDb } from '../helpers.js'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})
beforeEach(() => resetDb())
afterAll(() => app.close())

function signInRequest(credential: string) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/auth/google',
    headers: jsonHeaders,
    payload: { credential },
  })
}

describe('POST /auth/google', () => {
  it('creates a new user storing only Google identity fields and sets an httpOnly cookie', async () => {
    const res = await signInRequest('test:ann@example.com')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      user: { id: expect.any(String), email: 'ann@example.com', name: 'ann', avatarUrl: null },
      hasActivePlan: false,
    })

    const cookie = res.cookies.find((c) => c.name === 'dr_session')!
    expect(cookie.httpOnly).toBe(true)
    expect(cookie.sameSite).toBe('Lax')
    expect(cookie.path).toBe('/')
    expect(cookie.secure).toBeFalsy() // Secure only in production

    const user = await testDb().user.findFirstOrThrow()
    expect(Object.keys(user).sort()).toEqual(
      ['avatarUrl', 'createdAt', 'email', 'googleSub', 'id', 'name', 'updatedAt'].sort(),
    )
    const session = await testDb().session.findFirstOrThrow()
    expect(session.tokenHash).toBe(hashSessionToken(cookie.value))
  })

  it('updates a returning user instead of creating a duplicate', async () => {
    await signInRequest('test:ann@example.com')
    await testDb().user.updateMany({ data: { name: 'Old Name' } })
    const res = await signInRequest('test:ann@example.com')
    expect(res.statusCode).toBe(200)
    expect(await testDb().user.count()).toBe(1)
    expect(res.json().user.name).toBe('ann')
  })

  it('rejects an invalid token with 401', async () => {
    const res = await signInRequest('not-a-valid-token')
    expect(res.statusCode).toBe(401)
    expect(res.json().error.code).toBe('UNAUTHENTICATED')
    expect(await testDb().user.count()).toBe(0)
  })

  it('rejects a malformed body with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/google',
      headers: jsonHeaders,
      payload: { token: 'x' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /me', () => {
  it('returns 401 without a session', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/me' })
    expect(res.statusCode).toBe(401)
    expect(res.json().error.code).toBe('UNAUTHENTICATED')
  })

  it('returns the current user with a valid session', async () => {
    const cookie = await signIn(app, 'bob@example.com')
    const res = await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } })
    expect(res.statusCode).toBe(200)
    expect(res.json().user.email).toBe('bob@example.com')
  })

  it('returns 401 for an expired session and deletes it', async () => {
    const cookie = await signIn(app, 'bob@example.com')
    await testDb().session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })
    const res = await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } })
    expect(res.statusCode).toBe(401)
    expect(await testDb().session.count()).toBe(0)
  })

  it('slides the expiry when the session was last seen over an hour ago', async () => {
    const cookie = await signIn(app, 'bob@example.com')
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000)
    await testDb().session.updateMany({
      data: { lastSeenAt: old, expiresAt: new Date(Date.now() + 1000 * 60) },
    })
    const res = await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } })
    expect(res.statusCode).toBe(200)
    const session = await testDb().session.findFirstOrThrow()
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000)
  })
})

describe('POST /auth/logout', () => {
  it('deletes the session and clears the cookie', async () => {
    const cookie = await signIn(app, 'bob@example.com')
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { ...jsonHeaders, cookie },
      payload: {},
    })
    expect(res.statusCode).toBe(204)
    expect(await testDb().session.count()).toBe(0)
    const cleared = res.cookies.find((c) => c.name === 'dr_session')!
    expect(cleared.value).toBe('')

    const me = await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } })
    expect(me.statusCode).toBe(401)
  })

  it('requires a session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: jsonHeaders,
      payload: {},
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('rate limiting', () => {
  it('throttles sign-in attempts with the error envelope', async () => {
    const limited = await buildTestApp({ AUTH_RATE_LIMIT_PER_MINUTE: 2 })
    try {
      const attempt = () =>
        limited.inject({
          method: 'POST',
          url: '/api/v1/auth/google',
          headers: jsonHeaders,
          payload: { credential: 'test:x@example.com' },
        })
      await attempt()
      await attempt()
      const res = await attempt()
      expect(res.statusCode).toBe(429)
      expect(res.json().error.code).toBe('RATE_LIMITED')
    } finally {
      await limited.close()
    }
  })
})
