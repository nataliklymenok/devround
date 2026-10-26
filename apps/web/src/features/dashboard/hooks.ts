import { DashboardSchema, type Dashboard } from '@devround/shared'
import { useQuery } from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../api/client'
import { dashboardKey } from '../plan/hooks'

/** Dashboard of the active plan, or `null` when the user has no plan yet. */
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: async (): Promise<Dashboard | null> => {
      try {
        return await apiRequest('/dashboard', DashboardSchema)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
  })
}
