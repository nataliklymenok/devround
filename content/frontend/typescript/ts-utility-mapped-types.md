---
id: ts-utility-mapped-types
module: ts-advanced-types
order: 2
title: Utility, mapped and conditional types
description: Built-in utility types, how they are implemented with mapped types, and conditional types with infer.
levels: [middle, senior]
estimatedMinutes: 30
keyTakeaways:
  - Partial, Required, Readonly, Pick, Omit and Record cover most everyday transformations.
  - Mapped types iterate over keys to build a new object type.
  - Conditional types choose a type based on another; infer extracts parts of a type.
  - Derive types from a single source (a schema, a const object) instead of duplicating them.
interviewQuestions:
  - question: How is Partial implemented?
    answer: |
      As a mapped type that makes every property optional:
      `type Partial<T> = { [K in keyof T]?: T[K] }`. `Readonly` adds `readonly` the same way, and
      `Required` removes optionality with the `-?` modifier.
  - question: What is the difference between Pick and Omit?
    answer: |
      `Pick<T, K>` keeps only the listed keys; `Omit<T, K>` keeps every key except the listed ones.
      Note that `Omit` accepts any string key (it is not constrained to `keyof T`), so typos are not
      caught — `Pick` is stricter.
  - question: What does infer do in a conditional type?
    answer: |
      It declares a type variable that TypeScript fills in while matching a pattern, e.g.
      `type Awaited2<T> = T extends Promise<infer U> ? U : T` extracts the value type of a promise.
      Built-ins like `ReturnType` and `Parameters` are implemented this way.
  - question: Why are conditional types distributive?
    answer: |
      When the checked type is a naked type parameter and it receives a union, the condition is
      applied to each member separately and the results are unioned. That is how
      `Exclude<'a' | 'b', 'a'>` yields `'b'`. Wrapping both sides in a tuple (`[T] extends [U]`)
      disables distribution.
quiz:
  - id: q1
    question: "Which type makes all properties of User optional?"
    options: ["Required<User>", "Partial<User>", "Readonly<User>", "Record<User, undefined>"]
    correct: 1
    explanation: Partial maps every property to optional.
  - id: q2
    question: "What is Exclude<'a' | 'b' | 'c', 'a' | 'c'>?"
    options: ["'a' | 'c'", "'b'", "never", "'a' | 'b' | 'c'"]
    correct: 1
    explanation: Exclude is a distributive conditional type that removes matching members.
  - id: q3
    question: "What does ReturnType<typeof fn> give you?"
    options: ["The parameters of fn", "The type fn returns", "A promise of fn", "fn itself"]
    correct: 1
    explanation: ReturnType uses infer to extract the return type of a function type.
  - id: q4
    question: "Record<'admin' | 'user', boolean> is equivalent to…"
    options: ["{ admin: boolean; user: boolean }", "boolean[]", "Map<string, boolean>", "{ [key: string]: boolean }"]
    correct: 0
    explanation: Record maps each key of the union to the value type.
topics: [ts-utility-types, ts-mapped-conditional-types]
references:
  - { title: 'TypeScript Handbook — Utility Types', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html' }
  - { title: 'TypeScript Handbook — Mapped Types', url: 'https://www.typescriptlang.org/docs/handbook/2/mapped-types.html' }
  - { title: 'TypeScript Handbook — Conditional Types', url: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html' }
---

## Everyday utility types

```ts
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

type UserUpdate = Partial<Omit<User, 'id'>> // everything optional except id is removed
type UserPreview = Pick<User, 'id' | 'name'>
type Permissions = Record<User['role'], string[]>
type Frozen = Readonly<User>
```

## Mapped types

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null }

// Key remapping with "as"
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

type UserGetters = Getters<Pick<User, 'name'>> // { getName: () => string }
```

## Conditional types and infer

```ts
type ElementType<T> = T extends readonly (infer U)[] ? U : never
type A = ElementType<string[]> // string

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
type B = UnwrapPromise<Promise<number>> // number
```

## One source of truth

```ts
const ROLES = ['admin', 'editor', 'viewer'] as const
type Role = (typeof ROLES)[number] // 'admin' | 'editor' | 'viewer'

const routes = { home: '/', plan: '/plan' } satisfies Record<string, `/${string}`>
type RouteName = keyof typeof routes
```

Deriving types this way means adding a role or route updates every dependent type automatically.
