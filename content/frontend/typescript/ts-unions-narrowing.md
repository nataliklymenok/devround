---
id: ts-unions-narrowing
module: ts-type-system
order: 2
title: Unions, narrowing and type guards
description: Model states with union types, narrow them safely and get exhaustiveness checks with never.
levels: [junior, middle, senior]
estimatedMinutes: 25
keyTakeaways:
  - Union types describe values that can be one of several shapes.
  - TypeScript narrows unions using typeof, instanceof, in, equality and discriminant checks.
  - Discriminated unions with a literal kind or status field make impossible states unrepresentable.
  - Assigning to never in a default branch gives compile-time exhaustiveness checks.
interviewQuestions:
  - question: What is a discriminated union and why is it useful?
    answer: |
      A union of object types that share a literal "tag" property, e.g.
      `{ status: 'loading' } | { status: 'success'; data: User } | { status: 'error'; error: string }`.
      Checking the tag narrows to exactly one member, so you can only access `data` when it exists.
      It replaces loose shapes like `{ loading: boolean; data?: User; error?: string }`, where
      impossible combinations are representable.
  - question: How do you write a user-defined type guard?
    answer: |
      A function whose return type is a type predicate, e.g.
      `function isUser(x: unknown): x is User { ... }`. When it returns true, TypeScript narrows the
      argument to `User` in that branch. The check inside must really be correct — the compiler trusts
      the predicate.
  - question: How do you make sure a switch handles every case of a union?
    answer: |
      In the default branch assign the value to a variable of type `never`
      (`const unreachable: never = value`). If a new member is added to the union and not handled,
      the value is no longer `never` and compilation fails.
quiz:
  - id: q1
    question: "type Shape = { kind: 'circle'; r: number } | { kind: 'square'; size: number }. After if (s.kind === 'circle'), what can you access?"
    options: ["s.r only", "s.size only", "Both r and size", "Neither without a cast"]
    correct: 0
    explanation: Checking the discriminant narrows s to the circle member.
  - id: q2
    question: Which return type makes a function a type guard?
    options: ["boolean", "x is User", "asserts boolean", "User | false"]
    correct: 1
    explanation: A type predicate (x is User) tells TypeScript to narrow when the function returns true.
  - id: q3
    question: What is the type of a value in a branch that can never be reached?
    options: ["void", "undefined", "never", "unknown"]
    correct: 2
    explanation: never is the empty type — perfect for exhaustiveness checks.
  - id: q4
    question: Which operator narrows a union of object types by checking for a property?
    options: ["typeof", "in", "keyof", "satisfies"]
    correct: 1
    explanation: "'prop' in value narrows to the members that declare that property."
topics: [ts-narrowing, ts-discriminated-unions]
references:
  - { title: 'TypeScript Handbook — Narrowing', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html' }
---

## Union types

```ts
type Id = string | number

function format(id: Id) {
  if (typeof id === 'number') return id.toFixed(0) // id: number
  return id.toUpperCase() // id: string
}
```

## Discriminated unions model state

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

function render(state: RequestState<string[]>) {
  switch (state.status) {
    case 'success':
      return state.data.join(', ') // data exists only here
    case 'error':
      return `Failed: ${state.error}`
    default:
      return 'Loading…'
  }
}
```

## Custom type guards

```ts
interface Cat { meow(): void }
interface Dog { bark(): void }

function isCat(pet: Cat | Dog): pet is Cat {
  return 'meow' in pet
}

declare const pet: Cat | Dog
if (isCat(pet)) pet.meow()
else pet.bark()
```

## Exhaustiveness with never

```ts
function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.r ** 2
    case 'square':
      return shape.size ** 2
    default: {
      const unreachable: never = shape // compile error if a new kind is added
      throw new Error(`Unknown shape: ${JSON.stringify(unreachable)}`)
    }
  }
}
```
