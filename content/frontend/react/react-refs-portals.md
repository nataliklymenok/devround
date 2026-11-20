---
id: react-refs-portals
module: react-core
order: 5
title: Refs and portals
description: useRef for DOM nodes and mutable values, ref as a prop in React 19, useImperativeHandle and createPortal.
levels: [middle, senior]
estimatedMinutes: 20
topics: [react-refs-portals]
reviewed: 2026-11-20
references:
  - { title: 'React — Manipulating the DOM with Refs', url: 'https://react.dev/learn/manipulating-the-dom-with-refs' }
  - { title: 'React — useImperativeHandle', url: 'https://react.dev/reference/react/useImperativeHandle' }
  - { title: 'React — createPortal', url: 'https://react.dev/reference/react-dom/createPortal' }
keyTakeaways:
  - A ref is a mutable box ({ current }) that survives renders and does not trigger a re-render when changed.
  - Use refs for DOM access (focus, measure, scroll) and for values that must not cause renders (timer ids, latest callback).
  - In React 19 function components receive ref as a normal prop; forwardRef is no longer needed.
  - createPortal renders children into another DOM node while keeping React context and event bubbling.
interviewQuestions:
  - question: When should you use a ref instead of state?
    answer: |
      When the value does not affect what is rendered: DOM nodes, timer or request ids, the previous
      value of a prop, or the latest callback used by an effect. Changing `ref.current` does not
      re-render, so anything displayed must live in state. Do not read or write refs during rendering
      (except lazy initialization) — do it in effects and event handlers.
  - question: How do you expose a DOM node or methods from a component?
    answer: |
      In React 19, accept `ref` as a prop and pass it to the inner element:
      `function Input({ ref, ...props }) { return <input ref={ref} {...props} /> }`. Before React 19
      this required `forwardRef`. To expose a limited API instead of the whole node, use
      `useImperativeHandle(ref, () => ({ focus, clear }))`.
  - question: What are portals used for and how do events behave?
    answer: |
      Portals render UI such as modals, tooltips and toasts into a different DOM container (often at
      the end of `body`) so they escape `overflow: hidden` and z-index stacking contexts. In React they
      stay in the component tree: context works and events bubble to React ancestors as if the portal
      were rendered in place, even though the DOM parent is different.
quiz:
  - id: q1
    question: What happens when you change ref.current?
    options: ["The component re-renders", "Nothing re-renders; the new value is just stored", "React throws", "Effects re-run"]
    correct: 1
    explanation: Refs are escape hatches that do not trigger renders.
  - id: q2
    question: How does a React 19 function component receive a ref?
    options: ["Only via forwardRef", "As a regular ref prop", "Through context", "It cannot"]
    correct: 1
    explanation: ref is a normal prop for function components in React 19.
  - id: q3
    question: A click inside a portal rendered into document.body — does it bubble to the React parent that rendered the portal?
    options: ["No, never", "Yes, React events bubble through the React tree", "Only with capture", "Only in development"]
    correct: 1
    explanation: Portals preserve React tree semantics for events and context.
---

## Refs for DOM access

```jsx
function SearchBox() {
  const inputRef = useRef(null)
  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>Focus search</button>
    </>
  )
}
```

## Refs for values that should not re-render

```jsx
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  const start = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
  }
  const stop = () => clearInterval(intervalRef.current)
  return <p>{elapsed}s <button onClick={start}>Start</button> <button onClick={stop}>Stop</button></p>
}
```

## ref as a prop (React 19) and useImperativeHandle

```jsx
function TextField({ ref, label, ...props }) {
  const inputRef = useRef(null)
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => (inputRef.current.value = ''),
  }))
  return (
    <label>
      {label}
      <input ref={inputRef} {...props} />
    </label>
  )
}

// Parent
const fieldRef = useRef(null)
<TextField ref={fieldRef} label="Name" />
fieldRef.current.focus()
```

## Portals

```jsx
import { createPortal } from 'react-dom'

function Tooltip({ anchorRect, children }) {
  return createPortal(
    <div role="tooltip" style={{ position: 'fixed', top: anchorRect.bottom, left: anchorRect.left }}>
      {children}
    </div>,
    document.body,
  )
}
```
