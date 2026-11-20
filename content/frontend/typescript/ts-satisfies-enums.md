---
id: ts-satisfies-enums
module: ts-in-practice
order: 1
title: satisfies, as const and enums vs unions
description: Validate a value against a type without widening it, freeze literals with as const, and choose between enums and union types.
levels: [junior, middle, senior]
estimatedMinutes: 20
topics: [ts-satisfies-enums]
reviewed: 2026-11-20
references:
  - { title: 'TypeScript 4.9 release notes — satisfies', url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html' }
  - { title: 'TypeScript Handbook — Enums', url: 'https://www.typescriptlang.org/docs/handbook/enums.html' }
keyTakeaways:
  - "A type annotation widens the value to the annotated type; satisfies checks the value but keeps its precise inferred type."
  - as const makes literals readonly and narrow ('admin' instead of string).
  - Enums emit runtime code (except const enums) and are nominal; string literal unions are erased and work well with plain data.
  - A const object with as const plus a derived union type gives enum-like ergonomics without enum pitfalls.
interviewQuestions:
  - question: What is the difference between a type annotation and satisfies?
    answer: |
      `const config: Config = {...}` checks the object and then the variable has type `Config`, losing
      details such as which optional keys exist or literal values. `const config = {...} satisfies
      Config` checks the object against `Config` but keeps the inferred type, so
      `config.routes.home` is still known exactly and autocompletion stays precise.
  - question: Enums or union types — which do you prefer and why?
    answer: |
      Most teams prefer string literal unions (`type Status = 'idle' | 'loading'`) or `as const`
      objects: they are erased at runtime, work directly with JSON, and are structural. Enums generate
      JavaScript objects, numeric enums accept any number, and `const enum` has issues with
      isolated-module builds (Vite, esbuild, Babel). Enums are reasonable when you need a runtime object
      with reverse mapping or when a codebase already uses them consistently.
  - question: What does as const do?
    answer: |
      It tells TypeScript to infer the narrowest type: string and number literals stay literal, arrays
      become readonly tuples and object properties become readonly. It is the basis for deriving unions
      from data: `const ROLES = ['admin', 'user'] as const; type Role = (typeof ROLES)[number]`.
quiz:
  - id: q1
    question: "const palette = { red: '#f00' } satisfies Record<string, string>. What is typeof palette.red?"
    options: ["string | undefined", "string", "'#f00'", "unknown"]
    correct: 1
    explanation: 'satisfies keeps the inferred type { red: string } — red is known to exist.'
  - id: q2
    question: "type Role = (typeof ROLES)[number] where ROLES = ['admin', 'user'] as const. Role is…"
    options: ["string", "'admin' | 'user'", "number", "readonly string[]"]
    correct: 1
    explanation: Indexing a readonly tuple type by number gives the union of its elements.
  - id: q3
    question: Which statement about enums is true?
    options: ["They are always erased at compile time", "Regular enums produce a JavaScript object at runtime", "String enums accept any string", "They cannot be used in switch statements"]
    correct: 1
    explanation: Enums (except const enums) are emitted as objects.
---

## satisfies

```ts
type RouteMap = Record<string, `/${string}`>

const annotated: RouteMap = { home: '/', plan: '/plan' }
annotated.dashboard // no error — any string key is allowed by the annotation

const routes = { home: '/', plan: '/plan' } satisfies RouteMap
routes.dashboard // ❌ error — the precise type is kept
routes.plan // string — and TypeScript knows the key exists
```

## as const

```ts
const STATUSES = ['idle', 'loading', 'success', 'error'] as const
type Status = (typeof STATUSES)[number]

const isStatus = (value: string): value is Status => (STATUSES as readonly string[]).includes(value)
```

## Enums vs unions

```ts
// Enum: runtime object, nominal
enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}
move(Direction.Up)
move('UP') // ❌ error — string literals are not assignable to a string enum

// Union: erased, structural, plays well with JSON
type Dir = 'UP' | 'DOWN'
move2('UP') // ✅

// Enum-like object without enum
const Dir = { Up: 'UP', Down: 'DOWN' } as const
type DirValue = (typeof Dir)[keyof typeof Dir] // 'UP' | 'DOWN'
```
