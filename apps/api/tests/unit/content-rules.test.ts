import { beforeAll, describe, expect, it } from 'vitest'
import { loadLibrary, type LoadedLibrary } from '../../scripts/content/load.js'
import { checkBody, checkLibrary, collectIds, findRemovedIds } from '../../scripts/content/rules.js'
import { FIXTURE_CONTENT_DIR } from '../helpers.js'

let fixture: LoadedLibrary

beforeAll(async () => {
  const { library, issues } = await loadLibrary(FIXTURE_CONTENT_DIR)
  expect(issues).toEqual([])
  fixture = library!
})

function clone(): LoadedLibrary {
  return structuredClone(fixture)
}

function rules(lib: LoadedLibrary): string[] {
  return checkLibrary(lib).map((i) => i.rule)
}

describe('checkLibrary', () => {
  it('accepts the fixture library', () => {
    expect(checkLibrary(fixture)).toEqual([])
  })

  it('rejects duplicate lesson ids', () => {
    const lib = clone()
    lib.lessons[1]!.data.id = lib.lessons[0]!.data.id
    expect(rules(lib)).toContain('duplicate-id')
  })

  it('rejects an id that does not match the file name', () => {
    const lib = clone()
    lib.lessons[0]!.data.id = 'something-else'
    expect(rules(lib)).toContain('id-matches-file')
  })

  it('rejects a reference to an unknown module', () => {
    const lib = clone()
    lib.lessons[0]!.data.module = 'no-such-module'
    expect(rules(lib)).toContain('unknown-module')
  })

  it('rejects duplicate order within a module', () => {
    const lib = clone()
    const [a, b] = lib.lessons.filter((l) => l.data.module === lib.lessons[0]!.data.module)
    b!.data.order = a!.data.order
    expect(rules(lib)).toContain('duplicate-order')
  })

  it('rejects unknown levels and directories', () => {
    const lib = clone()
    lib.lessons[0]!.data.levels = ['principal']
    lib.directories.push('frontend/svelte')
    expect(rules(lib)).toEqual(expect.arrayContaining(['unknown-level', 'unknown-directory']))
  })

  it('enforces coverage per technology and per level', () => {
    const lib = clone()
    lib.lessons = lib.lessons.filter(
      (l) => l.technologyId !== 'react' || !l.data.levels.includes('senior'),
    )
    const messages = checkLibrary(lib)
      .filter((i) => i.rule === 'coverage')
      .map((i) => i.message)
    expect(messages.some((m) => m.includes('≥ 6 lessons'))).toBe(true)
    expect(messages.some((m) => m.includes('level "senior"'))).toBe(true)
  })

  it('ignores coverage for unavailable technologies', () => {
    const lib = clone()
    expect(lib.catalog.tracks[0]!.technologies.find((t) => t.id === 'html-css')?.available).toBe(
      false,
    )
    expect(rules(lib)).not.toContain('coverage')
  })

  it('rejects an empty module', () => {
    const lib = clone()
    lib.modules[0]!.modules.push({ id: 'js-empty', title: 'Empty module', description: '' })
    expect(rules(lib)).toContain('empty-module')
  })

  it('rejects a retired id reused as a file or module', () => {
    const lib = clone()
    lib.retired.lessons.push({ id: lib.lessons[0]!.data.id, retiredAt: '2026-10-01', reason: 'x' })
    lib.retired.modules.push({
      id: lib.modules[0]!.modules[0]!.id,
      retiredAt: '2026-10-01',
      reason: 'x',
    })
    expect(rules(lib).filter((r) => r === 'retired-id-reused')).toHaveLength(2)
  })
})

describe('checkBody', () => {
  it('requires a ## section', () => {
    expect(checkBody('a.md', 'Just text').map((i) => i.rule)).toContain('body-section')
  })

  it('rejects raw HTML outside code but allows it in code', () => {
    expect(checkBody('a.md', '## T\n<div>hi</div>').map((i) => i.rule)).toContain('no-raw-html')
    expect(checkBody('a.md', '## T\nUse `<div>` here\n```html\n<div></div>\n```')).toEqual([])
  })

  it('requires a language on fenced code blocks', () => {
    expect(checkBody('a.md', '## T\n```\ncode\n```').map((i) => i.rule)).toContain(
      'code-fence-language',
    )
  })

  it('detects an unclosed fence', () => {
    expect(checkBody('a.md', '## T\n```ts\ncode').map((i) => i.rule)).toContain(
      'code-fence-unclosed',
    )
  })
})

describe('findRemovedIds', () => {
  it('flags ids removed without retirement and accepts retired ones', () => {
    const lib = clone()
    const current = collectIds(lib)
    const base = {
      lessons: [...current.lessons, 'old-lesson', 'gone-lesson'],
      modules: [...current.modules, 'old-module'],
    }
    lib.retired.lessons.push({ id: 'old-lesson', retiredAt: '2026-10-01', reason: 'merged' })
    const messages = findRemovedIds(base, current, lib).map((i) => i.message)
    expect(messages).toHaveLength(2)
    expect(messages.join()).toContain('gone-lesson')
    expect(messages.join()).toContain('old-module')
  })
})
