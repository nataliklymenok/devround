import { z } from 'zod'

/** Permanent kebab-case identifier used for tracks, technologies, modules and lessons. */
export const ContentIdSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be kebab-case')

/** Track / technology id (kebab-case, may be short, e.g. `qa`). */
const CatalogIdSchema = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be kebab-case')

const LevelIdSchema = z.string().regex(/^[a-z]+$/, 'must be a lowercase level id')

export const CatalogFileSchema = z
  .object({
    levels: z
      .array(
        z.strictObject({
          id: LevelIdSchema,
          name: z.string().min(1),
          rank: z.int().min(1),
        }),
      )
      .min(1),
    tracks: z
      .array(
        z.strictObject({
          id: CatalogIdSchema,
          name: z.string().min(1),
          available: z.boolean(),
          technologies: z.array(
            z.strictObject({
              id: CatalogIdSchema,
              name: z.string().min(1),
              available: z.boolean(),
            }),
          ),
        }),
      )
      .min(1),
  })
  .strict()
export type CatalogFile = z.infer<typeof CatalogFileSchema>

export const ModulesFileSchema = z.strictObject({
  modules: z
    .array(
      z.strictObject({
        id: ContentIdSchema,
        title: z.string().min(3).max(120),
        description: z.string().max(500),
      }),
    )
    .min(1),
})
export type ModulesFile = z.infer<typeof ModulesFileSchema>

const RetiredEntrySchema = z.strictObject({
  id: ContentIdSchema,
  retiredAt: z.union([z.string(), z.date()]).transform((v) => String(v)),
  reason: z.string().min(1),
})

export const RetiredFileSchema = z.strictObject({
  lessons: z.array(RetiredEntrySchema).default([]),
  modules: z.array(RetiredEntrySchema).default([]),
})
export type RetiredFile = z.infer<typeof RetiredFileSchema>

export const QuizItemSchema = z
  .strictObject({
    id: z.string().min(1).max(40),
    question: z.string().min(1),
    options: z.array(z.string().trim().min(1)).min(2).max(5),
    correct: z.int().min(0),
    explanation: z.string().trim().min(1),
  })
  .superRefine((item, ctx) => {
    if (item.correct >= item.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['correct'],
        message: `correct must be within 0..${item.options.length - 1}`,
      })
    }
    if (new Set(item.options).size !== item.options.length) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' })
    }
  })
export type QuizItem = z.infer<typeof QuizItemSchema>

export const InterviewQuestionSchema = z.strictObject({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
})
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>

/** Front matter of a lesson Markdown file (content/<track>/<technology>/<id>.md). */
export const LessonFileSchema = z
  .strictObject({
    id: ContentIdSchema,
    module: ContentIdSchema,
    order: z.int().min(1),
    title: z.string().min(3).max(120),
    description: z.string().max(500),
    levels: z.array(LevelIdSchema).min(1),
    estimatedMinutes: z.int().min(5).max(90),
    keyTakeaways: z.array(z.string().trim().min(1)).min(3).max(6),
    interviewQuestions: z.array(InterviewQuestionSchema).min(3).max(8),
    quiz: z.array(QuizItemSchema).min(3).max(5),
  })
  .superRefine((lesson, ctx) => {
    const ids = lesson.quiz.map((q) => q.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['quiz'], message: 'quiz ids must be unique' })
    }
    if (new Set(lesson.levels).size !== lesson.levels.length) {
      ctx.addIssue({ code: 'custom', path: ['levels'], message: 'levels must be unique' })
    }
  })
export type LessonFile = z.infer<typeof LessonFileSchema>
