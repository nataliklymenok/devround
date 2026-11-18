import { z } from 'zod'
import { ReferenceSchema } from './content.js'
import {
  CheckSummarySchema,
  TaskDifficultySchema,
  TaskModeSchema,
  TaskStatusSchema,
} from './plan.js'

export const TaskTestCaseSchema = z.object({ name: z.string(), code: z.string() })

export const TaskProgressViewSchema = z.object({
  status: TaskStatusSchema.nullable(),
  hintsRevealed: z.number().int().min(0),
  solutionRevealed: z.boolean(),
  /** Latest saved draft (tests mode); null = use the starter code */
  draftCode: z.string().nullable(),
  lastCheck: CheckSummarySchema.nullable(),
})
export type TaskProgressView = z.infer<typeof TaskProgressViewSchema>

/** A coding task as shown to the user — hints and solution only once revealed (FR-011). */
export const TaskViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  technology: z.string(),
  difficulty: TaskDifficultySchema,
  estimatedMinutes: z.number().int(),
  mode: TaskModeSchema,
  /** Markdown: Problem, Constraints, Examples */
  statement: z.string(),
  starterCode: z.string(),
  entry: z.string().nullable(),
  /** Visible test cases (tests mode, FR-015d) */
  tests: z.array(TaskTestCaseSchema).nullable(),
  /** Self-check criteria (self-check mode) */
  acceptanceCriteria: z.array(z.string()).nullable(),
  hintsTotal: z.number().int(),
  hints: z.array(z.string()),
  /** Markdown: Solution, Explanation, Complexity, Common mistakes — null until revealed */
  solution: z.string().nullable(),
  references: z.array(ReferenceSchema),
  isDraft: z.boolean(),
  /** The task changed since the draft was saved (spec edge case) */
  taskUpdated: z.boolean(),
  progress: TaskProgressViewSchema,
  prevTaskId: z.string().nullable(),
  nextTaskId: z.string().nullable(),
})
export type TaskView = z.infer<typeof TaskViewSchema>

export const TaskDraftRequestSchema = z.object({ code: z.string().max(20_000) })
export const TaskCheckResultRequestSchema = z
  .object({ passed: z.int().min(0).max(100), total: z.int().min(1).max(100) })
  .refine((r) => r.passed <= r.total, { message: 'passed must not exceed total', path: ['passed'] })
export const TaskStatusRequestSchema = z.object({ status: TaskStatusSchema })

export const TaskHintResponseSchema = z.object({
  hint: z.string(),
  index: z.number().int(),
  hintsRevealed: z.number().int(),
})
export const TaskSolutionResponseSchema = z.object({ solution: z.string() })
