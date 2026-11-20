import { existsSync } from 'node:fs'
import path from 'node:path'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyInstance } from 'fastify'
import type { GoogleTokenVerifier } from './auth/google-verifier.js'
import type { Config } from './config.js'
import type { Db } from './db.js'
import { errorEnvelope, registerErrorHandler } from './plugins/error-handler.js'
import { registerOriginCheck } from './plugins/origin-check.js'
import { registerSessionAuth } from './plugins/session-auth.js'
import { authRoutes } from './routes/auth.js'
import { catalogRoutes } from './routes/catalog.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { exerciseRoutes } from './routes/exercises.js'
import { lessonRoutes } from './routes/lessons.js'
import { planRoutes } from './routes/plans.js'
import { taskRoutes } from './routes/tasks.js'
import { ExerciseService } from './services/exercise-service.js'
import { LessonService } from './services/lesson-service.js'
import { PlanService } from './services/plan-service.js'
import { ProgressService } from './services/progress-service.js'
import { TaskService } from './services/task-service.js'
import { SessionService } from './services/session-service.js'

export interface AppDeps {
  config: Config
  db: Db
  verifier: GoogleTokenVerifier
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const { config } = deps
  const app = Fastify({
    logger: config.NODE_ENV === 'test' ? false : { level: 'info' },
    trustProxy: true,
  })

  registerErrorHandler(app)
  registerOriginCheck(app, config.WEB_ORIGIN)
  await app.register(cookie)
  await app.register(rateLimit, {
    global: true,
    max: config.RATE_LIMIT_PER_MINUTE,
    timeWindow: '1 minute',
  })

  const sessions = new SessionService(deps.db)
  registerSessionAuth(app, sessions, config.NODE_ENV === 'production')

  await app.register(
    async (api) => {
      api.get('/health', async () => ({ ok: true }))
      await api.register(authRoutes(deps, sessions))
      await api.register(catalogRoutes(deps))
      await api.register(planRoutes(new PlanService(deps.db)))
      await api.register(lessonRoutes(new LessonService(deps.db)))
      await api.register(dashboardRoutes(new ProgressService(deps.db)))
      await api.register(taskRoutes(new TaskService(deps.db)))
      await api.register(exerciseRoutes(new ExerciseService(deps.db)))
    },
    { prefix: '/api/v1' },
  )

  const webDist = path.resolve(config.WEB_DIST_DIR)
  const serveWeb = config.NODE_ENV === 'production' && existsSync(path.join(webDist, 'index.html'))
  if (serveWeb) await app.register(fastifyStatic, { root: webDist, wildcard: false })

  app.setNotFoundHandler((request, reply) => {
    if (serveWeb && request.method === 'GET' && !request.url.startsWith('/api/')) {
      return reply.sendFile('index.html') // SPA fallback
    }
    return reply.status(404).send(errorEnvelope('NOT_FOUND', 'Route not found'))
  })

  return app
}
