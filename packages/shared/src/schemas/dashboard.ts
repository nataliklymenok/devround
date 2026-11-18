import { z } from 'zod'
import { PlanTargetSchema } from './plan.js'

export const ItemKindSchema = z.enum(['lesson', 'task', 'exercise'])
export type ItemKind = z.infer<typeof ItemKindSchema>

const CountSchema = z.object({ completed: z.number().int(), total: z.number().int() })

export const DashboardSchema = z.object({
  target: PlanTargetSchema,
  /** Lessons, tasks and exercises together (each item weighs 1) */
  overall: CountSchema.extend({ percent: z.number().int().min(0).max(100) }),
  modules: z.array(CountSchema.extend({ id: z.string(), title: z.string() })),
  /** Readiness per area: theory per technology, live coding, system design (FR-021) */
  areas: z.array(
    CountSchema.extend({ kind: z.enum(['theory', 'coding', 'design']), technology: z.string().nullable() }),
  ),
  averageBestScore: z.number().int().nullable(),
  topicsToReview: z.array(
    z.object({ kind: ItemKindSchema, id: z.string(), title: z.string(), score: z.number().int() }),
  ),
  continue: z.object({ kind: ItemKindSchema, id: z.string() }).nullable(),
  isComplete: z.boolean(),
})
export type Dashboard = z.infer<typeof DashboardSchema>
