import { z } from 'zod'
import { PlanTargetSchema } from './plan.js'

export const DashboardSchema = z.object({
  target: PlanTargetSchema,
  overall: z.object({
    completed: z.number().int(),
    total: z.number().int(),
    percent: z.number().int().min(0).max(100),
  }),
  modules: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      completed: z.number().int(),
      total: z.number().int(),
    }),
  ),
  averageBestScore: z.number().int().nullable(),
  topicsToReview: z.array(
    z.object({ lessonId: z.string(), title: z.string(), bestScore: z.number().int() }),
  ),
  continueLessonId: z.string().nullable(),
  isComplete: z.boolean(),
})
export type Dashboard = z.infer<typeof DashboardSchema>
