import { createHash } from 'node:crypto'
import type { Db } from '../../src/db.js'
import type { LoadedLibrary } from './load.js'

export interface SyncReport {
  created: number
  updated: number
  unchanged: number
  unpublished: number
}

export class SyncError extends Error {}

export function contentHash(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/** Load a validated library into the database (contracts/content-format.md → Sync semantics). */
export async function syncLibrary(db: Db, lib: LoadedLibrary): Promise<SyncReport> {
  const report: SyncReport = { created: 0, updated: 0, unchanged: 0, unpublished: 0 }

  await db.$transaction(
    async (tx) => {
      for (const level of lib.catalog.levels) {
        const data = { name: level.name, rank: level.rank }
        await tx.level.upsert({ where: { id: level.id }, create: { id: level.id, ...data }, update: data })
      }

      for (const [trackIndex, track] of lib.catalog.tracks.entries()) {
        const data = { name: track.name, isAvailable: track.available, position: trackIndex + 1 }
        await tx.track.upsert({ where: { id: track.id }, create: { id: track.id, ...data }, update: data })
        for (const [techIndex, tech] of track.technologies.entries()) {
          const techData = {
            trackId: track.id,
            name: tech.name,
            isAvailable: tech.available,
            position: techIndex + 1,
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

      const existing = new Map(
        (await tx.lesson.findMany({ select: { id: true, contentHash: true, isPublished: true } })).map(
          (l) => [l.id, l],
        ),
      )

      for (const lesson of lib.lessons) {
        const { data } = lesson
        const hash = contentHash(lesson.raw)
        const current = existing.get(data.id)
        if (current && !current.isPublished) {
          throw new SyncError(
            `lesson "${data.id}" was unpublished (retired) and cannot be republished — use a new id`,
          )
        }
        if (current?.contentHash === hash) {
          report.unchanged++
          continue
        }
        const fields = {
          moduleId: data.module,
          order: data.order,
          title: data.title,
          description: data.description,
          levels: data.levels,
          estimatedMinutes: data.estimatedMinutes,
          body: lesson.body,
          interviewQuestions: data.interviewQuestions,
          keyTakeaways: data.keyTakeaways,
          quiz: data.quiz,
          contentHash: hash,
        }
        await tx.lesson.upsert({
          where: { id: data.id },
          create: { id: data.id, ...fields },
          update: fields,
        })
        if (current) report.updated++
        else report.created++
      }

      const fileIds = lib.lessons.map((l) => l.data.id)
      const { count } = await tx.lesson.updateMany({
        where: { isPublished: true, id: { notIn: fileIds } },
        data: { isPublished: false },
      })
      report.unpublished = count
    },
    { timeout: 60_000 },
  )

  return report
}
