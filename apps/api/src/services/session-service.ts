import { createHash, randomBytes } from 'node:crypto'
import type { Db } from '../db.js'

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const SLIDE_INTERVAL_MS = 60 * 60 * 1000

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function nextExpiry(now: Date): Date {
  return new Date(now.getTime() + SESSION_TTL_MS)
}

/** Refresh the sliding expiry at most once per hour to avoid a write on every request. */
export function shouldSlide(lastSeenAt: Date, now: Date): boolean {
  return now.getTime() - lastSeenAt.getTime() > SLIDE_INTERVAL_MS
}

export interface SessionUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export class SessionService {
  constructor(private readonly db: Db) {}

  /** Creates a session and returns the raw token (only its hash is stored). */
  async create(userId: string, now = new Date()): Promise<string> {
    const token = generateSessionToken()
    await this.db.session.create({
      data: {
        userId,
        tokenHash: hashSessionToken(token),
        expiresAt: nextExpiry(now),
        lastSeenAt: now,
      },
    })
    return token
  }

  /** Resolves a token to its user; expired sessions are deleted. `slid` tells the caller to refresh the cookie. */
  async resolve(
    token: string,
    now = new Date(),
  ): Promise<{ user: SessionUser; slid: boolean } | null> {
    const tokenHash = hashSessionToken(token)
    const session = await this.db.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    })
    if (!session) return null
    if (session.expiresAt <= now) {
      await this.db.session.deleteMany({ where: { id: session.id } })
      return null
    }
    const slid = shouldSlide(session.lastSeenAt, now)
    if (slid) {
      await this.db.session.update({
        where: { id: session.id },
        data: { lastSeenAt: now, expiresAt: nextExpiry(now) },
      })
    }
    const { id, email, name, avatarUrl } = session.user
    return { user: { id, email, name, avatarUrl }, slid }
  }

  async destroy(token: string): Promise<void> {
    await this.db.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } })
  }
}
