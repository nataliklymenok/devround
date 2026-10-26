import type { CreatePlanRequestSchema, PlanDetail } from '@devround/shared'
import type { z } from 'zod'
import type { Db } from '../db.js'
import { assemblePlan } from '../domain/assemble-plan.js'
import { AppError, notFound } from '../errors.js'
import { Prisma } from '../generated/prisma/client.js'

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
    const assembled = assemblePlan(
      { technologies, modules, lessons },
      { levelId: level.id, technologyIds: input.technologyIds },
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
    }
  }
}
