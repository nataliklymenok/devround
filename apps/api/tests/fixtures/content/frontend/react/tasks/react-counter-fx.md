---
id: react-counter-fx
order: 1
title: Build a counter component
levels: [junior, middle]
difficulty: easy
estimatedMinutes: 15
mode: self-check
topics: [t-react-state]
reviewed: 2026-11-18
references:
  - { title: MDN, url: 'https://developer.mozilla.org/' }
hints:
  - Use the updater form of setState.
starterCode: |
  export function Counter() {
    return null
  }
acceptanceCriteria:
  - Shows the current count starting at 0
  - Increment and decrement buttons work
  - Buttons have accessible names
---

## Problem

Build a counter with increment and decrement buttons.

## Constraints

Use function components and hooks.

## Examples

Clicking increment twice shows 2.

## Solution

```jsx
export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>
}
```

## Explanation

State lives in the component; the updater form avoids stale values.

## Common mistakes

Mutating state or reading a stale value in quick successive updates.
