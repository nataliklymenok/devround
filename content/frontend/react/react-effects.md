---
id: react-effects
module: react-hooks
order: 2
title: useEffect done right
description: What effects are for, dependency arrays, cleanup, race conditions and when you do not need an effect.
levels: [junior, middle, senior]
estimatedMinutes: 30
reviewed: 2026-11-20
keyTakeaways:
  - Effects synchronize a component with an external system — network, subscriptions, timers, the DOM.
  - Every reactive value used inside an effect belongs in the dependency array.
  - Return a cleanup function to undo the effect; React runs it before the next run and on unmount.
  - Many effects are unnecessary — derive data during render and handle user actions in event handlers.
interviewQuestions:
  - question: What does the dependency array do?
    answer: |
      It tells React when to re-run the effect: after the first commit and whenever one of the listed
      values changed (compared with `Object.is`). An empty array runs it once after mount; no array
      runs it after every commit. Leaving out values that the effect uses leads to stale data — the
      lint rule `react-hooks/exhaustive-deps` catches it.
  - question: Why does an effect run twice in development?
    answer: |
      In Strict Mode React mounts, unmounts and re-mounts components once in development to surface
      effects without proper cleanup. If your effect breaks when run twice (duplicate subscriptions,
      double requests that conflict), it is missing a cleanup.
  - question: How do you avoid race conditions when fetching in an effect?
    answer: |
      Ignore or abort stale requests in the cleanup: set an `ignore` flag or call
      `controller.abort()` so a slow response for an old id cannot overwrite the newer one. In real
      apps a data library (TanStack Query, SWR, a framework loader) handles caching, deduplication
      and races for you.
  - question: Give examples of effects you do not need.
    answer: |
      Transforming data for rendering (compute it during render, `useMemo` if expensive), resetting
      state when a prop changes (use a `key`), reacting to a user action such as submitting a form
      (do it in the event handler), and syncing two pieces of state that can be derived from each
      other.
quiz:
  - id: q1
    question: "useEffect(fn, []) runs…"
    options: ["On every render", "Once after the first commit (plus the dev double-run)", "Never", "Before the first render"]
    correct: 1
    explanation: An empty dependency array means no reactive dependencies — it runs after mount only.
  - id: q2
    question: When does React call an effect's cleanup function?
    options: ["Only on unmount", "Before re-running the effect and on unmount", "After every render", "Never automatically"]
    correct: 1
    explanation: Cleanup runs before the next execution and when the component unmounts.
  - id: q3
    question: You need to send analytics when the user clicks Buy. Where should the code go?
    options: ["In a useEffect watching a clicked state", "In the click event handler", "In useMemo", "In the component body"]
    correct: 1
    explanation: Code caused by a specific user action belongs in its event handler.
  - id: q4
    question: The user switches profiles quickly and sees the wrong profile. What fixes it?
    options: ["Removing the dependency array", "Aborting or ignoring stale requests in cleanup", "Adding a setTimeout", "Using useLayoutEffect"]
    correct: 1
    explanation: Older responses can arrive last; cleanup must cancel or ignore them.
topics: [react-effects]
references:
  - { title: 'React — Synchronizing with Effects', url: 'https://react.dev/learn/synchronizing-with-effects' }
  - { title: 'React — You Might Not Need an Effect', url: 'https://react.dev/learn/you-might-not-need-an-effect' }
---

## What effects are for

Effects let a component stay in sync with something **outside React**: a network request, a
subscription, a timer, a non-React widget, `document.title`.

```jsx
useEffect(() => {
  document.title = `${unread} unread messages`
}, [unread])
```

## Dependencies and cleanup

```jsx
function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(roomId)
    connection.connect()
    return () => connection.disconnect() // runs before reconnecting and on unmount
  }, [roomId])
}
```

## Fetching without race conditions

```jsx
useEffect(() => {
  const controller = new AbortController()

  fetch(`/api/profiles/${userId}`, { signal: controller.signal })
    .then((res) => res.json())
    .then(setProfile)
    .catch((error) => {
      if (error.name !== 'AbortError') setError(error)
    })

  return () => controller.abort() // a stale response can never win
}, [userId])
```

## You might not need an effect

```jsx
// ❌ derived state via effect: an extra render and a sync bug waiting to happen
const [total, setTotal] = useState(0)
useEffect(() => setTotal(items.reduce((s, i) => s + i.price, 0)), [items])

// ✅ compute during render
const total2 = items.reduce((s, i) => s + i.price, 0)

// ❌ effect reacting to a flag set by a click
useEffect(() => {
  if (submitted) post('/api/order', order)
}, [submitted])

// ✅ do it in the handler
function handleSubmit() {
  post('/api/order', order)
}
```

## Senior angle: stale closures

An effect sees the props and state of the render it was created in. A timer or subscription set up
once (`[]`) and reading `count` will always see the initial value. Either list the dependency (and
re-subscribe), use the updater form `setCount((c) => c + 1)`, or keep the latest value in a ref.
