import { describe, expect, it } from 'vitest'
import {
  CatalogFileSchema,
  ExerciseFileSchema,
  LessonFileSchema,
  RetiredFileSchema,
  TaskFileSchema,
  TopicMapFileSchema,
} from '../src/index.js'

const ref = { title: 'MDN', url: 'https://developer.mozilla.org/' }

function issuePaths(schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: { path: PropertyKey[] }[] } } }, value: unknown) {
  const r = schema.safeParse(value)
  return r.success ? [] : r.error!.issues.map((i) => i.path.map(String).join('.'))
}

const lesson = {
  id: 'js-closures',
  module: 'js-fundamentals',
  order: 1,
  title: 'Closures',
  description: 'd',
  levels: ['middle'],
  estimatedMinutes: 20,
  keyTakeaways: ['a', 'b', 'c'],
  interviewQuestions: [
    { question: 'q', answer: 'a' },
    { question: 'q2', answer: 'a' },
    { question: 'q3', answer: 'a' },
  ],
  quiz: [
    { id: 'q1', question: 'Q', options: ['a', 'b'], correct: 0, explanation: 'e' },
    { id: 'q2', question: 'Q', options: ['a', 'b'], correct: 1, explanation: 'e' },
    { id: 'q3', question: 'Q', options: ['a', 'b'], correct: 0, explanation: 'e' },
  ],
  topics: ['js-closures'],
  references: [ref],
}

const testsTask = {
  id: 'js-debounce',
  order: 1,
  title: 'Implement debounce',
  levels: ['middle'],
  difficulty: 'medium',
  estimatedMinutes: 20,
  mode: 'tests',
  hints: ['Keep the timer in a closure'],
  starterCode: 'function debounce(fn, wait) {}',
  entry: 'debounce',
  tests: Array.from({ length: 5 }, (_, i) => ({ name: `case ${i}`, code: 'assert.ok(true)' })),
  naiveSolution: 'function debounce(fn) { return fn }',
  references: [ref],
}

const selfCheckTask = {
  id: 'react-tabs',
  order: 1,
  title: 'Accessible tabs',
  levels: ['middle'],
  difficulty: 'medium',
  estimatedMinutes: 40,
  mode: 'self-check',
  hints: ['Use roving tabindex'],
  starterCode: 'export function Tabs() {}',
  acceptanceCriteria: ['Arrow keys move focus', 'Selected tab has aria-selected', 'Panels are labelled'],
  references: [ref],
}

const exercise = {
  id: 'sd-autocomplete',
  order: 1,
  title: 'Design an autocomplete',
  levels: ['middle'],
  timeboxMinutes: 45,
  checklist: Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, text: `point ${i}` })),
  references: [ref],
}

describe('lesson additions', () => {
  it('accepts topics, references and a reviewed date', () => {
    const parsed = LessonFileSchema.parse({ ...lesson, reviewed: '2026-11-18' })
    expect(parsed.reviewed).toBe('2026-11-18')
  })

  it('normalizes a YAML Date for reviewed', () => {
    expect(LessonFileSchema.parse({ ...lesson, reviewed: new Date('2026-11-18') }).reviewed).toBe('2026-11-18')
  })

  it.each([
    ['missing references', { references: [] }, 'references'],
    ['non-https reference', { references: [{ title: 'x', url: 'http://example.com' }] }, 'references.0.url'],
    ['bad reviewed date', { reviewed: '18.11.2026' }, 'reviewed'],
    ['non-kebab topic', { topics: ['JS Closures'] }, 'topics.0'],
  ])('rejects %s', (_n, patch, path) => {
    expect(issuePaths(LessonFileSchema, { ...lesson, ...patch })).toContain(path)
  })

  it('defaults topics to an empty list (rules enforce ≥ 1 where a topic map exists)', () => {
    const { topics: _t, ...withoutTopics } = lesson
    expect(LessonFileSchema.parse(withoutTopics).topics).toEqual([])
  })
})

describe('TopicMapFileSchema', () => {
  it('accepts must/good topics and rejects duplicates and unknown priorities', () => {
    expect(TopicMapFileSchema.safeParse({ topics: [{ id: 'js-a', title: 'Topic A', priority: 'must' }] }).success).toBe(true)
    expect(
      issuePaths(TopicMapFileSchema, {
        topics: [
          { id: 'js-a', title: 'Topic A', priority: 'must' },
          { id: 'js-a', title: 'Topic A', priority: 'good' },
        ],
      }),
    ).toContain('topics')
    expect(issuePaths(TopicMapFileSchema, { topics: [{ id: 'js-a', title: 'Topic A', priority: 'often' }] })).toContain(
      'topics.0.priority',
    )
  })
})

describe('TaskFileSchema', () => {
  it('accepts tests and self-check tasks', () => {
    expect(TaskFileSchema.safeParse(testsTask).success).toBe(true)
    expect(TaskFileSchema.safeParse(selfCheckTask).success).toBe(true)
  })

  it.each([
    ['fewer than 5 tests', { tests: testsTask.tests.slice(0, 4) }, 'tests'],
    ['no hints', { hints: [] }, 'hints'],
    ['five hints', { hints: ['1', '2', '3', '4', '5'] }, 'hints'],
    ['bad entry name', { entry: 'not valid' }, 'entry'],
    ['bad difficulty', { difficulty: 'expert' }, 'difficulty'],
    ['missing order', { order: undefined }, 'order'],
  ])('rejects a tests task with %s', (_n, patch, path) => {
    expect(issuePaths(TaskFileSchema, { ...testsTask, ...patch })).toContain(path)
  })

  it('requires naiveSolution for tests mode and acceptanceCriteria for self-check', () => {
    const { naiveSolution: _n, ...noNaive } = testsTask
    expect(issuePaths(TaskFileSchema, noNaive)).toContain('naiveSolution')
    expect(issuePaths(TaskFileSchema, { ...selfCheckTask, acceptanceCriteria: ['a', 'b'] })).toContain(
      'acceptanceCriteria',
    )
  })

  it('rejects mixing fields from the other mode', () => {
    expect(TaskFileSchema.safeParse({ ...selfCheckTask, entry: 'x' }).success).toBe(false)
  })
})

describe('ExerciseFileSchema', () => {
  it('accepts a valid exercise', () => {
    expect(ExerciseFileSchema.safeParse(exercise).success).toBe(true)
  })

  it.each([
    ['7 checklist items', { checklist: exercise.checklist.slice(0, 7) }, 'checklist'],
    ['duplicate checklist ids', { checklist: exercise.checklist.map((c) => ({ ...c, id: 'same' })) }, 'checklist'],
    ['timebox below 15', { timeboxMinutes: 10 }, 'timeboxMinutes'],
  ])('rejects %s', (_n, patch, path) => {
    expect(issuePaths(ExerciseFileSchema, { ...exercise, ...patch })).toContain(path)
  })
})

describe('catalog and retired additions', () => {
  it('defaults recommends and the new retired lists', () => {
    const catalog = CatalogFileSchema.parse({
      levels: [{ id: 'middle', name: 'Middle', rank: 2 }],
      tracks: [{ id: 'frontend', name: 'Frontend', available: true, technologies: [{ id: 'react', name: 'React', available: true }] }],
    })
    expect(catalog.tracks[0]!.technologies[0]!.recommends).toEqual([])
    expect(RetiredFileSchema.parse({})).toEqual({ lessons: [], modules: [], tasks: [], exercises: [] })
  })
})
