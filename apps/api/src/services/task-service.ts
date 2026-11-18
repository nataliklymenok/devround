import {
  ReferenceSchema,
  TaskTestCaseSchema,
  type TaskProgressView,
  type TaskStatus,
  type TaskView,
} from '@devround/shared'
import { z } from 'zod'
import type { Db } from '../db.js'
import { AppError, notFound } from '../errors.js'
import type { TaskProgress } from '../generated/prisma/client.js'

const StringsSchema = z.array(z.string())
const TestsSchema = z.array(TaskTestCaseSchema)
const ReferencesSchema = z.array(ReferenceSchema)

function progressView(p: TaskProgress | null): TaskProgressView {
  return {
    status: p?.status ?? null,
    hintsRevealed: p?.hintsRevealed ?? 0,
    solutionRevealed: p?.solutionRevealed ?? false,
    draftCode: p?.draftCode ?? null,
    lastCheck:
      p?.lastCheckPassed != null && p.lastCheckTotal != null
        ? { passed: p.lastCheckPassed, total: p.lastCheckTotal }
        : null,
  }
}

export class TaskService {
  constructor(private readonly db: Db) {}

  /** The task as part of the user's active plan; 404 if not in it, 410 if unpublished. */
  private async findInActivePlan(userId: string, taskId: string) {
    const entry = await this.db.planTask.findFirst({
      where: { taskId, plan: { userId, status: 'active' } },
      include: { task: { include: { technology: true } } },
    })
    if (!entry) throw notFound('Task')
    if (!entry.task.isPublished) {
      throw new AppError('LESSON_UNAVAILABLE', 410, 'This task is no longer available')
    }
    return entry
  }

  private progress(userId: string, taskId: string) {
    return this.db.taskProgress.findUnique({ where: { userId_taskId: { userId, taskId } } })
  }

  private upsertProgress(
    userId: string,
    taskId: string,
    data: Partial<Omit<TaskProgress, 'userId' | 'taskId'>>,
  ) {
    return this.db.taskProgress.upsert({
      where: { userId_taskId: { userId, taskId } },
      create: { userId, taskId, ...data },
      update: data,
    })
  }

  private async neighbours(planId: string, order: number) {
    const available = { planId, task: { isPublished: true } }
    const [prev, next] = await Promise.all([
      this.db.planTask.findFirst({
        where: { ...available, order: { lt: order } },
        orderBy: { order: 'desc' },
      }),
      this.db.planTask.findFirst({
        where: { ...available, order: { gt: order } },
        orderBy: { order: 'asc' },
      }),
    ])
    return { prevTaskId: prev?.taskId ?? null, nextTaskId: next?.taskId ?? null }
  }

  async get(userId: string, taskId: string): Promise<TaskView> {
    const entry = await this.findInActivePlan(userId, taskId)
    const { task } = entry
    const progress = await this.upsertProgress(userId, taskId, { lastOpenedAt: new Date() })
    const hints = StringsSchema.parse(task.hints)

    return {
      id: task.id,
      title: task.title,
      technology: task.technology.name,
      difficulty: task.difficulty,
      estimatedMinutes: task.estimatedMinutes,
      mode: task.mode === 'tests' ? 'tests' : 'self-check',
      statement: task.statement,
      starterCode: task.starterCode,
      entry: task.entry,
      tests: task.tests ? TestsSchema.parse(task.tests) : null,
      acceptanceCriteria: task.acceptanceCriteria
        ? StringsSchema.parse(task.acceptanceCriteria)
        : null,
      hintsTotal: hints.length,
      // Never send unrevealed hints or the solution (FR-011, Constitution III).
      hints: hints.slice(0, progress.hintsRevealed),
      solution: progress.solutionRevealed ? task.solution : null,
      references: ReferencesSchema.parse(task.references),
      isDraft: task.isDraft,
      taskUpdated: progress.draftCode !== null && progress.draftContentHash !== task.contentHash,
      progress: progressView(progress),
      ...(await this.neighbours(entry.planId, entry.order)),
    }
  }

  async revealHint(userId: string, taskId: string) {
    const { task } = await this.findInActivePlan(userId, taskId)
    const hints = StringsSchema.parse(task.hints)
    const revealed = (await this.progress(userId, taskId))?.hintsRevealed ?? 0
    if (revealed >= hints.length) {
      throw new AppError('NO_MORE_HINTS', 409, 'All hints are already revealed')
    }
    await this.upsertProgress(userId, taskId, { hintsRevealed: revealed + 1 })
    return { hint: hints[revealed]!, index: revealed, hintsRevealed: revealed + 1 }
  }

  async revealSolution(userId: string, taskId: string) {
    const { task } = await this.findInActivePlan(userId, taskId)
    await this.upsertProgress(userId, taskId, { solutionRevealed: true })
    return { solution: task.solution }
  }

  async saveDraft(userId: string, taskId: string, code: string) {
    const { task } = await this.findInActivePlan(userId, taskId)
    if (task.mode !== 'tests') {
      throw new AppError(
        'VALIDATION_ERROR',
        400,
        'Drafts are only stored for tasks with an in-app editor',
      )
    }
    await this.upsertProgress(userId, taskId, {
      draftCode: code,
      draftContentHash: task.contentHash,
    })
  }

  async saveCheckResult(userId: string, taskId: string, passed: number, total: number) {
    await this.findInActivePlan(userId, taskId)
    await this.upsertProgress(userId, taskId, { lastCheckPassed: passed, lastCheckTotal: total })
  }

  async setStatus(userId: string, taskId: string, status: TaskStatus): Promise<TaskProgressView> {
    await this.findInActivePlan(userId, taskId)
    const current = await this.progress(userId, taskId)
    if (
      status === 'solved_own' &&
      ((current?.hintsRevealed ?? 0) > 0 || current?.solutionRevealed)
    ) {
      throw new AppError(
        'HINTS_USED',
        409,
        '"Solved on my own" is not available after revealing hints or the solution',
      )
    }
    return progressView(await this.upsertProgress(userId, taskId, { status }))
  }

  /** New attempt: hide hints and solution again, restore starter code; keep the status (FR-013). */
  async reset(userId: string, taskId: string): Promise<TaskProgressView> {
    await this.findInActivePlan(userId, taskId)
    return progressView(
      await this.upsertProgress(userId, taskId, {
        hintsRevealed: 0,
        solutionRevealed: false,
        draftCode: null,
        draftContentHash: null,
        lastCheckPassed: null,
        lastCheckTotal: null,
        attemptStartedAt: new Date(),
      }),
    )
  }
}
