import {
  InterviewQuestionSchema,
  QuizItemSchema,
  type LessonView,
  type QuizAttemptResult,
} from '@devround/shared'
import { z } from 'zod'
import type { Db } from '../db.js'
import { ScoringError, scoreQuiz } from '../domain/scoring.js'
import { AppError, notFound } from '../errors.js'

const QuizSchema = z.array(QuizItemSchema)
const InterviewQuestionsSchema = z.array(InterviewQuestionSchema)

export class LessonService {
  constructor(private readonly db: Db) {}

  /** The lesson as part of the user's active plan; 404 if not in it, 410 if unpublished. */
  private async findInActivePlan(userId: string, lessonId: string) {
    const entry = await this.db.planLesson.findFirst({
      where: { lessonId, plan: { userId, status: 'active' } },
      include: { lesson: true, module: { include: { technology: true } } },
    })
    if (!entry) throw notFound('Lesson')
    if (!entry.lesson.isPublished) {
      throw new AppError('LESSON_UNAVAILABLE', 410, 'This lesson is no longer available')
    }
    return entry
  }

  /** Previous / next available lessons in plan order. */
  private async neighbours(planId: string, order: number) {
    const available = { planId, lesson: { isPublished: true } }
    const [prev, next] = await Promise.all([
      this.db.planLesson.findFirst({
        where: { ...available, order: { lt: order } },
        orderBy: { order: 'desc' },
        select: { lessonId: true },
      }),
      this.db.planLesson.findFirst({
        where: { ...available, order: { gt: order } },
        orderBy: { order: 'asc' },
        select: { lessonId: true },
      }),
    ])
    return { prevLessonId: prev?.lessonId ?? null, nextLessonId: next?.lessonId ?? null }
  }

  async get(userId: string, lessonId: string): Promise<LessonView> {
    const entry = await this.findInActivePlan(userId, lessonId)
    const { lesson } = entry
    const now = new Date()
    const progress = await this.db.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, lastOpenedAt: now },
      update: { lastOpenedAt: now },
    })

    return {
      id: lesson.id,
      title: lesson.title,
      moduleTitle: entry.module.title,
      technology: entry.module.technology.name,
      order: entry.order,
      estimatedMinutes: lesson.estimatedMinutes,
      body: lesson.body,
      interviewQuestions: InterviewQuestionsSchema.parse(lesson.interviewQuestions),
      keyTakeaways: lesson.keyTakeaways,
      // Never reveal `correct` / `explanation` before submission (FR-018).
      quiz: QuizSchema.parse(lesson.quiz).map(({ id, question, options }) => ({
        id,
        question,
        options,
      })),
      progress: { completed: progress.completedAt !== null, bestScore: progress.bestScore },
      ...(await this.neighbours(entry.planId, entry.order)),
    }
  }

  async submitAttempt(
    userId: string,
    lessonId: string,
    answers: number[],
  ): Promise<QuizAttemptResult> {
    const entry = await this.findInActivePlan(userId, lessonId)
    const quiz = QuizSchema.parse(entry.lesson.quiz)

    let result
    try {
      result = scoreQuiz(quiz, answers)
    } catch (error) {
      if (error instanceof ScoringError) throw new AppError('VALIDATION_ERROR', 400, error.message)
      throw error
    }

    const now = new Date()
    const { attempt, progress } = await this.db.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.create({
        data: {
          userId,
          lessonId,
          answers,
          questionIds: quiz.map((q) => q.id),
          correctCount: result.correctCount,
          totalCount: result.totalCount,
          score: result.score,
        },
      })
      const existing = await tx.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      })
      const bestScore = Math.max(existing?.bestScore ?? 0, result.score)
      const progress = await tx.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        create: { userId, lessonId, completedAt: now, bestScore, lastOpenedAt: now },
        update: { completedAt: existing?.completedAt ?? now, bestScore },
      })
      return { attempt, progress }
    })

    return {
      attemptId: attempt.id,
      ...result,
      progress: { completed: true, bestScore: progress.bestScore },
      nextLessonId: (await this.neighbours(entry.planId, entry.order)).nextLessonId,
    }
  }
}
