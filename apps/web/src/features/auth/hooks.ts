import { GoogleSignInRequestSchema, MeResponseSchema, type MeResponse } from '@devround/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../api/client'

export const meKey = ['me'] as const

/** Current user, or `null` when signed out. */
export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async (): Promise<MeResponse | null> => {
      try {
        return await apiRequest('/me', MeResponseSchema)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
  })
}

export function useSignIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credential: string) =>
      apiRequest('/auth/google', MeResponseSchema, {
        method: 'POST',
        body: GoogleSignInRequestSchema.parse({ credential }),
      }),
    onSuccess: (me) => queryClient.setQueryData(meKey, me),
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiRequest('/auth/logout', null, { method: 'POST' }),
    onSettled: () => {
      queryClient.clear()
      queryClient.setQueryData(meKey, null)
    },
  })
}

/** Only same-origin relative paths are accepted as a post-sign-in destination. */
export function safeReturnTo(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}
