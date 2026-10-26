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
        lessons: { orderBy: { order: 'asc' }, include: { lesson: true, module: true } },
      },
    })
    if (!plan) throw notFound('Plan')

    const progress = await this.db.lessonProgress.findMany({
      where: { userId, lessonId: { in: plan.lessons.map((l) => l.lessonId) } },
    })

    return {
      target: {
        track: plan.track.name,
        level: plan.level.name,
        technologies: plan.technologies
          .map((t) => t.technology)
          .sort((a, b) => a.position - b.position)
          .map((t) => t.name),
      },
      ...buildDashboard(
        plan.lessons.map((l) => ({
          lessonId: l.lessonId,
          title: l.lesson.title,
          moduleId: l.moduleId,
          moduleTitle: l.module.title,
          order: l.order,
          isPublished: l.lesson.isPublished,
        })),
        new Map(
          progress.map((p) => [
            p.lessonId,
            { completed: p.completedAt !== null, bestScore: p.bestScore },
          ]),
        ),
      ),
    }
  }
}
