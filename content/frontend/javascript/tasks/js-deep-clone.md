---
id: js-deep-clone
order: 4
title: Implement deepClone
levels: [middle, senior]
difficulty: medium
estimatedMinutes: 25
mode: tests
topics: [js-arrays-immutability, js-collections-gc]
references:
  - { title: 'MDN — structuredClone()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone' }
  - { title: 'MDN — WeakMap', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap' }
hints:
  - Primitives (and functions) can be returned as they are; only objects need copying.
  - Handle Date, Map and Set explicitly, then arrays and plain objects recursively.
  - Keep a WeakMap from original objects to their copies so circular references point to the copy.
entry: deepClone
starterCode: |
  function deepClone(value) {
    // your code
  }
tests:
  - name: copies nested objects and arrays
    code: |
      const original = { a: 1, nested: { list: [1, { b: 2 }] } }
      const copy = deepClone(original)
      assert.deepEqual(copy, original)
      copy.nested.list[1].b = 99
      assert.equal(original.nested.list[1].b, 2)
  - name: returns primitives unchanged
    code: |
      assert.equal(deepClone(5), 5)
      assert.equal(deepClone('x'), 'x')
      assert.equal(deepClone(null), null)
      assert.equal(deepClone(undefined), undefined)
  - name: copies Dates as Dates
    code: |
      const d = new Date(1000)
      const copy = deepClone({ d })
      assert.ok(copy.d instanceof Date)
      assert.equal(copy.d.getTime(), 1000)
      assert.ok(copy.d !== d)
  - name: copies Maps and Sets deeply
    code: |
      const inner = { n: 1 }
      const copy = deepClone({ m: new Map([['k', inner]]), s: new Set([inner]) })
      assert.ok(copy.m instanceof Map && copy.s instanceof Set)
      copy.m.get('k').n = 2
      assert.equal(inner.n, 1)
  - name: preserves undefined values
    code: |
      const copy = deepClone({ a: undefined })
      assert.ok('a' in copy)
  - name: handles circular references
    code: |
      const a = { name: 'a' }
      a.self = a
      const copy = deepClone(a)
      assert.ok(copy !== a)
      assert.ok(copy.self === copy)
naiveSolution: |
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value))
  }
---

## Problem

Implement `deepClone(value)` that returns a deep copy of plain data: nested plain objects and arrays,
`Date`, `Map` and `Set`, including circular references. Mutating the copy must never affect the
original.

## Constraints

- Do not use `structuredClone` or `JSON`.
- Class instances other than `Date`, `Map`, `Set` and `Array` can be treated as plain objects.

## Examples

```js
const copy = deepClone({ when: new Date(), tags: new Set(['a']) })
copy.tags.add('b') // original unchanged
```

## Solution

```js
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return seen.get(value)

  if (value instanceof Date) return new Date(value.getTime())

  if (value instanceof Map) {
    const copy = new Map()
    seen.set(value, copy)
    value.forEach((v, k) => copy.set(deepClone(k, seen), deepClone(v, seen)))
    return copy
  }

  if (value instanceof Set) {
    const copy = new Set()
    seen.set(value, copy)
    value.forEach((v) => copy.add(deepClone(v, seen)))
    return copy
  }

  const copy = Array.isArray(value) ? [] : {}
  seen.set(value, copy)
  for (const key of Object.keys(value)) copy[key] = deepClone(value[key], seen)
  return copy
}
```

## Explanation

Primitives are immutable, so they are returned directly. For objects we create an empty copy of the
right kind, **register it in `seen` before recursing**, then copy children. When recursion meets an
object it has already started copying (a cycle), `seen` returns the existing copy instead of
recursing forever. A `WeakMap` does not keep the originals alive after cloning.

## Complexity

O(n) time and memory for n reachable values.

## Common mistakes

- `JSON.parse(JSON.stringify(x))` (the naive version) turns Dates into strings, drops `undefined`,
  `Map` and `Set`, and throws on cycles.
- Registering the copy in `seen` after recursing — cycles still overflow the stack.
- Copying with spread, which is shallow.
