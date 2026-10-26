---
id: ts-interfaces-vs-types
module: ts-type-system
order: 3
title: Interfaces vs type aliases
description: What interface and type can each do, declaration merging, and a pragmatic rule for choosing.
levels: [junior, middle]
estimatedMinutes: 15
keyTakeaways:
  - Both can describe object shapes and be extended; most of the time either works.
  - Only type aliases can name unions, tuples, primitives and mapped or conditional types.
  - Interfaces with the same name merge — useful for augmenting libraries, surprising elsewhere.
  - Pick one convention for object shapes and stay consistent.
interviewQuestions:
  - question: When must you use a type alias instead of an interface?
    answer: |
      For anything that is not a plain object shape: unions (`'a' | 'b'`), tuples (`[number, string]`),
      primitives and aliases of them, function types written as aliases, and mapped or conditional
      types (`Partial<T>`, `T extends U ? X : Y`).
  - question: What is declaration merging?
    answer: |
      Several `interface` declarations with the same name in the same scope are merged into one. It is
      how you augment third-party types (for example adding a property to Fastify's request type). Type
      aliases cannot be merged — redeclaring one is an error.
  - question: How do you extend types with each approach?
    answer: |
      Interfaces use `extends` (`interface Admin extends User { ... }`), which also reports conflicts
      clearly. Type aliases use intersections (`type Admin = User & { ... }`). Interfaces can extend
      type aliases of object types and vice versa.
quiz:
  - id: q1
    question: "Which can describe type Status = 'idle' | 'loading'?"
    options: ["Only an interface", "Only a type alias", "Both", "Neither — use an enum"]
    correct: 1
    explanation: Union types can only be named with a type alias.
  - id: q2
    question: What happens when you declare interface User twice in the same scope?
    options: ["Compile error", "The second replaces the first", "The declarations merge", "The first one wins"]
    correct: 2
    explanation: Interfaces support declaration merging.
  - id: q3
    question: How do you combine two object types with a type alias?
    options: ["extends", "implements", "An intersection with &", "A union with |"]
    correct: 2
    explanation: type C = A & B produces a type with the members of both.
---

## Mostly interchangeable

```ts
interface UserI {
  id: string
  name: string
}

type UserT = {
  id: string
  name: string
}

interface AdminI extends UserI {
  permissions: string[]
}

type AdminT = UserT & { permissions: string[] }
```

## Only type aliases can do this

```ts
type Status = 'idle' | 'loading' | 'error' // union
type Pair = [key: string, value: number] // tuple
type Handler = (event: Event) => void // function type
type ReadonlyUser = Readonly<UserT> // mapped type
type ElementOf<T> = T extends (infer U)[] ? U : never // conditional type
```

## Only interfaces merge

```ts
// Augmenting a library type
declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string } | null
  }
}
```

## A pragmatic rule

Many teams use `interface` for object shapes that may be extended or augmented (component props,
public API contracts) and `type` for everything else. Whatever you choose, be consistent — mixing
styles without a reason makes code harder to scan.
