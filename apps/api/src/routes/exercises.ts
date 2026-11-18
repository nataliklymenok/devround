import { ExerciseAssessmentRequestSchema, type ExerciseView } from '@devround/shared'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { currentUser } from '../plugins/session-auth.js'
import type { ExerciseService } from '../services/exercise-service.js'

const ParamsSchema = z.object({ exerciseId: z.string().min(1).max(80) })
const SectionParamsSchema = ParamsSchema.extend({ key: z.string().min(1).max(40) })

export function exerciseRoutes(exercises: ExerciseService) {
  return async (api: FastifyInstance) => {
    const auth = { preHandler: api.requireAuth }

    api.get('/exercises/:exerciseId', auth, async (request): Promise<ExerciseView> => {
      const { exerciseId } = ParamsSchema.parse(request.params)
      return exercises.get(currentUser(request).id, exerciseId)
    })

    api.post('/exercises/:exerciseId/sections/:key/reveal', auth, async (request) => {
      const { exerciseId, key } = SectionParamsSchema.parse(request.params)
      return exercises.revealSection(currentUser(request).id, exerciseId, key)
    })

    api.post('/exercises/:exerciseId/assessment', auth, async (request, reply) => {
      const { exerciseId } = ParamsSchema.parse(request.params)
      const { covered } = ExerciseAssessmentRequestSchema.parse(request.body)
      return reply
        .status(201)
        .send(await exercises.assess(currentUser(request).id, exerciseId, covered))
    })
  }
}
