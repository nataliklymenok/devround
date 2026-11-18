---
id: redux-toolkit-basics
module: state-core
order: 2
title: Redux Toolkit fundamentals
description: The Redux data flow, configureStore, createSlice with Immer, typed hooks and the rules of reducers.
levels: [junior, middle, senior]
estimatedMinutes: 30
topics: [redux-toolkit]
references:
  - { title: 'Redux Toolkit — Quick Start', url: 'https://redux-toolkit.js.org/tutorials/quick-start' }
  - { title: 'Redux Toolkit — createSlice', url: 'https://redux-toolkit.js.org/api/createSlice' }
  - { title: 'Redux — Style Guide', url: 'https://redux.js.org/style-guide/' }
keyTakeaways:
  - "One-way flow: UI dispatches an action → reducers compute new state → subscribed components re-render."
  - Reducers must be pure — no side effects, no mutations of the old state (Immer lets you write "mutating" code safely).
  - createSlice generates action creators and the reducer; configureStore adds DevTools and sensible middleware.
  - Define typed useAppSelector and useAppDispatch hooks once and use them everywhere.
interviewQuestions:
  - question: Explain the Redux data flow.
    answer: |
      The store holds the state tree. Components read slices of it with selectors and dispatch actions
      (plain objects describing what happened). The store runs the root reducer with the current state
      and the action to produce the next state, then notifies subscribers; components whose selected
      values changed re-render. Side effects live in middleware (thunks, listeners, RTK Query), not in
      reducers.
  - question: How can createSlice reducers "mutate" state?
    answer: |
      Redux Toolkit wraps reducers with Immer. You mutate a draft (`state.items.push(item)`), and Immer
      records the changes and produces a new immutable state with structural sharing. You may either
      mutate the draft or return a new value, but not both. Outside `createSlice`/`createReducer`,
      mutating state is still a bug.
  - question: Why must reducers be pure?
    answer: |
      Redux relies on reference equality to detect changes and on reproducible state transitions for
      DevTools time travel, tests and server rendering. Side effects in reducers (API calls, random
      ids, dates) make transitions unpredictable. Generate ids and timestamps in action creators
      (`prepare` callbacks) and run effects in middleware.
quiz:
  - id: q1
    question: What library lets createSlice reducers use mutating syntax safely?
    options: ["Reselect", "Immer", "Redux Thunk", "Lodash"]
    correct: 1
    explanation: Immer turns draft mutations into immutable updates.
  - id: q2
    question: Where should an API call triggered by a button live?
    options: ["In a reducer", "In a thunk, listener or RTK Query endpoint", "In the store enhancer", "In a selector"]
    correct: 1
    explanation: Reducers must be pure; effects go to middleware.
  - id: q3
    question: What does configureStore add by default?
    options: ["Nothing", "Redux DevTools support and default middleware including thunk", "A router", "Server rendering"]
    correct: 1
    explanation: It also adds development checks for mutations and non-serializable values.
---

## A slice

```ts
// features/cart/cartSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface CartItem { id: string; qty: number }
interface CartState { items: CartItem[] }

const initialState: CartState = { items: [] }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    added(state, action: PayloadAction<string>) {
      const existing = state.items.find((i) => i.id === action.payload)
      if (existing) existing.qty += 1 // "mutation" on an Immer draft
      else state.items.push({ id: action.payload, qty: 1 })
    },
    removed(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload)
    },
  },
})

export const { added, removed } = cartSlice.actions
export default cartSlice.reducer
```

## The store and typed hooks

```ts
// app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import cart from '../features/cart/cartSlice'

export const store = configureStore({ reducer: { cart } })

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

## Using it

```tsx
function CartBadge() {
  const count = useAppSelector((s) => s.cart.items.reduce((n, i) => n + i.qty, 0))
  return <span aria-label={`${count} items in cart`}>{count}</span>
}

function AddButton({ id }: { id: string }) {
  const dispatch = useAppDispatch()
  return <button onClick={() => dispatch(added(id))}>Add to cart</button>
}
```

Wrap the app in `Provider store={store}` from react-redux.
