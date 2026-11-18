import { describe, expect, it } from 'vitest'
import {
  buildDashboard,
  type DashboardExercise,
  type DashboardLesson,
  type DashboardProgress,
  type DashboardTask,
} from '../../src/domain/dashboard.js'

const lesson = (
  lessonId: string,
  moduleId: string,
  technology: string,
  order: number,
  isPublished = true,
): DashboardLesson => ({
  lessonId,
  title: lessonId.toUpperCase(),
  moduleId,
  moduleTitle: `Module ${moduleId}`,
  technology,
  order,
  isPublished,
})

const lessons: DashboardLesson[] = [
  lesson('a1', 'a', 'JavaScript', 1),
  lesson('a2', 'a', 'JavaScript', 2),
  lesson('b1', 'b', 'React', 3),
  lesson('b2', 'b', 'React', 4, false),
  lesson('b3', 'b', 'React', 5),
]
const done = (bestScore: number): DashboardProgress => ({ completed: true, bestScore })
const none = { tasks: [] as DashboardTask[], exercises: [] as DashboardExercise[] }

describe('buildDashboard — lessons (001 behaviour)', () => {
  it('starts at 0% with continue on the first lesson', () => {
    const d = buildDashboard({ lessons, progress: new Map(), ...none })
    expect(d).toMatchObject({
      overall: { completed: 0, total: 4, percent: 0 },
      modules: [
        { id: 'a', title: 'Module a', completed: 0, total: 2 },
        { id: 'b', title: 'Module b', completed: 0, total: 2 },
      ],
      averageBestScore: null,
      topicsToReview: [],
      continue: { kind: 'lesson', id: 'a1' },
      isComplete: false,
    })
  })

  it('excludes unavailable lessons and averages best scores', () => {
    const progress = new Map([
      ['a1', done(100)],
      ['b2', done(10)],
      ['b3', done(50)],
    ])
    const d = buildDashboard({ lessons, progress, ...none })
    expect(d.overall).toEqual({ completed: 2, total: 4, percent: 50 })
    expect(d.averageBestScore).toBe(75)
    expect(d.continue).toEqual({ kind: 'lesson', id: 'a2' })
  })

  it('ignores opened-but-not-completed lessons', () => {
    const d = buildDashboard({
      lessons,
      progress: new Map([['a1', { completed: false, bestScore: null }]]),
      ...none,
    })
    expect(d.overall.completed).toBe(0)
  })
})

describe('buildDashboard — areas and mixed review list (002)', () => {
  const tasks: DashboardTask[] = [
    { taskId: 't1', title: 'Debounce', order: 1, isPublished: true, status: 'solved_own' },
    { taskId: 't2', title: 'Throttle', order: 2, isPublished: true, status: 'revisit' },
    { taskId: 't3', title: 'Curry', order: 3, isPublished: true, status: null },
    { taskId: 't4', title: 'Gone', order: 4, isPublished: false, status: 'solved_own' },
  ]
  const exercises: DashboardExercise[] = [
    {
      exerciseId: 'e1',
      title: 'Autocomplete',
      order: 1,
      isPublished: true,
      completed: true,
      bestScore: 60,
    },
    {
      exerciseId: 'e2',
      title: 'Feed',
      order: 2,
      isPublished: true,
      completed: false,
      bestScore: null,
    },
  ]

  it('reports theory per technology, coding and design areas (FR-021)', () => {
    const d = buildDashboard({ lessons, progress: new Map([['a1', done(90)]]), tasks, exercises })
    expect(d.areas).toEqual([
      { kind: 'theory', technology: 'JavaScript', completed: 1, total: 2 },
      { kind: 'theory', technology: 'React', completed: 0, total: 2 },
      { kind: 'coding', technology: null, completed: 1, total: 3 },
      { kind: 'design', technology: null, completed: 1, total: 2 },
    ])
  })

  it('counts every kind in overall and omits empty areas', () => {
    const d = buildDashboard({ lessons, progress: new Map([['a1', done(90)]]), tasks, exercises })
    expect(d.overall).toEqual({ completed: 3, total: 9, percent: 33 })
    expect(
      buildDashboard({ lessons, progress: new Map(), ...none }).areas.map((a) => a.kind),
    ).toEqual(['theory', 'theory'])
  })

  it('mixes lessons < 70, tasks to revisit (score 0) and exercises < 70, weakest first, up to 5 (FR-022)', () => {
    const progress = new Map([
      ['a1', done(40)],
      ['a2', done(65)],
      ['b1', done(69)],
      ['b3', done(30)],
    ])
    const d = buildDashboard({ lessons, progress, tasks, exercises })
    expect(d.topicsToReview).toEqual([
      { kind: 'task', id: 't2', title: 'Throttle', score: 0 },
      { kind: 'lesson', id: 'b3', title: 'B3', score: 30 },
      { kind: 'lesson', id: 'a1', title: 'A1', score: 40 },
      { kind: 'exercise', id: 'e1', title: 'Autocomplete', score: 60 },
      { kind: 'lesson', id: 'a2', title: 'A2', score: 65 },
    ])
  })

  it('continues with tasks after lessons, then exercises', () => {
    const allLessons = new Map(['a1', 'a2', 'b1', 'b3'].map((id) => [id, done(90)]))
    expect(buildDashboard({ lessons, progress: allLessons, tasks, exercises }).continue).toEqual({
      kind: 'task',
      id: 't2',
    })
    const solvedTasks = tasks.map((t) => ({ ...t, status: 'solved_with_hints' as const }))
    expect(
      buildDashboard({ lessons, progress: allLessons, tasks: solvedTasks, exercises }).continue,
    ).toEqual({
      kind: 'exercise',
      id: 'e2',
    })
  })

  it('is complete only when every available item of every kind is done', () => {
    const allLessons = new Map(['a1', 'a2', 'b1', 'b3'].map((id) => [id, done(90)]))
    const solvedTasks = tasks.map((t) => ({ ...t, status: 'solved_own' as const }))
    const doneExercises = exercises.map((e) => ({ ...e, completed: true, bestScore: 90 }))
    const d = buildDashboard({
      lessons,
      progress: allLessons,
      tasks: solvedTasks,
      exercises: doneExercises,
    })
    expect(d).toMatchObject({ isComplete: true, continue: null, overall: { percent: 100 } })
  })
})
