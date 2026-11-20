import type { Dashboard } from '@devround/shared'
import type { Db } from '../db.js'
import { buildDashboard } from '../domain/dashboard.js'
import { notFound } from '../errors.js'

export class ProgressService {
  constructor(private readonly db: Db) {}

  async dashboard(userId: string): Promise<Dashboard> {
    const plan = await this.db.plan.findFirst({
      where: { userId, status: 'active' },
      include: {
        track: true,
        level: true,
        technologies: { include: { technology: true } },
        lessons: {
          orderBy: { order: 'asc' },
          include: { lesson: true, module: { include: { technology: true } } },
        },
        tasks: { orderBy: { order: 'asc' }, include: { task: true } },
        exercises: { orderBy: { order: 'asc' }, include: { exercise: true } },
      },
    })
    if (!plan) throw notFound('Plan')

    const progress = await this.db.lessonProgress.findMany({
      where: { userId, lessonId: { in: plan.lessons.map((l) => l.lessonId) } },
    })
    const taskProgress = new Map(
      (
        await this.db.taskProgress.findMany({
          where: { userId, taskId: { in: plan.tasks.map((t) => t.taskId) } },
        })
      ).map((p) => [p.taskId, p]),
    )
    const exerciseProgress = new Map(
      (
        await this.db.exerciseProgress.findMany({
          where: { userId, exerciseId: { in: plan.exercises.map((e) => e.exerciseId) } },
        })
      ).map((p) => [p.exerciseId, p]),
    )

    return {
      target: {
        track: plan.track.name,
        level: plan.level.name,
        technologies: plan.technologies
          .map((t) => t.technology)
          .sort((a, b) => a.position - b.position)
          .map((t) => t.name),
      },
      ...buildDashboard({
        lessons: plan.lessons.map((l) => ({
          lessonId: l.lessonId,
          title: l.lesson.title,
          moduleId: l.moduleId,
          moduleTitle: l.module.title,
          technology: l.module.technology.name,
          order: l.order,
          isPublished: l.lesson.isPublished,
        })),
        progress: new Map(
          progress.map((p) => [
            p.lessonId,
            { completed: p.completedAt !== null, bestScore: p.bestScore },
          ]),
        ),
        tasks: plan.tasks.map((t) => ({
          taskId: t.taskId,
          title: t.task.title,
          order: t.order,
          isPublished: t.task.isPublished,
          status: taskProgress.get(t.taskId)?.status ?? null,
        })),
        exercises: plan.exercises.map((e) => {
          const p = exerciseProgress.get(e.exerciseId)
          return {
            exerciseId: e.exerciseId,
            title: e.exercise.title,
            order: e.order,
            isPublished: e.exercise.isPublished,
            completed: p?.completedAt != null,
            bestScore: p?.bestScore ?? null,
          }
        }),
      }),
    }
  }
}
