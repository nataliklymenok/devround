import type { ErrorCode } from '@devround/shared'

/** Expected application error, rendered as the API error envelope. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly statusCode: number,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message)
  }
}

export const notFound = (what = 'Resource') => new AppError('NOT_FOUND', 404, `${what} not found`)
