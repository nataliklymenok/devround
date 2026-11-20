import { describe, expect, it } from 'vitest'
import {
  SESSION_TTL_MS,
  generateSessionToken,
  hashSessionToken,
  nextExpiry,
  shouldSlide,
} from '../../src/services/session-service.js'

describe('session tokens', () => {
  it('generates 32-byte base64url tokens that are unique', () => {
    const a = generateSessionToken()
    const b = generateSessionToken()
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(a).not.toBe(b)
  })

  it('stores only a SHA-256 hash of the token', () => {
    const token = generateSessionToken()
    const hash = hashSessionToken(token)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain(token)
    expect(hashSessionToken(token)).toBe(hash)
  })
})

describe('sliding expiry', () => {
  const now = new Date('2026-10-26T12:00:00Z')

  it('expires 30 days after activity', () => {
    expect(SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000)
    expect(nextExpiry(now).toISOString()).toBe('2026-11-25T12:00:00.000Z')
  })

  it('slides at most once per hour', () => {
    expect(shouldSlide(new Date('2026-10-26T11:30:00Z'), now)).toBe(false)
    expect(shouldSlide(new Date('2026-10-26T10:59:59Z'), now)).toBe(true)
  })
})
