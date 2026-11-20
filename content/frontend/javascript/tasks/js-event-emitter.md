---
id: js-event-emitter
order: 5
title: Implement an event emitter
levels: [junior, middle, senior]
difficulty: medium
estimatedMinutes: 25
mode: tests
topics: [js-collections-gc, js-prototypes-classes]
reviewed: 2026-11-20
references:
  - { title: 'Node.js — Events (EventEmitter)', url: 'https://nodejs.org/api/events.html' }
  - { title: 'MDN — Map', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map' }
hints:
  - Store listeners in a Map from event name to an array (or Set) of functions.
  - on() can return an unsubscribe function that calls off() for that listener.
  - For once(), register a wrapper that removes itself before calling the listener; off() must also find once-listeners by their original function.
entry: EventEmitter
starterCode: |
  class EventEmitter {
    on(event, listener) {}
    off(event, listener) {}
    once(event, listener) {}
    emit(event, ...args) {}
  }
tests:
  - name: on and emit call listeners in order with arguments
    code: |
      const e = new EventEmitter()
      const calls = []
      e.on('save', (a, b) => calls.push(['first', a, b]))
      e.on('save', (a) => calls.push(['second', a]))
      e.emit('save', 1, 2)
      assert.deepEqual(calls, [['first', 1, 2], ['second', 1]])
  - name: emit returns whether any listener was called
    code: |
      const e = new EventEmitter()
      assert.equal(e.emit('nothing'), false)
      e.on('x', () => {})
      assert.equal(e.emit('x'), true)
  - name: off removes a listener and on returns an unsubscribe function
    code: |
      const e = new EventEmitter()
      let a = 0, b = 0
      const la = () => a++
      e.on('tick', la)
      const unsubscribe = e.on('tick', () => b++)
      e.off('tick', la)
      unsubscribe()
      e.emit('tick')
      assert.equal(a, 0)
      assert.equal(b, 0)
  - name: once listeners run only once
    code: |
      const e = new EventEmitter()
      let n = 0
      e.once('ready', () => n++)
      e.emit('ready'); e.emit('ready')
      assert.equal(n, 1)
  - name: a once listener can be removed with off before it fires
    code: |
      const e = new EventEmitter()
      let n = 0
      const listener = () => n++
      e.once('ready', listener)
      e.off('ready', listener)
      e.emit('ready')
      assert.equal(n, 0)
  - name: removing a listener during emit does not skip the others
    code: |
      const e = new EventEmitter()
      const calls = []
      const first = () => { calls.push('first'); e.off('x', first) }
      e.on('x', first)
      e.on('x', () => calls.push('second'))
      e.emit('x')
      assert.deepEqual(calls, ['first', 'second'])
naiveSolution: |
  class EventEmitter {
    constructor() { this.events = {} }
    on(event, listener) {
      (this.events[event] ??= []).push(listener)
      return () => this.off(event, listener)
    }
    off(event, listener) {
      const list = this.events[event] ?? []
      const i = list.indexOf(listener)
      if (i !== -1) list.splice(i, 1)
    }
    once(event, listener) { this.on(event, listener) }
    emit(event, ...args) {
      const list = this.events[event] ?? []
      list.forEach((l) => l(...args))
      return list.length > 0
    }
  }
---

## Problem

Implement a class `EventEmitter` with:

- `on(event, listener)` — subscribe; returns an unsubscribe function;
- `off(event, listener)` — unsubscribe (also works for listeners added with `once`);
- `once(event, listener)` — subscribe for one call only;
- `emit(event, ...args)` — call listeners in subscription order; return `true` if any were called.

## Constraints

Listeners removed or added while an event is being emitted must not break the current emit.

## Examples

```js
const bus = new EventEmitter()
const stop = bus.on('message', (text) => console.log(text))
bus.emit('message', 'hi') // logs "hi", returns true
stop()
```

## Solution

```js
class EventEmitter {
  #listeners = new Map()

  on(event, listener) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, [])
    this.#listeners.get(event).push({ listener, fn: listener })
    return () => this.off(event, listener)
  }

  once(event, listener) {
    const fn = (...args) => {
      this.off(event, listener)
      listener.apply(this, args)
    }
    if (!this.#listeners.has(event)) this.#listeners.set(event, [])
    this.#listeners.get(event).push({ listener, fn })
    return () => this.off(event, listener)
  }

  off(event, listener) {
    const list = this.#listeners.get(event)
    if (!list) return
    const index = list.findIndex((entry) => entry.listener === listener)
    if (index !== -1) list.splice(index, 1)
    if (list.length === 0) this.#listeners.delete(event)
  }

  emit(event, ...args) {
    const list = this.#listeners.get(event)
    if (!list || list.length === 0) return false
    for (const { fn } of [...list]) fn.apply(this, args) // copy: listeners may unsubscribe while we iterate
    return true
  }
}
```

## Explanation

Each entry keeps the original `listener` (for `off`) and the function to call (`fn`, a self-removing
wrapper for `once`). `emit` iterates over a **copy** of the list, so a listener that removes itself or
another listener does not shift the array under the loop. Deleting empty lists keeps the map from
growing with dead event names.

## Complexity

`on`/`emit` are O(1)/O(k) for k listeners; `off` is O(k).

## Common mistakes

- Treating `once` like `on` (the naive version).
- Wrapping once-listeners without remembering the original function, so `off(event, listener)`
  cannot find them.
- Iterating the live array while listeners splice it, which skips the next listener.
