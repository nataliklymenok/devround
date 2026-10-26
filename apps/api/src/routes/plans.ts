import { CreatePlanRequestSchema, type PlanDetail } from '@devround/shared'
import type { FastifyInstance } from 'fastify'
import { currentUser } from '../plugins/session-auth.js'
import type { PlanService } from '../services/plan-service.js'

export function planRoutes(plans: PlanService) {
  return async (api: FastifyInstance) => {
    api.post('/plans', { preHandler: api.requireAuth }, async (request, reply) => {
      const input = CreatePlanRequestSchema.parse(request.body)
      const plan: PlanDetail = await plans.create(currentUser(request).id, input)
      return reply.status(201).send(plan)
    })

    api.get('/plans/current', { preHandler: api.requireAuth }, async (request): Promise<PlanDetail> =>
      plans.getCurrent(currentUser(request).id),
    )
  }
}
