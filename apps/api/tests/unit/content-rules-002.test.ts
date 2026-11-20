import { beforeAll, describe, expect, it } from 'vitest'
import { loadLibrary, type LoadedLibrary } from '../../scripts/content/load.js'
import { checkLibrary, findDrafts } from '../../scripts/content/rules.js'
import { verifySolutions } from '../../scripts/content/verify-solutions.js'
import { FIXTURE_CONTENT_DIR } from '../helpers.js'

let fixture: LoadedLibrary

beforeAll(async () => {
  const { library, issues } = await loadLibrary(FIXTURE_CONTENT_DIR)
  expect(issues).toEqual([])
  fixture = library!
})

const clone = () => structuredClone(fixture)
const rules = (lib: LoadedLibrary) => checkLibrary(lib).map((i) => i.rule)
const task = (lib: LoadedLibrary, id: string) => lib.tasks.find((t) => t.data.id === id)!

describe('loader', () => {
  it('splits tasks into public statement and hidden solution', () => {
    const t = task(fixture, 'js-debounce-fx')
    expect(t.headings).toEqual([
      'Problem',
      'Constraints',
      'Examples',
      'Solution',
      'Explanation',
      'Complexity',
      'Common mistakes',
    ])
    expect(t.statement).toContain('## Problem')
    expect(t.statement).not.toContain('clearTimeout(timer)')
    expect(t.solution).toContain('## Solution')
    expect(t.solutionCode).toContain('function debounce')
  })

  it('splits exercises into prompt and the 8 fixed sections', () => {
    const e = fixture.exercises.find((x) => x.data.id === 'sd-fx-autocomplete')!
    expect(e.prompt).toContain('fixture app')
    expect(e.sections.map((s) => s.key)).toEqual([
      'requirements',
      'architecture',
      'components',
      'data-api',
      'state',
      'performance',
      'accessibility',
      'edge-cases',
    ])
    expect(e.sections.every((s) => s.body.length > 0)).toBe(true)
  })
})

describe('topic rules', () => {
  it('accepts the fixture', () => {
    expect(checkLibrary(fixture)).toEqual([])
  })

  it('reports an uncovered must topic (FR-003)', () => {
    const lib = clone()
    lib.topicMaps[0]!.topics.push({ id: 't-js-generators', title: 'Generators', priority: 'must' })
    const issue = checkLibrary(lib).find((i) => i.rule === 'topic-coverage')
    expect(issue?.message).toContain('t-js-generators')
  })

  it('does not require coverage for good-to-know topics', () => {
    const lib = clone()
    lib.topicMaps[0]!.topics.push({ id: 't-js-generators', title: 'Generators', priority: 'good' })
    expect(rules(lib)).not.toContain('topic-coverage')
  })

  it('reports unknown topics, lessons without topics and missing topic maps', () => {
    const lib = clone()
    lib.lessons[0]!.data.topics = ['t-nope']
    lib.lessons[1]!.data.topics = []
    lib.topicMaps = lib.topicMaps.filter((m) => m.technologyId !== 'react')
    expect(rules(lib)).toEqual(
      expect.arrayContaining(['unknown-topic', 'missing-topics', 'missing-topic-map']),
    )
  })

  it('reports a must lesson ordered after a good-only lesson (FR-005)', () => {
    const lib = clone()
    // js-async: promises(1, must), async-await(2, must), event-loop(3, good) → move event-loop first
    const eventLoop = lib.lessons.find((l) => l.data.id === 'js-event-loop')!
    const promises = lib.lessons.find((l) => l.data.id === 'js-promises')!
    eventLoop.data.order = 0
    promises.data.order = 1
    expect(rules(lib)).toContain('topic-order')
  })

  it('reports duplicate topic ids across maps', () => {
    const lib = clone()
    lib.topicMaps[1]!.topics.push({ ...lib.topicMaps[0]!.topics[0]! })
    expect(rules(lib)).toContain('duplicate-id')
  })
})

describe('task and exercise rules', () => {
  it('requires the task sections in order and a single solution code block', () => {
    const lib = clone()
    const t = task(lib, 'js-sum-array')
    t.headings = [
      'Problem',
      'Examples',
      'Constraints',
      'Solution',
      'Explanation',
      'Complexity',
      'Common mistakes',
    ]
    t.solutionCode = null
    expect(rules(lib)).toEqual(expect.arrayContaining(['task-sections', 'task-solution-code']))
  })

  it('allows self-check tasks without a Complexity section', () => {
    expect(task(fixture, 'react-counter-fx').headings).not.toContain('Complexity')
    expect(rules(fixture)).not.toContain('task-sections')
  })

  it('rejects retired, duplicate and misnamed task ids and duplicate orders', () => {
    const lib = clone()
    lib.retired.tasks.push({ id: 'js-sum-array', retiredAt: '2026-11-01', reason: 'x' })
    task(lib, 'js-debounce-fx').data.order = 1
    task(lib, 'react-counter-fx').data.id = 'js-sum-array'
    expect(rules(lib)).toEqual(
      expect.arrayContaining([
        'retired-id-reused',
        'duplicate-order',
        'duplicate-id',
        'id-matches-file',
      ]),
    )
  })

  it('requires exercise sections exactly in the fixed order (FR-016)', () => {
    const lib = clone()
    lib.exercises[0]!.headings = ['Prompt', 'Requirements', 'Performance']
    expect(rules(lib)).toContain('exercise-sections')
  })
})

describe('solution verification (SC-004, SC-008)', () => {
  it('passes for the fixture', async () => {
    expect(await verifySolutions(fixture)).toEqual([])
  })

  it('reports a reference solution that fails a test', async () => {
    const lib = clone()
    task(lib, 'js-sum-array').solutionCode = 'function sumArray(xs) { return xs.length }'
    const issues = await verifySolutions(lib)
    expect(issues.map((i) => i.rule)).toContain('reference-solution')
    expect(issues[0]!.message).toMatch(/expected 6, actual 3/)
  })

  it('reports a naive solution that passes every test', async () => {
    const lib = clone()
    const t = task(lib, 'js-sum-array')
    if (t.data.mode === 'tests') t.data.naiveSolution = t.solutionCode!
    expect((await verifySolutions(lib)).map((i) => i.rule)).toEqual(['naive-solution'])
  })

  it('stops an infinite loop in content code instead of hanging', async () => {
    const lib = clone()
    task(lib, 'js-sum-array').solutionCode = 'function sumArray() { while (true) {} }'
    const issues = await verifySolutions(lib)
    expect(issues.some((i) => /timed out/i.test(i.message))).toBe(true)
    expect(issues[0]!.message).toMatch(/Error: Script execution timed out after 2000ms/)
  }, 60_000)
})

describe('review status (Constitution IV)', () => {
  it('lists drafts', () => {
    expect(
      findDrafts(fixture)
        .map((d) => d.file)
        .sort(),
    ).toEqual(['frontend/javascript/js-values.md', 'frontend/javascript/tasks/js-sum-array.md'])
  })
})
