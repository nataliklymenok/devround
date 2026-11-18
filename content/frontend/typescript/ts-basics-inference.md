---
id: ts-basics-inference
module: ts-type-system
order: 1
title: Annotations, inference and structural typing
description: When to annotate, what TypeScript infers for you, and why types are compared by shape.
levels: [junior, middle]
estimatedMinutes: 20
keyTakeaways:
  - Annotate function parameters and public APIs; let TypeScript infer local variables.
  - TypeScript is structural — a value fits a type if it has the required shape, whatever its name.
  - Prefer unknown over any for values you have not validated yet.
  - Types are erased at runtime; validate external data (API responses, JSON) yourself.
interviewQuestions:
  - question: What is the difference between any and unknown?
    answer: |
      Both accept any value. `any` switches type checking off — you can call, index or assign it to
      anything, and errors spread silently. `unknown` is type-safe: you must narrow it (with `typeof`,
      `instanceof`, a type guard or a schema validator) before using it. Use `unknown` for untrusted
      input such as `JSON.parse` results or caught errors.
  - question: What does "structural typing" mean?
    answer: |
      Compatibility is decided by the shape of a type, not by its name or declaration. Any object with
      the required properties satisfies an interface, even if it was never declared to implement it.
      Extra properties are allowed when assigning a variable, but an object literal passed directly is
      checked for excess properties to catch typos.
  - question: Do TypeScript types exist at runtime?
    answer: |
      No — types are erased during compilation, so they cannot validate data coming from the network or
      user input. Use runtime validation (e.g. Zod) at the boundaries and infer static types from those
      schemas to keep a single source of truth.
quiz:
  - id: q1
    question: Which type forces you to narrow a value before using it?
    options: ["any", "unknown", "object", "never"]
    correct: 1
    explanation: unknown accepts everything but allows almost no operations until it is narrowed.
  - id: q2
    question: "What type does TypeScript infer for: const status = 'idle'?"
    options: ["string", "the literal type 'idle'", "any", "String"]
    correct: 1
    explanation: const bindings of primitives get the literal type; let would widen it to string.
  - id: q3
    question: "interface Point { x: number; y: number }. Can { x: 1, y: 2, z: 3 } stored in a variable be passed where Point is expected?"
    options: ["Yes — it has the required shape", "No — z is not allowed anywhere", "Only with a type assertion", "Only if it is a class instance"]
    correct: 0
    explanation: Structural typing allows extra properties for non-literal values; excess property checks apply only to fresh object literals.
  - id: q4
    question: What happens to type annotations when TypeScript compiles to JavaScript?
    options: ["They become runtime checks", "They are erased", "They become JSDoc comments that run", "They are stored in a .d.ts and enforced at runtime"]
    correct: 1
    explanation: Types are erased; validate untrusted data at runtime yourself.
topics: [ts-inference-structural, ts-any-unknown]
references:
  - { title: 'TypeScript Handbook — Everyday Types', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html' }
  - { title: 'TypeScript Handbook — Type Compatibility', url: 'https://www.typescriptlang.org/docs/handbook/type-compatibility.html' }
---

## Annotate the edges, infer the rest

```ts
// Parameters and return types of exported functions document the contract
export function total(items: { price: number; qty: number }[]): number {
  const sum = items.reduce((acc, item) => acc + item.price * item.qty, 0) // inferred: number
  return Math.round(sum * 100) / 100
}

let mode = 'light' // string
const theme = 'dark' // literal type 'dark'
```

## Structural typing

```ts
interface Named {
  name: string
}

class Person {
  constructor(public name: string, public age: number) {}
}

const greet = (x: Named) => `Hi ${x.name}`

greet(new Person('Ann', 30)) // OK — it has a name
greet({ name: 'Bob', age: 2 }) // Error — excess property check on a fresh literal
```

## any vs unknown

```ts
function parse(json: string): unknown {
  return JSON.parse(json)
}

const data = parse('{"id": 1}')
data.id // Error — must narrow first

if (typeof data === 'object' && data !== null && 'id' in data) {
  console.log(data.id) // OK
}
```

## Types disappear at runtime

TypeScript cannot check data that arrives while the app runs. Validate at the boundary and derive
the static type from the validator:

```ts
import { z } from 'zod'

const User = z.object({ id: z.string(), email: z.email() })
type User = z.infer<typeof User>

const user: User = User.parse(await res.json()) // throws if the shape is wrong
```
