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

/** Topic id from a technology's topic map, e.g. `js-closures`. */
const TopicIdSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be kebab-case')

/** Further-reading link; only https URLs (FR-006). */
export const ReferenceSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  url: z.url().startsWith('https://', 'must be an https:// URL'),
})
export type Reference = z.infer<typeof ReferenceSchema>

/** `reviewed: YYYY-MM-DD` — absent means the item is a draft (research R2). */
const ReviewedSchema = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a YYYY-MM-DD date'))
  .optional()

/** Fields shared by every publishable content item (lesson, task, exercise). */
const ItemMetaShape = {
  topics: z.array(TopicIdSchema).default([]),
  references: z.array(ReferenceSchema).min(1, 'at least one further-reading reference is required'),
  reviewed: ReviewedSchema,
}

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
              recommends: z.array(CatalogIdSchema).default([]),
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
  tasks: z.array(RetiredEntrySchema).default([]),
  exercises: z.array(RetiredEntrySchema).default([]),
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
    ...ItemMetaShape,
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

/** Middle topic map of one technology (content/<track>/<technology>/topics.middle.yaml). */
export const TopicMapFileSchema = z
  .strictObject({
    topics: z
      .array(
        z.strictObject({
          id: TopicIdSchema,
          title: z.string().trim().min(3).max(160),
          priority: z.enum(['must', 'good']),
        }),
      )
      .min(1),
  })
  .superRefine((map, ctx) => {
    const ids = map.topics.map((t) => t.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['topics'], message: 'topic ids must be unique' })
    }
  })
export type TopicMapFile = z.infer<typeof TopicMapFileSchema>

const TaskBaseShape = {
  id: ContentIdSchema,
  order: z.int().min(1),
  title: z.string().min(3).max(120),
  levels: z.array(LevelIdSchema).min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedMinutes: z.int().min(5).max(90),
  hints: z.array(z.string().trim().min(1)).min(1).max(4),
  starterCode: z.string().min(1).max(5000),
  ...ItemMetaShape,
}

/** Front matter of a coding task (content/<track>/<technology>/tasks/<id>.md). */
export const TaskFileSchema = z.discriminatedUnion('mode', [
  z.strictObject({
    ...TaskBaseShape,
    mode: z.literal('tests'),
    /** Name of the function the user implements and the tests call. */
    entry: z.string().regex(/^[A-Za-z_$][\w$]*$/, 'must be a JavaScript identifier'),
    tests: z
      .array(z.strictObject({ name: z.string().trim().min(1).max(120), code: z.string().min(1) }))
      .min(5),
    /** A plausible but wrong solution that must fail at least one test (SC-008). */
    naiveSolution: z.string().min(1),
  }),
  z.strictObject({
    ...TaskBaseShape,
    mode: z.literal('self-check'),
    acceptanceCriteria: z.array(z.string().trim().min(1)).min(3).max(10),
  }),
])
export type TaskFile = z.infer<typeof TaskFileSchema>

/** Front matter of a system design exercise (content/<track>/system-design/<id>.md). */
export const ExerciseFileSchema = z
  .strictObject({
    id: ContentIdSchema,
    order: z.int().min(1),
    title: z.string().min(3).max(120),
    levels: z.array(LevelIdSchema).min(1),
    timeboxMinutes: z.int().min(15).max(90),
    checklist: z
      .array(z.strictObject({ id: z.string().min(1).max(40), text: z.string().trim().min(1) }))
      .min(8)
      .max(15),
    ...ItemMetaShape,
  })
  .superRefine((exercise, ctx) => {
    const ids = exercise.checklist.map((c) => c.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['checklist'], message: 'checklist ids must be unique' })
    }
  })
export type ExerciseFile = z.infer<typeof ExerciseFileSchema>

/** The fixed walkthrough sections of a design exercise, in order (FR-016). */
export const DESIGN_SECTIONS = [
  { key: 'requirements', heading: 'Requirements' },
  { key: 'architecture', heading: 'High-level architecture' },
  { key: 'components', heading: 'Component design' },
  { key: 'data-api', heading: 'Data model and API' },
  { key: 'state', heading: 'State management' },
  { key: 'performance', heading: 'Performance' },
  { key: 'accessibility', heading: 'Accessibility' },
  { key: 'edge-cases', heading: 'Edge cases and trade-offs' },
] as const
export type DesignSectionKey = (typeof DESIGN_SECTIONS)[number]['key']
