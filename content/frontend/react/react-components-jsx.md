---
id: react-components-jsx
module: react-core
order: 1
title: Components, JSX and rendering
description: What a component is, what JSX compiles to, and what happens when React renders.
levels: [junior, middle]
estimatedMinutes: 20
keyTakeaways:
  - A component is a function that returns a description of UI; React calls it, you never do.
  - JSX compiles to function calls that create plain element objects.
  - Rendering means calling components to compute the next UI; committing means updating the DOM.
  - Components must be pure during render — no side effects, same inputs give the same output.
interviewQuestions:
  - question: What is JSX?
    answer: |
      A syntax extension that compiles to function calls (with the modern transform, `jsx()` from
      `react/jsx-runtime`). `<Button kind="primary">Save</Button>` becomes roughly
      `jsx(Button, { kind: 'primary', children: 'Save' })`, which returns a plain object describing
      what to render. It is not HTML: attributes are camelCase (`className`, `onClick`) and any
      JavaScript expression can go inside braces.
  - question: What is the difference between rendering and committing?
    answer: |
      In the render phase React calls your components to compute the next tree of elements and diffs
      it with the previous one. In the commit phase it applies the minimal set of changes to the DOM
      and then runs effects. A render does not necessarily change the DOM.
  - question: What triggers a re-render?
    answer: |
      A state update in the component (or a hook it uses), a re-render of its parent (which re-renders
      children by default), or a change in a context it consumes. Props changing is not a trigger by
      itself — the parent re-rendering is.
  - question: Why must components be pure?
    answer: |
      React may call a component several times (Strict Mode does it on purpose in development) and may
      render without committing. Side effects during render — mutating external variables, fetching,
      subscribing — would run unpredictably. Put side effects in event handlers or effects.
quiz:
  - id: q1
    question: What does JSX compile to?
    options: ["HTML strings", "Function calls that create element objects", "DOM nodes", "Template literals"]
    correct: 1
    explanation: JSX becomes jsx()/createElement calls returning plain objects that describe the UI.
  - id: q2
    question: Which attribute sets a CSS class in JSX?
    options: ["class", "className", "cssClass", "styleName"]
    correct: 1
    explanation: JSX uses DOM property names, so class becomes className.
  - id: q3
    question: When a parent re-renders, what happens to its children by default?
    options: ["Nothing", "They re-render too", "Only children with changed props re-render", "They unmount"]
    correct: 1
    explanation: Children re-render by default; React.memo can skip it when props are unchanged.
  - id: q4
    question: Which of these is allowed during render?
    options: ["Calling fetch()", "Mutating a global variable", "Computing a value from props and state", "Adding an event listener to window"]
    correct: 2
    explanation: Rendering must be pure; deriving values is fine, side effects are not.
---

## Components are functions

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>
}

export function App() {
  return (
    <main>
      <Greeting name="Ann" />
      <Greeting name="Bob" />
    </main>
  )
}
```

Component names start with a capital letter — lowercase tags like `div` are treated as DOM elements.

## What JSX becomes

```js
// <Button kind="primary">Save</Button> compiles to roughly:
import { jsx } from 'react/jsx-runtime'
jsx(Button, { kind: 'primary', children: 'Save' })
// → { type: Button, props: { kind: 'primary', children: 'Save' }, ... }
```

## Expressions, conditions and fragments

```jsx
function Status({ user, items }) {
  return (
    <>
      {user ? <p>Signed in as {user.name}</p> : <p>Please sign in</p>}
      {items.length > 0 && <p>{items.length} items</p>}
    </>
  )
}
```

Watch out for `{count && <Badge />}`: when `count` is `0`, React renders `0`. Use
`{count > 0 && <Badge />}` instead.

## Render and commit

1. **Trigger** — initial mount, a state update, or a parent render.
2. **Render** — React calls components and diffs the new element tree with the previous one.
3. **Commit** — React updates the DOM where something changed, then runs effects.

Because render can happen without a commit (and twice in Strict Mode), keep it pure.
