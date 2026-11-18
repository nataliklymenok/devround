---
id: react-context-state
module: react-hooks
order: 4
title: Context and state management
description: Avoiding prop drilling with context, its re-render behavior, and choosing where state should live.
levels: [middle, senior]
estimatedMinutes: 25
keyTakeaways:
  - Context passes values deep into the tree without prop drilling — ideal for theme, auth and locale.
  - Every consumer re-renders when the context value changes, so keep values stable and split contexts.
  - Server state (fetched data) belongs in a data-fetching cache, not in global client state.
  - Reach for a store library only when context and local state become painful.
interviewQuestions:
  - question: What problem does context solve and what are its trade-offs?
    answer: |
      It avoids passing props through many components that do not use them. The trade-off: every
      component that reads the context re-renders when its value changes, and the value identity
      changes whenever the provider renders with a new object. Memoize the value, split rarely- and
      frequently-changing data into separate contexts, and keep context for genuinely global data.
  - question: How do you decide where state should live?
    answer: |
      Keep it as local as possible: component state first, lift it to the nearest common parent when
      siblings need it, use context for app-wide values (theme, current user), and use a query cache
      such as TanStack Query for server data. A dedicated store (Zustand, Redux Toolkit) is worth it
      for complex, frequently updated client state shared across distant parts of the app.
  - question: What is the difference between server state and client state?
    answer: |
      Server state is a cached copy of data owned by the backend — it can be stale, needs refetching,
      deduplication and invalidation. Client state is owned by the UI (open modals, form drafts,
      selected tabs). Mixing them in one global store leads to manual cache management; libraries like
      TanStack Query handle server state specifically.
quiz:
  - id: q1
    question: What happens to consumers when a context provider's value object is recreated on each render?
    options: ["Nothing", "All consumers re-render every time", "Only the first consumer re-renders", "React warns and ignores it"]
    correct: 1
    explanation: A new object identity counts as a change; memoize the value.
  - id: q2
    question: Which is the best fit for data fetched from an API and shown in many places?
    options: ["A context with useEffect fetching", "A query cache like TanStack Query", "A global variable", "localStorage"]
    correct: 1
    explanation: Query caches handle caching, refetching, deduplication and invalidation of server state.
  - id: q3
    question: Which value is a good candidate for context?
    options: ["The text of a search input", "The current theme", "Whether a dropdown is open", "A list item's hover state"]
    correct: 1
    explanation: Theme is global and changes rarely; the others are local UI state.
topics: [react-context, react-state-management]
references:
  - { title: 'React — Passing Data Deeply with Context', url: 'https://react.dev/learn/passing-data-deeply-with-context' }
  - { title: 'TanStack Query — Overview', url: 'https://tanstack.com/query/latest/docs/framework/react/overview' }
---

## Creating and consuming context

```jsx
const ThemeContext = createContext('light')

function App() {
  const [theme, setTheme] = useState('light')
  const value = useMemo(() => ({ theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }), [theme])

  return (
    <ThemeContext value={value}>
      <Layout />
    </ThemeContext>
  )
}

function ThemeButton() {
  const { theme, toggle } = use(ThemeContext) // or useContext(ThemeContext)
  return <button onClick={toggle}>Theme: {theme}</button>
}
```

In React 19 you can render `<ThemeContext>` directly as the provider and read it with `use`, which
(unlike `useContext`) may be called conditionally.

## Re-render behavior

Every component that reads a context re-renders when its value changes. Tips:

- Memoize the provider value (`useMemo`) so unrelated parent renders do not change it.
- Split contexts: `AuthContext` for the user, `AuthActionsContext` for stable functions.
- Do not put rapidly changing values (mouse position, input text) into widely used contexts.

## Where should state live?

| Kind of state | Where |
| --- | --- |
| UI state used by one component | `useState` in that component |
| Shared by siblings | Lift to the nearest common parent |
| App-wide, rarely changing (theme, user, locale) | Context |
| Data from the server | Query cache (TanStack Query, SWR, framework loaders) |
| Complex, frequently updated shared client state | A store (Zustand, Redux Toolkit) |

## Server state with a query cache

```jsx
function Profile({ id }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()),
  })
  if (isPending) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  return <h1>{data.name}</h1>
}
```
