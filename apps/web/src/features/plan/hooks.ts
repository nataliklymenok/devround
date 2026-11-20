import {
  CatalogResponseSchema,
  CreatePlanRequestSchema,
  PlanDetailSchema,
  type CreatePlanRequest,
  type PlanDetail,
} from '@devround/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../api/client'
import { meKey } from '../auth/hooks'

export const planKey = ['plan', 'current'] as const
export const dashboardKey = ['dashboard'] as const

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: () => apiRequest('/catalog', CatalogResponseSchema),
    staleTime: 5 * 60_000,
  })
}

/** The active plan, or `null` when the user has none. */
export function useCurrentPlan() {
  return useQuery({
    queryKey: planKey,
    queryFn: async (): Promise<PlanDetail | null> => {
      try {
        return await apiRequest('/plans/current', PlanDetailSchema)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
  })
}

export function useCreatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlanRequest) =>
      apiRequest('/plans', PlanDetailSchema, {
        method: 'POST',
        body: CreatePlanRequestSchema.parse(input),
      }),
    onSuccess: async (plan) => {
      queryClient.setQueryData(planKey, plan)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meKey }),
        queryClient.invalidateQueries({ queryKey: dashboardKey }),
      ])
    },
  })
}
