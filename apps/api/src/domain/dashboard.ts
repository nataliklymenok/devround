import type { Dashboard } from '@devround/shared'

export interface DashboardLesson {
  lessonId: string
  title: string
  moduleId: string
  moduleTitle: string
  order: number
  isPublished: boolean
}

export interface DashboardProgress {
  completed: boolean
  bestScore: number | null
}

const REVIEW_THRESHOLD = 70
const MAX_TOPICS_TO_REVIEW = 3

const percent = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100)

/** Dashboard numbers over the plan's available lessons (data-model.md → Derived: Dashboard). */
export function buildDashboard(
  lessons: DashboardLesson[],
  progress: Map<string, DashboardProgress>,
): Omit<Dashboard, 'target'> {
  const available = lessons.filter((l) => l.isPublished).sort((a, b) => a.order - b.order)
  const isDone = (l: DashboardLesson) => progress.get(l.lessonId)?.completed === true
  const completed = available.filter(isDone)

  const modules: Dashboard['modules'] = []
  for (const lesson of available) {
    let module = modules.find((m) => m.id === lesson.moduleId)
    if (!module) {
      module = { id: lesson.moduleId, title: lesson.moduleTitle, completed: 0, total: 0 }
      modules.push(module)
    }
    module.total++
    if (isDone(lesson)) module.completed++
  }

  const scored = completed.flatMap((l) => {
    const bestScore = progress.get(l.lessonId)?.bestScore
    return bestScore === null || bestScore === undefined ? [] : [{ lesson: l, bestScore }]
  })
  const averageBestScore =
    scored.length === 0
      ? null
      : Math.round(scored.reduce((sum, s) => sum + s.bestScore, 0) / scored.length)

  const topicsToReview = scored
    .filter((s) => s.bestScore < REVIEW_THRESHOLD)
    .sort((a, b) => a.bestScore - b.bestScore || a.lesson.order - b.lesson.order)
    .slice(0, MAX_TOPICS_TO_REVIEW)
    .map((s) => ({ lessonId: s.lesson.lessonId, title: s.lesson.title, bestScore: s.bestScore }))

  const next = available.find((l) => !isDone(l))

  return {
    overall: {
      completed: completed.length,
      total: available.length,
      percent: percent(completed.length, available.length),
    },
    modules,
    averageBestScore,
    topicsToReview,
    continueLessonId: next?.lessonId ?? null,
    isComplete: available.length > 0 && !next,
  }
}
