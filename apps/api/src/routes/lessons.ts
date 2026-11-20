import { QuizAttemptRequestSchema, type LessonView } from '@devround/shared'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { currentUser } from '../plugins/session-auth.js'
import type { LessonService } from '../services/lesson-service.js'

const ParamsSchema = z.object({ lessonId: z.string().min(1).max(80) })

export function lessonRoutes(lessons: LessonService) {
  return async (api: FastifyInstance) => {
    api.get(
      '/lessons/:lessonId',
      { preHandler: api.requireAuth },
      async (request): Promise<LessonView> => {
        const { lessonId } = ParamsSchema.parse(request.params)
        return lessons.get(currentUser(request).id, lessonId)
      },
    )

    api.post(
      '/lessons/:lessonId/attempts',
      { preHandler: api.requireAuth },
      async (request, reply) => {
        const { lessonId } = ParamsSchema.parse(request.params)
        const { answers } = QuizAttemptRequestSchema.parse(request.body)
        const result = await lessons.submitAttempt(currentUser(request).id, lessonId, answers)
        return reply.status(201).send(result)
      },
    )
  }
}
