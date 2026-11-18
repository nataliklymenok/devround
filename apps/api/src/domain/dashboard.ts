import type { Dashboard, ItemKind, TaskStatus } from '@devround/shared'

export interface DashboardLesson {
  lessonId: string
  title: string
  moduleId: string
  moduleTitle: string
  technology: string
  order: number
  isPublished: boolean
}

export interface DashboardProgress {
  completed: boolean
  bestScore: number | null
}

export interface DashboardTask {
  taskId: string
  title: string
  order: number
  isPublished: boolean
  status: TaskStatus | null
}

export interface DashboardExercise {
  exerciseId: string
  title: string
  order: number
  isPublished: boolean
  completed: boolean
  bestScore: number | null
}

export interface DashboardInput {
  lessons: DashboardLesson[]
  progress: Map<string, DashboardProgress>
  tasks: DashboardTask[]
  exercises: DashboardExercise[]
}

const REVIEW_THRESHOLD = 70
const MAX_TOPICS_TO_REVIEW = 5
const KIND_RANK: Record<ItemKind, number> = { lesson: 0, task: 1, exercise: 2 }

const percent = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100)
const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order
const isSolved = (status: TaskStatus | null) =>
  status === 'solved_own' || status === 'solved_with_hints'

/** Dashboard numbers over the plan's available items (data-model.md → Derived: Dashboard). */
export function buildDashboard({
  lessons,
  progress,
  tasks,
  exercises,
}: DashboardInput): Omit<Dashboard, 'target'> {
  const availableLessons = lessons.filter((l) => l.isPublished).sort(byOrder)
  const availableTasks = tasks.filter((t) => t.isPublished).sort(byOrder)
  const availableExercises = exercises.filter((e) => e.isPublished).sort(byOrder)
  const lessonDone = (l: DashboardLesson) => progress.get(l.lessonId)?.completed === true

  // Modules (lessons only, as in 001)
  const modules: Dashboard['modules'] = []
  for (const l of availableLessons) {
    let module = modules.find((m) => m.id === l.moduleId)
    if (!module) {
      module = { id: l.moduleId, title: l.moduleTitle, completed: 0, total: 0 }
      modules.push(module)
    }
    module.total++
    if (lessonDone(l)) module.completed++
  }

  // Areas (FR-021): theory per technology in plan order, then coding and design when present
  const areas: Dashboard['areas'] = []
  for (const l of availableLessons) {
    let area = areas.find((a) => a.kind === 'theory' && a.technology === l.technology)
    if (!area) {
      area = { kind: 'theory', technology: l.technology, completed: 0, total: 0 }
      areas.push(area)
    }
    area.total++
    if (lessonDone(l)) area.completed++
  }
  const solvedTasks = availableTasks.filter((t) => isSolved(t.status))
  const completedExercises = availableExercises.filter((e) => e.completed)
  if (availableTasks.length > 0) {
    areas.push({
      kind: 'coding',
      technology: null,
      completed: solvedTasks.length,
      total: availableTasks.length,
    })
  }
  if (availableExercises.length > 0) {
    areas.push({
      kind: 'design',
      technology: null,
      completed: completedExercises.length,
      total: availableExercises.length,
    })
  }

  // Average best quiz score over completed lessons
  const lessonScores = availableLessons.flatMap((l) => {
    const p = progress.get(l.lessonId)
    return p?.completed && p.bestScore != null ? [{ lesson: l, score: p.bestScore }] : []
  })
  const averageBestScore =
    lessonScores.length === 0
      ? null
      : Math.round(lessonScores.reduce((sum, s) => sum + s.score, 0) / lessonScores.length)

  // Topics to review (FR-022): weakest first across kinds, then kind, then plan order
  const review = [
    ...lessonScores
      .filter((s) => s.score < REVIEW_THRESHOLD)
      .map((s) => ({
        kind: 'lesson' as const,
        id: s.lesson.lessonId,
        title: s.lesson.title,
        score: s.score,
        order: s.lesson.order,
      })),
    ...availableTasks
      .filter((t) => t.status === 'revisit')
      .map((t) => ({
        kind: 'task' as const,
        id: t.taskId,
        title: t.title,
        score: 0,
        order: t.order,
      })),
    ...completedExercises
      .filter((e) => (e.bestScore ?? 0) < REVIEW_THRESHOLD)
      .map((e) => ({
        kind: 'exercise' as const,
        id: e.exerciseId,
        title: e.title,
        score: e.bestScore ?? 0,
        order: e.order,
      })),
  ]
    .sort((a, b) => a.score - b.score || KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.order - b.order)
    .slice(0, MAX_TOPICS_TO_REVIEW)
    .map(({ kind, id, title, score }) => ({ kind, id, title, score }))

  // Continue: first incomplete lesson, then task, then exercise
  const nextLesson = availableLessons.find((l) => !lessonDone(l))
  const nextTask = availableTasks.find((t) => !isSolved(t.status))
  const nextExercise = availableExercises.find((e) => !e.completed)
  const next: Dashboard['continue'] = nextLesson
    ? { kind: 'lesson', id: nextLesson.lessonId }
    : nextTask
      ? { kind: 'task', id: nextTask.taskId }
      : nextExercise
        ? { kind: 'exercise', id: nextExercise.exerciseId }
        : null

  const completed =
    availableLessons.filter(lessonDone).length + solvedTasks.length + completedExercises.length
  const total = availableLessons.length + availableTasks.length + availableExercises.length

  return {
    overall: { completed, total, percent: percent(completed, total) },
    modules,
    areas,
    averageBestScore,
    topicsToReview: review,
    continue: next,
    isComplete: total > 0 && next === null,
  }
}
