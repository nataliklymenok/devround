import { z } from 'zod'

export const ErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN_ORIGIN',
  'NOT_FOUND',
  'ACTIVE_PLAN_EXISTS',
  'LESSON_UNAVAILABLE',
  'TRACK_UNAVAILABLE',
  'RATE_LIMITED',
  'INTERNAL',
  'HINTS_USED',
  'NO_MORE_HINTS',
])
export type ErrorCode = z.infer<typeof ErrorCodeSchema>

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
})
export type ApiErrorBody = z.infer<typeof ApiErrorSchema>
