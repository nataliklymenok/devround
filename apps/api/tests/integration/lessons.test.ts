import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildTestApp, jsonHeaders, resetDb, signIn, syncContent, testDb } from '../helpers.js'

let app: FastifyInstance
let cookie: string

beforeAll(async () => {
  app = await buildTestApp()
})
beforeEach(async () => {
  await resetDb()
  await syncContent()
  cookie = await signIn(app, 'ann@example.com')
  await createPlan(cookie, ['react'])
})
afterAll(() => app.close())

// Fixture: React middle plan = react-jsx, react-props, react-state, react-effects, react-memo, react-context.
// Every fixture quiz has correct answers [0, 1, 2].
const ALL_CORRECT = [0, 1, 2]

async function createPlan(as: string, technologyIds: string[], levelId = 'middle') {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/plans',
    headers: { ...jsonHeaders, cookie: as },
    payload: { trackId: 'frontend', levelId, technologyIds, replaceExisting: true },
  })
  expect(res.statusCode).toBe(201)
}

function getLesson(id: string, as = cookie) {
  return app.inject({ method: 'GET', url: `/api/v1/lessons/${id}`, headers: { cookie: as } })
}

function submit(id: string, answers: unknown, as = cookie) {
  return app.inject({
    method: 'POST',
    url: `/api/v1/lessons/${id}/attempts`,
    headers: { ...jsonHeaders, cookie: as },
    payload: { answers },
  })
}

describe('GET /lessons/:id', () => {
  it('returns the full lesson without quiz answers (V8)', async () => {
    const res = await getLesson('react-props')
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toMatch(/"correct"|"explanation"/)
    const lesson = res.json()
    expect(lesson).toMatchObject({
      id: 'react-props',
      title: 'React Props',
      moduleTitle: 'React basics',
      technology: 'React',
      order: 2,
      estimatedMinutes: 15,
      progress: { completed: false, bestScore: null },
      prevLessonId: 'react-jsx',
      nextLessonId: 'react-state',
    })
    expect(lesson.body).toContain('## Overview')
    expect(lesson.interviewQuestions).toHaveLength(3)
    expect(lesson.keyTakeaways).toHaveLength(3)
    expect(lesson.quiz[0]).toEqual({ id: 'q1', question: 'Fixture question one?', options: ['Right', 'Wrong'] })
  })

  it('records lastOpenedAt', async () => {
    await getLesson('react-jsx')
    const progress = await testDb().lessonProgress.findFirstOrThrow()
    expect(progress.lessonId).toBe('react-jsx')
    expect(progress.completedAt).toBeNull()
  })

  it('returns 404 for a lesson that is not in the user\'s active plan', async () => {
    expect((await getLesson('js-values')).statusCode).toBe(404)
    expect((await getLesson('does-not-exist')).statusCode).toBe(404)
  })

  it('returns 404 for another user\'s lessons when they have no such plan (V11)', async () => {
    const eve = await signIn(app, 'eve@example.com')
    expect((await getLesson('react-props', eve)).statusCode).toBe(404)
    expect((await submit('react-props', ALL_CORRECT, eve)).statusCode).toBe(404)
  })

  it('returns 410 for an unpublished lesson and skips it in prev/next', async () => {
    await testDb().lesson.update({ where: { id: 'react-state' }, data: { isPublished: false } })
    const gone = await getLesson('react-state')
    expect(gone.statusCode).toBe(410)
    expect(gone.json().error.code).toBe('LESSON_UNAVAILABLE')
    expect((await getLesson('react-props')).json().nextLessonId).toBe('react-effects')
    expect((await getLesson('react-effects')).json().prevLessonId).toBe('react-props')
  })

  it('has no prev for the first and no next for the last lesson', async () => {
    expect((await getLesson('react-jsx')).json().prevLessonId).toBeNull()
    expect((await getLesson('react-context')).json().nextLessonId).toBeNull()
  })
})

describe('POST /lessons/:id/attempts', () => {
  it('scores the quiz, reveals answers and completes the lesson (V9)', async () => {
    const res = await submit('react-props', [0, 0, 2])
    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({
      attemptId: expect.any(String),
      score: 67,
      correctCount: 2,
      totalCount: 3,
      progress: { completed: true, bestScore: 67 },
      nextLessonId: 'react-state',
    })
    expect(res.json().results[1]).toEqual({
      questionId: 'q2',
      selected: 0,
      correct: 1,
      isCorrect: false,
      explanation: 'The second option is right.',
    })
    const attempt = await testDb().quizAttempt.findFirstOrThrow()
    expect(attempt.questionIds).toEqual(['q1', 'q2', 'q3'])
    expect(attempt.answers).toEqual([0, 0, 2])
  })

  it('keeps the best score and first completion time across retakes', async () => {
    await submit('react-props', ALL_CORRECT)
    const first = await testDb().lessonProgress.findFirstOrThrow({ where: { lessonId: 'react-props' } })
    const retake = await submit('react-props', [1, 0, 0])
    expect(retake.json()).toMatchObject({ score: 0, progress: { completed: true, bestScore: 100 } })
    const after = await testDb().lessonProgress.findFirstOrThrow({ where: { lessonId: 'react-props' } })
    expect(after.completedAt).toEqual(first.completedAt)
    expect(await testDb().quizAttempt.count()).toBe(2)
  })

  it('updates plan progress immediately', async () => {
    await submit('react-jsx', ALL_CORRECT)
    const plan = await app.inject({ method: 'GET', url: '/api/v1/plans/current', headers: { cookie } })
    const lesson = plan.json().modules[0].lessons[0]
    expect(lesson.progress).toEqual({ completed: true, bestScore: 100 })
  })

  it.each([
    ['too few answers', [0, 1]],
    ['too many answers', [0, 1, 2, 0]],
    ['index out of range', [0, 1, 9]],
    ['negative index', [-1, 1, 2]],
    ['not an array', 'abc'],
  ])('rejects %s with 400', async (_name, answers) => {
    const res = await submit('react-props', answers)
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
    expect(await testDb().quizAttempt.count()).toBe(0)
  })

  it('returns 410 for an unpublished lesson', async () => {
    await testDb().lesson.update({ where: { id: 'react-props' }, data: { isPublished: false } })
    expect((await submit('react-props', ALL_CORRECT)).statusCode).toBe(410)
  })
})
