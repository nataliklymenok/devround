import { ApiErrorSchema, type ErrorCode } from '@devround/shared'
import type { ZodType } from 'zod'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'NETWORK_ERROR' | 'BAD_RESPONSE',
    message: string,
  ) {
    super(message)
  }
}

/** Fired on any 401 so the auth guard can send the user to sign in (and back). */
export const UNAUTHENTICATED_EVENT = 'devround:unauthenticated'

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
}

export async function apiRequest<T>(
  path: string,
  schema: ZodType<T> | null,
  { method = 'GET', body }: RequestOptions = {},
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      credentials: 'include',
      headers: method === 'GET' ? {} : { 'content-type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error — check your connection and try again.')
  }

  if (!res.ok) {
    const parsed = ApiErrorSchema.safeParse(await res.json().catch(() => null))
    if (res.status === 401) window.dispatchEvent(new Event(UNAUTHENTICATED_EVENT))
    if (parsed.success) {
      throw new ApiError(res.status, parsed.data.error.code, parsed.data.error.message)
    }
    throw new ApiError(res.status, 'BAD_RESPONSE', `Unexpected server response (${res.status})`)
  }

  if (schema === null || res.status === 204) return undefined as T
  const parsed = schema.safeParse(await res.json())
  if (!parsed.success) throw new ApiError(res.status, 'BAD_RESPONSE', 'Unexpected server response')
  return parsed.data
}
