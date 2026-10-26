import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, jsonHeaders } from '../helpers.js'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})
afterAll(() => app.close())

describe('app skeleton', () => {
  it('serves health', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' })
    expect(res.statusCode).toBe(200)
  })

  it('returns the error envelope for unknown routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/nope' })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
  })

  it('rejects mutating requests from a foreign origin or without JSON', async () => {
    const foreign = await app.inject({
      method: 'POST',
      url: '/api/v1/health',
      headers: { ...jsonHeaders, origin: 'https://evil.example' },
      payload: {},
    })
    expect(foreign.statusCode).toBe(403)
    expect(foreign.json().error.code).toBe('FORBIDDEN_ORIGIN')

    const form = await app.inject({
      method: 'POST',
      url: '/api/v1/health',
      headers: { origin: jsonHeaders.origin, 'content-type': 'text/plain' },
      payload: 'x',
    })
    expect(form.statusCode).toBe(403)
  })
})

describe('config', () => {
  it('refuses fake auth in production', async () => {
    const { loadConfig } = await import('../../src/config.js')
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://x',
        AUTH_PROVIDER: 'fake',
        WEB_ORIGIN: 'https://devround.app',
      }),
    ).toThrow(/fake auth is not allowed in production/)
  })
})
