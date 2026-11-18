---
id: ts-classes
module: ts-in-practice
order: 2
title: Classes, access modifiers and abstract classes
description: public, private, protected and readonly, #private fields, parameter properties, abstract classes and implements.
levels: [junior, middle, senior]
estimatedMinutes: 20
topics: [ts-classes]
references:
  - { title: 'TypeScript Handbook — Classes', url: 'https://www.typescriptlang.org/docs/handbook/2/classes.html' }
  - { title: 'MDN — Private properties', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties' }
keyTakeaways:
  - TypeScript's private and protected are compile-time only; JavaScript #private fields are enforced at runtime.
  - 'Parameter properties (constructor(private readonly api: Api)) declare and assign fields in one place.'
  - Abstract classes provide shared implementation and force subclasses to implement abstract members.
  - implements checks a class against an interface but does not change the class type or add code.
interviewQuestions:
  - question: What is the difference between private and #private?
    answer: |
      `private x` is a TypeScript check: the property exists normally at runtime and can be read with
      `(obj as any).x` or from plain JavaScript. `#x` is a JavaScript private field: inaccessible
      outside the class body at runtime, invisible to `Object.keys` and JSON. Use `#` when real
      encapsulation matters.
  - question: Abstract class or interface?
    answer: |
      An interface only describes a shape and disappears at runtime; a class can implement several.
      An abstract class can contain implementation, fields and constructors, exists at runtime, and a
      class can extend only one. Choose an interface for contracts and an abstract class when
      subclasses should share behaviour (template method pattern).
  - question: What does protected mean?
    answer: |
      The member is accessible inside the class and its subclasses, but not from outside instances. Like
      `private`, it is only enforced by the type checker.
quiz:
  - id: q1
    question: Which field is truly inaccessible from outside the class at runtime?
    options: ["private count", "protected count", "#count", "readonly count"]
    correct: 2
    explanation: "#fields are enforced by the JavaScript engine."
  - id: q2
    question: "constructor(private readonly id: string) {} does what?"
    options: ["Only types the parameter", "Declares a private readonly field id and assigns it", "Creates a static property", "Nothing at runtime"]
    correct: 1
    explanation: Parameter properties declare and initialize a field.
  - id: q3
    question: Can you instantiate an abstract class directly?
    options: ["Yes", "No", "Only with new.target", "Only in tests"]
    correct: 1
    explanation: Abstract classes must be extended.
---

## Modifiers

```ts
class Account {
  static readonly currency = 'EUR'
  #balance = 0 // runtime-private

  constructor(
    public readonly id: string,
    private readonly ledger: Ledger, // parameter property
  ) {}

  protected log(message: string) {
    this.ledger.write(this.id, message)
  }

  deposit(amount: number) {
    if (amount <= 0) throw new RangeError('Amount must be positive')
    this.#balance += amount
    this.log(`deposit ${amount}`)
  }

  get balance() {
    return this.#balance
  }
}
```

## Abstract classes

```ts
abstract class Exporter<T> {
  export(items: T[]): string {
    return [this.header(), ...items.map((i) => this.row(i))].join('\n')
  }
  protected abstract header(): string
  protected abstract row(item: T): string
}

class CsvUserExporter extends Exporter<User> {
  protected header() {
    return 'id,email'
  }
  protected row(u: User) {
    return `${u.id},${u.email}`
  }
}
```

## implements

```ts
interface Cache {
  get(key: string): string | undefined
  set(key: string, value: string): void
}

class MemoryCache implements Cache {
  private store = new Map<string, string>()
  get(key: string) {
    return this.store.get(key)
  }
  set(key: string, value: string) {
    this.store.set(key, value)
  }
}
```
