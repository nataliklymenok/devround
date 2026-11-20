---
id: js-iterators-generators
module: js-fundamentals
order: 8
title: Iterators and generators
description: The iteration protocols, for...of vs for...in, generator functions and async iteration.
levels: [middle, senior]
estimatedMinutes: 20
topics: [js-iterators-generators]
reviewed: 2026-11-20
references:
  - { title: 'MDN — Iteration protocols', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols' }
  - { title: 'MDN — function*', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*' }
keyTakeaways:
  - An iterable has a Symbol.iterator method returning an iterator with next() → { value, done }.
  - for...of iterates values of iterables; for...in iterates enumerable string keys, including inherited ones.
  - Generators pause at yield and resume on next(), which makes lazy sequences easy.
  - for await...of consumes async iterables such as streams and paginated APIs.
interviewQuestions:
  - question: What is the difference between for...of and for...in?
    answer: |
      `for...of` uses the iteration protocol and yields values of arrays, strings, Maps, Sets,
      generators and other iterables. `for...in` loops over enumerable string property names of an
      object, including inherited ones, so it is meant for plain objects (and even there
      `Object.keys`/`Object.entries` is usually clearer). Using `for...in` on arrays gives string
      indices and may include extra properties.
  - question: What is a generator and when would you use one?
    answer: |
      A function declared with `function*` that returns an iterator. Each `yield` pauses execution and
      produces a value; calling `next()` resumes it. Generators make lazy or infinite sequences, custom
      iterables and step-by-step algorithms simple. Async generators (`async function*`) combine this
      with `await`, e.g. to page through an API.
  - question: Which built-ins are iterable, and which common objects are not?
    answer: |
      Arrays, strings, `Map`, `Set`, typed arrays, `arguments`, `NodeList` and generator objects are
      iterable. Plain objects are not — `for (const x of {})` throws a TypeError — so iterate
      `Object.entries(obj)` instead. Array-likes without `Symbol.iterator` can be converted with
      `Array.from`.
quiz:
  - id: q1
    question: "What does for (const x in ['a', 'b']) give you in x?"
    options: ["'a' then 'b'", "'0' then '1'", "0 then 1 as numbers", "Nothing"]
    correct: 1
    explanation: for...in iterates property names, which are strings.
  - id: q2
    question: What makes an object iterable?
    options: ["A length property", "A Symbol.iterator method", "Being an instance of Array", "A next method on the object itself"]
    correct: 1
    explanation: The iterable protocol is a Symbol.iterator method returning an iterator.
  - id: q3
    question: "function* g() { yield 1; yield 2 } — what is [...g()]?"
    options: ["[]", "[1, 2]", "[g]", "It throws"]
    correct: 1
    explanation: Spreading consumes the generator until done.
---

## The iteration protocols

```js
const range = {
  from: 1,
  to: 3,
  [Symbol.iterator]() {
    let current = this.from
    const last = this.to
    return {
      next: () => (current <= last ? { value: current++, done: false } : { value: undefined, done: true }),
    }
  },
}

console.log([...range]) // [1, 2, 3]
```

## Generators

```js
function* idGenerator(prefix) {
  let i = 1
  while (true) yield `${prefix}-${i++}` // infinite, but lazy
}

const ids = idGenerator('task')
ids.next().value // 'task-1'
ids.next().value // 'task-2'

function* take(iterable, n) {
  for (const value of iterable) {
    if (n-- <= 0) return
    yield value
  }
}
```

## Async iteration

```js
async function* fetchAllPages(url) {
  let next = url
  while (next) {
    const res = await fetch(next)
    const page = await res.json()
    yield* page.items
    next = page.nextUrl
  }
}

for await (const item of fetchAllPages('/api/items')) {
  render(item)
}
```

Readable streams in browsers are async iterable too: `for await (const chunk of response.body)`.
