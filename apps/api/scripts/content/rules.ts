import path from 'node:path'
import { DESIGN_SECTIONS } from '@devround/shared'
import {
  HIDDEN_TASK_HEADINGS,
  PUBLIC_TASK_HEADINGS,
  type ContentIssue,
  type LoadedLibrary,
} from './load.js'

export interface CoverageRules {
  minLessonsPerTechnology: number
  minLessonsPerLevel: number
}

/** FR-008 / SC-005 */
export const DEFAULT_COVERAGE: CoverageRules = { minLessonsPerTechnology: 6, minLessonsPerLevel: 3 }

function duplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const dups = new Set<string>()
  for (const v of values) (seen.has(v) ? dups : seen).add(v)
  return [...dups]
}

/** Markdown body rules: ≥ 1 `##` section, fenced code blocks declare a language, no raw HTML. */
export function checkBody(file: string, body: string): ContentIssue[] {
  const issues: ContentIssue[] = []
  let inFence = false
  let fenceMarker = ''
  let hasSection = false

  body.split('\n').forEach((line, index) => {
    const fence = /^\s*(```+|~~~+)(.*)$/.exec(line)
    if (fence) {
      const [, marker = '', info = ''] = fence
      if (!inFence) {
        inFence = true
        fenceMarker = marker
        if (info.trim() === '') {
          issues.push({
            file,
            rule: 'code-fence-language',
            message: `line ${index + 1}: fenced code block must declare a language`,
          })
        }
      } else if (marker.startsWith(fenceMarker) && info.trim() === '') {
        inFence = false
      }
      return
    }
    if (inFence) return
    if (/^##\s+\S/.test(line)) hasSection = true
    const withoutInlineCode = line.replace(/`[^`]*`/g, '')
    if (/<\/?[a-zA-Z][\w-]*(\s[^>]*)?\/?>/.test(withoutInlineCode)) {
      issues.push({
        file,
        rule: 'no-raw-html',
        message: `line ${index + 1}: raw HTML is not allowed`,
      })
    }
  })

  if (inFence) issues.push({ file, rule: 'code-fence-unclosed', message: 'unclosed code block' })
  if (!hasSection) {
    issues.push({
      file,
      rule: 'body-section',
      message: 'body must contain at least one "## " section',
    })
  }
  return issues
}

/** Cross-file rules from contracts/content-format.md. */
export function checkLibrary(
  lib: LoadedLibrary,
  coverage: CoverageRules = DEFAULT_COVERAGE,
): ContentIssue[] {
  const issues: ContentIssue[] = []
  const { catalog } = lib

  // Catalog
  for (const id of duplicates(catalog.levels.map((l) => l.id))) {
    issues.push({
      file: 'catalog.yaml',
      rule: 'duplicate-id',
      message: `level "${id}" is defined twice`,
    })
  }
  for (const id of duplicates(catalog.tracks.map((t) => t.id))) {
    issues.push({
      file: 'catalog.yaml',
      rule: 'duplicate-id',
      message: `track "${id}" is defined twice`,
    })
  }
  for (const id of duplicates(catalog.tracks.flatMap((t) => t.technologies.map((x) => x.id)))) {
    issues.push({
      file: 'catalog.yaml',
      rule: 'duplicate-id',
      message: `technology "${id}" is defined twice`,
    })
  }

  const levelIds = new Set(catalog.levels.map((l) => l.id))
  const techDirs = new Map<string, { available: boolean }>()
  for (const track of catalog.tracks) {
    for (const tech of track.technologies) {
      techDirs.set(`${track.id}/${tech.id}`, { available: track.available && tech.available })
    }
  }

  for (const dir of lib.directories) {
    if (!techDirs.has(dir)) {
      issues.push({
        file: dir,
        rule: 'unknown-directory',
        message: 'directory does not match a track/technology in catalog.yaml',
      })
    }
  }

  // Modules
  const retiredModules = new Set(lib.retired.modules.map((m) => m.id))
  const retiredLessons = new Set(lib.retired.lessons.map((l) => l.id))
  const modulesByTech = new Map<string, Set<string>>()
  const moduleIdsByTrack = new Map<string, string[]>()
  for (const entry of lib.modules) {
    const key = `${entry.trackId}/${entry.technologyId}`
    modulesByTech.set(key, new Set(entry.modules.map((m) => m.id)))
    const trackIds = moduleIdsByTrack.get(entry.trackId) ?? []
    trackIds.push(...entry.modules.map((m) => m.id))
    moduleIdsByTrack.set(entry.trackId, trackIds)
    for (const m of entry.modules) {
      if (retiredModules.has(m.id)) {
        issues.push({
          file: entry.file,
          rule: 'retired-id-reused',
          message: `module id "${m.id}" is retired and cannot be reused`,
        })
      }
    }
  }
  for (const [trackId, ids] of moduleIdsByTrack) {
    for (const id of duplicates(ids)) {
      issues.push({
        file: trackId,
        rule: 'duplicate-id',
        message: `module id "${id}" is used more than once in track "${trackId}"`,
      })
    }
  }

  // Lessons
  for (const id of duplicates(lib.lessons.map((l) => l.data.id))) {
    const files = lib.lessons.filter((l) => l.data.id === id).map((l) => l.file)
    issues.push({
      file: files.join(', '),
      rule: 'duplicate-id',
      message: `lesson id "${id}" is not unique`,
    })
  }

  const lessonsPerModule = new Map<string, number[]>()
  for (const lesson of lib.lessons) {
    const { file, data } = lesson
    const key = `${lesson.trackId}/${lesson.technologyId}`
    if (path.basename(file, '.md') !== data.id) {
      issues.push({
        file,
        rule: 'id-matches-file',
        message: `id "${data.id}" must equal the file name`,
      })
    }
    if (retiredLessons.has(data.id)) {
      issues.push({
        file,
        rule: 'retired-id-reused',
        message: `lesson id "${data.id}" is retired and cannot be reused`,
      })
    }
    if (!modulesByTech.get(key)?.has(data.module)) {
      issues.push({
        file,
        rule: 'unknown-module',
        message: `module "${data.module}" is not defined in ${key}/modules.yaml`,
      })
    }
    for (const level of data.levels) {
      if (!levelIds.has(level)) {
        issues.push({
          file,
          rule: 'unknown-level',
          message: `level "${level}" is not in catalog.yaml`,
        })
      }
    }
    const moduleKey = `${key}/${data.module}`
    lessonsPerModule.set(moduleKey, [...(lessonsPerModule.get(moduleKey) ?? []), data.order])
    issues.push(...checkBody(file, lesson.body))
  }

  for (const [moduleKey, orders] of lessonsPerModule) {
    for (const order of duplicates(orders.map(String))) {
      issues.push({
        file: moduleKey,
        rule: 'duplicate-order',
        message: `order ${order} is used by more than one lesson in module`,
      })
    }
  }

  for (const entry of lib.modules) {
    for (const m of entry.modules) {
      if (!lessonsPerModule.has(`${entry.trackId}/${entry.technologyId}/${m.id}`)) {
        issues.push({
          file: entry.file,
          rule: 'empty-module',
          message: `module "${m.id}" has no lessons`,
        })
      }
    }
  }

  issues.push(...checkTopics(lib), ...checkTasks(lib), ...checkExercises(lib))

  // Coverage (SC-005)
  for (const [key, { available }] of techDirs) {
    if (!available) continue
    const techLessons = lib.lessons.filter((l) => `${l.trackId}/${l.technologyId}` === key)
    if (techLessons.length < coverage.minLessonsPerTechnology) {
      issues.push({
        file: key,
        rule: 'coverage',
        message: `available technology needs ≥ ${coverage.minLessonsPerTechnology} lessons, has ${techLessons.length}`,
      })
    }
    for (const level of catalog.levels) {
      const count = techLessons.filter((l) => l.data.levels.includes(level.id)).length
      if (count < coverage.minLessonsPerLevel) {
        issues.push({
          file: key,
          rule: 'coverage',
          message: `needs ≥ ${coverage.minLessonsPerLevel} lessons for level "${level.id}", has ${count}`,
        })
      }
    }
  }

  return issues
}

const MIDDLE = 'middle'

/** Topic maps, topic references, Middle coverage and must-before-good ordering (R1). */
function checkTopics(lib: LoadedLibrary): ContentIssue[] {
  const issues: ContentIssue[] = []
  const mapByTech = new Map(lib.topicMaps.map((m) => [`${m.trackId}/${m.technologyId}`, m]))
  const priority = new Map<string, 'must' | 'good'>()

  for (const map of lib.topicMaps) {
    for (const topic of map.topics) {
      if (priority.has(topic.id)) {
        issues.push({
          file: map.file,
          rule: 'duplicate-id',
          message: `topic id "${topic.id}" is defined in more than one topic map`,
        })
      }
      priority.set(topic.id, topic.priority)
    }
  }

  for (const track of lib.catalog.tracks) {
    for (const tech of track.technologies) {
      const key = `${track.id}/${tech.id}`
      if (track.available && tech.available && !mapByTech.has(key)) {
        issues.push({
          file: key,
          rule: 'missing-topic-map',
          message: 'available technology needs a topics.middle.yaml',
        })
      }
      for (const rec of tech.recommends) {
        if (!track.technologies.some((t) => t.id === rec)) {
          issues.push({
            file: 'catalog.yaml',
            rule: 'unknown-technology',
            message: `${tech.id} recommends unknown technology "${rec}"`,
          })
        }
      }
    }
  }

  const ownTopics = (key: string) => new Set(mapByTech.get(key)?.topics.map((t) => t.id) ?? [])

  for (const lesson of lib.lessons) {
    const key = `${lesson.trackId}/${lesson.technologyId}`
    if (!mapByTech.has(key)) continue
    const known = ownTopics(key)
    if (lesson.data.topics.length === 0) {
      issues.push({
        file: lesson.file,
        rule: 'missing-topics',
        message: 'lesson needs at least one topic from its technology topic map',
      })
    }
    for (const topic of lesson.data.topics) {
      if (!known.has(topic)) {
        issues.push({
          file: lesson.file,
          rule: 'unknown-topic',
          message: `topic "${topic}" is not in ${key}/topics.middle.yaml`,
        })
      }
    }
  }

  for (const task of lib.tasks) {
    const known = ownTopics(`${task.trackId}/${task.technologyId}`)
    for (const topic of task.data.topics) {
      if (!known.has(topic)) {
        issues.push({
          file: task.file,
          rule: 'unknown-topic',
          message: `topic "${topic}" is not in the ${task.technologyId} topic map`,
        })
      }
    }
  }
  for (const exercise of lib.exercises) {
    for (const topic of exercise.data.topics) {
      if (!priority.has(topic)) {
        issues.push({
          file: exercise.file,
          rule: 'unknown-topic',
          message: `topic "${topic}" is not in any topic map`,
        })
      }
    }
  }

  // Coverage: every must topic needs a Middle lesson of the same technology (FR-003, SC-001)
  for (const map of lib.topicMaps) {
    const middleLessons = lib.lessons.filter(
      (l) =>
        l.trackId === map.trackId &&
        l.technologyId === map.technologyId &&
        l.data.levels.includes(MIDDLE),
    )
    for (const topic of map.topics) {
      if (
        topic.priority === 'must' &&
        !middleLessons.some((l) => l.data.topics.includes(topic.id))
      ) {
        issues.push({
          file: map.file,
          rule: 'topic-coverage',
          message: `must-know topic "${topic.id}" (${topic.title}) has no Middle lesson`,
        })
      }
    }
  }

  // Ordering: within a module, Middle lessons with a must topic come before good-only lessons (FR-005)
  const byModule = new Map<string, typeof lib.lessons>()
  for (const lesson of lib.lessons) {
    if (!lesson.data.levels.includes(MIDDLE)) continue
    const key = `${lesson.trackId}/${lesson.technologyId}/${lesson.data.module}`
    byModule.set(key, [...(byModule.get(key) ?? []), lesson])
  }
  for (const [moduleKey, lessons] of byModule) {
    const sorted = [...lessons].sort((a, b) => a.data.order - b.data.order)
    let seenGoodOnly: string | null = null
    for (const lesson of sorted) {
      const topics = lesson.data.topics.filter((t) => priority.has(t))
      if (topics.length === 0) continue
      const hasMust = topics.some((t) => priority.get(t) === 'must')
      if (!hasMust) seenGoodOnly ??= lesson.data.id
      else if (seenGoodOnly) {
        issues.push({
          file: lesson.file,
          rule: 'topic-order',
          message: `must-know lesson "${lesson.data.id}" comes after good-to-know lesson "${seenGoodOnly}" in ${moduleKey}`,
        })
      }
    }
  }

  return issues
}

function checkHeadingOrder(
  file: string,
  actual: string[],
  expected: readonly string[],
  rule: string,
): ContentIssue[] {
  return actual.join('|') === expected.join('|')
    ? []
    : [
        {
          file,
          rule,
          message: `sections must be exactly: ${expected.map((h) => `## ${h}`).join(', ')} (found: ${actual.join(', ') || 'none'})`,
        },
      ]
}

function checkTasks(lib: LoadedLibrary): ContentIssue[] {
  const issues: ContentIssue[] = []
  const retired = new Set(lib.retired.tasks.map((t) => t.id))

  for (const id of duplicates(lib.tasks.map((t) => t.data.id))) {
    issues.push({ file: 'tasks', rule: 'duplicate-id', message: `task id "${id}" is not unique` })
  }
  const orders = new Map<string, number[]>()
  for (const task of lib.tasks) {
    const { file, data } = task
    if (path.basename(file, '.md') !== data.id) {
      issues.push({
        file,
        rule: 'id-matches-file',
        message: `id "${data.id}" must equal the file name`,
      })
    }
    if (retired.has(data.id)) {
      issues.push({
        file,
        rule: 'retired-id-reused',
        message: `task id "${data.id}" is retired and cannot be reused`,
      })
    }
    const key = `${task.trackId}/${task.technologyId}`
    orders.set(key, [...(orders.get(key) ?? []), data.order])
    const expected =
      data.mode === 'tests'
        ? [...PUBLIC_TASK_HEADINGS, ...HIDDEN_TASK_HEADINGS]
        : task.headings.includes('Complexity')
          ? [...PUBLIC_TASK_HEADINGS, ...HIDDEN_TASK_HEADINGS]
          : [...PUBLIC_TASK_HEADINGS, ...HIDDEN_TASK_HEADINGS.filter((h) => h !== 'Complexity')]
    issues.push(...checkHeadingOrder(file, task.headings, expected, 'task-sections'))
    if (task.solutionCode === null) {
      issues.push({
        file,
        rule: 'task-solution-code',
        message: '## Solution must contain exactly one fenced code block',
      })
    }
    issues.push(...checkBody(file, task.body))
  }
  for (const [key, list] of orders) {
    for (const order of duplicates(list.map(String))) {
      issues.push({
        file: `${key}/tasks`,
        rule: 'duplicate-order',
        message: `task order ${order} is used more than once`,
      })
    }
  }
  return issues
}

function checkExercises(lib: LoadedLibrary): ContentIssue[] {
  const issues: ContentIssue[] = []
  const retired = new Set(lib.retired.exercises.map((e) => e.id))
  const expected = ['Prompt', ...DESIGN_SECTIONS.map((s) => s.heading)]

  for (const id of duplicates(lib.exercises.map((e) => e.data.id))) {
    issues.push({
      file: 'system-design',
      rule: 'duplicate-id',
      message: `exercise id "${id}" is not unique`,
    })
  }
  const orders = new Map<string, number[]>()
  for (const exercise of lib.exercises) {
    const { file, data } = exercise
    if (path.basename(file, '.md') !== data.id) {
      issues.push({
        file,
        rule: 'id-matches-file',
        message: `id "${data.id}" must equal the file name`,
      })
    }
    if (retired.has(data.id)) {
      issues.push({
        file,
        rule: 'retired-id-reused',
        message: `exercise id "${data.id}" is retired and cannot be reused`,
      })
    }
    orders.set(exercise.trackId, [...(orders.get(exercise.trackId) ?? []), data.order])
    issues.push(...checkHeadingOrder(file, exercise.headings, expected, 'exercise-sections'))
    issues.push(...checkBody(file, exercise.body))
  }
  for (const [track, list] of orders) {
    for (const order of duplicates(list.map(String))) {
      issues.push({
        file: `${track}/system-design`,
        rule: 'duplicate-order',
        message: `exercise order ${order} is used more than once`,
      })
    }
  }
  return issues
}

/** Items without a `reviewed:` date (drafts) — must be none for PRs into main (Constitution IV). */
export function findDrafts(lib: LoadedLibrary): ContentIssue[] {
  return [...lib.lessons, ...lib.tasks, ...lib.exercises]
    .filter((item) => !item.data.reviewed)
    .map((item) => ({
      file: item.file,
      rule: 'not-reviewed',
      message: 'draft: add a `reviewed: YYYY-MM-DD` date after human review',
    }))
}

export interface ContentIds {
  lessons: string[]
  modules: string[]
  tasks: string[]
  exercises: string[]
}

export function collectIds(lib: LoadedLibrary): ContentIds {
  return {
    lessons: lib.lessons.map((l) => l.data.id),
    modules: lib.modules.flatMap((m) => m.modules.map((x) => x.id)),
    tasks: lib.tasks.map((t) => t.data.id),
    exercises: lib.exercises.map((e) => e.data.id),
  }
}

/** Ids present on the base branch that disappeared without being listed in retired.yaml. */
export function findRemovedIds(
  base: ContentIds,
  current: ContentIds,
  lib: LoadedLibrary,
): ContentIssue[] {
  const kinds = [
    ['lessons', 'lesson'],
    ['modules', 'module'],
    ['tasks', 'task'],
    ['exercises', 'exercise'],
  ] as const
  const issues: ContentIssue[] = []
  for (const [kind, label] of kinds) {
    const retired = new Set(lib.retired[kind].map((r) => r.id))
    const present = new Set(current[kind])
    for (const id of base[kind]) {
      if (!present.has(id) && !retired.has(id)) {
        issues.push({
          file: 'retired.yaml',
          rule: 'id-removed-without-retirement',
          message: `${label} "${id}" was removed; add it to retired.yaml (ids are permanent)`,
        })
      }
    }
  }
  return issues
}
