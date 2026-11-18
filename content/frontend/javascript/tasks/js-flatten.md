---
id: js-flatten
order: 8
title: Flatten a nested array
levels: [junior, middle]
difficulty: easy
estimatedMinutes: 15
mode: tests
topics: [js-arrays-immutability]
references:
  - { title: 'MDN — Array.prototype.flat()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat' }
hints:
  - Walk the array; when an item is an array and depth > 0, flatten it with depth - 1.
  - Use Array.isArray to detect arrays.
  - Build a new result array — do not modify the input.
entry: flatten
starterCode: |
  function flatten(array, depth = Infinity) {
    // your code
  }
tests:
  - name: flattens deeply nested arrays by default
    code: |
      assert.deepEqual(flatten([1, [2, [3, [4]], 5]]), [1, 2, 3, 4, 5])
  - name: respects the depth argument
    code: |
      assert.deepEqual(flatten([1, [2, [3, [4]]]], 1), [1, 2, [3, [4]]])
      assert.deepEqual(flatten([1, [2, [3]]], 0), [1, [2, [3]]])
  - name: handles empty arrays
    code: |
      assert.deepEqual(flatten([]), [])
      assert.deepEqual(flatten([[], [[]]]), [])
  - name: does not mutate the input
    code: |
      const input = [1, [2, [3]]]
      flatten(input)
      assert.deepEqual(input, [1, [2, [3]]])
  - name: keeps non-array objects as items
    code: |
      const obj = { a: [1] }
      assert.deepEqual(flatten([obj, ['x']]), [obj, 'x'])
naiveSolution: |
  function flatten(array, depth = Infinity) {
    return [].concat(...array)
  }
---

## Problem

Implement `flatten(array, depth = Infinity)` that returns a new array with sub-arrays concatenated up
to `depth` levels, like `Array.prototype.flat`.

## Constraints

Do not use `flat` or `flatMap`.

## Examples

```js
flatten([1, [2, [3]]]) // [1, 2, 3]
flatten([1, [2, [3]]], 1) // [1, 2, [3]]
```

## Solution

```js
function flatten(array, depth = Infinity) {
  const result = []
  for (const item of array) {
    if (Array.isArray(item) && depth > 0) result.push(...flatten(item, depth - 1))
    else result.push(item)
  }
  return result
}
```

## Explanation

Recursion mirrors the nesting: each level decreases `depth`, and arrays at depth 0 are kept as they
are. A fresh `result` array keeps the input untouched.

## Complexity

O(n) for n total elements (plus recursion depth on the stack).

## Common mistakes

- Flattening only one level (the naive version).
- Ignoring `depth`.
- Very deep nesting can overflow the stack — an iterative version with an explicit stack avoids it
  (a common follow-up).
