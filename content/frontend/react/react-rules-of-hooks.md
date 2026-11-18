---
id: react-rules-of-hooks
module: react-hooks
order: 1
title: Rules of hooks and custom hooks
description: Why hooks must be called unconditionally, how React tracks them and how to extract custom hooks.
levels: [junior, middle, senior]
estimatedMinutes: 20
keyTakeaways:
  - Call hooks only at the top level of components or custom hooks — never in conditions, loops or callbacks.
  - React identifies each hook by its call order between renders.
  - Custom hooks share stateful logic, not state — each call gets its own state.
  - A custom hook is any function starting with use that calls other hooks.
interviewQuestions:
  - question: Why can't you call a hook inside an if statement?
    answer: |
      React stores hook state in a list per component and matches each hook call to its slot by order.
      If a hook is skipped on some renders, every following hook reads the wrong slot, mixing up
      state. Calling hooks unconditionally keeps the order identical on every render. Put the
      condition inside the hook (or the effect) instead.
  - question: What is a custom hook and when would you write one?
    answer: |
      A function whose name starts with `use` and that calls other hooks. Write one to reuse stateful
      logic across components — e.g. `useDebouncedValue`, `useOnlineStatus`, `useLocalStorage` — or to
      give a complex component's logic a clear name. Each component that calls it gets its own state.
  - question: Do two components using the same custom hook share state?
    answer: |
      No. A custom hook is just a function; every call creates its own `useState`/`useEffect` slots in
      the calling component. To share state you need to lift it up, use context, or use an external
      store.
quiz:
  - id: q1
    question: Where may you call useState?
    options: ["Inside an if block", "At the top level of a component or custom hook", "Inside a for loop", "Inside an event handler"]
    correct: 1
    explanation: Hooks must run in the same order on every render.
  - id: q2
    question: What does React use to associate state with each useState call?
    options: ["The variable name", "The order of hook calls during render", "A key passed to useState", "The line number"]
    correct: 1
    explanation: Hook state is stored by call order, which is why the order must never change.
  - id: q3
    question: Two components call useCounter(). If one increments, what happens to the other?
    options: ["It increments too", "Nothing — each has its own state", "It re-renders with the same value", "React throws"]
    correct: 1
    explanation: Custom hooks share logic, not state.
topics: [react-rules-of-hooks, react-custom-hooks]
references:
  - { title: 'React — Rules of Hooks', url: 'https://react.dev/reference/rules/rules-of-hooks' }
  - { title: 'React — Reusing Logic with Custom Hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks' }
---

## How React tracks hooks

React keeps a list of hook states for each component instance and walks it in order on every
render. The *position* of a call is its identity.

```jsx
function Profile({ user }) {
  const [name, setName] = useState(user.name) // slot 0
  const [age, setAge] = useState(user.age) // slot 1
  useEffect(() => {}, []) // slot 2
}
```

## Breaking the rule

```jsx
// ❌ hook order changes when isEditing changes
function Field({ isEditing }) {
  if (isEditing) {
    const [draft, setDraft] = useState('')
  }
  const [error, setError] = useState(null) // reads slot 0 or 1 depending on the branch
}

// ✅ call unconditionally, branch on the value
function FieldFixed({ isEditing }) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  if (!isEditing) return <span>{draft}</span>
  return <input value={draft} onChange={(e) => setDraft(e.target.value)} />
}
```

The `eslint-plugin-react-hooks` rules catch these mistakes — keep them enabled.

## Custom hooks

```jsx
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

function Search() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  const results = useSearch(debouncedQuery)
  // ...
}
```
