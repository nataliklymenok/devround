import type { FastifyInstance } from 'fastify'
import { AppError } from '../errors.js'

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** CSRF protection (research R4): mutating API calls must be JSON from our own web origin. */
export function registerOriginCheck(app: FastifyInstance, webOrigin: string) {
  app.addHook('onRequest', async (request) => {
    if (!MUTATING.has(request.method) || !request.url.startsWith('/api/')) return
    const contentType = request.headers['content-type'] ?? ''
    if (request.headers.origin !== webOrigin || !contentType.startsWith('application/json')) {
      throw new AppError('FORBIDDEN_ORIGIN', 403, 'Request origin is not allowed')
    }
  })
}
