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
  isDraft: z.boolean(),
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

export const TaskModeSchema = z.enum(['tests', 'self-check'])
export type TaskMode = z.infer<typeof TaskModeSchema>
export const TaskDifficultySchema = z.enum(['easy', 'medium', 'hard'])
export type TaskDifficulty = z.infer<typeof TaskDifficultySchema>
export const TaskStatusSchema = z.enum(['solved_own', 'solved_with_hints', 'revisit'])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const CheckSummarySchema = z.object({
  passed: z.number().int().min(0),
  total: z.number().int().min(0),
})

export const PlanTaskSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  title: z.string(),
  technology: z.string(),
  difficulty: TaskDifficultySchema,
  estimatedMinutes: z.number().int(),
  mode: TaskModeSchema,
  isAvailable: z.boolean(),
  isDraft: z.boolean(),
  progress: z.object({
    status: TaskStatusSchema.nullable(),
    lastCheck: CheckSummarySchema.nullable(),
  }),
})
export type PlanTask = z.infer<typeof PlanTaskSchema>

export const PlanExerciseSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  title: z.string(),
  timeboxMinutes: z.number().int(),
  isAvailable: z.boolean(),
  isDraft: z.boolean(),
  progress: z.object({
    completed: z.boolean(),
    bestScore: z.number().int().min(0).max(100).nullable(),
  }),
})
export type PlanExercise = z.infer<typeof PlanExerciseSchema>

export const PlanDetailSchema = z.object({
  id: z.string(),
  target: PlanTargetSchema,
  modules: z.array(PlanModuleSchema),
  tasks: z.array(PlanTaskSchema),
  exercises: z.array(PlanExerciseSchema),
})
export type PlanDetail = z.infer<typeof PlanDetailSchema>
