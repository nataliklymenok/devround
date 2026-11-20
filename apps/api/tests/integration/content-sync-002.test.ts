import { beforeEach, describe, expect, it } from 'vitest'
import { syncLibrary } from '../../scripts/content/sync-library.js'
import { validateLibrary } from '../../scripts/content/validate-library.js'
import { FIXTURE_CONTENT_DIR, resetDb, syncContent, testDb } from '../helpers.js'

beforeEach(() => resetDb())

describe('content:sync — tasks and exercises', () => {
  it('stores tasks with hidden parts separated and exercises with fixed sections', async () => {
    const report = await syncContent()
    expect(report.tasks).toEqual({ created: 3, updated: 0, unchanged: 0, unpublished: 0 })
    expect(report.exercises).toEqual({ created: 2, updated: 0, unchanged: 0, unpublished: 0 })
    expect(report.drafts).toBe(2)

    const debounce = await testDb().codingTask.findUniqueOrThrow({
      where: { id: 'js-debounce-fx' },
    })
    expect(debounce).toMatchObject({
      mode: 'tests',
      entry: 'debounce',
      difficulty: 'medium',
      isDraft: false,
    })
    expect(debounce.statement).not.toContain('clearTimeout(timer)')
    expect(debounce.solution).toContain('clearTimeout(timer)')
    expect((debounce.tests as unknown[]).length).toBe(5)

    const counter = await testDb().codingTask.findUniqueOrThrow({
      where: { id: 'react-counter-fx' },
    })
    expect(counter).toMatchObject({ mode: 'self_check', entry: null })

    const sumArray = await testDb().codingTask.findUniqueOrThrow({ where: { id: 'js-sum-array' } })
    expect(sumArray.isDraft).toBe(true)

    const exercise = await testDb().designExercise.findUniqueOrThrow({
      where: { id: 'sd-fx-autocomplete' },
    })
    expect((exercise.sections as { key: string }[]).map((s) => s.key)).toHaveLength(8)

    const lesson = await testDb().lesson.findUniqueOrThrow({ where: { id: 'js-scope' } })
    expect(lesson).toMatchObject({ topics: ['t-js-scope'], isDraft: false })
    expect(lesson.reviewedAt?.toISOString().slice(0, 10)).toBe('2026-11-18')

    const react = await testDb().technology.findUniqueOrThrow({ where: { id: 'react' } })
    expect(react.recommends).toEqual(['javascript'])
  })

  it('is a no-op on re-sync', async () => {
    await syncContent()
    const second = await syncContent()
    expect(second.tasks).toMatchObject({ created: 0, updated: 0, unchanged: 3 })
    expect(second.exercises).toMatchObject({ created: 0, updated: 0, unchanged: 2 })
  })

  it('refuses to republish an unpublished task id', async () => {
    await syncContent()
    await testDb().codingTask.update({
      where: { id: 'js-sum-array' },
      data: { isPublished: false },
    })
    await expect(syncContent()).rejects.toThrow(/task "js-sum-array" .* cannot be republished/)
  })

  it('--require-reviewed refuses drafts in validate and sync', async () => {
    const { library, issues } = await validateLibrary(FIXTURE_CONTENT_DIR, {
      requireReviewed: true,
    })
    expect(library).toBeNull()
    expect(issues.map((i) => i.rule)).toEqual(['not-reviewed', 'not-reviewed'])

    const { library: lib } = await validateLibrary(FIXTURE_CONTENT_DIR)
    await expect(syncLibrary(testDb(), lib!, { requireReviewed: true })).rejects.toThrow(
      /2 draft item/,
    )
    expect(await testDb().codingTask.count()).toBe(0)
  })
})
