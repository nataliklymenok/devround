import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import YAML from 'yaml'
import type { ZodType } from 'zod'
import {
  CatalogFileSchema,
  DESIGN_SECTIONS,
  ExerciseFileSchema,
  LessonFileSchema,
  ModulesFileSchema,
  RetiredFileSchema,
  TaskFileSchema,
  TopicMapFileSchema,
  type CatalogFile,
  type DesignSectionKey,
  type ExerciseFile,
  type LessonFile,
  type ModulesFile,
  type RetiredFile,
  type TaskFile,
  type TopicMapFile,
} from '@devround/shared'

export interface ContentIssue {
  /** Path relative to the content directory */
  file: string
  rule: string
  message: string
}

export interface LoadedModules {
  file: string
  trackId: string
  technologyId: string
  modules: ModulesFile['modules']
}

export interface LoadedLesson {
  file: string
  trackId: string
  technologyId: string
  data: LessonFile
  body: string
  /** Normalized file contents (LF line endings), used for the content hash */
  raw: string
}

export interface LoadedTopicMap {
  file: string
  trackId: string
  technologyId: string
  topics: TopicMapFile['topics']
}

export interface MarkdownSection {
  heading: string
  content: string
}

export interface LoadedTask {
  file: string
  trackId: string
  technologyId: string
  data: TaskFile
  /** `##` headings in file order (validated by rules) */
  headings: string[]
  /** Public part: Problem, Constraints, Examples (Markdown with headings) */
  statement: string
  /** Hidden part: Solution, Explanation, Complexity, Common mistakes (Markdown with headings) */
  solution: string
  /** The single fenced code block of the Solution section (reference solution), if any */
  solutionCode: string | null
  body: string
  raw: string
}

export interface LoadedExercise {
  file: string
  trackId: string
  data: ExerciseFile
  headings: string[]
  prompt: string
  sections: { key: DesignSectionKey; title: string; body: string }[]
  body: string
  raw: string
}

export interface LoadedLibrary {
  dir: string
  catalog: CatalogFile
  retired: RetiredFile
  modules: LoadedModules[]
  lessons: LoadedLesson[]
  topicMaps: LoadedTopicMap[]
  tasks: LoadedTask[]
  exercises: LoadedExercise[]
  /** `<track>/<technology>` directories found on disk (excluding reserved folders) */
  directories: string[]
}

export interface LoadResult {
  library: LoadedLibrary | null
  issues: ContentIssue[]
}

/** Reserved folder names (content-format.md): not technologies / not lessons. */
export const TASKS_DIR = 'tasks'
export const SYSTEM_DESIGN_DIR = 'system-design'
export const TOPIC_MAP_FILE = 'topics.middle.yaml'

export const PUBLIC_TASK_HEADINGS = ['Problem', 'Constraints', 'Examples'] as const
export const HIDDEN_TASK_HEADINGS = [
  'Solution',
  'Explanation',
  'Complexity',
  'Common mistakes',
] as const

const yamlEngine = { parse: (source: string) => YAML.parse(source) as object }

function zodIssues(file: string, error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return error.issues.map((issue) => ({
    file,
    rule: 'schema',
    message: `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`,
  }))
}

async function readYaml<T>(
  dir: string,
  file: string,
  schema: ZodType<T>,
  issues: ContentIssue[],
): Promise<T | null> {
  let parsed: unknown
  try {
    parsed = YAML.parse(await readFile(path.join(dir, file), 'utf8'))
  } catch (error) {
    issues.push({ file, rule: 'parse', message: (error as Error).message })
    return null
  }
  const result = schema.safeParse(parsed ?? {})
  if (!result.success) {
    issues.push(...zodIssues(file, result.error))
    return null
  }
  return result.data
}

async function isDirectory(p: string) {
  return (await stat(p)).isDirectory()
}

async function exists(p: string) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function listMarkdown(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return []
  return (await readdir(dir)).filter((name) => name.endsWith('.md')).sort()
}

