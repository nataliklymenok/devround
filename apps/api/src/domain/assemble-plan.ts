export interface CatalogForPlan {
  technologies: { id: string; position: number }[]
  modules: { id: string; technologyId: string; order: number }[]
  lessons: { id: string; moduleId: string; order: number; levels: string[]; isPublished: boolean }[]
}

export interface PlanSelection {
  levelId: string
  technologyIds: string[]
}

export interface AssembledLesson {
  lessonId: string
  moduleId: string
  order: number
}

const byKey =
  <T>(key: (item: T) => number | string) =>
  (a: T, b: T) => {
    const ka = key(a)
    const kb = key(b)
    return ka < kb ? -1 : ka > kb ? 1 : 0
  }

/**
 * Deterministic plan assembly (research R8): selected technologies in catalog position order →
 * their modules by order → published lessons relevant for the level by order. Empty modules drop out.
 */
export function assemblePlan(catalog: CatalogForPlan, selection: PlanSelection): AssembledLesson[] {
  const selected = new Set(selection.technologyIds)
  const technologies = catalog.technologies
    .filter((t) => selected.has(t.id))
    .sort(byKey((t) => t.position))

  const result: AssembledLesson[] = []
  for (const technology of technologies) {
    const modules = catalog.modules
      .filter((m) => m.technologyId === technology.id)
      .sort(byKey((m) => m.order))
    for (const module of modules) {
      const lessons = catalog.lessons
        .filter(
          (l) => l.moduleId === module.id && l.isPublished && l.levels.includes(selection.levelId),
        )
        .sort(byKey((l) => l.order))
      for (const lesson of lessons) {
        result.push({ lessonId: lesson.id, moduleId: module.id, order: result.length + 1 })
      }
    }
  }
  return result
}

export interface TaskForPlan {
  id: string
  technologyId: string
  order: number
  difficulty: 'easy' | 'medium' | 'hard'
  levels: string[]
  isPublished: boolean
}

export interface ExerciseForPlan {
  id: string
  trackId: string
  order: number
  levels: string[]
  isPublished: boolean
}

const DIFFICULTY_RANK = { easy: 1, medium: 2, hard: 3 } as const

/** Live coding section (R10): technology position → difficulty → task order. */
export function assembleTasks(
  tasks: TaskForPlan[],
  technologies: { id: string; position: number }[],
  selection: PlanSelection,
): { taskId: string; order: number }[] {
  const position = new Map(technologies.map((t) => [t.id, t.position]))
  const selected = new Set(selection.technologyIds)
  return tasks
    .filter(
      (t) => selected.has(t.technologyId) && t.isPublished && t.levels.includes(selection.levelId),
    )
    .sort(
      (a, b) =>
        (position.get(a.technologyId) ?? 0) - (position.get(b.technologyId) ?? 0) ||
        DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] ||
        a.order - b.order,
    )
    .map((t, index) => ({ taskId: t.id, order: index + 1 }))
}

/** System design section (R10): exercises of the track relevant for the level, by order. */
export function assembleExercises(
  exercises: ExerciseForPlan[],
  selection: { trackId: string; levelId: string },
): { exerciseId: string; order: number }[] {
  return exercises
    .filter(
      (e) =>
        e.trackId === selection.trackId && e.isPublished && e.levels.includes(selection.levelId),
    )
    .sort((a, b) => a.order - b.order)
    .map((e, index) => ({ exerciseId: e.id, order: index + 1 }))
}
