---
id: js-curry
order: 9
title: Implement curry
levels: [middle, senior]
difficulty: medium
estimatedMinutes: 20
mode: tests
topics: [js-closures]
references:
  - { title: 'MDN — Function: length', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length' }
hints:
  - fn.length tells you how many arguments fn expects.
  - Return a function that collects arguments; when it has at least fn.length, call fn.
  - Otherwise return another function that remembers the arguments collected so far.
entry: curry
starterCode: |
  function curry(fn) {
    // your code
  }
tests:
  - name: supports one argument at a time
    code: |
      const add3 = curry((a, b, c) => a + b + c)
      assert.equal(add3(1)(2)(3), 6)
  - name: supports several arguments at once
    code: |
      const add3 = curry((a, b, c) => a + b + c)
      assert.equal(add3(1, 2)(3), 6)
      assert.equal(add3(1)(2, 3), 6)
      assert.equal(add3(1, 2, 3), 6)
  - name: partially applied functions are reusable
    code: |
      const add3 = curry((a, b, c) => a + b + c)
      const add1 = add3(1)
      assert.equal(add1(2)(3), 6)
      assert.equal(add1(10)(20), 31)
  - name: works for functions of one argument
    code: |
      const inc = curry((n) => n + 1)
      assert.equal(inc(1), 2)
  - name: preserves this
    code: |
      const obj = { base: 100 }
      obj.sum = curry(function (a, b) { return this.base + a + b })
      assert.equal(obj.sum(1, 2), 103)
naiveSolution: |
  function curry(fn) {
    return function curried(a) {
      return function (b) {
        return function (c) {
          return fn(a, b, c)
        }
      }
    }
  }
---

## Problem

Implement `curry(fn)`. The curried function keeps collecting arguments — one or several per call —
until it has received `fn.length` arguments, then calls `fn` with all of them.

## Constraints

Each partially applied function must be reusable (calling it twice must not share collected
arguments).

## Examples

```js
const volume = curry((l, w, h) => l * w * h)
volume(2)(3)(4) // 24
volume(2, 3)(4) // 24
```

## Solution

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args)
    return function (...next) {
      return curried.apply(this, [...args, ...next])
    }
  }
}
```

## Explanation

`curried` checks whether enough arguments have arrived. If not, it returns a new function that
concatenates the previous arguments with the new ones and tries again. Because each step creates a
new array (`[...args, ...next]`), branches like `add1(2)` and `add1(10)` do not interfere.

## Complexity

O(k) per call to copy the collected arguments.

## Common mistakes

- Supporting exactly one argument per call (the naive version).
- Mutating a shared arguments array, so reused partial functions leak arguments into each other.
- Note: `fn.length` ignores default and rest parameters — curried functions should declare plain
  parameters.
