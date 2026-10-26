import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../errors.js'
import { SESSION_TTL_MS, SessionService, type SessionUser } from '../services/session-service.js'

export const SESSION_COOKIE = 'dr_session'

declare module 'fastify' {
  interface FastifyRequest {
    sessionUser: SessionUser | null
    sessionToken: string | null
  }
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    // Safari drops Secure cookies on http://localhost, so only in production (research R4).
    secure,
    maxAge: SESSION_TTL_MS / 1000,
  }
}

export function registerSessionAuth(app: FastifyInstance, sessions: SessionService, secure: boolean) {
  app.decorateRequest('sessionUser', null)
  app.decorateRequest('sessionToken', null)

  app.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[SESSION_COOKIE]
    const resolved = token ? await sessions.resolve(token) : null
    if (!token || !resolved) {
      throw new AppError('UNAUTHENTICATED', 401, 'Please sign in to continue')
    }
    if (resolved.slid) reply.setCookie(SESSION_COOKIE, token, sessionCookieOptions(secure))
    request.sessionUser = resolved.user
    request.sessionToken = token
  })
}

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

/** The authenticated user; only valid in routes guarded by `requireAuth`. */
export function currentUser(request: FastifyRequest): SessionUser {
  if (!request.sessionUser) throw new AppError('UNAUTHENTICATED', 401, 'Please sign in to continue')
  return request.sessionUser
}
