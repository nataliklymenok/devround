---
id: react-lists-keys
module: react-core
order: 3
title: Lists, keys and reconciliation
description: How React matches elements between renders, why keys matter and what goes wrong with index keys.
levels: [junior, middle, senior]
estimatedMinutes: 20
keyTakeaways:
  - Reconciliation compares element type and key to decide whether to update, move or recreate a component.
  - Keys must be stable and unique among siblings — use ids from your data.
  - Index keys break when items are inserted, removed or reordered — state attaches to the wrong item.
  - Changing a key on purpose is a clean way to reset a component's state.
interviewQuestions:
  - question: Why does React need keys in lists?
    answer: |
      To match children between renders. Without keys React matches by position, so inserting an item
      at the top makes every item look changed. With stable keys React knows which item moved, which
      was added and which was removed, and keeps each item's state and DOM.
  - question: When is using the array index as a key a problem?
    answer: |
      When the list can be reordered, filtered, or have items inserted or removed anywhere but the end.
      The index then points to a different item, so component state (an input's text, an open
      accordion) and DOM nodes are reused for the wrong data. Index keys are only safe for static
      lists.
  - question: How does reconciliation decide whether to keep a component?
    answer: |
      At the same position, if the element type and key are the same, React keeps the component
      instance and updates its props. If the type or key differs, React unmounts the old subtree
      (losing its state) and mounts a new one.
  - question: How can you reset a component's state when a prop changes?
    answer: |
      Give it a key derived from that prop, e.g. `<ProfileForm key={userId} userId={userId} />`. When
      `userId` changes, React treats it as a new component and starts with fresh state — no effect
      needed.
quiz:
  - id: q1
    question: What is the best key for items loaded from an API?
    options: ["The array index", "Math.random()", "The item's id from the API", "The item's title"]
    correct: 2
    explanation: Stable, unique ids from your data keep identity across renders.
  - id: q2
    question: "Inputs are rendered with key={index}. You remove the first item. What happens?"
    options: ["Everything works", "The text typed in inputs shifts to the wrong items", "React throws an error", "All inputs are cleared"]
    correct: 1
    explanation: Keys now map to different items, so component state is reused for the wrong data.
  - id: q3
    question: What happens when an element's key changes between renders?
    options: ["React updates its props", "React remounts it with fresh state", "Nothing", "React logs a warning only"]
    correct: 1
    explanation: A different key means a different component instance.
  - id: q4
    question: Where must keys be unique?
    options: ["Across the whole app", "Among siblings in the same list", "Within the same file", "Per component type"]
    correct: 1
    explanation: Keys only need to be unique among siblings.
topics: [react-keys-reconciliation]
references:
  - { title: 'React — Rendering Lists', url: 'https://react.dev/learn/rendering-lists' }
  - { title: 'React — Preserving and Resetting State', url: 'https://react.dev/learn/preserving-and-resetting-state' }
---

## Rendering lists

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}
```

The key goes on the outermost element returned from `map`, not inside the child component.

## Why index keys break

```jsx
// Each row has its own input state
function Row({ label }) {
  const [note, setNote] = useState('')
  return (
    <li>
      {label} <input value={note} onChange={(e) => setNote(e.target.value)} />
    </li>
  )
}

// ❌ remove the first item → the second row now gets key 0 and inherits the first row's note
{items.map((item, index) => <Row key={index} label={item.label} />)}

// ✅ state stays with the right item
{items.map((item) => <Row key={item.id} label={item.label} />)}
```

## Reconciliation rules

- Same position, same type, same key → keep the instance, update props.
- Different type (e.g. `div` → `section`, or `Form` → `Wizard`) → unmount and remount the subtree.
- Different key → unmount and remount.

This is why defining a component **inside** another component is a bug: it is a new function on
every render, so its type changes and its state is lost each time.

## Resetting state with a key

```jsx
function Profile({ userId }) {
  // A new key creates a new ProfileForm with clean state for each user
  return <ProfileForm key={userId} userId={userId} />
}
```
