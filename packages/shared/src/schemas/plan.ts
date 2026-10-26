import { z } from 'zod'

export const CreatePlanRequestSchema = z.object({
  trackId: z.string().min(1),
  levelId: z.string().min(1),
  technologyIds: z
    .array(z.string().min(1))
    .min(1, 'Choose at least one technology')
    .refine((ids) => new Set(ids).size === ids.length, 'Technologies must be unique'),
  replaceExisting: z.boolean().default(false),
})
export type CreatePlanRequest = z.input<typeof CreatePlanRequestSchema>

export const LessonProgressSummarySchema = z.object({
  completed: z.boolean(),
  bestScore: z.number().int().min(0).max(100).nullable(),
})
export type LessonProgressSummary = z.infer<typeof LessonProgressSummarySchema>

export const PlanTargetSchema = z.object({
  track: z.string(),
  level: z.string(),
  technologies: z.array(z.string()),
})
export type PlanTarget = z.infer<typeof PlanTargetSchema>

export const PlanLessonSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number().int(),
  isAvailable: z.boolean(),
  progress: LessonProgressSummarySchema,
})
export type PlanLesson = z.infer<typeof PlanLessonSchema>

export const PlanModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  technology: z.string(),
  lessons: z.array(PlanLessonSchema),
})
export type PlanModule = z.infer<typeof PlanModuleSchema>

export const PlanDetailSchema = z.object({
  id: z.string(),
  target: PlanTargetSchema,
  modules: z.array(PlanModuleSchema),
})
export type PlanDetail = z.infer<typeof PlanDetailSchema>
