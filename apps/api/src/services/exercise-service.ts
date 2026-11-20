import {
  DESIGN_SECTIONS,
  ReferenceSchema,
  type ExerciseAssessmentResult,
  type ExerciseProgressView,
  type ExerciseView,
} from '@devround/shared'
import { z } from 'zod'
import type { Db } from '../db.js'
import { AppError, notFound } from '../errors.js'
import type { ExerciseProgress } from '../generated/prisma/client.js'

const SectionsSchema = z.array(z.object({ key: z.string(), title: z.string(), body: z.string() }))
const ChecklistSchema = z.array(z.object({ id: z.string(), text: z.string() }))
const ReferencesSchema = z.array(ReferenceSchema)
const SECTION_KEYS = new Set<string>(DESIGN_SECTIONS.map((s) => s.key))

function progressView(p: ExerciseProgress | null): ExerciseProgressView {
  return {
    sectionsRevealed: p?.sectionsRevealed ?? [],
    bestScore: p?.bestScore ?? null,
    completed: p?.completedAt != null,
    lastCovered: p?.lastCovered ?? [],
  }
}

export class ExerciseService {
  constructor(private readonly db: Db) {}

  /** The exercise as part of the user's active plan; 404 if not in it, 410 if unpublished. */
  private async findInActivePlan(userId: string, exerciseId: string) {
    const entry = await this.db.planExercise.findFirst({
      where: { exerciseId, plan: { userId, status: 'active' } },
      include: { exercise: true },
    })
    if (!entry) throw notFound('Exercise')
    if (!entry.exercise.isPublished) {
      throw new AppError('LESSON_UNAVAILABLE', 410, 'This exercise is no longer available')
    }
    return entry
  }

  private upsertProgress(
    userId: string,
    exerciseId: string,
    data: Partial<Omit<ExerciseProgress, 'userId' | 'exerciseId'>>,
  ) {
    return this.db.exerciseProgress.upsert({
      where: { userId_exerciseId: { userId, exerciseId } },
      create: { userId, exerciseId, ...data },
      update: data,
    })
  }

  private async neighbours(planId: string, order: number) {
    const available = { planId, exercise: { isPublished: true } }
    const [prev, next] = await Promise.all([
      this.db.planExercise.findFirst({
        where: { ...available, order: { lt: order } },
        orderBy: { order: 'desc' },
      }),
      this.db.planExercise.findFirst({
        where: { ...available, order: { gt: order } },
        orderBy: { order: 'asc' },
      }),
    ])
    return { prevExerciseId: prev?.exerciseId ?? null, nextExerciseId: next?.exerciseId ?? null }
  }

  async get(userId: string, exerciseId: string): Promise<ExerciseView> {
    const entry = await this.findInActivePlan(userId, exerciseId)
    const { exercise } = entry
    const progress = await this.upsertProgress(userId, exerciseId, { lastOpenedAt: new Date() })
    const revealed = new Set(progress.sectionsRevealed)

    return {
      id: exercise.id,
      title: exercise.title,
      timeboxMinutes: exercise.timeboxMinutes,
      prompt: exercise.prompt,
      // Never send unrevealed walkthrough sections (FR-018, Constitution III).
      sections: SectionsSchema.parse(exercise.sections).map(({ key, title, body }) => ({
        key,
        title,
        body: revealed.has(key) ? body : null,
      })),
      checklist: ChecklistSchema.parse(exercise.checklist),
      references: ReferencesSchema.parse(exercise.references),
      isDraft: exercise.isDraft,
      progress: progressView(progress),
      ...(await this.neighbours(entry.planId, entry.order)),
    }
  }

  async revealSection(userId: string, exerciseId: string, key: string) {
    if (!SECTION_KEYS.has(key))
      throw new AppError('VALIDATION_ERROR', 400, `Unknown section "${key}"`)
    const { exercise } = await this.findInActivePlan(userId, exerciseId)
    const section = SectionsSchema.parse(exercise.sections).find((s) => s.key === key)
    if (!section) throw new AppError('VALIDATION_ERROR', 400, `Unknown section "${key}"`)
    const current = await this.db.exerciseProgress.findUnique({
      where: { userId_exerciseId: { userId, exerciseId } },
    })
    const revealed = current?.sectionsRevealed ?? []
    if (!revealed.includes(key)) {
      await this.upsertProgress(userId, exerciseId, { sectionsRevealed: [...revealed, key] })
    }
    return { key, body: section.body }
  }

  async assess(
    userId: string,
    exerciseId: string,
    covered: string[],
  ): Promise<ExerciseAssessmentResult> {
    const { exercise } = await this.findInActivePlan(userId, exerciseId)
    const checklist = ChecklistSchema.parse(exercise.checklist)
    const ids = new Set(checklist.map((c) => c.id))
    const unknown = covered.filter((id) => !ids.has(id))
    if (unknown.length > 0) {
      throw new AppError('VALIDATION_ERROR', 400, `Unknown checklist items: ${unknown.join(', ')}`)
    }
    const score = Math.round((covered.length / checklist.length) * 100)

    const progress = await this.db.$transaction(async (tx) => {
      const current = await tx.exerciseProgress.findUnique({
        where: { userId_exerciseId: { userId, exerciseId } },
      })
      const data = {
        bestScore: Math.max(current?.bestScore ?? 0, score),
        lastCovered: covered,
        completedAt: current?.completedAt ?? new Date(),
      }
      return tx.exerciseProgress.upsert({
        where: { userId_exerciseId: { userId, exerciseId } },
        create: { userId, exerciseId, ...data },
        update: data,
      })
    })

    return {
      score,
      coveredCount: covered.length,
      total: checklist.length,
      progress: progressView(progress),
    }
  }
}