/** Split Markdown into `## ` sections, ignoring headings inside fenced code blocks. */
export function splitSections(body: string): { preamble: string; sections: MarkdownSection[] } {
  const sections: MarkdownSection[] = []
  const preamble: string[] = []
  let current: { heading: string; lines: string[] } | null = null
  let fence: string | null = null

  for (const line of body.split('\n')) {
    const fenceMatch = /^\s*(```+|~~~+)/.exec(line)
    if (fenceMatch) {
      const marker = fenceMatch[1]!
      if (fence === null) fence = marker
      else if (marker.startsWith(fence)) fence = null
    }
    const heading = fence === null ? /^##\s+(.+?)\s*$/.exec(line) : null
    if (heading && !line.startsWith('###')) {
      if (current)
        sections.push({ heading: current.heading, content: current.lines.join('\n').trim() })
      current = { heading: heading[1]!, lines: [] }
    } else if (current) {
      current.lines.push(line)
    } else {
      preamble.push(line)
    }
  }
  if (current) sections.push({ heading: current.heading, content: current.lines.join('\n').trim() })
  return { preamble: preamble.join('\n').trim(), sections }
}

const toMarkdown = (sections: MarkdownSection[]) =>
  sections.map((s) => `## ${s.heading}\n\n${s.content}`).join('\n\n')

/** The single fenced code block of a section (null when there is none or more than one). */
export function extractCodeBlock(content: string): string | null {
  const blocks = [...content.matchAll(/^```[\w-]*\n([\s\S]*?)^```/gm)]
  return blocks.length === 1 ? blocks[0]![1]!.replace(/\n$/, '') : null
}

function parseFrontMatter(
  file: string,
  raw: string,
  issues: ContentIssue[],
): { data: unknown; body: string } | null {
  try {
    const parsed = matter(raw, { engines: { yaml: yamlEngine } })
    return { data: parsed.data, body: parsed.content.trim() }
  } catch (error) {
    issues.push({ file, rule: 'parse', message: (error as Error).message })
    return null
  }
}

async function readRaw(file: string) {
  return (await readFile(file, 'utf8')).replace(/\r\n/g, '\n')
}

async function loadTasks(
  dir: string,
  trackId: string,
  technologyId: string,
  issues: ContentIssue[],
): Promise<LoadedTask[]> {
  const tasksDir = path.join(dir, trackId, technologyId, TASKS_DIR)
  const tasks: LoadedTask[] = []
  for (const name of await listMarkdown(tasksDir)) {
    const file = `${trackId}/${technologyId}/${TASKS_DIR}/${name}`
    const raw = await readRaw(path.join(tasksDir, name))
    const parsed = parseFrontMatter(file, raw, issues)
    if (!parsed) continue
    const result = TaskFileSchema.safeParse(parsed.data)
    if (!result.success) {
      issues.push(...zodIssues(file, result.error))
      continue
    }
    const { sections } = splitSections(parsed.body)
    const isPublic = (s: MarkdownSection) =>
      (PUBLIC_TASK_HEADINGS as readonly string[]).includes(s.heading)
    const solutionSection = sections.find((s) => s.heading === 'Solution')
    tasks.push({
      file,
      trackId,
      technologyId,
      data: result.data,
      headings: sections.map((s) => s.heading),
      statement: toMarkdown(sections.filter(isPublic)),
      solution: toMarkdown(sections.filter((s) => !isPublic(s))),
      solutionCode: solutionSection ? extractCodeBlock(solutionSection.content) : null,
      body: parsed.body,
      raw,
    })
  }
  return tasks
}

async function loadExercises(
  dir: string,
  trackId: string,
  issues: ContentIssue[],
): Promise<LoadedExercise[]> {
  const exercisesDir = path.join(dir, trackId, SYSTEM_DESIGN_DIR)
  const exercises: LoadedExercise[] = []
  for (const name of await listMarkdown(exercisesDir)) {
    const file = `${trackId}/${SYSTEM_DESIGN_DIR}/${name}`
    const raw = await readRaw(path.join(exercisesDir, name))
    const parsed = parseFrontMatter(file, raw, issues)
    if (!parsed) continue
    const result = ExerciseFileSchema.safeParse(parsed.data)
    if (!result.success) {
      issues.push(...zodIssues(file, result.error))
      continue
    }
    const { sections } = splitSections(parsed.body)
    const byHeading = new Map(sections.map((s) => [s.heading, s.content]))
    exercises.push({
      file,
      trackId,
      data: result.data,
      headings: sections.map((s) => s.heading),
      prompt: byHeading.get('Prompt') ?? '',
      sections: DESIGN_SECTIONS.map(({ key, heading }) => ({
        key,
        title: heading,
        body: byHeading.get(heading) ?? '',
      })),
      body: parsed.body,
      raw,
    })
  }
  return exercises
}

/** Parse every file of the library. Structural problems are returned as issues, not thrown. */
export async function loadLibrary(dir: string): Promise<LoadResult> {
  const issues: ContentIssue[] = []
  const catalog = await readYaml(dir, 'catalog.yaml', CatalogFileSchema, issues)
  const retired = (await exists(path.join(dir, 'retired.yaml')))
    ? await readYaml(dir, 'retired.yaml', RetiredFileSchema, issues)
    : RetiredFileSchema.parse({})

  const modules: LoadedModules[] = []
  const lessons: LoadedLesson[] = []
  const topicMaps: LoadedTopicMap[] = []
  const tasks: LoadedTask[] = []
  const exercises: LoadedExercise[] = []
  const directories: string[] = []

  for (const trackId of (await readdir(dir)).sort()) {
    if (trackId.startsWith('.') || !(await isDirectory(path.join(dir, trackId)))) continue
    for (const technologyId of (await readdir(path.join(dir, trackId))).sort()) {
      const techDir = path.join(dir, trackId, technologyId)
      if (technologyId.startsWith('.') || !(await isDirectory(techDir))) continue
      if (technologyId === SYSTEM_DESIGN_DIR) {
        exercises.push(...(await loadExercises(dir, trackId, issues)))
        continue
      }
      const rel = `${trackId}/${technologyId}`
      directories.push(rel)

      if (await exists(path.join(techDir, 'modules.yaml'))) {
        const file = `${rel}/modules.yaml`
        const parsed = await readYaml(dir, file, ModulesFileSchema, issues)
        if (parsed) modules.push({ file, trackId, technologyId, modules: parsed.modules })
      } else {
        issues.push({ file: rel, rule: 'missing-modules', message: 'modules.yaml is missing' })
      }

      if (await exists(path.join(techDir, TOPIC_MAP_FILE))) {
        const file = `${rel}/${TOPIC_MAP_FILE}`
        const parsed = await readYaml(dir, file, TopicMapFileSchema, issues)
        if (parsed) topicMaps.push({ file, trackId, technologyId, topics: parsed.topics })
      }

      for (const name of await listMarkdown(techDir)) {
        const file = `${rel}/${name}`
        const raw = await readRaw(path.join(techDir, name))
        const parsed = parseFrontMatter(file, raw, issues)
        if (!parsed) continue
        const result = LessonFileSchema.safeParse(parsed.data)
        if (!result.success) {
          issues.push(...zodIssues(file, result.error))
          continue
        }
        lessons.push({ file, trackId, technologyId, data: result.data, body: parsed.body, raw })
      }

      tasks.push(...(await loadTasks(dir, trackId, technologyId, issues)))
    }
  }

  if (!catalog || !retired) return { library: null, issues }
  return {
    library: { dir, catalog, retired, modules, lessons, topicMaps, tasks, exercises, directories },
    issues,
  }
}
