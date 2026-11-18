---
id: js-sum-array
order: 1
title: Sum an array
levels: [junior, middle]
difficulty: easy
estimatedMinutes: 5
mode: tests
topics: [t-js-values]
references:
  - { title: MDN, url: 'https://developer.mozilla.org/' }
hints:
  - Start the accumulator at 0.
entry: sumArray
starterCode: |
  function sumArray(numbers) {
    // your code
  }
tests:
  - name: sums positive numbers
    code: assert.equal(sumArray([1, 2, 3]), 6)
  - name: handles negatives
    code: assert.equal(sumArray([-1, 1]), 0)
  - name: returns 0 for an empty array
    code: assert.equal(sumArray([]), 0)
  - name: single element
    code: assert.equal(sumArray([5]), 5)
  - name: does not mutate the input
    code: |
      const input = [1, 2]
      sumArray(input)
      assert.deepEqual(input, [1, 2])
naiveSolution: |
  function sumArray(numbers) {
    return numbers.reduce((a, b) => a + b)
  }
---

## Problem

Return the sum of all numbers in the array.

## Constraints

The array may be empty.

## Examples

`sumArray([1, 2, 3])` returns `6`.

## Solution

```js
function sumArray(numbers) {
  return numbers.reduce((sum, n) => sum + n, 0)
}
```

## Explanation

Pass an initial value so `reduce` works on empty arrays.

## Complexity

O(n) time, O(1) extra space.

## Common mistakes

Calling `reduce` without an initial value throws on an empty array.
