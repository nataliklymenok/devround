import { createHash } from 'node:crypto'
import type { Db } from '../../src/db.js'
import type { LoadedLibrary } from './load.js'
import { findDrafts } from './rules.js'

export interface ItemReport {
  created: number
  updated: number
  unchanged: number
  unpublished: number
}

/** Lesson counts at the top level (as in feature 001) plus tasks, exercises and drafts. */
export interface SyncReport extends ItemReport {
  tasks: ItemReport
  exercises: ItemReport
  drafts: number
}

export interface SyncOptions {
  /** Refuse to publish drafts (items without `reviewed:`) — production deploys. */
  requireReviewed?: boolean
}

export class SyncError extends Error {}

export function contentHash(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

const emptyReport = (): ItemReport => ({ created: 0, updated: 0, unchanged: 0, unpublished: 0 })

const reviewedAt = (reviewed: string | undefined) =>
  reviewed ? new Date(`${reviewed}T00:00:00Z`) : null

type Tx = Parameters<Parameters<Db['$transaction']>[0]>[0]

interface ItemDelegate<Fields> {
  findMany(args: {
    select: { id: true; contentHash: true; isPublished: true }
  }): Promise<{ id: string; contentHash: string; isPublished: boolean }[]>
  upsert(args: {
    where: { id: string }
    create: { id: string } & Fields
    update: Fields
  }): Promise<unknown>
  updateMany(args: {
    where: { isPublished: true; id: { notIn: string[] } }
    data: { isPublished: false }
  }): Promise<{ count: number }>
}

/**
 * Upsert items by permanent id: unchanged hashes are skipped, items missing from files are
 * unpublished (never deleted), and an unpublished (retired) id can never be republished.
 */
async function syncItems<Fields>(
  delegate: ItemDelegate<Fields>,
  kind: string,
  items: { id: string; raw: string; fields: Fields }[],
): Promise<ItemReport> {
  const report = emptyReport()
  const existing = new Map(
    (await delegate.findMany({ select: { id: true, contentHash: true, isPublished: true } })).map(
      (i) => [i.id, i],
    ),
  )

  for (const item of items) {
    const hash = contentHash(item.raw)
    const current = existing.get(item.id)
    if (current && !current.isPublished) {
      throw new SyncError(
        `${kind} "${item.id}" was unpublished (retired) and cannot be republished — use a new id`,
      )
    }
    if (current?.contentHash === hash) {
      report.unchanged++
      continue
    }
    const fields = { ...item.fields, contentHash: hash }
    await delegate.upsert({
      where: { id: item.id },
      create: { id: item.id, ...fields },
      update: fields,
    })
    if (current) report.updated++
    else report.created++
  }

  const { count } = await delegate.updateMany({
    where: { isPublished: true, id: { notIn: items.map((i) => i.id) } },
    data: { isPublished: false },
  })
  report.unpublished = count
  return report
}

async function syncCatalog(tx: Tx, lib: LoadedLibrary) {
  for (const level of lib.catalog.levels) {
    const data = { name: level.name, rank: level.rank }
    await tx.level.upsert({
      where: { id: level.id },
      create: { id: level.id, ...data },
      update: data,
    })
  }

  for (const [trackIndex, track] of lib.catalog.tracks.entries()) {
    const data = { name: track.name, isAvailable: track.available, position: trackIndex + 1 }
    await tx.track.upsert({
      where: { id: track.id },
      create: { id: track.id, ...data },
      update: data,
    })
    for (const [techIndex, tech] of track.technologies.entries()) {
      const techData = {
        trackId: track.id,
        name: tech.name,
        isAvailable: tech.available,
        position: techIndex + 1,
        recommends: tech.recommends,
      }
      await tx.technology.upsert({
        where: { id: tech.id },
        create: { id: tech.id, ...techData },
        update: techData,
      })
    }
  }

  for (const entry of lib.modules) {
    for (const [index, m] of entry.modules.entries()) {
      const data = {
        technologyId: entry.technologyId,
        title: m.title,
        description: m.description,
        order: index + 1,
      }
      await tx.module.upsert({ where: { id: m.id }, create: { id: m.id, ...data }, update: data })
    }
  }
}

/** Load a validated library into the database (contracts/content-format.md → Sync semantics). */
export async function syncLibrary(
  db: Db,
  lib: LoadedLibrary,
  options: SyncOptions = {},
): Promise<SyncReport> {
  const drafts = findDrafts(lib)
  if (options.requireReviewed && drafts.length > 0) {
    throw new SyncError(
      `${drafts.length} draft item(s) cannot be published with --require-reviewed:\n${drafts.map((d) => `  ${d.file}`).join('\n')}`,
    )
  }

  let report!: SyncReport
  await db.$transaction(
    async (tx) => {
      await syncCatalog(tx, lib)

      const lessons = await syncItems(
        tx.lesson as unknown as ItemDelegate<object>,
        'lesson',
        lib.lessons.map(({ data, body, raw }) => ({
          id: data.id,
          raw,
          fields: {
            moduleId: data.module,
            order: data.order,
            title: data.title,
            description: data.description,
            levels: data.levels,
            estimatedMinutes: data.estimatedMinutes,
            body,
            interviewQuestions: data.interviewQuestions,
            keyTakeaways: data.keyTakeaways,
            quiz: data.quiz,
            topics: data.topics,
            references: data.references,
            isDraft: !data.reviewed,
            reviewedAt: reviewedAt(data.reviewed),
          },
        })),
      )

      const tasks = await syncItems(
        tx.codingTask as unknown as ItemDelegate<object>,
        'task',
        lib.tasks.map(({ data, technologyId, statement, solution, raw }) => ({
          id: data.id,
          raw,
          fields: {
            technologyId,
            order: data.order,
            title: data.title,
            levels: data.levels,
            difficulty: data.difficulty,
            estimatedMinutes: data.estimatedMinutes,
            mode: data.mode === 'tests' ? 'tests' : 'self_check',
            statement,
            starterCode: data.starterCode,
            entry: data.mode === 'tests' ? data.entry : null,
            tests: data.mode === 'tests' ? data.tests : undefined,
            acceptanceCriteria: data.mode === 'self-check' ? data.acceptanceCriteria : undefined,
            hints: data.hints,
            solution,
            topics: data.topics,
            references: data.references,
            isDraft: !data.reviewed,
            reviewedAt: reviewedAt(data.reviewed),
          },
        })),
      )

      const exercises = await syncItems(
        tx.designExercise as unknown as ItemDelegate<object>,
        'exercise',
        lib.exercises.map(({ data, trackId, prompt, sections, raw }) => ({
          id: data.id,
          raw,
          fields: {
            trackId,
            order: data.order,
            title: data.title,
            levels: data.levels,
            timeboxMinutes: data.timeboxMinutes,
            prompt,
            sections,
            checklist: data.checklist,
            topics: data.topics,
            references: data.references,
            isDraft: !data.reviewed,
            reviewedAt: reviewedAt(data.reviewed),
          },
        })),
      )

      report = { ...lessons, tasks, exercises, drafts: drafts.length }
    },
    { timeout: 60_000 },
  )

  return report
}
