import type { ApiErrorBody, ErrorCode } from '@devround/shared'
import type { FastifyError, FastifyInstance, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { AppError } from '../errors.js'

function send(reply: FastifyReply, status: number, body: ApiErrorBody) {
  return reply.status(status).send(body)
}

export function errorEnvelope(code: ErrorCode, message: string, details?: Record<string, unknown>) {
  return { error: { code, message, ...(details ? { details } : {}) } } satisfies ApiErrorBody
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    if (error instanceof AppError) {
      return send(reply, error.statusCode, errorEnvelope(error.code, error.message, error.details))
    }
    if (error instanceof ZodError) {
      return send(
        reply,
        400,
        errorEnvelope('VALIDATION_ERROR', 'Request validation failed', {
          issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        }),
      )
    }
    const status = 'statusCode' in error ? error.statusCode : undefined
    if (status === 429) {
      return send(reply, 429, errorEnvelope('RATE_LIMITED', 'Too many requests, try again later'))
    }
    if (status && status >= 400 && status < 500) {
      // Fastify's own client errors (malformed JSON, unsupported media type, ...)
      return send(reply, 400, errorEnvelope('VALIDATION_ERROR', error.message))
    }
    request.log.error(error)
    return send(reply, 500, errorEnvelope('INTERNAL', 'Something went wrong'))
  })
}
