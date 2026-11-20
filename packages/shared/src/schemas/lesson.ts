import { z } from 'zod'
import { InterviewQuestionSchema, ReferenceSchema } from './content.js'
import { LessonProgressSummarySchema } from './plan.js'

/** Quiz question as shown before submission — no correct answer, no explanation. */
export const PublicQuizItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
})
export type PublicQuizItem = z.infer<typeof PublicQuizItemSchema>

export const LessonViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  moduleTitle: z.string(),
  technology: z.string(),
  order: z.number().int(),
  estimatedMinutes: z.number().int(),
  body: z.string(),
  interviewQuestions: z.array(InterviewQuestionSchema),
  keyTakeaways: z.array(z.string()),
  quiz: z.array(PublicQuizItemSchema),
  progress: LessonProgressSummarySchema,
  references: z.array(ReferenceSchema),
  isDraft: z.boolean(),
  prevLessonId: z.string().nullable(),
  nextLessonId: z.string().nullable(),
})
export type LessonView = z.infer<typeof LessonViewSchema>

export const QuizAttemptRequestSchema = z.object({
  answers: z.array(z.int().min(0)).min(1).max(5),
})
export type QuizAttemptRequest = z.infer<typeof QuizAttemptRequestSchema>

export const QuizQuestionResultSchema = z.object({
  questionId: z.string(),
  selected: z.number().int(),
  correct: z.number().int(),
  isCorrect: z.boolean(),
  explanation: z.string(),
})
export type QuizQuestionResult = z.infer<typeof QuizQuestionResultSchema>

export const QuizAttemptResultSchema = z.object({
  attemptId: z.string(),
  score: z.number().int().min(0).max(100),
  correctCount: z.number().int(),
  totalCount: z.number().int(),
  results: z.array(QuizQuestionResultSchema),
  progress: LessonProgressSummarySchema,
  nextLessonId: z.string().nullable(),
})
export type QuizAttemptResult = z.infer<typeof QuizAttemptResultSchema>
