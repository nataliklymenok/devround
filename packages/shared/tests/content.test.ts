import { describe, expect, it } from 'vitest'
import { CatalogFileSchema, LessonFileSchema, RetiredFileSchema } from '../src/index.js'

function validLesson() {
  return {
    id: 'react-hooks-rules',
    module: 'react-hooks',
    order: 1,
    title: 'Rules of Hooks',
    description: 'Why hooks must be called unconditionally.',
    levels: ['junior', 'middle'],
    estimatedMinutes: 20,
    keyTakeaways: ['One', 'Two', 'Three'],
    interviewQuestions: [
      { question: 'Q1?', answer: 'A1' },
      { question: 'Q2?', answer: 'A2' },
      { question: 'Q3?', answer: 'A3' },
    ],
    quiz: [
      { id: 'q1', question: 'Q?', options: ['a', 'b'], correct: 0, explanation: 'E' },
      { id: 'q2', question: 'Q?', options: ['a', 'b', 'c'], correct: 2, explanation: 'E' },
      { id: 'q3', question: 'Q?', options: ['a', 'b'], correct: 1, explanation: 'E' },
    ],
  }
}

function issuePaths(input: unknown): string[] {
  const result = LessonFileSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'))
}

describe('LessonFileSchema', () => {
  it('accepts a valid lesson', () => {
    expect(LessonFileSchema.safeParse(validLesson()).success).toBe(true)
  })

  it.each([
    ['id not kebab-case', { id: 'React_Hooks' }, 'id'],
    ['title too short', { title: 'ab' }, 'title'],
    ['description too long', { description: 'x'.repeat(501) }, 'description'],
    ['estimatedMinutes below 5', { estimatedMinutes: 4 }, 'estimatedMinutes'],
    ['estimatedMinutes above 90', { estimatedMinutes: 91 }, 'estimatedMinutes'],
    ['estimatedMinutes not integer', { estimatedMinutes: 10.5 }, 'estimatedMinutes'],
    ['no levels', { levels: [] }, 'levels'],
    ['duplicate levels', { levels: ['junior', 'junior'] }, 'levels'],
    ['too few takeaways', { keyTakeaways: ['a', 'b'] }, 'keyTakeaways'],
    ['too many takeaways', { keyTakeaways: ['1', '2', '3', '4', '5', '6', '7'] }, 'keyTakeaways'],
    ['too few interview questions', { interviewQuestions: [{ question: 'q', answer: 'a' }] }, 'interviewQuestions'],
    ['unknown field', { extra: true }, ''],
  ])('rejects %s', (_name, patch, path) => {
    expect(issuePaths({ ...validLesson(), ...patch })).toContain(path)
  })

  it('rejects a quiz with fewer than 3 or more than 5 questions', () => {
    const lesson = validLesson()
    expect(issuePaths({ ...lesson, quiz: lesson.quiz.slice(0, 2) })).toContain('quiz')
    const six = Array.from({ length: 6 }, (_, i) => ({ ...lesson.quiz[0], id: `q${i}` }))
    expect(issuePaths({ ...lesson, quiz: six })).toContain('quiz')
  })

  it('rejects correct index out of range', () => {
    const lesson = validLesson()
    lesson.quiz[0] = { ...lesson.quiz[0]!, correct: 2 }
    expect(issuePaths(lesson)).toContain('quiz.0.correct')
  })

  it('rejects duplicate options and duplicate quiz ids', () => {
    const lesson = validLesson()
    lesson.quiz[0] = { ...lesson.quiz[0]!, options: ['a', 'a'] }
    lesson.quiz[1] = { ...lesson.quiz[1]!, id: 'q3' }
    const paths = issuePaths(lesson)
    expect(paths).toContain('quiz.0.options')
    expect(paths).toContain('quiz')
  })

  it('rejects options count outside 2..5 and empty explanation', () => {
    const lesson = validLesson()
    lesson.quiz[0] = { ...lesson.quiz[0]!, options: ['only'] }
    lesson.quiz[1] = { ...lesson.quiz[1]!, explanation: ' ' }
    const paths = issuePaths(lesson)
    expect(paths).toContain('quiz.0.options')
    expect(paths).toContain('quiz.1.explanation')
  })
})

describe('CatalogFileSchema', () => {
  it('accepts a minimal catalog', () => {
    const result = CatalogFileSchema.safeParse({
      levels: [{ id: 'junior', name: 'Junior', rank: 1 }],
      tracks: [{ id: 'frontend', name: 'Frontend', available: true, technologies: [] }],
    })
    expect(result.success).toBe(true)
  })
})

describe('RetiredFileSchema', () => {
  it('defaults to empty lists', () => {
    expect(RetiredFileSchema.parse({})).toEqual({ lessons: [], modules: [] })
  })
})
