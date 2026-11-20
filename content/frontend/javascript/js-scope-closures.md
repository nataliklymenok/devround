---
id: js-scope-closures
module: js-fundamentals
order: 2
title: Scope, hoisting and closures
description: var vs let/const, the temporal dead zone, lexical scope and how closures capture variables.
levels: [junior, middle, senior]
estimatedMinutes: 25
reviewed: 2026-11-20
keyTakeaways:
  - let and const are block-scoped; var is function-scoped and hoisted with the value undefined.
  - let/const are hoisted too, but accessing them before declaration throws (temporal dead zone).
  - A closure is a function together with the variables of the scope it was created in.
  - Closures keep variables alive — useful for private state, but a source of memory leaks and stale values.
interviewQuestions:
  - question: What is a closure? Give a practical example.
    answer: |
      A closure is a function that remembers the variables from the scope where it was defined, even
      after that scope has finished executing. Practical uses: private state (a counter factory),
      partial application, memoization caches and event handlers that need data from setup time.
      In React, every render creates new closures over that render's props and state — the reason for
      "stale closure" bugs in effects and timers.
  - question: What is the difference between var, let and const?
    answer: |
      `var` is function-scoped, can be redeclared and is hoisted with the value `undefined`.
      `let` and `const` are block-scoped, cannot be redeclared in the same scope and are in the
      temporal dead zone until their declaration runs. `const` prevents reassignment of the binding,
      not mutation of the object it points to.
  - question: Why does a for loop with var and setTimeout print the same number several times?
    answer: |
      With `var` there is a single `i` shared by the whole function; by the time the callbacks run
      the loop has finished and `i` holds its final value. `let` creates a fresh binding for each
      iteration, so each callback closes over its own `i`.
  - question: What is hoisting?
    answer: |
      Before code runs, declarations are registered in their scope. Function declarations are fully
      hoisted (they can be called before they appear), `var` is hoisted and initialised to
      `undefined`, while `let`, `const` and `class` are hoisted but uninitialised — touching them
      before the declaration throws a ReferenceError (the temporal dead zone).
quiz:
  - id: q1
    question: "What does this log? for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))"
    options: ["0 1 2", "3 3 3", "undefined three times", "It throws a ReferenceError"]
    correct: 1
    explanation: var creates one shared binding; when the callbacks run the loop is done and i is 3.
  - id: q2
    question: "What happens when you read a let variable before its declaration in the same block?"
    options: ["You get undefined", "You get null", "A ReferenceError is thrown", "The global variable is used"]
    correct: 2
    explanation: let/const are in the temporal dead zone until the declaration executes.
  - id: q3
    question: "const user = { name: 'Ann' }; user.name = 'Bob' — what happens?"
    options: ["TypeError: assignment to constant", "The name changes to Bob", "Nothing, the assignment is ignored", "A new object is created"]
    correct: 1
    explanation: const prevents rebinding the variable, not mutating the object it references.
  - id: q4
    question: Which statement about closures is true?
    options: ["They copy variable values at creation time", "They keep a live reference to the outer variables", "They only work with var", "They are created only by arrow functions"]
    correct: 1
    explanation: Closures reference the variables themselves, so they see later updates (and keep them in memory).
topics: [js-scope-hoisting, js-closures]
references:
  - { title: 'MDN — Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures' }
  - { title: 'MDN — let and the temporal dead zone', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let' }
---

## Lexical scope

JavaScript uses **lexical scope**: where a function is *written* decides which variables it can see.
Blocks (`{ }`) create a scope for `let`, `const` and `class`; functions create a scope for
everything, including `var`.

```js
function outer() {
  const secret = 42
  if (true) {
    let inner = 'block'
    var leaked = 'function'
  }
  // inner is not visible here, leaked is
  return function reveal() {
    return secret // found in the outer scope
  }
}
```

## Hoisting and the temporal dead zone

```js
console.log(a) // undefined — var is hoisted and initialised
var a = 1

console.log(b) // ReferenceError — b is in the TDZ
let b = 2

greet() // works — function declarations are fully hoisted
function greet() {}
```

## Closures

A closure is created every time a function is created. It keeps access to the outer variables —
not copies of their values.

```js
function createCounter() {
  let count = 0 // private state
  return {
    increment: () => ++count,
    get: () => count,
  }
}

const counter = createCounter()
counter.increment()
counter.get() // 1 — count lives on inside the closure
```

## The classic loop bug

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)) // 3, 3, 3
}

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j)) // 0, 1, 2 — a new binding per iteration
}
```

## Senior angle: closures and memory

A closure keeps its whole outer scope reachable. A long-lived event listener or cache that closes
over a large object prevents it from being garbage-collected. Remove listeners you add, and avoid
capturing more than you need in long-lived callbacks.
