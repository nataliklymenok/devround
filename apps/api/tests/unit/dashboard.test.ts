import { describe, expect, it } from 'vitest'
import {
  buildDashboard,
  type DashboardLesson,
  type DashboardProgress,
} from '../../src/domain/dashboard.js'

const lessons: DashboardLesson[] = [
  {
    lessonId: 'a1',
    title: 'A1',
    moduleId: 'a',
    moduleTitle: 'Module A',
    order: 1,
    isPublished: true,
  },
  {
    lessonId: 'a2',
    title: 'A2',
    moduleId: 'a',
    moduleTitle: 'Module A',
    order: 2,
    isPublished: true,
  },
  {
    lessonId: 'b1',
    title: 'B1',
    moduleId: 'b',
    moduleTitle: 'Module B',
    order: 3,
    isPublished: true,
  },
  {
    lessonId: 'b2',
    title: 'B2',
    moduleId: 'b',
    moduleTitle: 'Module B',
    order: 4,
    isPublished: false,
  },
  {
    lessonId: 'b3',
    title: 'B3',
    moduleId: 'b',
    moduleTitle: 'Module B',
    order: 5,
    isPublished: true,
  },
]

const done = (bestScore: number): DashboardProgress => ({ completed: true, bestScore })

describe('buildDashboard', () => {
  it('starts at 0% with Continue on the first lesson', () => {
    expect(buildDashboard(lessons, new Map())).toEqual({
      overall: { completed: 0, total: 4, percent: 0 },
      modules: [
        { id: 'a', title: 'Module A', completed: 0, total: 2 },
        { id: 'b', title: 'Module B', completed: 0, total: 2 },
      ],
      averageBestScore: null,
      topicsToReview: [],
      continueLessonId: 'a1',
      isComplete: false,
    })
  })

  it('counts completed lessons per module and overall, excluding unavailable ones', () => {
    const progress = new Map([
      ['a1', done(100)],
      ['b2', done(10)], // unpublished: ignored everywhere
      ['b3', done(50)],
    ])
    const d = buildDashboard(lessons, progress)
    expect(d.overall).toEqual({ completed: 2, total: 4, percent: 50 })
    expect(d.modules.map((m) => [m.id, m.completed, m.total])).toEqual([
      ['a', 1, 2],
      ['b', 1, 2],
    ])
    expect(d.averageBestScore).toBe(75)
    expect(d.continueLessonId).toBe('a2')
  })

  it('lists up to 3 completed lessons scoring below 70, lowest first', () => {
    const progress = new Map([
      ['a1', done(60)],
      ['a2', done(30)],
      ['b1', done(69)],
      ['b3', done(70)],
    ])
    expect(buildDashboard(lessons, progress).topicsToReview).toEqual([
      { lessonId: 'a2', title: 'A2', bestScore: 30 },
      { lessonId: 'a1', title: 'A1', bestScore: 60 },
      { lessonId: 'b1', title: 'B1', bestScore: 69 },
    ])
  })

  it('caps topics to review at 3', () => {
    const progress = new Map(['a1', 'a2', 'b1', 'b3'].map((id) => [id, done(10)]))
    expect(buildDashboard(lessons, progress).topicsToReview).toHaveLength(3)
  })

  it('ignores opened-but-not-completed lessons', () => {
    const progress = new Map([['a1', { completed: false, bestScore: null }]])
    const d = buildDashboard(lessons, progress)
    expect(d.overall.completed).toBe(0)
    expect(d.continueLessonId).toBe('a1')
  })

  it('reports completion when every available lesson is done', () => {
    const progress = new Map(['a1', 'a2', 'b1', 'b3'].map((id) => [id, done(90)]))
    const d = buildDashboard(lessons, progress)
    expect(d).toMatchObject({
      overall: { completed: 4, total: 4, percent: 100 },
      continueLessonId: null,
      isComplete: true,
    })
  })

  it('rounds the percentage', () => {
    const three = lessons.slice(0, 3)
    expect(buildDashboard(three, new Map([['a1', done(80)]])).overall.percent).toBe(33)
  })
})
