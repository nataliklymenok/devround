---
id: redux-async
module: state-core
order: 3
title: Async logic, thunks and middleware
description: createAsyncThunk and its lifecycle actions, loading state patterns, middleware, and the listener middleware.
levels: [middle, senior]
estimatedMinutes: 25
topics: [redux-async]
references:
  - { title: 'Redux Toolkit — createAsyncThunk', url: 'https://redux-toolkit.js.org/api/createAsyncThunk' }
  - { title: 'Redux — Writing Logic with Thunks', url: 'https://redux.js.org/usage/writing-logic-thunks' }
  - { title: 'Redux Toolkit — createListenerMiddleware', url: 'https://redux-toolkit.js.org/api/createListenerMiddleware' }
keyTakeaways:
  - Middleware sits between dispatch and reducers; thunks let you dispatch functions that run async code.
  - createAsyncThunk dispatches pending, fulfilled and rejected actions that extraReducers handle.
  - Model request state with a status field ('idle' | 'loading' | 'succeeded' | 'failed') rather than many booleans.
  - The listener middleware reacts to actions with side effects (debounce, cancel, sequences) — a lighter alternative to sagas.
interviewQuestions:
  - question: What is Redux middleware?
    answer: |
      A function that wraps `dispatch`: `store => next => action => {...}`. It can inspect, delay,
      transform or replace actions and run side effects before passing the action on with
      `next(action)`. Thunks, the listener middleware, RTK Query, loggers and analytics are all
      middleware.
  - question: How does createAsyncThunk work?
    answer: |
      You give it an action type prefix and an async payload creator. Dispatching it dispatches
      `pending`, runs the function, then dispatches `fulfilled` with the return value or `rejected`
      with the error (or `rejectWithValue` payload). Reducers handle these in `extraReducers` with the
      builder API. The returned promise has `unwrap()` to get the result or throw in components. It
      receives a `signal` for cancellation.
  - question: When would you use the listener middleware instead of a thunk?
    answer: |
      When logic should react to actions rather than be called directly: e.g. "when filters change,
      debounce and refetch", "when the user logs out, clear caches", or workflows with
      `take`/`condition`, cancellation of previous runs and forked tasks. Thunks are better for
      imperative "do this now" logic initiated by a component.
quiz:
  - id: q1
    question: Which actions does a createAsyncThunk dispatch?
    options: ["start and end", "pending, fulfilled or rejected", "request and response", "loading and done"]
    correct: 1
    explanation: The lifecycle actions are generated automatically.
  - id: q2
    question: How do you get the thunk result (or throw on error) in a component?
    options: ["await dispatch(fetchUser(id)).unwrap()", "store.getState().result", "useEffect return value", "It is impossible"]
    correct: 0
    explanation: unwrap() returns the fulfilled payload or throws the rejection.
  - id: q3
    question: What is the signature shape of Redux middleware?
    options: ["(state, action) => state", "store => next => action => …", "(action) => void", "(dispatch) => state"]
    correct: 1
    explanation: Middleware is a curried function around dispatch.
---

## createAsyncThunk

```ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export const fetchOrders = createAsyncThunk('orders/fetch', async (page: number, { signal, rejectWithValue }) => {
  const res = await fetch(`/api/orders?page=${page}`, { signal })
  if (!res.ok) return rejectWithValue(`HTTP ${res.status}`)
  return (await res.json()) as Order[]
})

interface OrdersState {
  items: Order[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState: { items: [], status: 'idle', error: null } as OrdersState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error'
      })
  },
})
```

## Using it in a component

```tsx
const dispatch = useAppDispatch()
useEffect(() => {
  const promise = dispatch(fetchOrders(page))
  return () => promise.abort() // cancels via the signal
}, [dispatch, page])
```

## Listener middleware

```ts
import { createListenerMiddleware } from '@reduxjs/toolkit'

export const listener = createListenerMiddleware()

listener.startListening({
  actionCreator: filtersChanged,
  effect: async (action, api) => {
    api.cancelActiveListeners() // keep only the latest run
    await api.delay(300) // debounce
    await api.dispatch(searchProducts(action.payload))
  },
})
```
