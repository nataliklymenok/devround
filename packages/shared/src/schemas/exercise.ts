import { z } from 'zod'
import { ReferenceSchema } from './content.js'

export const ExerciseProgressViewSchema = z.object({
  sectionsRevealed: z.array(z.string()),
  bestScore: z.number().int().min(0).max(100).nullable(),
  completed: z.boolean(),
  lastCovered: z.array(z.string()),
})
export type ExerciseProgressView = z.infer<typeof ExerciseProgressViewSchema>

/** A design exercise as shown to the user — section bodies only once revealed (FR-018). */
export const ExerciseViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  timeboxMinutes: z.number().int(),
  prompt: z.string(),
  sections: z.array(z.object({ key: z.string(), title: z.string(), body: z.string().nullable() })),
  checklist: z.array(z.object({ id: z.string(), text: z.string() })),
  references: z.array(ReferenceSchema),
  isDraft: z.boolean(),
  progress: ExerciseProgressViewSchema,
  prevExerciseId: z.string().nullable(),
  nextExerciseId: z.string().nullable(),
})
export type ExerciseView = z.infer<typeof ExerciseViewSchema>

export const ExerciseSectionResponseSchema = z.object({ key: z.string(), body: z.string() })

export const ExerciseAssessmentRequestSchema = z.object({
  covered: z
    .array(z.string().min(1))
    .max(15)
    .refine((ids) => new Set(ids).size === ids.length, 'Checklist ids must be unique'),
})

export const ExerciseAssessmentResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  coveredCount: z.number().int(),
  total: z.number().int(),
  progress: ExerciseProgressViewSchema,
})
export type ExerciseAssessmentResult = z.infer<typeof ExerciseAssessmentResultSchema>
