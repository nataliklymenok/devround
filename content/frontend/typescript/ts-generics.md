---
id: ts-generics
module: ts-advanced-types
order: 1
title: Generics
description: Write reusable, type-safe functions and components with type parameters and constraints.
levels: [middle, senior]
estimatedMinutes: 25
keyTakeaways:
  - Generics let a function or type work with many types while keeping the relationship between input and output.
  - Constrain type parameters with extends to require a minimal shape.
  - keyof and indexed access types make property-safe helpers possible.
  - Do not add a type parameter that is used only once — a plain type is clearer.
interviewQuestions:
  - question: Why use generics instead of any?
    answer: |
      `any` loses the connection between input and output — `first(items: any[]): any` returns
      something unknown. A generic `first<T>(items: T[]): T | undefined` preserves it: pass `User[]`
      and you get `User | undefined` back, with full checking and autocompletion.
  - question: What does K extends keyof T mean?
    answer: |
      `K` must be one of the property names of `T`. Combined with the indexed access type `T[K]` it
      lets you write helpers like `get(obj, key)` that only accept existing keys and return the exact
      type of that property.
  - question: When is a generic unnecessary?
    answer: |
      When the type parameter appears only once in the signature, it does not relate anything — e.g.
      `function log<T>(value: T): void` is no better than `function log(value: unknown): void`.
      Generics are useful when they link parameters to each other or to the return type.
quiz:
  - id: q1
    question: "function identity<T>(x: T): T. What is the type of identity(42)?"
    options: ["any", "unknown", "number", "T"]
    correct: 2
    explanation: T is inferred from the argument.
  - id: q2
    question: "What does <T extends { id: string }> require?"
    options: ["T must be exactly { id: string }", "T must have at least an id string property", "T must be a class", "T must not have an id"]
    correct: 1
    explanation: A constraint sets a minimal shape; extra properties are allowed.
  - id: q3
    question: "In function get<T, K extends keyof T>(o: T, k: K), what is the return type T[K]?"
    options: ["The type of the property k of o", "A string", "Always unknown", "keyof T"]
    correct: 0
    explanation: Indexed access types look up the property type for the given key.
  - id: q4
    question: Which signature uses a generic without benefit?
    options: ["function wrap<T>(x: T): { value: T }", "function log<T>(x: T): void", "function pair<A, B>(a: A, b: B): [A, B]", "function last<T>(xs: T[]): T | undefined"]
    correct: 1
    explanation: T appears once and relates nothing — unknown would be clearer.
topics: [ts-generics]
references:
  - { title: 'TypeScript Handbook — Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' }
---

## Keeping input and output connected

```ts
function first<T>(items: T[]): T | undefined {
  return items[0]
}

const n = first([1, 2, 3]) // number | undefined
const u = first([{ name: 'Ann' }]) // { name: string } | undefined
```

## Constraints

```ts
function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

byId([{ id: 'a', title: 'Post' }]) // Map<string, { id: string; title: string }>
byId([{ name: 'x' }]) // Error — no id
```

## keyof and indexed access

```ts
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key])
}

const users = [{ name: 'Ann', age: 30 }]
pluck(users, 'age') // number[]
pluck(users, 'email') // Error — not a key of the user type
```

## Generic types

```ts
type ApiResponse<T> = { data: T; error: null } | { data: null; error: string }

interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>
  save(entity: T): Promise<void>
}
```

## Senior angle: defaults and inference

Type parameters can have defaults (`type Page<T = unknown>`), and TypeScript 5's `const` type
parameters (`function tuple<const T extends readonly unknown[]>(x: T)`) infer literal and readonly
types without callers writing `as const`.
