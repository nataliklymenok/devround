---
id: js-promise-all
order: 3
title: Implement Promise.all
levels: [junior, middle, senior]
difficulty: medium
estimatedMinutes: 20
mode: tests
topics: [js-promises]
reviewed: 2026-11-20
references:
  - { title: 'MDN — Promise.all()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all' }
hints:
  - Return a new Promise and start every input at once — do not await them one after another.
  - Store each result at its original index and count how many have resolved.
  - Wrap each item with Promise.resolve so plain values work, and reject as soon as any input rejects.
entry: promiseAll
starterCode: |
  function promiseAll(iterable) {
    // your code
  }
tests:
  - name: resolves with values in input order, not completion order
    code: |
      const slow = new Promise((r) => setTimeout(() => r('slow'), 100))
      const fast = new Promise((r) => setTimeout(() => r('fast'), 10))
      let result
      promiseAll([slow, fast]).then((v) => (result = v))
      await clock.tickAsync(100)
      assert.deepEqual(result, ['slow', 'fast'])
  - name: rejects as soon as any input rejects
    code: |
      const slow = new Promise((r) => setTimeout(() => r(1), 100))
      const failing = new Promise((_, reject) => setTimeout(() => reject(new Error('boom')), 10))
      let error
      promiseAll([slow, failing]).catch((e) => (error = e))
      await clock.tickAsync(10)
      assert.equal(error && error.message, 'boom')
  - name: accepts plain values
    code: |
      assert.deepEqual(await promiseAll([1, Promise.resolve(2), 'three']), [1, 2, 'three'])
  - name: resolves an empty input with an empty array
    code: |
      assert.deepEqual(await promiseAll([]), [])
  - name: accepts any iterable
    code: |
      assert.deepEqual(await promiseAll(new Set([Promise.resolve('a'), 'b'])), ['a', 'b'])
  - name: returns a promise
    code: |
      const p = promiseAll([])
      assert.ok(p instanceof Promise)
      await p
naiveSolution: |
  async function promiseAll(iterable) {
    const results = []
    for (const item of iterable) results.push(await item)
    return results
  }
---

## Problem

Implement `promiseAll(iterable)` that behaves like `Promise.all`:

- returns a promise that resolves to an array of results **in input order**;
- rejects immediately with the reason of the first input that rejects;
- accepts plain values and any iterable;
- resolves to `[]` for an empty input.

## Constraints

Do not use `Promise.all`, `Promise.allSettled` or other combinators.

## Examples

```js
await promiseAll([fetchUser(), fetchPosts(), 42]) // [user, posts, 42]
```

## Solution

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable)
    const results = new Array(items.length)
    let remaining = items.length
    if (remaining === 0) return resolve([])

    items.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        results[index] = value
        remaining -= 1
        if (remaining === 0) resolve(results)
      }, reject)
    })
  })
}
```

## Explanation

All inputs start immediately because we attach handlers to every one of them in the same loop.
Storing by `index` keeps the original order even when later items finish first, and a counter tells
us when everything has resolved. Passing `reject` as the rejection handler rejects the outer promise
on the first failure; later settlements are ignored because a promise can settle only once.

## Complexity

O(n) time and memory.

## Common mistakes

- Awaiting inputs one by one (the naive version): results are correct, but a fast rejection is
  reported only after all earlier inputs settle.
- Using `results.push`, which records completion order instead of input order.
- Checking `results.length === items.length` — a sparse array has the full length from the start.
- Forgetting the empty-input case, which would never resolve.
