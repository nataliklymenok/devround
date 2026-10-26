---
id: js-this-prototypes
module: js-fundamentals
order: 3
title: this, prototypes and classes
description: How this is determined at call time, how prototype chains work and what classes really are.
levels: [junior, middle, senior]
estimatedMinutes: 25
keyTakeaways:
  - The value of this depends on how a function is called, not where it is defined (except arrow functions).
  - Arrow functions do not have their own this; they use this from the surrounding scope.
  - call, apply and bind set this explicitly; bind returns a new function.
  - Classes are syntax over prototypes — methods live on the prototype and are shared by instances.
interviewQuestions:
  - question: How is the value of this determined?
    answer: |
      By the call site, in priority order: `new` binding (a fresh object), explicit binding
      (`call`/`apply`/`bind`), implicit binding (`obj.method()` → `obj`), and the default binding
      (`undefined` in strict mode, the global object otherwise). Arrow functions ignore all of these
      and capture `this` lexically from where they are defined.
  - question: What is the prototype chain?
    answer: |
      Every object has an internal link (`[[Prototype]]`) to another object. When a property is not
      found on the object itself, the lookup continues along this chain until it is found or the chain
      ends with `null`. That is how instances share methods defined on `Constructor.prototype` and how
      inheritance works with `extends`.
  - question: Why do methods lose this when passed as callbacks, and how do you fix it?
    answer: |
      Passing `obj.method` passes only the function; when it is later called as a plain function the
      implicit `obj` binding is gone. Fixes: `obj.method.bind(obj)`, a wrapper arrow function
      `() => obj.method()`, or defining the method as an arrow-function class field.
  - question: What is the difference between call, apply and bind?
    answer: |
      `call(thisArg, a, b)` and `apply(thisArg, [a, b])` invoke the function immediately with the
      given `this` — they differ only in how arguments are passed. `bind(thisArg, ...args)` does not
      call the function; it returns a new function with `this` (and optionally leading arguments)
      permanently fixed.
quiz:
  - id: q1
    question: "const obj = { name: 'A', hi() { return this.name } }; const f = obj.hi; f() in strict mode returns…"
    options: ["'A'", "undefined", "It throws a TypeError", "The global name"]
    correct: 2
    explanation: f() uses the default binding, so this is undefined in strict mode and reading this.name throws.
  - id: q2
    question: What is this inside an arrow function?
    options: ["The object the arrow function is called on", "Always the global object", "The this of the enclosing scope", "Always undefined"]
    correct: 2
    explanation: Arrow functions capture this lexically from where they are created.
  - id: q3
    question: Where are methods declared in a class body stored?
    options: ["On each instance", "On the class prototype", "In a hidden closure", "On the global object"]
    correct: 1
    explanation: Class methods are defined on Class.prototype and shared by all instances (unlike class fields).
  - id: q4
    question: What does fn.bind(obj) return?
    options: ["The result of calling fn", "A new function with this bound to obj", "obj with fn attached", "undefined"]
    correct: 1
    explanation: bind returns a new function; call and apply invoke immediately.
---

## this is decided at call time

```js
'use strict'

const user = {
  name: 'Ann',
  greet() {
    return `Hi, ${this.name}`
  },
}

user.greet() // 'Hi, Ann' — implicit binding: this === user

const greet = user.greet
greet() // TypeError — default binding: this is undefined

greet.call({ name: 'Bob' }) // 'Hi, Bob' — explicit binding
const bound = greet.bind(user)
bound() // 'Hi, Ann'
```

## Arrow functions

Arrow functions have no own `this`. That makes them ideal for callbacks inside methods:

```js
class Timer {
  seconds = 0
  start() {
    setInterval(() => {
      this.seconds++ // this is the Timer instance
    }, 1000)
  }
}
```

The flip side: never use an arrow function as an object method that needs `this` of the object.

## Prototypes

```js
const animal = { speak() { return `${this.name} makes a sound` } }
const dog = Object.create(animal)
dog.name = 'Rex'

dog.speak() // found on the prototype, this === dog
Object.getPrototypeOf(dog) === animal // true
```

## Classes are prototypes with nicer syntax

```js
class Animal {
  constructor(name) {
    this.name = name // own property on each instance
  }
  speak() {
    return `${this.name} makes a sound` // on Animal.prototype
  }
}

class Dog extends Animal {
  speak() {
    return `${super.speak()} — woof`
  }
}

new Dog('Rex').speak()
typeof Animal // 'function'
```

## Senior angle

Class fields (`handleClick = () => {}`) create a new function **per instance**, while prototype
methods are shared. That is a fine trade-off for event handlers but matters for objects created in
large numbers.
