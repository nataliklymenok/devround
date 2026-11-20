---
id: js-objects-descriptors
module: js-fundamentals
order: 9
title: Objects in depth — descriptors, freezing, Symbol and Proxy
description: Ways to create objects, property descriptors, getters and setters, freeze vs seal vs preventExtensions, Symbols, Proxy and Reflect, tagged templates.
levels: [middle, senior]
estimatedMinutes: 25
topics: [js-objects-metaprogramming]
reviewed: 2026-11-20
references:
  - { title: 'MDN — Object.defineProperty()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty' }
  - { title: 'MDN — Object.freeze()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze' }
  - { title: 'MDN — Symbol', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol' }
  - { title: 'MDN — Proxy', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy' }
  - { title: 'MDN — Template literals: tagged templates', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates' }
keyTakeaways:
  - 'Every property has flags: writable, enumerable, configurable (or get/set for accessors); literal properties default to true, defineProperty defaults to false.'
  - preventExtensions blocks new properties; seal also blocks deleting; freeze also blocks changing values — all are shallow.
  - Symbols are unique keys that do not clash and are skipped by for...in, Object.keys and JSON.stringify.
  - Proxy intercepts operations on an object (get, set, has, deleteProperty…); Reflect performs the default behavior inside a trap.
interviewQuestions:
  - question: What are the different ways to create an object in JavaScript?
    answer: |
      An object literal `{}`; a constructor function or class with `new`; `Object.create(proto)` to
      choose the prototype explicitly (`Object.create(null)` for a dictionary with no prototype);
      `Object.fromEntries` and `Object.assign`/spread to build from other data; and factory functions
      that return a literal. Literals are the default; classes when you need many instances with shared
      methods; `Object.create` when you need control over the prototype.
  - question: What is the difference between Object.freeze, Object.seal and Object.preventExtensions?
    answer: |
      `preventExtensions` forbids adding properties. `seal` forbids adding and deleting (sets
      `configurable: false` on every property) but values can still change. `freeze` additionally makes
      every data property read-only (`writable: false`). All three are shallow — nested objects stay
      mutable unless you freeze them recursively. Violations fail silently in sloppy mode and throw a
      TypeError in strict mode (ES modules and classes are always strict).
  - question: What are property descriptors and when would you use defineProperty?
    answer: |
      A descriptor describes one property: a data descriptor has `value` and `writable`, an accessor
      has `get` and `set`; both have `enumerable` (shows up in `for...in`, `Object.keys`, spread, JSON)
      and `configurable` (can be deleted or redefined). Properties created by assignment have all flags
      `true`; `Object.defineProperty` defaults missing flags to `false`. You use it to define
      non-enumerable or read-only properties, lazy getters, or to inspect with
      `Object.getOwnPropertyDescriptor`.
  - question: What are Symbols used for?
    answer: |
      `Symbol()` creates a unique, non-string key, so libraries can attach metadata to objects without
      name clashes; symbol keys are skipped by `for...in`, `Object.keys` and `JSON.stringify`.
      Well-known symbols customize language behavior: `Symbol.iterator` makes an object iterable,
      `Symbol.asyncIterator` works with `for await`, `Symbol.toPrimitive` controls conversion.
      `Symbol.for('key')` returns a shared symbol from a global registry.
  - question: What is a Proxy and where is it used in practice?
    answer: |
      `new Proxy(target, handler)` wraps an object and lets traps intercept operations such as `get`,
      `set`, `has`, `deleteProperty` and `apply`. Inside a trap, `Reflect.get/set/…` performs the
      default behavior with the right receiver. Real uses: reactivity (Vue 3 and MobX track reads and
      writes), Immer's drafts, validation, default values, logging and API clients that turn property
      access into requests. The cost is performance and debuggability, so it is rarely used for plain
      application objects.
quiz:
  - id: q1
    question: Which call still allows changing existing property values?
    options: ["Object.freeze", "Object.seal", "Neither", "Both"]
    correct: 1
    explanation: seal blocks adding and deleting but keeps properties writable.
  - id: q2
    question: "`const o = Object.freeze({ inner: { n: 1 } }); o.inner.n = 2` — what is `o.inner.n`?"
    options: ["1", "2", "TypeError", "undefined"]
    correct: 1
    explanation: freeze is shallow; the nested object is still mutable.
  - id: q3
    question: "What are the default flags of a property created with `Object.defineProperty(o, 'x', { value: 1 })`?"
    options: ["All true", "All false", "writable true, others false", "enumerable true, others false"]
    correct: 1
    explanation: defineProperty defaults missing flags to false, unlike assignment.
  - id: q4
    question: Which of these includes symbol-keyed properties?
    options: ["Object.keys", "JSON.stringify", "Reflect.ownKeys", "for...in"]
    correct: 2
    explanation: Reflect.ownKeys returns string and symbol own keys, enumerable or not.
---

## Descriptors

```js
const user = { name: 'Ann' }
Object.getOwnPropertyDescriptor(user, 'name')
// { value: 'Ann', writable: true, enumerable: true, configurable: true }

Object.defineProperty(user, 'id', { value: 42 }) // writable/enumerable/configurable: false
user.id = 7          // ignored (TypeError in strict mode)
Object.keys(user)    // ['name'] — id is not enumerable

const temp = {
  celsius: 20,
  get fahrenheit() { return this.celsius * 1.8 + 32 },
  set fahrenheit(f) { this.celsius = (f - 32) / 1.8 },
}
temp.fahrenheit = 212 // temp.celsius === 100
```

## Locking objects down

| | Add | Delete | Change value |
| --- | --- | --- | --- |
| `Object.preventExtensions` | ✗ | ✓ | ✓ |
| `Object.seal` | ✗ | ✗ | ✓ |
| `Object.freeze` | ✗ | ✗ | ✗ |

```js
function deepFreeze(obj) {
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') deepFreeze(value)
  }
  return Object.freeze(obj)
}
```

`const` only prevents reassigning the variable; it does not freeze the object.

## Symbols

```js
const meta = Symbol('meta')
const item = { id: 1, [meta]: { cachedAt: Date.now() } }
Object.keys(item)        // ['id']
JSON.stringify(item)     // '{"id":1}'
Reflect.ownKeys(item)    // ['id', Symbol(meta)]

class Range {
  constructor(from, to) { this.from = from; this.to = to }
  *[Symbol.iterator]() { for (let i = this.from; i <= this.to; i++) yield i }
}
[...new Range(1, 3)] // [1, 2, 3]
```

## Proxy and Reflect

```js
function withDefaults(target, fallback) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      return key in obj ? Reflect.get(obj, key, receiver) : fallback
    },
  })
}
const counts = withDefaults({}, 0)
counts.react += 1 // 1

const validated = new Proxy({}, {
  set(obj, key, value, receiver) {
    if (key === 'age' && !Number.isInteger(value)) throw new TypeError('age must be an integer')
    return Reflect.set(obj, key, value, receiver)
  },
})
```

## Tagged templates

A tag is a function that receives the literal string parts and the interpolated values separately —
how `styled-components`, `graphql` tags and safe HTML/SQL builders work:

```js
function html(strings, ...values) {
  return strings.reduce((out, str, i) => out + str + (i < values.length ? escape(values[i]) : ''), '')
}
html`<p>${userInput}</p>` // values are escaped, the static parts are not
```
