import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import YAML from 'yaml'
import type { ZodType } from 'zod'
import {
  CatalogFileSchema,
  LessonFileSchema,
  ModulesFileSchema,
  RetiredFileSchema,
  type CatalogFile,
  type LessonFile,
  type ModulesFile,
  type RetiredFile,
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

export interface LoadedLibrary {
  dir: string
  catalog: CatalogFile
  retired: RetiredFile
  modules: LoadedModules[]
  lessons: LoadedLesson[]
  /** `<track>/<technology>` directories found on disk */
  directories: string[]
}

export interface LoadResult {
  library: LoadedLibrary | null
  issues: ContentIssue[]
}

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

/** Parse every file of the library. Structural problems are returned as issues, not thrown. */
export async function loadLibrary(dir: string): Promise<LoadResult> {
  const issues: ContentIssue[] = []
  const catalog = await readYaml(dir, 'catalog.yaml', CatalogFileSchema, issues)
  const retired = (await exists(path.join(dir, 'retired.yaml')))
    ? await readYaml(dir, 'retired.yaml', RetiredFileSchema, issues)
    : { lessons: [], modules: [] }

  const modules: LoadedModules[] = []
  const lessons: LoadedLesson[] = []
  const directories: string[] = []

  for (const trackId of (await readdir(dir)).sort()) {
    if (trackId.startsWith('.') || !(await isDirectory(path.join(dir, trackId)))) continue
    for (const technologyId of (await readdir(path.join(dir, trackId))).sort()) {
      const techDir = path.join(dir, trackId, technologyId)
      if (technologyId.startsWith('.') || !(await isDirectory(techDir))) continue
      const rel = `${trackId}/${technologyId}`
      directories.push(rel)

      if (await exists(path.join(techDir, 'modules.yaml'))) {
        const file = `${rel}/modules.yaml`
        const parsed = await readYaml(dir, file, ModulesFileSchema, issues)
        if (parsed) modules.push({ file, trackId, technologyId, modules: parsed.modules })
      } else {
        issues.push({ file: rel, rule: 'missing-modules', message: 'modules.yaml is missing' })
      }

      for (const name of (await readdir(techDir)).sort()) {
        if (!name.endsWith('.md')) continue
        const file = `${rel}/${name}`
        const raw = (await readFile(path.join(techDir, name), 'utf8')).replace(/\r\n/g, '\n')
        let front: unknown
        let body: string
        try {
          const parsed = matter(raw, { engines: { yaml: yamlEngine } })
          front = parsed.data
          body = parsed.content.trim()
        } catch (error) {
          issues.push({ file, rule: 'parse', message: (error as Error).message })
          continue
        }
        const result = LessonFileSchema.safeParse(front)
        if (!result.success) {
          issues.push(...zodIssues(file, result.error))
          continue
        }
        lessons.push({ file, trackId, technologyId, data: result.data, body, raw })
      }
    }
  }

  if (!catalog || !retired) return { library: null, issues }
  return { library: { dir, catalog, retired, modules, lessons, directories }, issues }
}
