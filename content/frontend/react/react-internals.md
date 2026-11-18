---
id: react-internals
module: react-advanced
order: 4
title: Virtual DOM, Fiber and reconciliation internals
description: What the virtual DOM really is, how Fiber splits rendering into units of work, and the render and commit phases.
levels: [middle, senior]
estimatedMinutes: 20
topics: [react-internals]
references:
  - { title: 'React — Render and Commit', url: 'https://react.dev/learn/render-and-commit' }
  - { title: 'React — Preserving and Resetting State', url: 'https://react.dev/learn/preserving-and-resetting-state' }
keyTakeaways:
  - The "virtual DOM" is the tree of React elements; React diffs trees and applies minimal DOM changes.
  - Fiber is React's internal data structure — one unit of work per component — that makes rendering interruptible.
  - The render phase is pure and may be paused or discarded; the commit phase applies changes and runs effects synchronously.
  - The diffing heuristics compare type and key at each position — that is why keys and stable component types matter.
interviewQuestions:
  - question: Is the virtual DOM what makes React fast?
    answer: |
      Not by itself — diffing has a cost too. The virtual DOM (the element tree) lets React compute the
      minimal set of DOM operations declaratively and batch them, which is usually fast enough and much
      easier to reason about than manual DOM updates. Real performance comes from avoiding unnecessary
      work: fewer re-renders, stable keys, memoization where it matters.
  - question: What is React Fiber?
    answer: |
      Fiber is the reconciler rewrite introduced in React 16. Each component instance is represented by
      a fiber node with links to its child, sibling and parent. Work is processed one fiber at a time,
      so React can pause, resume, prioritize or abandon rendering — the foundation for concurrent
      features like transitions and Suspense. React keeps a current tree and a work-in-progress tree
      and swaps them on commit.
  - question: What happens in the render and commit phases?
    answer: |
      Render: React calls components, diffs the new elements against the current fibers, and builds the
      work-in-progress tree with a list of changes. It must be side-effect free because it can run more
      than once. Commit: React applies DOM mutations, attaches refs, runs layout effects synchronously,
      then schedules passive effects (`useEffect`). Commit cannot be interrupted.
quiz:
  - id: q1
    question: Which phase can React pause or throw away?
    options: ["Commit", "Render", "Both", "Neither"]
    correct: 1
    explanation: Only the render phase is interruptible.
  - id: q2
    question: When do useLayoutEffect callbacks run?
    options: ["During render", "Synchronously after DOM mutations, before paint", "After paint, asynchronously", "Only on the server"]
    correct: 1
    explanation: Layout effects run in the commit phase before the browser paints.
  - id: q3
    question: Two siblings swap places without keys. What does React do?
    options: ["Moves the DOM nodes", "Compares by position and updates the props in place", "Throws an error", "Unmounts both"]
    correct: 1
    explanation: Without keys, React matches children by index.
---

## Elements and the "virtual DOM"

```js
// JSX produces plain objects
{ type: 'button', props: { className: 'primary', children: 'Save' }, key: null }
```

React compares the new tree with the previous one and turns differences into DOM operations.

## Fiber in one picture

```text
App ─child→ Header ─sibling→ Main ─sibling→ Footer
              │                │
            child            child
              ↓                ↓
            Logo             List ─child→ Item ─sibling→ Item
```

Each node is a fiber holding the component type, props, state (hooks list), and flags describing
what must change. React walks this structure in small steps and can yield to the browser between
them.

## Phases

```text
Render (interruptible, pure)  →  Commit (synchronous)
  call components                  apply DOM mutations
  diff children                    attach refs
  mark changes                     run useLayoutEffect
                                   paint
                                   run useEffect (after paint)
```

## Diffing heuristics

1. Different element type at the same position → destroy the subtree and build a new one.
2. Same type → keep the instance (DOM node or component state) and update props.
3. Children lists are matched by `key`, falling back to index.
