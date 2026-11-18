---
id: js-arrays-immutability
module: js-fundamentals
order: 5
title: Arrays, immutability and copying
description: Mutating vs non-mutating array methods, reduce, sorting pitfalls, and shallow vs deep copies.
levels: [junior, middle]
estimatedMinutes: 25
topics: [js-arrays-immutability]
references:
  - { title: 'MDN — Array', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array' }
  - { title: 'MDN — structuredClone()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone' }
keyTakeaways:
  - push, pop, shift, unshift, splice, sort, reverse and fill mutate the array; map, filter, slice, concat and the newer toSorted, toReversed, toSpliced and with return new arrays.
  - sort() compares values as strings by default — always pass a comparator for numbers.
  - Spread and Object.assign copy one level deep; structuredClone makes a deep copy of plain data.
  - Immutable updates matter in UI code because change detection compares references.
interviewQuestions:
  - question: Which array methods mutate the array and which return a new one?
    answer: |
      Mutating: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`.
      Non-mutating: `map`, `filter`, `reduce`, `slice`, `concat`, `flat`, `flatMap`, and the ES2023
      copies `toSorted`, `toReversed`, `toSpliced` and `with(index, value)`. In React or Redux state
      you use the non-mutating ones (or copy first) so the new state has a new reference.
  - question: Why does [10, 1, 5].sort() return [1, 10, 5]?
    answer: |
      Without a comparator `sort` converts elements to strings and compares UTF-16 code units, so
      `'10'` comes before `'5'`. Use `sort((a, b) => a - b)` for numbers, and `localeCompare` for
      user-facing strings. Since ES2019 the sort is guaranteed to be stable.
  - question: What is the difference between a shallow and a deep copy?
    answer: |
      A shallow copy (`[...arr]`, `{ ...obj }`, `Object.assign`, `Array.from`) creates a new outer
      container but nested objects are shared. A deep copy recreates every level. `structuredClone`
      deep-copies plain data (including `Map`, `Set`, `Date` and cycles) but not functions, DOM nodes
      or class prototypes. `JSON.parse(JSON.stringify(x))` loses `undefined`, functions, `Date`
      (becomes a string), `Map`/`Set` and fails on cycles.
  - question: When would you use reduce, and when is it a bad idea?
    answer: |
      `reduce` folds a list into one value — sums, grouping into an object, building a lookup map.
      It hurts readability when a simple `for...of`, `map`/`filter`, or `Object.groupBy` expresses
      the intent better. Always pass an initial value; without it `reduce` throws on an empty array.
quiz:
  - id: q1
    question: "What does [10, 1, 5].sort() return?"
    options: ["[1, 5, 10]", "[1, 10, 5]", "[10, 5, 1]", "[5, 1, 10]"]
    correct: 1
    explanation: The default sort compares strings, so '10' sorts before '5'.
  - id: q2
    question: Which method returns a new sorted array without changing the original?
    options: ["sort", "toSorted", "splice", "reverse"]
    correct: 1
    explanation: toSorted (ES2023) is the non-mutating version of sort.
  - id: q3
    question: "const a = [{ n: 1 }]; const b = [...a]; b[0].n = 2. What is a[0].n?"
    options: ["1", "2", "undefined", "It throws"]
    correct: 1
    explanation: Spread copies the array, but both arrays reference the same object.
  - id: q4
    question: What is lost when deep-copying with JSON.parse(JSON.stringify(x))?
    options: ["Nested arrays", "Numbers", "Date objects become strings and undefined values disappear", "Nothing"]
    correct: 2
    explanation: JSON has no Date, undefined, Map or Set; use structuredClone for plain data.
---

## Mutating vs non-mutating methods

```js
const nums = [3, 1, 2]

nums.toSorted((a, b) => a - b) // [1, 2, 3] — nums unchanged
nums.with(0, 99) // [99, 1, 2] — nums unchanged
nums.sort((a, b) => a - b) // mutates nums → [1, 2, 3]
```

Use non-mutating methods (or copy first) whenever the array is state that something else observes.

## map, filter, reduce

```js
const orders = [
  { id: 1, status: 'paid', total: 30 },
  { id: 2, status: 'open', total: 20 },
  { id: 3, status: 'paid', total: 50 },
]

const paidTotal = orders
  .filter((o) => o.status === 'paid')
  .reduce((sum, o) => sum + o.total, 0) // 80

const byStatus = Object.groupBy(orders, (o) => o.status) // { paid: [...], open: [...] }
const byId = new Map(orders.map((o) => [o.id, o]))
```

## Sorting pitfalls

```js
;[10, 1, 5].sort() // [1, 10, 5] — string comparison
;[10, 1, 5].sort((a, b) => a - b) // [1, 5, 10]
names.sort((a, b) => a.localeCompare(b, 'uk')) // locale-aware strings
```

## Shallow vs deep copies

```js
const state = { user: { name: 'Ann' }, tags: ['a'] }

const shallow = { ...state }
shallow.user.name = 'Bob' // also changes state.user.name

const deep = structuredClone(state)
deep.user.name = 'Eve' // state is untouched
```

## Immutable updates

```js
const next = {
  ...state,
  user: { ...state.user, name: 'Bob' }, // copy every level you change
  tags: [...state.tags, 'b'],
}
```
