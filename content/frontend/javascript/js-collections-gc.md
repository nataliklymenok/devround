---
id: js-collections-gc
module: js-fundamentals
order: 6
title: Map, Set, WeakMap and garbage collection
description: When to use Map and Set instead of objects and arrays, weak references, and common memory leaks.
levels: [middle, senior]
estimatedMinutes: 20
topics: [js-collections-gc]
references:
  - { title: 'MDN — Map', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map' }
  - { title: 'MDN — WeakMap', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap' }
  - { title: 'MDN — Memory management', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management' }
keyTakeaways:
  - Map keeps insertion order, accepts any key type and has an O(1) size; use it for dynamic dictionaries.
  - Set stores unique values (by SameValueZero) and gives fast membership checks.
  - WeakMap and WeakSet hold keys weakly, so entries disappear when the key object is no longer reachable.
  - Garbage collection frees unreachable objects; leaks come from references you forgot — listeners, timers, caches, closures.
interviewQuestions:
  - question: When would you use a Map instead of a plain object?
    answer: |
      When keys are not known in advance or are not strings (objects, numbers without coercion), when
      you add and delete keys often, when you need insertion order and `size`, or when keys come from
      users (a plain object has prototype keys like `__proto__` or `constructor`). Plain objects are
      still the natural choice for fixed-shape records and JSON.
  - question: What is a WeakMap and what is it good for?
    answer: |
      A map whose keys must be objects (or non-registered symbols) and are held weakly: if nothing else
      references the key, the entry can be garbage-collected. It is not iterable and has no `size`.
      Typical uses: attaching private data or cached computations to objects you do not own (DOM
      nodes, library objects) without preventing their collection.
  - question: How does garbage collection work in JavaScript and how do memory leaks happen?
    answer: |
      Engines use reachability (mark-and-sweep with generational optimizations): objects reachable
      from roots (globals, the stack, active closures) are kept; everything else can be freed.
      Leaks are references that stay reachable by accident: event listeners and intervals never
      removed, ever-growing caches or arrays, closures capturing large objects, detached DOM nodes
      kept in variables. Find them with heap snapshots in DevTools.
quiz:
  - id: q1
    question: "new Set([1, '1', 1, NaN, NaN]).size is…"
    options: ["2", "3", "4", "5"]
    correct: 1
    explanation: 1 and '1' differ; duplicates of 1 and NaN are removed (SameValueZero treats NaN as equal to NaN).
  - id: q2
    question: Which statement about WeakMap is true?
    options: ["Keys can be strings", "You can iterate over its entries", "Entries can be collected when the key object becomes unreachable", "It has a size property"]
    correct: 2
    explanation: WeakMap keys are held weakly and the map is not enumerable.
  - id: q3
    question: Which of these is a typical memory leak in a single-page app?
    options: ["Using const instead of let", "A setInterval that is never cleared after the component unmounts", "Using Map for a cache with a size limit", "Declaring functions inside modules"]
    correct: 1
    explanation: The interval keeps its callback and everything it closes over alive.
---

## Map vs object

```js
const visits = new Map()
visits.set(userObject, 3) // object keys work
visits.set(42, 'number key') // no string coercion
visits.size // O(1)
for (const [key, value] of visits) {} // insertion order

// Plain objects coerce keys to strings and inherit from Object.prototype
const counts = {}
counts['__proto__'] // not undefined — use Object.create(null) or Map for user keys
```

## Set for uniqueness

```js
const unique = [...new Set(['a', 'b', 'a'])] // ['a', 'b']
const seen = new Set()
if (!seen.has(id)) seen.add(id)

// Set methods (ES2025): a.union(b), a.intersection(b), a.difference(b)
```

## WeakMap for data attached to objects

```js
const metadata = new WeakMap()

function track(element) {
  metadata.set(element, { clicks: 0 }) // removed automatically when the element is gone
}
```

## Common leaks and fixes

```js
// ❌ listener and interval outlive the view
window.addEventListener('resize', onResize)
const id = setInterval(poll, 1000)

// ✅ remove them on teardown — or use an AbortController for listeners
const controller = new AbortController()
window.addEventListener('resize', onResize, { signal: controller.signal })
// later:
controller.abort()
clearInterval(id)
```

Use the **Memory** panel (heap snapshots, allocation timeline) to compare snapshots before and
after an action and look for objects that should have been freed.
