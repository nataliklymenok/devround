---
id: react-concurrent-rendering
module: react-advanced
order: 3
title: Concurrent rendering, transitions and batching
description: How React prioritizes updates, useTransition and useDeferredValue, and automatic batching.
levels: [middle, senior]
estimatedMinutes: 20
topics: [react-concurrent]
reviewed: 2026-11-20
references:
  - { title: 'React — useTransition', url: 'https://react.dev/reference/react/useTransition' }
  - { title: 'React — useDeferredValue', url: 'https://react.dev/reference/react/useDeferredValue' }
  - { title: 'React — Queueing a Series of State Updates', url: 'https://react.dev/learn/queueing-a-series-of-state-updates' }
keyTakeaways:
  - Concurrent rendering lets React prepare a new UI in the background and interrupt it for urgent updates like typing.
  - Updates inside startTransition are non-urgent and can be interrupted; isPending lets you show feedback.
  - useDeferredValue gives a lagging copy of a value for rendering expensive parts.
  - Since React 18 state updates are batched everywhere — in promises, timeouts and native handlers too.
interviewQuestions:
  - question: What is the difference between useTransition and useDeferredValue?
    answer: |
      `useTransition` marks the state update you trigger as non-urgent: you wrap the setter in
      `startTransition`, and get `isPending`. `useDeferredValue` is for when you do not control the
      update (e.g. a prop): it returns a version of the value that lags behind during heavy renders.
      Both keep inputs responsive; neither makes the expensive render faster — they change priority.
  - question: What is automatic batching?
    answer: |
      React groups multiple state updates into a single re-render. Before React 18 this happened only
      inside React event handlers; now it also applies inside promises, `setTimeout` and native event
      handlers. `flushSync` forces an immediate render when you really need the DOM updated right away
      (e.g. before measuring or scrolling).
  - question: Can a transition be used for controlled input values?
    answer: |
      No — updates to the input's own value must be urgent, or typing will lag and the cursor may jump.
      Keep the input's state urgent and put the expensive derived update (filtering a big list,
      switching a tab's content) in a transition or render it from a deferred value.
quiz:
  - id: q1
    question: You filter 10,000 rows as the user types. What keeps typing responsive?
    options: ["useLayoutEffect", "Rendering the list from useDeferredValue(query)", "Putting the input value in a transition", "flushSync"]
    correct: 1
    explanation: The input stays urgent; the expensive list renders with a lagging value.
  - id: q2
    question: How many re-renders do two setState calls inside a setTimeout cause in React 18+?
    options: ["Two", "One — they are batched", "Zero", "Depends on StrictMode"]
    correct: 1
    explanation: Automatic batching applies to timeouts and promises too.
  - id: q3
    question: What does isPending from useTransition tell you?
    options: ["That a fetch is in flight", "That the transition's render has not committed yet", "That the component unmounted", "That an error happened"]
    correct: 1
    explanation: Use it to show a subtle loading indicator while the non-urgent render runs.
---

## Urgent vs non-urgent updates

```jsx
function TabSwitcher() {
  const [tab, setTab] = useState('about')
  const [isPending, startTransition] = useTransition()

  function selectTab(next) {
    startTransition(() => setTab(next)) // can be interrupted by more urgent updates
  }

  return (
    <>
      <TabButtons onSelect={selectTab} />
      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        {tab === 'posts' ? <SlowPosts /> : <About />}
      </div>
    </>
  )
}
```

## useDeferredValue

```jsx
function Search() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const isStale = query !== deferredQuery

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <SlowResults query={deferredQuery} />
      </div>
    </>
  )
}
```

`SlowResults` should be wrapped in `memo` so it only re-renders when the deferred value changes.

## Batching

```jsx
setTimeout(() => {
  setCount((c) => c + 1)
  setFlag((f) => !f)
  // one render, not two (React 18+)
})

import { flushSync } from 'react-dom'
flushSync(() => setItems(next)) // DOM updated synchronously
listRef.current.lastChild.scrollIntoView()
```
