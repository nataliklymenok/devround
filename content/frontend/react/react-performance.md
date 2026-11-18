---
id: react-performance
module: react-hooks
order: 3
title: Memoization and performance
description: When re-renders matter, React.memo, useMemo, useCallback and the React Compiler.
levels: [middle, senior]
estimatedMinutes: 25
keyTakeaways:
  - Re-renders are usually cheap; measure with the React DevTools Profiler before optimizing.
  - React.memo skips re-rendering when props are shallowly equal — it needs stable props to work.
  - useMemo caches a computed value and useCallback caches a function between renders.
  - Structural fixes (moving state down, passing children) often beat memoization.
interviewQuestions:
  - question: When would you use useMemo and useCallback?
    answer: |
      `useMemo` for expensive calculations that would otherwise rerun on every render, or to keep an
      object/array reference stable when it is a dependency or a prop of a memoized child.
      `useCallback` to keep a function reference stable for the same reasons. Using them everywhere
      adds cost and noise; with the React Compiler enabled most manual memoization is unnecessary.
  - question: Why might React.memo not prevent a re-render?
    answer: |
      `memo` compares props with `Object.is`. If the parent passes a new object, array or inline
      function on every render (`style={{...}}`, `onClick={() => ...}`), the props are never equal.
      Stabilize them with `useMemo`/`useCallback` or restructure. Context changes also re-render
      memoized consumers.
  - question: How do you find and fix a slow React screen?
    answer: |
      Profile first (React DevTools Profiler, Performance panel) to find what renders and why. Then:
      move state closer to where it is used, lift expensive subtrees out via `children`, memoize the
      expensive parts, virtualize long lists, split code with `lazy`, and use `useTransition` or
      `useDeferredValue` to keep typing responsive during heavy updates.
quiz:
  - id: q1
    question: What does React.memo compare by default?
    options: ["Deep equality of props", "Shallow (Object.is) equality of each prop", "Only the children prop", "Nothing — it always skips"]
    correct: 1
    explanation: memo shallowly compares each prop with Object.is.
  - id: q2
    question: "A memoized child receives onSelect={() => select(id)}. Why does it still re-render?"
    options: ["memo does not work with functions", "A new function is created on every parent render", "Arrow functions are not allowed as props", "The child has state"]
    correct: 1
    explanation: Inline functions get a new identity each render — wrap with useCallback if it matters.
  - id: q3
    question: Which hook keeps an input responsive while a heavy list re-renders with the new query?
    options: ["useLayoutEffect", "useDeferredValue", "useRef", "useId"]
    correct: 1
    explanation: useDeferredValue lets React render the heavy part with a lagging value at lower priority.
  - id: q4
    question: What should you do before memoizing components?
    options: ["Wrap everything in memo", "Measure with the Profiler", "Convert to class components", "Remove all state"]
    correct: 1
    explanation: Optimize what measurements show is slow.
topics: [react-memoization]
references:
  - { title: 'React — memo', url: 'https://react.dev/reference/react/memo' }
  - { title: 'React — useMemo', url: 'https://react.dev/reference/react/useMemo' }
  - { title: 'React — React Compiler', url: 'https://react.dev/learn/react-compiler' }
---

## Measure first

Most re-renders are fast. Use the **React DevTools Profiler** ("Highlight updates", "Why did this
render?") to find components that render often *and* slowly before adding memoization.

## Structural fixes

```jsx
// ❌ typing in the input re-renders the expensive tree
function Page() {
  const [query, setQuery] = useState('')
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveChart />
    </>
  )
}

// ✅ move state down into its own component
function SearchBox() {
  const [query, setQuery] = useState('')
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

## memo, useMemo, useCallback

```jsx
const Row = memo(function Row({ item, onSelect }) {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>
})

function List({ items, filter }) {
  const visible = useMemo(() => items.filter((i) => i.name.includes(filter)), [items, filter])
  const handleSelect = useCallback((id) => console.log('selected', id), [])

  return (
    <ul>
      {visible.map((item) => (
        <Row key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </ul>
  )
}
```

## Keeping the UI responsive

```jsx
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query) // input stays snappy
  return <HeavyList query={deferredQuery} />
}
```

## The React Compiler

The React Compiler automatically memoizes components and values at build time. In projects that use
it, manual `memo`/`useMemo`/`useCallback` is mostly unnecessary — but the rules of React (pure
render, no mutation) become even more important, because the compiler relies on them.
