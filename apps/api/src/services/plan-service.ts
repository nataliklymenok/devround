import type { CreatePlanRequestSchema, PlanDetail } from '@devround/shared'
import type { z } from 'zod'
import type { Db } from '../db.js'
import { assembleExercises, assemblePlan, assembleTasks } from '../domain/assemble-plan.js'
import { AppError, notFound } from '../errors.js'
import {
  Prisma,
  type CodingTask as CodingTaskRow,
  type DesignExercise as DesignExerciseRow,
} from '../generated/prisma/client.js'

type CreatePlanInput = z.output<typeof CreatePlanRequestSchema>

const activePlanExists = () =>
  new AppError('ACTIVE_PLAN_EXISTS', 409, 'You already have an active plan')

export class PlanService {
  constructor(private readonly db: Db) {}

  async create(userId: string, input: CreatePlanInput): Promise<PlanDetail> {
    const track = await this.db.track.findUnique({ where: { id: input.trackId } })
    if (!track?.isAvailable) {
      throw new AppError('TRACK_UNAVAILABLE', 422, 'This track is not available yet')
    }
    const level = await this.db.level.findUnique({ where: { id: input.levelId } })
    if (!level) {
      throw new AppError('VALIDATION_ERROR', 400, 'Unknown level', { field: 'levelId' })
    }
    const technologies = await this.db.technology.findMany({
      where: { id: { in: input.technologyIds }, trackId: track.id, isAvailable: true },
    })
    if (technologies.length !== input.technologyIds.length) {
      throw new AppError('TRACK_UNAVAILABLE', 422, 'One or more technologies are not available', {
        field: 'technologyIds',
      })
    }

    const modules = await this.db.module.findMany({
      where: { technologyId: { in: input.technologyIds } },
      select: { id: true, technologyId: true, order: true },
    })
    const lessons = await this.db.lesson.findMany({
      where: { moduleId: { in: modules.map((m) => m.id) }, isPublished: true },
      select: { id: true, moduleId: true, order: true, levels: true, isPublished: true },
    })
    const selection = { levelId: level.id, technologyIds: input.technologyIds }
    const assembled = assemblePlan({ technologies, modules, lessons }, selection)
    const tasks = assembleTasks(
      await this.db.codingTask.findMany({
        where: { technologyId: { in: input.technologyIds }, isPublished: true },
        select: {
          id: true,
          technologyId: true,
          order: true,
          difficulty: true,
          levels: true,
          isPublished: true,
        },
      }),
      technologies,
      selection,
    )
    const exercises = assembleExercises(
      await this.db.designExercise.findMany({
        where: { trackId: track.id, isPublished: true },
        select: { id: true, trackId: true, order: true, levels: true, isPublished: true },
      }),
      { trackId: track.id, levelId: level.id },
    )

    try {
      await this.db.$transaction(async (tx) => {
        const active = await tx.plan.count({ where: { userId, status: 'active' } })
        if (active > 0 && !input.replaceExisting) throw activePlanExists()
        await tx.plan.updateMany({
          where: { userId, status: 'active' },
          data: { status: 'archived', archivedAt: new Date() },
        })
        await tx.plan.create({
          data: {
            userId,
            trackId: track.id,
            levelId: level.id,
            technologies: { create: input.technologyIds.map((technologyId) => ({ technologyId })) },
            lessons: { create: assembled },
            tasks: { create: tasks },
            exercises: { create: exercises },
          },
        })
      })
    } catch (error) {
      // The partial unique index "one active plan per user" catches concurrent submits.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw activePlanExists()
      }
      throw error
    }

    return this.getCurrent(userId)
  }

  async getCurrent(userId: string): Promise<PlanDetail> {
    const plan = await this.db.plan.findFirst({
      where: { userId, status: 'active' },
      include: {
        track: true,
        level: true,
        technologies: { include: { technology: true } },
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            lesson: true,
            module: { include: { technology: true } },
          },
        },
        tasks: { orderBy: { order: 'asc' }, include: { task: { include: { technology: true } } } },
        exercises: { orderBy: { order: 'asc' }, include: { exercise: true } },
      },
    })
    if (!plan) throw notFound('Plan')

    const progress = new Map(
      (
        await this.db.lessonProgress.findMany({
          where: { userId, lessonId: { in: plan.lessons.map((l) => l.lessonId) } },
        })
      ).map((p) => [p.lessonId, p]),
    )

    const modules: PlanDetail['modules'] = []
    for (const entry of plan.lessons) {
      let module = modules.at(-1)
      if (module?.id !== entry.moduleId) {
        module = {
          id: entry.moduleId,
          title: entry.module.title,
          technology: entry.module.technology.name,
          lessons: [],
        }
        modules.push(module)
      }
      const p = progress.get(entry.lessonId)
      module.lessons.push({
        id: entry.lessonId,
        order: entry.order,
        title: entry.lesson.title,
        description: entry.lesson.description,
        estimatedMinutes: entry.lesson.estimatedMinutes,
        isAvailable: entry.lesson.isPublished,
        isDraft: entry.lesson.isDraft,
        progress: { completed: Boolean(p?.completedAt), bestScore: p?.bestScore ?? null },
      })
    }

    return {
      id: plan.id,
      target: {
        track: plan.track.name,
        level: plan.level.name,
        technologies: plan.technologies
          .map((t) => t.technology)
          .sort((a, b) => a.position - b.position)
          .map((t) => t.name),
      },
      modules,
      tasks: await this.planTasks(userId, plan.tasks),
      exercises: await this.planExercises(userId, plan.exercises),
    }
  }

  private async planTasks(
    userId: string,
    entries: { order: number; task: CodingTaskRow & { technology: { name: string } } }[],
  ): Promise<PlanDetail['tasks']> {
    const progress = new Map(
      (
        await this.db.taskProgress.findMany({
          where: { userId, taskId: { in: entries.map((e) => e.task.id) } },
        })
      ).map((p) => [p.taskId, p]),
    )
    return entries.map(({ order, task }) => {
      const p = progress.get(task.id)
      return {
        id: task.id,
        order,
        title: task.title,
        technology: task.technology.name,
        difficulty: task.difficulty,
        estimatedMinutes: task.estimatedMinutes,
        mode: task.mode === 'tests' ? 'tests' : 'self-check',
        isAvailable: task.isPublished,
        isDraft: task.isDraft,
        progress: {
          status: p?.status ?? null,
          lastCheck:
            p?.lastCheckPassed != null && p.lastCheckTotal != null
              ? { passed: p.lastCheckPassed, total: p.lastCheckTotal }
              : null,
        },
      }
    })
  }

  private async planExercises(
    userId: string,
    entries: { order: number; exercise: DesignExerciseRow }[],
  ): Promise<PlanDetail['exercises']> {
    const progress = new Map(
      (
        await this.db.exerciseProgress.findMany({
          where: { userId, exerciseId: { in: entries.map((e) => e.exercise.id) } },
        })
      ).map((p) => [p.exerciseId, p]),
    )
    return entries.map(({ order, exercise }) => {
      const p = progress.get(exercise.id)
      return {
        id: exercise.id,
        order,
        title: exercise.title,
        timeboxMinutes: exercise.timeboxMinutes,
        isAvailable: exercise.isPublished,
        isDraft: exercise.isDraft,
        progress: { completed: Boolean(p?.completedAt), bestScore: p?.bestScore ?? null },
      }
    })
  }
}
