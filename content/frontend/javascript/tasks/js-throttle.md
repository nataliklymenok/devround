---
id: js-throttle
order: 2
title: Implement throttle (leading and trailing)
levels: [middle, senior]
difficulty: medium
estimatedMinutes: 25
mode: tests
topics: [js-timers-abort, js-closures]
reviewed: 2026-11-20
references:
  - { title: 'MDN — Date.now()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now' }
  - { title: 'MDN — setTimeout()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout' }
hints:
  - Remember when fn last ran (Date.now()) and compute how much of the wait window is left.
  - If the window has passed, call fn immediately; otherwise remember the latest arguments and schedule one trailing call for when the window ends.
  - Only schedule a trailing timer if none is pending, and clear it when you call fn immediately.
entry: throttle
starterCode: |
  function throttle(fn, wait) {
    // your code
  }
tests:
  - name: the first call runs immediately
    code: |
      const calls = []
      const t = throttle((x) => calls.push(x), 100)
      t(1)
      assert.deepEqual(calls, [1])
  - name: calls inside the window collapse into one trailing call with the last arguments
    code: |
      const calls = []
      const t = throttle((x) => calls.push(x), 100)
      t(1); clock.tick(10); t(2); clock.tick(10); t(3)
      assert.deepEqual(calls, [1])
      clock.tick(80)
      assert.deepEqual(calls, [1, 3])
  - name: no trailing call when there was only one call
    code: |
      let n = 0
      const t = throttle(() => n++, 50)
      t()
      clock.tick(200)
      assert.equal(n, 1)
  - name: calls spaced further apart than wait all run immediately
    code: |
      const calls = []
      const t = throttle((x) => calls.push(x), 50)
      t('a'); clock.tick(60); t('b'); clock.tick(60); t('c')
      assert.deepEqual(calls, ['a', 'b', 'c'])
  - name: runs at most once per window during a long burst
    code: |
      let n = 0
      const t = throttle(() => n++, 100)
      for (let i = 0; i < 50; i++) { t(); clock.tick(10) } // 500 ms of calls every 10 ms
      clock.tick(100)
      assert.ok(n >= 5 && n <= 6, 'expected 5 or 6 calls, got ' + n)
  - name: preserves this for the trailing call
    code: |
      const obj = { v: 42, seen: [] }
      obj.run = throttle(function () { obj.seen.push(this.v) }, 20)
      obj.run(); obj.run()
      clock.tick(20)
      assert.deepEqual(obj.seen, [42, 42])
naiveSolution: |
  function throttle(fn, wait) {
    let last = -Infinity
    return function (...args) {
      if (Date.now() - last >= wait) {
        last = Date.now()
        fn.apply(this, args)
      }
    }
  }
---

## Problem

Implement `throttle(fn, wait)` with **leading and trailing** behaviour:

- the first call runs `fn` immediately;
- further calls within `wait` ms are not run immediately — instead, one trailing call runs at the end
  of the window with the **latest** arguments;
- `fn` never runs more than once per `wait` ms.

## Constraints

- Use `Date.now()` and `setTimeout` (the tests use a fake clock starting at 0).
- Preserve `this` and arguments.

## Examples

```js
const onScroll = throttle(updatePosition, 100)
// scroll events every 10 ms for 1 s → updatePosition runs about every 100 ms,
// including once after the last event
```

## Solution

```js
function throttle(fn, wait) {
  let lastCall = -Infinity
  let timer = null
  let pendingArgs = null
  let pendingThis = null

  function invoke(context, args) {
    lastCall = Date.now()
    fn.apply(context, args)
  }

  return function (...args) {
    const remaining = wait - (Date.now() - lastCall)
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      invoke(this, args)
    } else {
      pendingArgs = args
      pendingThis = this
      if (!timer) {
        timer = setTimeout(() => {
          timer = null
          invoke(pendingThis, pendingArgs)
          pendingArgs = null
        }, remaining)
      }
    }
  }
}
```

## Explanation

We track when `fn` last ran. If the whole window has passed, we run immediately (leading edge). If
not, we store the newest arguments and make sure exactly one timer is scheduled for the end of the
window (trailing edge). When the timer fires it runs `fn` with whatever arguments arrived last.
`lastCall` starts at `-Infinity` so the very first call always runs.

## Complexity

O(1) per call.

## Common mistakes

- Dropping the trailing call (the naive version) — the final scroll or resize position is lost.
- Scheduling a new timer on every call, which turns throttle into debounce.
- Starting `lastCall` at 0, which breaks the first call when the clock also starts at 0.
