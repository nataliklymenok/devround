import { GoogleSignInRequestSchema, type MeResponse } from '@devround/shared'
import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../app.js'
import { AppError } from '../errors.js'
import { SESSION_COOKIE, currentUser, sessionCookieOptions } from '../plugins/session-auth.js'
import type { SessionService } from '../services/session-service.js'

export async function hasActivePlan(deps: AppDeps, userId: string): Promise<boolean> {
  return (await deps.db.plan.count({ where: { userId, status: 'active' } })) > 0
}

export function authRoutes(deps: AppDeps, sessions: SessionService) {
  const secure = deps.config.NODE_ENV === 'production'

  return async (api: FastifyInstance) => {
    api.post(
      '/auth/google',
      { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
      async (request, reply): Promise<MeResponse> => {
        const { credential } = GoogleSignInRequestSchema.parse(request.body)
        const identity = await deps.verifier.verify(credential)
        if (!identity) throw new AppError('UNAUTHENTICATED', 401, 'Google sign-in failed')

        const profile = { email: identity.email, name: identity.name, avatarUrl: identity.avatarUrl }
        const user = await deps.db.user.upsert({
          where: { googleSub: identity.sub },
          create: { googleSub: identity.sub, ...profile },
          update: profile,
        })
        const token = await sessions.create(user.id)
        reply.setCookie(SESSION_COOKIE, token, sessionCookieOptions(secure))
        return {
          user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
          hasActivePlan: await hasActivePlan(deps, user.id),
        }
      },
    )

    api.post('/auth/logout', { preHandler: api.requireAuth }, async (request, reply) => {
      await sessions.destroy(request.sessionToken!)
      reply.clearCookie(SESSION_COOKIE, { path: '/' })
      return reply.status(204).send()
    })

    api.get('/me', { preHandler: api.requireAuth }, async (request): Promise<MeResponse> => {
      const user = currentUser(request)
      return { user, hasActivePlan: await hasActivePlan(deps, user.id) }
    })
  }
}
