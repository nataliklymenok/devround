---
id: state-management-choices
module: state-core
order: 1
title: Choosing a state management approach
description: Local vs global state, server state vs client state, and when Context, a store or a query library is the right tool.
levels: [junior, middle, senior]
estimatedMinutes: 20
topics: [state-choices]
reviewed: 2026-11-20
references:
  - { title: 'React — Choosing the State Structure', url: 'https://react.dev/learn/choosing-the-state-structure' }
  - { title: 'Redux — When should I use Redux?', url: 'https://redux.js.org/faq/general#when-should-i-use-redux' }
  - { title: 'TanStack Query — Does TanStack Query replace Redux?', url: 'https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state' }
keyTakeaways:
  - Most state is local or derivable — start with useState and lift state only when needed.
  - Server state (cached API data) has different problems than client state — use a query library for it.
  - Context is a dependency-injection mechanism, not a state manager — it re-renders all consumers on change.
  - A global store (Redux Toolkit, Zustand) pays off for complex, frequently updated client state shared widely.
interviewQuestions:
  - question: When would you introduce Redux into a React app?
    answer: |
      When a lot of client state is shared across distant parts of the app, updates come from many
      places, the update logic is complex, and the team benefits from a single predictable pattern
      with DevTools (action log, time travel). If the "global state" is mostly API data, a query
      library (RTK Query, TanStack Query) solves it better; if it is a few values, Context or Zustand
      is enough.
  - question: What is the difference between server state and client state?
    answer: |
      Server state is owned by the backend; the client holds a cached, possibly stale copy that needs
      fetching, deduplication, background refresh, invalidation after mutations and pagination. Client
      state is owned by the UI — open dialogs, form drafts, selections, theme. Mixing them in one store
      leads to hand-written loading flags and cache invalidation bugs.
  - question: Why is Context not a replacement for Redux?
    answer: |
      Context passes a value down the tree; every consumer re-renders when the value changes, with no
      built-in selectors, middleware or DevTools. It is perfect for rarely changing values (theme,
      current user, locale) and for injecting a store, but a store adds subscriptions with selectors,
      so components re-render only when the slice they read changes.
quiz:
  - id: q1
    question: The app mostly shows and edits data from REST APIs. What is the best first choice?
    options: ["Put all responses in Redux slices by hand", "A server-state library such as RTK Query or TanStack Query", "Context with useEffect fetching", "localStorage"]
    correct: 1
    explanation: Query libraries handle caching, deduplication and invalidation.
  - id: q2
    question: Which is client state?
    options: ["The list of products from the API", "Whether the filters panel is open", "The current user's profile from the server", "Search results"]
    correct: 1
    explanation: UI-only state that the server does not own.
  - id: q3
    question: What happens when a Context value object changes?
    options: ["Only components reading the changed field re-render", "All consumers of that context re-render", "Nothing", "The provider unmounts"]
    correct: 1
    explanation: Context has no selector-based subscriptions.
---

## A decision guide

| State | Example | Tool |
| --- | --- | --- |
| Local UI | input value, open/closed | `useState` / `useReducer` |
| Shared by siblings | selected tab + content | lift to common parent |
| Global, rarely changing | theme, user, locale | Context |
| Server data | products, orders | RTK Query / TanStack Query |
| Complex shared client state | editor document, cart with rules, multi-step workflow | Redux Toolkit / Zustand |
| Shareable / bookmarkable | filters, page, sort | URL search params |

## Derive, don't store

```ts
// ❌ storing what can be computed
const [items, setItems] = useState<Item[]>([])
const [total, setTotal] = useState(0)

// ✅ compute during render
const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
```

## URL as state

```tsx
const [params, setParams] = useSearchParams()
const sort = params.get('sort') ?? 'newest'
```

Filters in the URL survive reloads, can be shared, and work with the back button.
