---
id: js-retry-backoff
order: 10
title: Retry with exponential backoff
levels: [middle, senior]
difficulty: hard
estimatedMinutes: 30
mode: tests
topics: [js-promises, js-async-await, js-error-handling]
reviewed: 2026-11-20
references:
  - { title: 'MDN — async function', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function' }
  - { title: 'MDN — setTimeout()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout' }
hints:
  - Write a small sleep(ms) helper that returns a promise resolved by setTimeout.
  - Loop over attempts with try/catch; on success return the value, on failure wait before the next attempt.
  - The delay before attempt n (counting retries from 0) is baseDelay * 2 ** n; after the last attempt, throw the last error.
entry: retry
starterCode: |
  async function retry(fn, { retries = 3, baseDelay = 100 } = {}) {
    // your code
  }
tests:
  - name: returns the value when the first attempt succeeds
    code: |
      let calls = 0
      const value = await retry(async () => { calls++; return 'ok' })
      assert.equal(value, 'ok')
      assert.equal(calls, 1)
  - name: retries after a failure and resolves
    code: |
      let calls = 0
      const promise = retry(async () => { calls++; if (calls < 3) throw new Error('fail'); return 'done' }, { retries: 3, baseDelay: 100 })
      let result
      promise.then((v) => (result = v))
      await clock.tickAsync(100) // 1st retry after 100 ms
      await clock.tickAsync(200) // 2nd retry after 200 ms
      assert.equal(result, 'done')
      assert.equal(calls, 3)
  - name: waits with exponential backoff between attempts
    code: |
      const times = []
      const promise = retry(async () => { times.push(Date.now()); throw new Error('nope') }, { retries: 3, baseDelay: 50 })
      promise.catch(() => {})
      await clock.runAll()
      assert.deepEqual(times, [0, 50, 150, 350])
  - name: rejects with the last error after all retries
    code: |
      let n = 0
      const promise = retry(async () => { n++; throw new Error('attempt ' + n) }, { retries: 2, baseDelay: 10 })
      let error
      promise.catch((e) => (error = e))
      await clock.runAll()
      assert.equal(error && error.message, 'attempt 3')
  - name: with retries 0 it tries exactly once
    code: |
      let calls = 0
      const promise = retry(async () => { calls++; throw new Error('x') }, { retries: 0 })
      let rejected = false
      promise.catch(() => (rejected = true))
      await clock.runAll()
      assert.equal(calls, 1)
      assert.ok(rejected)
naiveSolution: |
  async function retry(fn, { retries = 3 } = {}) {
    let lastError
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
      }
    }
    throw lastError
  }
---

## Problem

Implement `retry(fn, { retries = 3, baseDelay = 100 })`. Call the async function `fn`; if it rejects,
wait and try again, up to `retries` extra attempts. The wait before retry number n (0-based) is
`baseDelay * 2 ** n` (100 ms, 200 ms, 400 ms, …). Resolve with the first successful value or reject
with the **last** error.

## Constraints

Use `setTimeout` for waiting (the tests use a fake clock).

## Examples

```js
const data = await retry(() => fetchJson('/api/flaky'), { retries: 4, baseDelay: 250 })
```

## Solution

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function retry(fn, { retries = 3, baseDelay = 100 } = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < retries) await sleep(baseDelay * 2 ** attempt)
    }
  }
  throw lastError
}
```

## Explanation

The loop runs `retries + 1` attempts. `return await` makes rejections land in our `catch`. Between
attempts we sleep for an exponentially growing delay, but not after the final attempt. The last error
is rethrown so callers see the real failure.

## Complexity

O(retries) attempts; total waiting time is `baseDelay * (2^retries - 1)`.

## Common mistakes

- Retrying immediately without a delay (the naive version) — hammering a struggling server.
- `return fn()` without `await` inside `try`: the rejection escapes the `catch`.
- Sleeping after the last attempt, delaying the final error for no reason.
- Production follow-ups: add random jitter, retry only on retryable errors (network, 5xx, 429), and
  support an `AbortSignal`.
