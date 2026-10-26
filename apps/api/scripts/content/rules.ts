import path from 'node:path'
import type { ContentIssue, LoadedLibrary } from './load.js'

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
      issues.push({ file, rule: 'no-raw-html', message: `line ${index + 1}: raw HTML is not allowed` })
    }
  })

  if (inFence) issues.push({ file, rule: 'code-fence-unclosed', message: 'unclosed code block' })
  if (!hasSection) {
    issues.push({ file, rule: 'body-section', message: 'body must contain at least one "## " section' })
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
    issues.push({ file: 'catalog.yaml', rule: 'duplicate-id', message: `level "${id}" is defined twice` })
  }
  for (const id of duplicates(catalog.tracks.map((t) => t.id))) {
    issues.push({ file: 'catalog.yaml', rule: 'duplicate-id', message: `track "${id}" is defined twice` })
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
    issues.push({ file: files.join(', '), rule: 'duplicate-id', message: `lesson id "${id}" is not unique` })
  }

  const lessonsPerModule = new Map<string, number[]>()
  for (const lesson of lib.lessons) {
    const { file, data } = lesson
    const key = `${lesson.trackId}/${lesson.technologyId}`
    if (path.basename(file, '.md') !== data.id) {
      issues.push({ file, rule: 'id-matches-file', message: `id "${data.id}" must equal the file name` })
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
        issues.push({ file, rule: 'unknown-level', message: `level "${level}" is not in catalog.yaml` })
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
        issues.push({ file: entry.file, rule: 'empty-module', message: `module "${m.id}" has no lessons` })
      }
    }
  }

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

export interface ContentIds {
  lessons: string[]
  modules: string[]
}

export function collectIds(lib: LoadedLibrary): ContentIds {
  return {
    lessons: lib.lessons.map((l) => l.data.id),
    modules: lib.modules.flatMap((m) => m.modules.map((x) => x.id)),
  }
}

/** Ids present on the base branch that disappeared without being listed in retired.yaml. */
export function findRemovedIds(base: ContentIds, current: ContentIds, lib: LoadedLibrary): ContentIssue[] {
  const retiredLessons = new Set(lib.retired.lessons.map((l) => l.id))
  const retiredModules = new Set(lib.retired.modules.map((m) => m.id))
  const lessons = new Set(current.lessons)
  const modules = new Set(current.modules)
  const issues: ContentIssue[] = []
  for (const id of base.lessons) {
    if (!lessons.has(id) && !retiredLessons.has(id)) {
      issues.push({
        file: 'retired.yaml',
        rule: 'id-removed-without-retirement',
        message: `lesson "${id}" was removed; add it to retired.yaml (ids are permanent)`,
      })
    }
  }
  for (const id of base.modules) {
    if (!modules.has(id) && !retiredModules.has(id)) {
      issues.push({
        file: 'retired.yaml',
        rule: 'id-removed-without-retirement',
        message: `module "${id}" was removed; add it to retired.yaml (ids are permanent)`,
      })
    }
  }
  return issues
}
