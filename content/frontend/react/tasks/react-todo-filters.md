---
id: react-todo-filters
order: 3
title: Build a todo list with filters
levels: [junior, middle]
difficulty: easy
estimatedMinutes: 30
mode: self-check
topics: [react-state-props, react-keys-reconciliation, react-forms]
references:
  - { title: 'React — Updating Arrays in State', url: 'https://react.dev/learn/updating-arrays-in-state' }
  - { title: 'React — Rendering Lists', url: 'https://react.dev/learn/rendering-lists' }
hints:
  - Store todos and the current filter in state; compute the visible list during render.
  - Update the array immutably — map to toggle, filter to delete, spread to add.
  - Give each todo a stable id (crypto.randomUUID()) and use it as the key.
starterCode: |
  export function TodoApp() {
    return null
  }
acceptanceCriteria:
  - A form adds a todo on submit (Enter or button) and ignores empty input
  - Each todo can be toggled done and deleted
  - Filters All / Active / Completed show the right items, and the active filter is indicated (aria-pressed)
  - A counter shows how many active todos remain
  - Todos use stable keys — toggling or deleting does not mix up items or their checkboxes
  - State is updated immutably (no push/splice on state)
---

## Problem

Build a `TodoApp` with adding, toggling, deleting and filtering todos (All / Active / Completed) and
a counter of remaining items.

## Constraints

React state only — no external state library.

## Examples

Add "Buy milk" and "Write tests", complete "Buy milk", choose Active → only "Write tests" is shown and
the counter says "1 item left".

## Solution

```jsx
import { useState } from 'react'

const FILTERS = {
  all: () => true,
  active: (t) => !t.done,
  completed: (t) => t.done,
}

export function TodoApp() {
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('all')
  const [text, setText] = useState('')

  function addTodo(event) {
    event.preventDefault()
    const title = text.trim()
    if (!title) return
    setTodos((list) => [...list, { id: crypto.randomUUID(), title, done: false }])
    setText('')
  }

  const toggle = (id) => setTodos((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const remove = (id) => setTodos((list) => list.filter((t) => t.id !== id))

  const visible = todos.filter(FILTERS[filter])
  const left = todos.filter((t) => !t.done).length

  return (
    <section>
      <form onSubmit={addTodo}>
        <label htmlFor="new-todo">New todo</label>
        <input id="new-todo" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {visible.map((todo) => (
          <li key={todo.id}>
            <label>
              <input type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} /> {todo.title}
            </label>
            <button type="button" aria-label={`Delete ${todo.title}`} onClick={() => remove(todo.id)}>×</button>
          </li>
        ))}
      </ul>
      <p>{left} {left === 1 ? 'item' : 'items'} left</p>
      <div role="group" aria-label="Filter">
        {Object.keys(FILTERS).map((name) => (
          <button key={name} type="button" aria-pressed={filter === name} onClick={() => setFilter(name)}>
            {name[0].toUpperCase() + name.slice(1)}
          </button>
        ))}
      </div>
    </section>
  )
}
```

## Explanation

Only `todos`, `filter` and the input text are state; the visible list and the counter are derived
during render, so they can never get out of sync. Updates use the updater form and create new arrays
and objects, which React needs to detect changes. Stable ids as keys keep each checkbox attached to
the right todo when items are removed or filtered.

## Common mistakes

- Storing `visibleTodos` or `count` in state and syncing it with effects.
- Using the array index as key — deleting an item shifts checkbox state to the wrong row.
- `todos.push(...)` followed by `setTodos(todos)`: same reference, no re-render.
- Icon-only delete buttons without an accessible name.
