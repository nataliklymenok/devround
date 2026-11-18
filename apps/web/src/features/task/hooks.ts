import {
  TaskHintResponseSchema,
  TaskProgressViewSchema,
  TaskSolutionResponseSchema,
  TaskViewSchema,
  type TaskStatus,
} from '@devround/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../api/client'
import { dashboardKey, planKey } from '../plan/hooks'

export const taskKey = (id: string) => ['task', id] as const
const path = (id: string, action = '') => `/tasks/${encodeURIComponent(id)}${action}`

export function useTask(id: string) {
  return useQuery({ queryKey: taskKey(id), queryFn: () => apiRequest(path(id), TaskViewSchema) })
}

function useTaskMutation<TVars, TResult>(
  id: string,
  fn: (vars: TVars) => Promise<TResult>,
  refreshPlan = true,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKey(id) }),
        refreshPlan && queryClient.invalidateQueries({ queryKey: planKey }),
        refreshPlan && queryClient.invalidateQueries({ queryKey: dashboardKey }),
      ]),
  })
}

export const useRevealHint = (id: string) =>
  useTaskMutation(
    id,
    () => apiRequest(path(id, '/hints'), TaskHintResponseSchema, { method: 'POST' }),
    false,
  )

export const useRevealSolution = (id: string) =>
  useTaskMutation(
    id,
    () => apiRequest(path(id, '/solution'), TaskSolutionResponseSchema, { method: 'POST' }),
    false,
  )

export const useSetTaskStatus = (id: string) =>
  useTaskMutation(id, (status: TaskStatus) =>
    apiRequest(path(id, '/status'), TaskProgressViewSchema, { method: 'POST', body: { status } }),
  )

export const useResetTask = (id: string) =>
  useTaskMutation(id, () =>
    apiRequest(path(id, '/reset'), TaskProgressViewSchema, { method: 'POST' }),
  )

/** Drafts and check results do not need to refetch the task view. */
export function useSaveDraft(id: string) {
  return useMutation({
    mutationFn: (code: string) =>
      apiRequest(path(id, '/draft'), null, { method: 'POST', body: { code } }),
  })
}

export function useSaveCheckResult(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (summary: { passed: number; total: number }) =>
      apiRequest(path(id, '/check-result'), null, { method: 'POST', body: summary }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKey }),
  })
}
