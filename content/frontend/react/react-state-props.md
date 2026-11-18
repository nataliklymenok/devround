---
id: react-state-props
module: react-core
order: 2
title: State, props and data flow
description: Props vs state, immutable updates, lifting state up and derived values.
levels: [junior, middle]
estimatedMinutes: 25
keyTakeaways:
  - Props are inputs from the parent and are read-only; state is memory owned by the component.
  - State updates are asynchronous snapshots — use the updater form when the next state depends on the previous one.
  - Never mutate state; create new objects and arrays.
  - Lift shared state to the closest common parent and derive everything you can instead of storing it.
interviewQuestions:
  - question: What is the difference between props and state?
    answer: |
      Props are passed in by the parent and must not be modified by the child. State is internal
      memory created with `useState`/`useReducer`; changing it re-renders the component. Data flows
      down via props and changes flow up via callbacks.
  - question: Why does setCount(count + 1) called three times increase count only by one?
    answer: |
      Each render sees a snapshot of state. All three calls read the same `count` from the current
      render, so they all schedule the same value. Use the updater form `setCount((c) => c + 1)`,
      which receives the latest pending state.
  - question: Why must state be updated immutably?
    answer: |
      React compares the old and new state with `Object.is`. Mutating an object keeps the same
      reference, so React may skip the re-render, and memoized children or effects depending on it
      will not see the change. Create new objects (`{ ...user, name }`) and arrays (`[...list, x]`,
      `filter`, `map`).
  - question: What is "lifting state up"?
    answer: |
      When two components need the same data, move the state to their closest common parent and pass
      it down as props, together with callbacks to change it. This keeps a single source of truth.
quiz:
  - id: q1
    question: "count is 0. setCount(count + 1) is called three times in one handler. What is count after re-render?"
    options: ["0", "1", "3", "It depends on the browser"]
    correct: 1
    explanation: All calls read the same snapshot. Use setCount(c => c + 1) to get 3.
  - id: q2
    question: Which state update is correct for adding an item?
    options: ["items.push(item); setItems(items)", "setItems([...items, item])", "items[items.length] = item", "setItems(items.concat).push(item)"]
    correct: 1
    explanation: Create a new array; mutating the old one keeps the same reference.
  - id: q3
    question: "A component stores fullName in state, computed from firstName and lastName props. What is better?"
    options: ["Sync it with useEffect", "Compute it during render", "Store it in a ref", "Store it in context"]
    correct: 1
    explanation: Derived values should be computed during render — storing them creates sync bugs.
topics: [react-state-props]
references:
  - { title: 'React — State: A Component''s Memory', url: 'https://react.dev/learn/state-a-components-memory' }
  - { title: 'React — Updating Objects in State', url: 'https://react.dev/learn/updating-objects-in-state' }
  - { title: 'React — Sharing State Between Components', url: 'https://react.dev/learn/sharing-state-between-components' }
---

## Props flow down, events flow up

```jsx
function Counter({ step, onChange }) {
  const [count, setCount] = useState(0)

  function increment() {
    const next = count + step
    setCount(next)
    onChange?.(next) // notify the parent
  }

  return <button onClick={increment}>Count: {count}</button>
}
```

## State is a snapshot

```jsx
function handleClick() {
  setCount(count + 1)
  setCount(count + 1) // still count + 1 — same snapshot
  setCount((c) => c + 1) // updater form uses the latest pending value
}
```

## Immutable updates

```jsx
const [user, setUser] = useState({ name: 'Ann', address: { city: 'Kyiv' } })

setUser({ ...user, name: 'Bob' })
setUser({ ...user, address: { ...user.address, city: 'Lviv' } })

const [todos, setTodos] = useState([])
setTodos([...todos, newTodo]) // add
setTodos(todos.filter((t) => t.id !== id)) // remove
setTodos(todos.map((t) => (t.id === id ? { ...t, done: true } : t))) // update
```

## Derive instead of duplicating

```jsx
// ❌ extra state + effect to keep it in sync
const [visible, setVisible] = useState([])
useEffect(() => setVisible(todos.filter((t) => !t.done)), [todos])

// ✅ compute during render
const visibleTodos = todos.filter((t) => !t.done)
```

## Lifting state up

```jsx
function Filters() {
  const [query, setQuery] = useState('')
  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <Results query={query} />
    </>
  )
}
```
