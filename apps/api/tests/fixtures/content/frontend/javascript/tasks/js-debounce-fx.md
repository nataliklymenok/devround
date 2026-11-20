---
id: js-debounce-fx
order: 2
title: Implement debounce
levels: [middle, senior]
difficulty: medium
estimatedMinutes: 20
mode: tests
topics: [t-js-scope]
reviewed: 2026-11-18
references:
  - { title: MDN, url: 'https://developer.mozilla.org/' }
hints:
  - Keep the timer id in a closure.
  - Clear the previous timer on every call.
entry: debounce
starterCode: |
  function debounce(fn, wait) {
    // your code
  }
tests:
  - name: calls once after the wait
    code: |
      const calls = []
      const d = debounce((x) => calls.push(x), 100)
      d(1); d(2); d(3)
      clock.tick(99)
      assert.deepEqual(calls, [])
      clock.tick(1)
      assert.deepEqual(calls, [3])
  - name: restarts the wait on each call
    code: |
      let n = 0
      const d = debounce(() => n++, 50)
      d(); clock.tick(40); d(); clock.tick(40)
      assert.equal(n, 0)
      clock.tick(10)
      assert.equal(n, 1)
  - name: passes the latest arguments
    code: |
      let last
      const d = debounce((a, b) => (last = [a, b]), 10)
      d(1, 2); d(3, 4)
      clock.tick(10)
      assert.deepEqual(last, [3, 4])
  - name: separate bursts call separately
    code: |
      let n = 0
      const d = debounce(() => n++, 10)
      d(); clock.tick(10); d(); clock.tick(10)
      assert.equal(n, 2)
  - name: preserves this
    code: |
      const obj = { v: 7, got: null, run: null }
      obj.run = debounce(function () { obj.got = this.v }, 5)
      obj.run()
      clock.tick(5)
      assert.equal(obj.got, 7)
naiveSolution: |
  function debounce(fn, wait) {
    return (...args) => setTimeout(() => fn(...args), wait)
  }
---

## Problem

Return a debounced version of `fn` that waits `wait` ms after the last call.

## Constraints

Preserve arguments and `this`.

## Examples

Three quick calls result in one call with the last arguments.

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

The closure keeps the pending timer so each call can cancel it.

## Complexity

O(1) per call.

## Common mistakes

Forgetting to clear the previous timer, or losing `this` with an arrow function wrapper.
