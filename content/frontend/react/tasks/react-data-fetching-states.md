---
id: react-data-fetching-states
order: 5
title: Fetch data with loading, error and empty states
levels: [junior, middle, senior]
difficulty: medium
estimatedMinutes: 30
mode: self-check
topics: [react-effects, react-state-management]
references:
  - { title: 'React — You Might Not Need an Effect (fetching data)', url: 'https://react.dev/learn/you-might-not-need-an-effect#fetching-data' }
  - { title: 'TanStack Query — Queries', url: 'https://tanstack.com/query/latest/docs/framework/react/guides/queries' }
hints:
  - Model the request as one status value — 'loading' | 'error' | 'success' — instead of several booleans.
  - Abort or ignore the request in the effect cleanup so changing userId never shows the wrong user's data.
  - Show distinct UI for loading, error (with a retry), empty and success, and announce changes politely.
starterCode: |
  // fetchOrders(userId, { signal }) → Promise<{ id: string; total: number }[]>
  export function Orders({ userId, fetchOrders }) {
    return null
  }
acceptanceCriteria:
  - A loading state is shown while the request is in flight
  - Errors show a message and a Retry button that refetches
  - An empty result shows a friendly empty state, not an empty list
  - Changing userId while a request is pending never shows the previous user's orders
  - The request is cancelled (or ignored) when the component unmounts
  - Status changes are announced (role="status" or role="alert")
---

## Problem

Build `Orders`, which loads a user's orders with `fetchOrders(userId, { signal })` and handles every
state of the request.

## Constraints

Implement it with `useEffect` first, then explain how you would do it with a data library.

## Examples

```jsx
<Orders userId={currentUser.id} fetchOrders={api.fetchOrders} />
```

## Solution

```jsx
import { useEffect, useState } from 'react'

export function Orders({ userId, fetchOrders }) {
  const [state, setState] = useState({ status: 'loading', orders: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', orders: [] })
    fetchOrders(userId, { signal: controller.signal })
      .then((orders) => setState({ status: 'success', orders }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', orders: [] })
      })
    return () => controller.abort()
  }, [userId, fetchOrders, attempt])

  if (state.status === 'loading') return <p role="status">Loading orders…</p>
  if (state.status === 'error') {
    return (
      <div role="alert">
        <p>Could not load orders.</p>
        <button type="button" onClick={() => setAttempt((a) => a + 1)}>Retry</button>
      </div>
    )
  }
  if (state.orders.length === 0) return <p>You have no orders yet.</p>
  return (
    <ul>
      {state.orders.map((o) => (
        <li key={o.id}>Order {o.id} — {o.total.toFixed(2)}</li>
      ))}
    </ul>
  )
}
```

## Explanation

The effect re-runs when `userId` changes (or Retry bumps `attempt`), and its cleanup aborts the old
request, so a slow response for a previous user can never land. A single `status` field makes
impossible combinations (loading and error at once) unrepresentable. In production you would use a
data library: `useQuery({ queryKey: ['orders', userId], queryFn: ({ signal }) => fetchOrders(userId,
{ signal }) })` gives caching, deduplication, retries and the same states with far less code.

## Common mistakes

- No cleanup — race conditions when `userId` changes quickly.
- Three booleans (`isLoading`, `isError`, `hasData`) that drift out of sync.
- Treating an empty array as "still loading" or rendering an empty list without explanation.
- Swallowing errors without a retry path.
