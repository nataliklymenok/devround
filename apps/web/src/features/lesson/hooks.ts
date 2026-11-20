import {
  LessonViewSchema,
  QuizAttemptRequestSchema,
  QuizAttemptResultSchema,
} from '@devround/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../api/client'
import { dashboardKey, planKey } from '../plan/hooks'

export const lessonKey = (id: string) => ['lesson', id] as const

export function useLesson(id: string) {
  return useQuery({
    queryKey: lessonKey(id),
    queryFn: () => apiRequest(`/lessons/${encodeURIComponent(id)}`, LessonViewSchema),
  })
}

export function useSubmitAttempt(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answers: number[]) =>
      apiRequest(`/lessons/${encodeURIComponent(id)}/attempts`, QuizAttemptResultSchema, {
        method: 'POST',
        body: QuizAttemptRequestSchema.parse({ answers }),
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: lessonKey(id) }),
        queryClient.invalidateQueries({ queryKey: planKey }),
        queryClient.invalidateQueries({ queryKey: dashboardKey }),
      ]),
  })
}
