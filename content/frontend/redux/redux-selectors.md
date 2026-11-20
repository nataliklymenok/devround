---
id: redux-selectors
module: state-advanced
order: 2
title: Selectors, memoization and normalized state
description: How useSelector decides to re-render, memoized selectors with createSelector, and normalizing collections with createEntityAdapter.
levels: [middle, senior]
estimatedMinutes: 25
topics: [redux-selectors]
reviewed: 2026-11-20
references:
  - { title: 'Redux — Deriving Data with Selectors', url: 'https://redux.js.org/usage/deriving-data-selectors' }
  - { title: 'Redux — Normalizing State Shape', url: 'https://redux.js.org/usage/structuring-reducers/normalizing-state-shape' }
  - { title: 'Redux Toolkit — createEntityAdapter', url: 'https://redux-toolkit.js.org/api/createEntityAdapter' }
keyTakeaways:
  - useSelector re-runs after every dispatch and re-renders when the result changes by reference (===).
  - Selectors that return new arrays or objects each time cause re-renders — memoize them with createSelector.
  - Keep the minimal state in the store and derive everything else in selectors.
  - Normalized state (ids + entities) avoids duplication and makes updates O(1); createEntityAdapter generates the boilerplate.
interviewQuestions:
  - question: Why does a component re-render on every action even though nothing it shows changed?
    answer: |
      Its selector probably returns a new reference each time — e.g.
      `useSelector(s => s.todos.filter(t => t.done))` creates a new array on every call, which is never
      `===` to the previous one. Memoize the selector with `createSelector`, select primitive values,
      or pass `shallowEqual` as the equality function when returning a small object.
  - question: What does createSelector do?
    answer: |
      It builds a memoized selector from input selectors and a result function. The result function
      runs only when an input changes by reference; otherwise the previous result is returned, keeping
      the same reference. Selectors with arguments need care (one selector instance per component, or
      a cache size greater than one) so different arguments do not evict each other.
  - question: What is normalized state and why use it?
    answer: |
      Storing each entity type like a database table: `{ ids: ['a', 'b'], entities: { a: {...},
      b: {...} } }`, with references by id instead of nested copies. Updates touch one place, lookups
      are O(1), and memoized selectors stay stable. `createEntityAdapter` provides reducers
      (`addOne`, `upsertMany`, `removeOne`) and selectors (`selectAll`, `selectById`).
quiz:
  - id: q1
    question: "useSelector(s => s.items.filter(i => i.active)) — what is the problem?"
    options: ["None", "It returns a new array every time, causing re-renders after any action", "filter is not allowed", "It mutates state"]
    correct: 1
    explanation: Memoize derived arrays with createSelector.
  - id: q2
    question: When does a createSelector result function recompute?
    options: ["On every call", "When one of its input selector results changes by reference", "Every second", "Only on page reload"]
    correct: 1
    explanation: Inputs are compared with reference equality.
  - id: q3
    question: What shape does createEntityAdapter manage?
    options: ["A nested tree", "{ ids, entities }", "An array of arrays", "A Map"]
    correct: 1
    explanation: Normalized ids plus an entities lookup table.
---

## Memoized selectors

```ts
import { createSelector } from '@reduxjs/toolkit'

const selectTodos = (s: RootState) => s.todos.items
const selectFilter = (s: RootState) => s.todos.filter

export const selectVisibleTodos = createSelector([selectTodos, selectFilter], (todos, filter) =>
  filter === 'all' ? todos : todos.filter((t) => (filter === 'done' ? t.done : !t.done)),
)

// Component
const visible = useAppSelector(selectVisibleTodos) // same reference until todos or filter change
```

## Normalized state with createEntityAdapter

```ts
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'

const postsAdapter = createEntityAdapter<Post>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

const postsSlice = createSlice({
  name: 'posts',
  initialState: postsAdapter.getInitialState({ status: 'idle' }),
  reducers: {
    postAdded: postsAdapter.addOne,
    postUpdated: postsAdapter.updateOne,
    postsReceived: postsAdapter.setAll,
  },
})

export const { selectAll: selectAllPosts, selectById: selectPostById } = postsAdapter.getSelectors(
  (s: RootState) => s.posts,
)
```

## Re-render checklist

- Select the smallest value you need (`s.cart.count` rather than `s.cart`)
- Never create new objects/arrays in a selector without memoization
- Split big components so each subscribes to what it renders
