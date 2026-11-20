---
id: js-design-patterns
module: js-fundamentals
order: 10
title: Design patterns in JavaScript
description: The module pattern and IIFE, singleton, factory, observer, decorator, strategy and command — what each solves and how it looks in modern JavaScript.
levels: [middle, senior]
estimatedMinutes: 25
topics: [js-design-patterns]
reviewed: 2026-11-20
references:
  - { title: 'patterns.dev — Design patterns', url: 'https://www.patterns.dev/#patterns' }
  - { title: 'MDN — IIFE', url: 'https://developer.mozilla.org/en-US/docs/Glossary/IIFE' }
  - { title: 'Refactoring.Guru — Design patterns catalog', url: 'https://refactoring.guru/design-patterns/catalog' }
keyTakeaways:
  - A pattern is a named, reusable solution to a recurring design problem — knowing the names speeds up discussion.
  - In JavaScript many classic patterns are just functions and closures; ES modules already give you the module pattern and singletons.
  - Observer (pub/sub) is everywhere in frontend — DOM events, EventEmitter, stores and subscriptions.
  - Decorator and strategy favor composition over inheritance; command turns actions into data (undo, queues, Redux actions).
interviewQuestions:
  - question: What is the module pattern and why was the IIFE used for it?
    answer: |
      The module pattern hides private state inside a function scope and returns only a public API.
      Before ES modules, an immediately invoked function expression created that private scope:
      `const counter = (function () { let n = 0; return { inc: () => ++n } })()`. The parentheses make
      the function an expression — `function foo(){}()` is a syntax error because it is parsed as a
      declaration. Today every ES module file has its own scope, so non-exported bindings are private
      by default and IIFEs are rarely needed.
  - question: What is a singleton and what are its drawbacks?
    answer: |
      A singleton guarantees a single shared instance — a config, a logger, an API client. In
      JavaScript an ES module that exports an instance is already a singleton, because a module is
      evaluated once and cached. Drawbacks: hidden global state, implicit coupling, and harder testing
      (state leaks between tests, hard to substitute). Prefer passing dependencies explicitly, or
      export a factory plus one default instance.
  - question: Explain the observer pattern and give frontend examples.
    answer: |
      A subject keeps a list of subscribers and notifies them when something changes; subscribers can
      unsubscribe. It decouples who produces events from who reacts. Examples: `addEventListener`,
      Node's `EventEmitter`, Redux `store.subscribe`, RxJS observables, `useSyncExternalStore`
      subscriptions, WebSocket message handlers. The main pitfall is forgetting to unsubscribe, which
      leaks memory and causes updates on unmounted components. Pub/sub is a variant with a broker
      between publishers and subscribers.
  - question: What are the factory, decorator and strategy patterns?
    answer: |
      A factory is a function that creates objects so callers do not depend on concrete classes or
      setup details (`createLogger({ level })`, `React.createElement`). A decorator wraps an object or
      function to add behavior without changing it — `memoize(fn)`, `withRetry(fetchFn)`, higher-order
      components. A strategy is an interchangeable algorithm chosen at runtime behind the same
      interface — sorting comparators, validation rules per field, payment providers in a map instead
      of a long `if/else` chain.
  - question: What is the command pattern used for in frontend apps?
    answer: |
      A command wraps an action as an object with everything needed to execute it (and often to undo
      it). That makes actions storable and replayable: undo/redo stacks in editors, offline queues
      that retry when the network returns, keyboard-shortcut maps, and Redux actions — plain objects
      describing what happened that a reducer executes.
quiz:
  - id: q1
    question: "Why is `function foo(){}()` a syntax error?"
    options: ["foo is not defined", "It is parsed as a function declaration, which cannot be invoked in place", "IIFEs are not allowed in strict mode", "Functions need a return value"]
    correct: 1
    explanation: Wrapping it in parentheses makes it an expression that can be called.
  - id: q2
    question: Which pattern does `addEventListener` implement?
    options: ["Singleton", "Observer", "Factory", "Command"]
    correct: 1
    explanation: Listeners subscribe to a subject and are notified on events.
  - id: q3
    question: "A map of `{ card: payByCard, paypal: payByPaypal }` chosen at runtime is an example of…"
    options: ["Strategy", "Decorator", "Singleton", "Prototype"]
    correct: 0
    explanation: Interchangeable algorithms behind the same interface.
  - id: q4
    question: Why is a module that exports an instance effectively a singleton?
    options: ["Modules are evaluated once and cached", "Modules freeze their exports", "Exports are copied on import", "It is not a singleton"]
    correct: 0
    explanation: Every import receives the same module instance.
---

## Module pattern: then and now

```js
// before ES modules
const counter = (function () {
  let count = 0 // private
  return { increment: () => ++count, get value() { return count } }
})()

// today: the file is the module
let count = 0
export const increment = () => ++count
export const getCount = () => count
```

## Singleton

```js
// api-client.js — evaluated once, every importer gets the same instance
class ApiClient { constructor(baseUrl) { this.baseUrl = baseUrl } }
export const api = new ApiClient('/api')
```

For testability, export the factory too: `export function createApiClient(baseUrl) { … }`.

## Factory

```js
function createNotifier(channel) {
  const senders = { email: sendEmail, sms: sendSms, push: sendPush }
  const send = senders[channel]
  if (!send) throw new Error(`Unknown channel: ${channel}`)
  return { notify: (user, text) => send(user, text) }
}
```

## Observer

```js
function createStore(initial) {
  let state = initial
  const listeners = new Set()
  return {
    getState: () => state,
    setState(next) { state = next; listeners.forEach((l) => l(state)) },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener) // always return an unsubscribe
    },
  }
}
```

The `js-event-emitter` coding task asks you to build this from scratch.

## Decorator

```js
function withLogging(fn) {
  return function (...args) {
    console.log(`→ ${fn.name}`, args)
    return fn.apply(this, args)
  }
}
const save = withLogging(saveUser)
```

`memoize`, `debounce` and `throttle` from the coding tasks are all function decorators;
higher-order components are the same idea for React components.

## Strategy

```js
const validators = {
  required: (v) => v.trim() !== '' || 'Required',
  email: (v) => /^\S+@\S+$/.test(v) || 'Invalid email',
  min: (n) => (v) => v.length >= n || `At least ${n} characters`,
}
const rules = { email: [validators.required, validators.email] }
```

## Command

```js
const history = []
function execute(command) {
  command.do()
  history.push(command)
}
function undo() {
  history.pop()?.undo()
}
execute({ do: () => list.push(item), undo: () => list.pop() })
```

## Senior angle

Know when **not** to use a pattern: a class hierarchy where a function would do, a singleton that
makes tests share state, or an event bus that hides who changes what. Interviewers value the
trade-off more than the definition.
