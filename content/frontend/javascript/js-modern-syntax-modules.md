---
id: js-modern-syntax-modules
module: js-fundamentals
order: 4
title: Modern syntax and ES modules
description: Destructuring, spread, optional chaining, nullish coalescing and how ES modules work.
levels: [junior, middle]
estimatedMinutes: 20
keyTakeaways:
  - Destructuring and spread make copying and extracting data concise — but spread copies only one level deep.
  - "?. stops at null/undefined; ?? falls back only for null/undefined, unlike ||."
  - "ES modules are static: imports are resolved before code runs, enabling tree shaking."
  - Imported bindings are live and read-only.
interviewQuestions:
  - question: Does the spread operator create a deep copy?
    answer: |
      No. `{ ...obj }` and `[...arr]` create a **shallow** copy: top-level properties are copied, but
      nested objects are still shared. For a deep copy of plain data use `structuredClone(value)`.
      In React state updates you typically spread each level you change.
  - question: What is the difference between ?? and ||?
    answer: |
      `a || b` returns `b` for any falsy `a` (`0`, `''`, `false`, `NaN`, `null`, `undefined`).
      `a ?? b` returns `b` only when `a` is `null` or `undefined`, so valid values like `0` and `''`
      are kept.
  - question: How do ES modules differ from CommonJS?
    answer: |
      ES modules use static `import`/`export`, are resolved before execution (so bundlers can
      tree-shake unused exports), load asynchronously, run in strict mode and export live read-only
      bindings. CommonJS uses `require()` at runtime, loads synchronously and exports a copy of
      `module.exports` at the time of the call.
quiz:
  - id: q1
    question: "const a = { user: { name: 'Ann' } }; const b = { ...a }; b.user.name = 'Bob'. What is a.user.name?"
    options: ["'Ann'", "'Bob'", "undefined", "It throws"]
    correct: 1
    explanation: Spread is shallow — a.user and b.user are the same object.
  - id: q2
    question: What is 0 ?? 5?
    options: ["0", "5", "null", "false"]
    correct: 0
    explanation: ?? only falls back for null or undefined; 0 is kept.
  - id: q3
    question: What does user?.address?.city return when user is null?
    options: ["null", "undefined", "It throws a TypeError", "''"]
    correct: 1
    explanation: Optional chaining short-circuits to undefined when it meets null or undefined.
topics: [js-modern-syntax, js-modules]
references:
  - { title: 'MDN — Destructuring', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring' }
  - { title: 'MDN — JavaScript modules', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules' }
---

## Destructuring and defaults

```js
const user = { name: 'Ann', role: 'admin', address: { city: 'Kyiv' } }

const { name, role = 'viewer', address: { city } } = user
const [first, , third = 0] = [10, 20]

function connect({ host = 'localhost', port = 5432 } = {}) {
  return `${host}:${port}`
}
```

## Spread and rest

```js
const base = { theme: 'dark', lang: 'en' }
const settings = { ...base, lang: 'uk' } // later keys win

const [head, ...tail] = [1, 2, 3] // tail = [2, 3]
const max = Math.max(...[4, 8, 1])
```

Spread is **shallow**. Use `structuredClone` for a real deep copy of plain data:

```js
const copy = structuredClone({ nested: { list: [1, 2] } })
```

## Optional chaining and nullish coalescing

```js
const city = user?.address?.city ?? 'Unknown'
const onSave = props.onSave?.() // call only if defined
const pageSize = query.pageSize ?? 20 // 0 stays 0, unlike ||
```

## ES modules

```js
// math.js
export const add = (a, b) => a + b
export default function multiply(a, b) {
  return a * b
}

// app.js
import multiply, { add } from './math.js'
const { heavy } = await import('./heavy.js') // dynamic import → code splitting
```

Because `import` and `export` are static, tools know exactly what is used and can remove the rest
(tree shaking). Dynamic `import()` returns a promise and is how bundlers split code into chunks.
