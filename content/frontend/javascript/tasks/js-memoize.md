---
id: js-memoize
order: 7
title: Implement memoize
levels: [junior, middle, senior]
difficulty: easy
estimatedMinutes: 15
mode: tests
topics: [js-closures, js-collections-gc]
references:
  - { title: 'MDN — Map', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map' }
  - { title: 'MDN — Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures' }
hints:
  - Keep a Map in a closure; the key is the first argument by default.
  - Accept an optional resolver(...args) that computes the cache key.
  - Use map.has(key) rather than checking the cached value, so results like undefined or 0 are cached too.
entry: memoize
starterCode: |
  function memoize(fn, resolver) {
    // your code
  }
tests:
  - name: calls fn once per distinct key
    code: |
      let calls = 0
      const square = memoize((n) => { calls++; return n * n })
      assert.equal(square(3), 9)
      assert.equal(square(3), 9)
      assert.equal(calls, 1)
  - name: caches several keys at once
    code: |
      let calls = 0
      const double = memoize((n) => { calls++; return n * 2 })
      double(1); double(2); double(1); double(2)
      assert.equal(calls, 2)
  - name: uses the resolver to build keys
    code: |
      let calls = 0
      const add = memoize((a, b) => { calls++; return a + b }, (a, b) => a + ',' + b)
      add(1, 2); add(1, 2); add(2, 1)
      assert.equal(calls, 2)
  - name: caches falsy results
    code: |
      let calls = 0
      const nothing = memoize(() => { calls++; return undefined })
      nothing('x'); nothing('x')
      assert.equal(calls, 1)
  - name: forwards all arguments and this
    code: |
      const obj = { factor: 10 }
      obj.scale = memoize(function (n, extra) { return n * this.factor + extra })
      assert.equal(obj.scale(2, 1), 21)
naiveSolution: |
  function memoize(fn, resolver) {
    let lastKey, lastValue
    return function (...args) {
      const key = resolver ? resolver(...args) : args[0]
      if (key === lastKey) return lastValue
      lastKey = key
      lastValue = fn.apply(this, args)
      return lastValue
    }
  }
---

## Problem

Implement `memoize(fn, resolver?)` that caches results. By default the cache key is the first
argument; if `resolver` is given, the key is `resolver(...args)`.

## Constraints

- Results such as `undefined`, `0` or `false` must be cached as well.
- Forward all arguments and `this` to `fn`.

## Examples

```js
const fib = memoize((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2)))
fib(50) // fast
```

## Solution

```js
function memoize(fn, resolver) {
  const cache = new Map()
  return function (...args) {
    const key = resolver ? resolver.apply(this, args) : args[0]
    if (cache.has(key)) return cache.get(key)
    const result = fn.apply(this, args)
    cache.set(key, result)
    return result
  }
}
```

## Explanation

The `Map` lives in the closure, so every call to the memoized function shares it. A `Map` (unlike a
plain object) keeps keys of any type without string coercion. Checking `cache.has` instead of the
value means falsy results are still treated as cached.

## Complexity

O(1) average per lookup; memory grows with the number of distinct keys.

## Common mistakes

- Caching only the last call (the naive version) — alternating arguments recompute every time.
- `if (cache.get(key))`, which recomputes falsy results.
- Using `JSON.stringify(args)` blindly: slow, and fails for functions, cycles and key order.
- Interview follow-up: bound the cache (LRU) or use a `WeakMap` for object keys.
