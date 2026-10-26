import type { Dashboard } from '@devround/shared'
import type { FastifyInstance } from 'fastify'
import { currentUser } from '../plugins/session-auth.js'
import type { ProgressService } from '../services/progress-service.js'

export function dashboardRoutes(progress: ProgressService) {
  return async (api: FastifyInstance) => {
    api.get('/dashboard', { preHandler: api.requireAuth }, async (request): Promise<Dashboard> =>
      progress.dashboard(currentUser(request).id),
    )
  }
}
