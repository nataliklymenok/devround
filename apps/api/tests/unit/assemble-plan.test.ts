import { describe, expect, it } from 'vitest'
import { assemblePlan, type CatalogForPlan } from '../../src/domain/assemble-plan.js'

const catalog: CatalogForPlan = {
  technologies: [
    { id: 'react', position: 3 },
    { id: 'javascript', position: 1 },
    { id: 'typescript', position: 2 },
  ],
  modules: [
    { id: 'react-b', technologyId: 'react', order: 2 },
    { id: 'react-a', technologyId: 'react', order: 1 },
    { id: 'ts-a', technologyId: 'typescript', order: 1 },
    { id: 'js-a', technologyId: 'javascript', order: 1 },
  ],
  lessons: [
    { id: 'r-b2', moduleId: 'react-b', order: 2, levels: ['middle'], isPublished: true },
    { id: 'r-b1', moduleId: 'react-b', order: 1, levels: ['middle', 'senior'], isPublished: true },
    { id: 'r-a1', moduleId: 'react-a', order: 1, levels: ['junior', 'middle'], isPublished: true },
    { id: 'r-a2', moduleId: 'react-a', order: 2, levels: ['senior'], isPublished: true },
    { id: 'r-a3', moduleId: 'react-a', order: 3, levels: ['middle'], isPublished: false },
    { id: 't-a1', moduleId: 'ts-a', order: 1, levels: ['middle'], isPublished: true },
    { id: 'j-a1', moduleId: 'js-a', order: 1, levels: ['middle'], isPublished: true },
  ],
}

describe('assemblePlan', () => {
  it('filters by technologies and level and orders by technology → module → lesson', () => {
    const plan = assemblePlan(catalog, {
      levelId: 'middle',
      technologyIds: ['react', 'typescript'],
    })
    expect(plan).toEqual([
      { lessonId: 't-a1', moduleId: 'ts-a', order: 1 },
      { lessonId: 'r-a1', moduleId: 'react-a', order: 2 },
      { lessonId: 'r-b1', moduleId: 'react-b', order: 3 },
      { lessonId: 'r-b2', moduleId: 'react-b', order: 4 },
    ])
  })

  it('excludes unpublished lessons and lessons for other levels', () => {
    const ids = assemblePlan(catalog, { levelId: 'middle', technologyIds: ['react'] }).map(
      (l) => l.lessonId,
    )
    expect(ids).not.toContain('r-a3')
    expect(ids).not.toContain('r-a2')
  })

  it('drops modules without matching lessons', () => {
    const plan = assemblePlan(catalog, { levelId: 'junior', technologyIds: ['react'] })
    expect(plan).toEqual([{ lessonId: 'r-a1', moduleId: 'react-a', order: 1 }])
  })

  it('is deterministic regardless of input order', () => {
    const a = assemblePlan(catalog, { levelId: 'middle', technologyIds: ['react', 'javascript'] })
    const shuffled: CatalogForPlan = {
      technologies: [...catalog.technologies].reverse(),
      modules: [...catalog.modules].reverse(),
      lessons: [...catalog.lessons].reverse(),
    }
    const b = assemblePlan(shuffled, { levelId: 'middle', technologyIds: ['javascript', 'react'] })
    expect(b).toEqual(a)
    expect(a.map((l) => l.order)).toEqual(a.map((_, i) => i + 1))
  })

  it('ignores technologies that were not selected', () => {
    const ids = assemblePlan(catalog, { levelId: 'middle', technologyIds: ['javascript'] }).map(
      (l) => l.lessonId,
    )
    expect(ids).toEqual(['j-a1'])
  })
})
