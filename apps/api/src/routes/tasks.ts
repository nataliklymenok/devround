import {
  TaskCheckResultRequestSchema,
  TaskDraftRequestSchema,
  TaskStatusRequestSchema,
  type TaskView,
} from '@devround/shared'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { currentUser } from '../plugins/session-auth.js'
import type { TaskService } from '../services/task-service.js'

const ParamsSchema = z.object({ taskId: z.string().min(1).max(80) })

export function taskRoutes(tasks: TaskService) {
  return async (api: FastifyInstance) => {
    const auth = { preHandler: api.requireAuth }
    const ids = (request: { params: unknown }) => ParamsSchema.parse(request.params).taskId

    api.get('/tasks/:taskId', auth, async (request): Promise<TaskView> =>
      tasks.get(currentUser(request).id, ids(request)),
    )

    api.post('/tasks/:taskId/hints', auth, async (request) =>
      tasks.revealHint(currentUser(request).id, ids(request)),
    )

    api.post('/tasks/:taskId/solution', auth, async (request) =>
      tasks.revealSolution(currentUser(request).id, ids(request)),
    )

    api.post('/tasks/:taskId/draft', { ...auth, bodyLimit: 64 * 1024 }, async (request, reply) => {
      const { code } = TaskDraftRequestSchema.parse(request.body)
      await tasks.saveDraft(currentUser(request).id, ids(request), code)
      return reply.status(204).send()
    })

    api.post('/tasks/:taskId/check-result', auth, async (request, reply) => {
      const { passed, total } = TaskCheckResultRequestSchema.parse(request.body)
      await tasks.saveCheckResult(currentUser(request).id, ids(request), passed, total)
      return reply.status(204).send()
    })

    api.post('/tasks/:taskId/status', auth, async (request) => {
      const { status } = TaskStatusRequestSchema.parse(request.body)
      return tasks.setStatus(currentUser(request).id, ids(request), status)
    })

    api.post('/tasks/:taskId/reset', auth, async (request) =>
      tasks.reset(currentUser(request).id, ids(request)),
    )
  }
}
