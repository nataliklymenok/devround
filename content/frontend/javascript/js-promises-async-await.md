---
id: js-promises-async-await
module: js-async
order: 2
title: Promises and async/await
description: Promise states, chaining, error handling, combinators and common async/await mistakes.
levels: [junior, middle, senior]
estimatedMinutes: 30
keyTakeaways:
  - A promise is pending, then settles once — fulfilled or rejected.
  - Returning from then passes a value down the chain; throwing turns into a rejection.
  - Await in a loop runs operations sequentially — use Promise.all for independent work.
  - Know the combinators — all, allSettled, race and any — and when each one rejects.
interviewQuestions:
  - question: What is the difference between Promise.all, Promise.allSettled, Promise.race and Promise.any?
    answer: |
      `all` fulfils with all results when every promise fulfils, and rejects as soon as one rejects.
      `allSettled` always fulfils, with a `{ status, value | reason }` entry per promise.
      `race` settles like the first promise that settles (fulfilled or rejected).
      `any` fulfils with the first fulfilled value and rejects (with an `AggregateError`) only if all
      reject.
  - question: How do you handle errors with async/await?
    answer: |
      Wrap awaits in `try/catch` (and `finally` for cleanup), or attach `.catch` to the promise you
      await. Errors thrown inside an async function reject the returned promise, so the caller must
      await it or handle the rejection — otherwise you get an unhandled rejection.
  - question: What is wrong with using forEach with an async callback?
    answer: |
      `forEach` ignores the promises returned by the callback, so it neither waits for them nor
      propagates their errors. Use `for...of` with `await` for sequential work, or
      `await Promise.all(items.map(async (item) => ...))` for parallel work.
  - question: How would you add a timeout to a fetch request?
    answer: |
      Pass an abort signal: `fetch(url, { signal: AbortSignal.timeout(5000) })`. For arbitrary
      promises you can `Promise.race` the operation against a promise that rejects after a delay, but
      that does not cancel the underlying work — AbortController does.
quiz:
  - id: q1
    question: What happens if one promise rejects in Promise.all([p1, p2, p3])?
    options: ["It waits for the others and returns partial results", "It rejects immediately with that reason", "It retries the failed promise", "It fulfils with undefined in that slot"]
    correct: 1
    explanation: Promise.all is fail-fast. Use allSettled if you need every outcome.
  - id: q2
    question: "Two independent requests: const a = await getA(); const b = await getB(). How do you make them run in parallel?"
    options: ["Use for await", "const [a, b] = await Promise.all([getA(), getB()])", "Wrap them in setTimeout", "They already run in parallel"]
    correct: 1
    explanation: Each await waits before starting the next call; start both and await them together.
  - id: q3
    question: What does an async function return?
    options: ["The value of its return statement", "Always a promise", "undefined until it finishes", "A generator"]
    correct: 1
    explanation: An async function always returns a promise that resolves to the returned value or rejects with the thrown error.
  - id: q4
    question: Which combinator fulfils with the first successful result and ignores failures until all fail?
    options: ["Promise.race", "Promise.all", "Promise.any", "Promise.allSettled"]
    correct: 2
    explanation: Promise.any rejects with an AggregateError only if every promise rejects.
  - id: q5
    question: What happens to an error thrown inside a .then callback?
    options: ["It crashes the page immediately", "It is swallowed silently", "It becomes a rejection handled by the next catch in the chain", "It is retried"]
    correct: 2
    explanation: Throwing inside then rejects the promise returned by then, which flows to the next catch.
topics: [js-promises, js-async-await]
references:
  - { title: 'MDN — Using promises', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises' }
  - { title: 'MDN — async function', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function' }
---

## Promise basics

A promise represents a value that will be available later. It starts **pending** and settles
exactly once: **fulfilled** with a value or **rejected** with a reason.

```js
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

fetch('/api/user')
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`) // → rejection
    return res.json() // → value for the next then
  })
  .then((user) => console.log(user.name))
  .catch((error) => console.error(error)) // handles any failure above
  .finally(() => hideSpinner())
```

## async/await

```js
async function loadUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    hideSpinner()
  }
}
```

## Sequential vs parallel

```js
// Sequential — the second request starts only after the first finishes
const user = await getUser()
const posts = await getPosts()

// Parallel — both start immediately
const [user2, posts2] = await Promise.all([getUser(), getPosts()])

// Parallel with partial failure tolerance
const results = await Promise.allSettled(urls.map((u) => fetch(u)))
const ok = results.filter((r) => r.status === 'fulfilled')
```

## Common mistakes

```js
// ❌ forEach does not wait
items.forEach(async (item) => await save(item))

// ✅ sequential
for (const item of items) await save(item)

// ✅ parallel
await Promise.all(items.map((item) => save(item)))

// ❌ forgotten await: the error escapes the try/catch
try {
  save(item)
} catch {}
```

## Senior angle: cancellation

Promises cannot be cancelled by themselves. Use `AbortController` to cancel the underlying work —
for example aborting a stale search request when the user types again — and ignore results from
aborted requests.
