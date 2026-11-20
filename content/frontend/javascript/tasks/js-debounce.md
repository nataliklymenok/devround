---
id: js-debounce
order: 1
title: Implement debounce
levels: [junior, middle, senior]
difficulty: medium
estimatedMinutes: 20
mode: tests
topics: [js-timers-abort, js-closures]
reviewed: 2026-11-20
references:
  - { title: 'MDN — setTimeout()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout' }
  - { title: 'MDN — Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures' }
hints:
  - Keep the id of the pending timer in a variable shared by all calls (a closure).
  - Every call should cancel the previous timer and start a new one.
  - Return a regular function (not an arrow function) so you can forward `this`.
entry: debounce
starterCode: |
  function debounce(fn, wait) {
    // your code
  }
tests:
  - name: calls fn once after the wait with the last arguments
    code: |
      const calls = []
      const d = debounce((x) => calls.push(x), 100)
      d(1); d(2); d(3)
      clock.tick(99)
      assert.deepEqual(calls, [])
      clock.tick(1)
      assert.deepEqual(calls, [3])
  - name: restarts the wait on every call
    code: |
      let n = 0
      const d = debounce(() => n++, 50)
      d(); clock.tick(40); d(); clock.tick(40)
      assert.equal(n, 0)
      clock.tick(10)
      assert.equal(n, 1)
  - name: separate bursts produce separate calls
    code: |
      let n = 0
      const d = debounce(() => n++, 10)
      d(); clock.tick(10)
      d(); clock.tick(10)
      assert.equal(n, 2)
  - name: forwards all arguments
    code: |
      let got
      const d = debounce((...args) => (got = args), 5)
      d(1, 'a', true)
      clock.tick(5)
      assert.deepEqual(got, [1, 'a', true])
  - name: preserves this
    code: |
      const counter = { value: 1, seen: null }
      counter.log = debounce(function () { counter.seen = this.value }, 5)
      counter.log()
      clock.tick(5)
      assert.equal(counter.seen, 1)
  - name: does not call fn when never invoked
    code: |
      let n = 0
      debounce(() => n++, 5)
      clock.tick(100)
      assert.equal(n, 0)
naiveSolution: |
  function debounce(fn, wait) {
    return (...args) => setTimeout(() => fn(...args), wait)
  }
---

## Problem

Implement `debounce(fn, wait)`. It returns a new function that delays calling `fn` until `wait`
milliseconds have passed since the **last** call. Only the last call in a burst runs `fn`, with that
call's arguments and `this`.

## Constraints

- Use `setTimeout` / `clearTimeout` (the tests control time with a fake clock).
- Do not use libraries.

## Examples

```js
const save = debounce((text) => api.save(text), 300)
save('a'); save('ab'); save('abc')
// 300 ms after the last call: api.save('abc') — once
```

## Solution

```js
function debounce(fn, wait) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}
```

## Explanation

The returned function closes over `timer`, so every call can cancel the timer scheduled by the
previous call before scheduling a new one. Only when calls stop for `wait` ms does a timer survive
and call `fn`. Using a regular `function` lets us capture the call's `this`, and the arrow function
inside `setTimeout` keeps it; `apply` forwards both `this` and the arguments.

## Complexity

O(1) time and memory per call.

## Common mistakes

- Not clearing the previous timer, so every call eventually runs `fn` (that is what the naive
  version does).
- Returning an arrow function and losing `this`.
- Creating the `timer` variable inside the returned function, so it is new on every call.
- Interview follow-ups: add `cancel()` / `flush()` methods, or a `leading` option.
