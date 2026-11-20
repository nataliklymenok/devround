import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  FIXTURE_CONTENT_DIR,
  resetDb,
  retireFixtureLesson,
  syncContent,
  testDb,
} from '../helpers.js'

const tmpDirs: string[] = []

async function copyFixture(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'devround-content-'))
  tmpDirs.push(dir)
  await cp(FIXTURE_CONTENT_DIR, dir, { recursive: true })
  return dir
}

beforeEach(() => resetDb())
afterAll(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })))
})

describe('content:sync', () => {
  it('creates the catalog on first sync and is a no-op on re-sync', async () => {
    const first = await syncContent()
    expect(first).toMatchObject({ created: 12, updated: 0, unchanged: 0, unpublished: 0 })
    expect(await testDb().track.count()).toBe(2)
    expect(await testDb().technology.count()).toBe(3)
    expect(await testDb().module.count()).toBe(4)

    const second = await syncContent()
    expect(second).toMatchObject({ created: 0, updated: 0, unchanged: 12, unpublished: 0 })
  })

  it('updates an edited lesson and unpublishes a removed one', async () => {
    const dir = await copyFixture()
    await syncContent(dir)

    const edited = path.join(dir, 'frontend/javascript/js-values.md')
    await writeFile(
      edited,
      (await readFile(edited, 'utf8')).replace('explained for tests', 'rewritten'),
    )

    // The fixture has no spare lessons, so make React unavailable (coverage applies only to
    // available technologies) before retiring one of its lessons.
    await retireFixtureLesson(dir, 'react', 'react-memo')

    const report = await syncContent(dir)
    expect(report).toMatchObject({ created: 0, updated: 1, unpublished: 1 })
    const lesson = await testDb().lesson.findUniqueOrThrow({ where: { id: 'react-memo' } })
    expect(lesson.isPublished).toBe(false)
    expect(
      (await testDb().lesson.findUniqueOrThrow({ where: { id: 'js-values' } })).body,
    ).toContain('rewritten')
  })

  it('refuses to republish an unpublished lesson id', async () => {
    await syncContent()
    await testDb().lesson.update({ where: { id: 'js-values' }, data: { isPublished: false } })
    await expect(syncContent()).rejects.toThrow(/cannot be republished/)
  })
})
