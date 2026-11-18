import {
  ExerciseAssessmentResultSchema,
  ExerciseSectionResponseSchema,
  ExerciseViewSchema,
} from '@devround/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../api/client'
import { dashboardKey, planKey } from '../plan/hooks'

export const exerciseKey = (id: string) => ['exercise', id] as const
const path = (id: string, action = '') => `/exercises/${encodeURIComponent(id)}${action}`

export function useExercise(id: string) {
  return useQuery({
    queryKey: exerciseKey(id),
    queryFn: () => apiRequest(path(id), ExerciseViewSchema),
  })
}

export function useRevealSection(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) =>
      apiRequest(
        path(id, `/sections/${encodeURIComponent(key)}/reveal`),
        ExerciseSectionResponseSchema,
        {
          method: 'POST',
        },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKey(id) }),
  })
}

export function useAssessExercise(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (covered: string[]) =>
      apiRequest(path(id, '/assessment'), ExerciseAssessmentResultSchema, {
        method: 'POST',
        body: { covered },
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: exerciseKey(id) }),
        queryClient.invalidateQueries({ queryKey: planKey }),
        queryClient.invalidateQueries({ queryKey: dashboardKey }),
      ]),
  })
}
