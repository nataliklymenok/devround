---
id: ts-overloads
module: ts-in-practice
order: 5
title: Function overloads and typing this
description: When overload signatures beat unions and generics, how they are resolved, and declaring the type of this.
levels: [middle, senior]
estimatedMinutes: 15
topics: [ts-overloads]
references:
  - { title: 'TypeScript Handbook — More on Functions (overloads, this)', url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html' }
keyTakeaways:
  - Overloads describe several call signatures with one implementation; callers see only the overload signatures.
  - Prefer union or generic parameters when the return type does not depend on which signature is used.
  - Overloads are checked top to bottom — put the most specific first.
  - A fake first parameter named this declares the type of this inside a function.
interviewQuestions:
  - question: When are overloads better than a union parameter?
    answer: |
      When the return type depends on the argument type in a way a single signature cannot express
      cleanly — e.g. `parse(input: string): Ast` and `parse(input: string[]): Ast[]`. If the return
      type is the same, a union parameter is simpler; if the relation is generic, a generic or
      conditional type may be clearer.
  - question: How do you type this in a function?
    answer: |
      Add a pseudo-parameter: `function onClick(this: HTMLButtonElement, event: MouseEvent) {}`. It is
      erased at compile time and lets TypeScript check both the body and how the function is called.
  - question: How does TypeScript pick an overload, and what are common pitfalls?
    answer: |
      It tries the overload signatures in order and uses the first one whose parameters accept the
      arguments, so specific signatures must come before general ones. Pitfalls: the implementation
      signature is not callable from outside, every overload must be compatible with the
      implementation, and a caller passing a value of a union type (e.g. `string | string[]`) matches
      no single overload unless you add one for the union.
quiz:
  - id: q1
    question: Can callers use the implementation signature of an overloaded function directly?
    options: ["Yes", "No — only the overload signatures are visible", "Only with as any", "Only in .d.ts files"]
    correct: 1
    explanation: The implementation signature is hidden from callers.
  - id: q2
    question: In which order should overloads be written?
    options: ["Most general first", "Most specific first", "Alphabetical", "Order does not matter"]
    correct: 1
    explanation: TypeScript picks the first matching overload.
  - id: q3
    question: "function f(this: Window) {} — what happens to this parameter at runtime?"
    options: ["It becomes the first argument", "It is erased", "It throws", "It binds automatically"]
    correct: 1
    explanation: The this parameter only exists for type checking.
---

## Overloads

```ts
function getItems(id: string): Promise<Item>
function getItems(ids: string[]): Promise<Item[]>
async function getItems(idOrIds: string | string[]): Promise<Item | Item[]> {
  return Array.isArray(idOrIds) ? fetchMany(idOrIds) : fetchOne(idOrIds)
}

const one = await getItems('a') // Item
const many = await getItems(['a', 'b']) // Item[]
```

## Prefer simpler alternatives when possible

```ts
// Same return type → a union is enough
function formatId(id: string | number): string {
  return String(id).padStart(6, '0')
}

// Return type follows the input → a generic is enough
function first<T>(items: T[]): T | undefined {
  return items[0]
}
```

## Typing this

```ts
function handleClick(this: HTMLButtonElement, event: MouseEvent) {
  this.disabled = true
}

button.addEventListener('click', handleClick) // ✅ this is the button
handleClick(new MouseEvent('click')) // ❌ error: this is void
```
