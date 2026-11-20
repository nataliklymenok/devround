---
id: js-types-coercion
module: js-fundamentals
order: 1
title: Types, equality and coercion
description: The seven primitives, objects, typeof quirks and how == and === really compare values.
levels: [junior, middle]
estimatedMinutes: 20
reviewed: 2026-11-20
keyTakeaways:
  - JavaScript has seven primitive types plus objects; primitives are immutable and compared by value.
  - "=== compares without coercion; == applies the abstract equality algorithm and is best avoided except for x == null."
  - typeof null is "object" for historical reasons — check null explicitly.
  - Objects (including arrays and functions) are compared by reference, not by content.
interviewQuestions:
  - question: What is the difference between == and ===?
    answer: |
      `===` (strict equality) returns true only if both operands have the same type and value.
      `==` (loose equality) first converts the operands to a common type — e.g. `'1' == 1` is `true`
      because the string is converted to a number. Because those rules are hard to remember, most
      codebases use `===` everywhere and allow `x == null` as a short way to check for both `null`
      and `undefined`.
  - question: How many primitive types does JavaScript have, and what makes them different from objects?
    answer: |
      Seven: `string`, `number`, `bigint`, `boolean`, `undefined`, `symbol` and `null`.
      Primitives are immutable and are copied and compared by value. Objects (plain objects, arrays,
      functions, dates, ...) are mutable and are copied and compared by reference — two different
      objects with identical content are not equal.
  - question: Why does typeof null return "object"?
    answer: |
      It is a bug from the first implementation of JavaScript that can no longer be fixed without
      breaking the web. To check for null use `value === null`. To check for a "real" object use
      `value !== null && typeof value === 'object'`.
  - question: What are truthy and falsy values?
    answer: |
      When a value is used in a boolean context it is converted to `true` or `false`. The falsy values
      are `false`, `0`, `-0`, `0n`, `''`, `null`, `undefined` and `NaN`. Everything else — including
      `'0'`, `[]` and `{}` — is truthy.
quiz:
  - id: q1
    question: What does typeof null return?
    options: ["\"null\"", "\"object\"", "\"undefined\"", "It throws an error"]
    correct: 1
    explanation: A historical quirk — typeof null is "object", so check null with === null.
  - id: q2
    question: Which expression is true?
    options: ["[] === []", "NaN === NaN", "null == undefined", "'1' === 1"]
    correct: 2
    explanation: null and undefined are loosely equal to each other (and to nothing else). Arrays compare by reference and NaN is never equal to itself.
  - id: q3
    question: Which of these values is truthy?
    options: ["0", "''", "'0'", "NaN"]
    correct: 2
    explanation: A non-empty string is truthy, even if it contains the character 0.
  - id: q4
    question: How do you reliably check that a value is NaN?
    options: ["value === NaN", "Number.isNaN(value)", "typeof value === 'NaN'", "value == NaN"]
    correct: 1
    explanation: NaN is not equal to anything, including itself; Number.isNaN checks for it without coercion.
topics: [js-types-equality]
references:
  - { title: 'MDN — Equality comparisons and sameness', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness' }
  - { title: 'MDN — typeof', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof' }
---

## Primitives and objects

JavaScript has seven **primitive** types — `string`, `number`, `bigint`, `boolean`, `undefined`,
`symbol` and `null` — and everything else is an **object**. Primitives are immutable and compared by
value; objects are compared by reference.

```js
const a = { x: 1 }
const b = { x: 1 }
a === b // false — two different objects
a === a // true — same reference

let s = 'hi'
s.toUpperCase() // 'HI' — returns a new string, s is unchanged
```

## typeof and its quirks

```js
typeof 'text' // 'string'
typeof 42 // 'number'
typeof 10n // 'bigint'
typeof undefined // 'undefined'
typeof Symbol() // 'symbol'
typeof null // 'object'  ← historical bug
typeof [] // 'object'   → use Array.isArray
typeof function () {} // 'function'
```

## Strict vs loose equality

`===` never converts types. `==` follows the *abstract equality* algorithm, which converts operands
before comparing:

```js
1 === '1' // false
1 == '1' // true  (string → number)
0 == '' // true  (both become 0)
null == undefined // true
null == 0 // false
NaN == NaN // false — NaN is not equal to anything
```

A common, readable exception is `value == null`, which is true for both `null` and `undefined`.

## Truthy and falsy

Only eight values are falsy: `false`, `0`, `-0`, `0n`, `''`, `null`, `undefined`, `NaN`. Beware of
using `||` for defaults when `0` or `''` are valid values — prefer `??` (nullish coalescing):

```js
const count = input.count || 10 // 0 becomes 10 — probably a bug
const safeCount = input.count ?? 10 // only null/undefined become 10
```
