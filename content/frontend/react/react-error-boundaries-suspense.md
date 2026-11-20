---
id: react-error-boundaries-suspense
module: react-advanced
order: 1
title: Error boundaries, Suspense and lazy loading
description: Catching render errors, showing fallbacks while code or data loads, and splitting bundles with lazy.
levels: [middle, senior]
estimatedMinutes: 25
topics: [react-error-boundaries-suspense]
reviewed: 2026-11-20
references:
  - { title: 'React — Catching rendering errors with an error boundary', url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary' }
  - { title: 'React — Suspense', url: 'https://react.dev/reference/react/Suspense' }
  - { title: 'React — lazy', url: 'https://react.dev/reference/react/lazy' }
keyTakeaways:
  - Error boundaries catch errors during rendering, in lifecycle methods and in constructors below them — not in event handlers or async code.
  - Error boundaries are still class components (or a library such as react-error-boundary).
  - Suspense shows a fallback while children wait for lazy code or data from a Suspense-enabled source.
  - Place boundaries where a partial failure or loading state makes sense for the user, not around every component.
interviewQuestions:
  - question: Which errors does an error boundary catch?
    answer: |
      Errors thrown while rendering, in lifecycle methods and in constructors of components in the tree
      below it. It does not catch errors in event handlers, in asynchronous code (timers, promises) or
      in server-side rendering, nor errors in the boundary itself. Handle those with try/catch or by
      storing the error in state and throwing it during render.
  - question: How do Suspense and lazy work together?
    answer: |
      `lazy(() => import('./Chart'))` creates a component whose code is loaded on first render. While
      the chunk is loading, the component suspends, and the nearest `Suspense` boundary shows its
      `fallback`. When the code arrives, React renders the real component. This splits the bundle per
      route or heavy widget.
  - question: Can Suspense be used for data fetching?
    answer: |
      Yes, with Suspense-enabled data sources: frameworks (Next.js server components and loaders),
      libraries such as TanStack Query's `useSuspenseQuery`, or React 19's `use(promise)` with a promise
      created outside the component (and cached). Plain `useEffect` fetching does not suspend.
quiz:
  - id: q1
    question: Which error is caught by an error boundary?
    options: ["An error in an onClick handler", "An error thrown during rendering of a child", "A rejected promise in useEffect", "A network error in fetch"]
    correct: 1
    explanation: Error boundaries catch rendering errors only.
  - id: q2
    question: What does Suspense show while a lazy component's code is loading?
    options: ["Nothing", "Its fallback prop", "The previous page", "An error"]
    correct: 1
    explanation: The nearest Suspense boundary renders its fallback.
  - id: q3
    question: How are error boundaries written in React 19?
    options: ["With a useErrorBoundary hook built into React", "As class components with getDerivedStateFromError / componentDidCatch (or via a library)", "With Suspense", "With useEffect"]
    correct: 1
    explanation: There is still no built-in hook; classes or libraries are used.
---

## An error boundary

```jsx
class ErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error } // render the fallback on the next render
  }

  componentDidCatch(error, info) {
    reportError(error, info.componentStack) // logging
  }

  render() {
    if (this.state.error) return this.props.fallback ?? <p>Something went wrong.</p>
    return this.props.children
  }
}
```

Many teams use `react-error-boundary`, which adds `resetKeys` and a `FallbackComponent` with a reset
button.

## Where to place boundaries

```jsx
<Layout>
  <ErrorBoundary fallback={<SidebarError />}>
    <Sidebar />
  </ErrorBoundary>
  <ErrorBoundary fallback={<FeedError />}>
    <Feed />
  </ErrorBoundary>
</Layout>
```

One broken widget should not blank the whole page.

## lazy + Suspense

```jsx
const Analytics = lazy(() => import('./Analytics'))

function Dashboard() {
  return (
    <Suspense fallback={<Spinner label="Loading charts…" />}>
      <Analytics />
    </Suspense>
  )
}
```

## Suspense for data (React 19 use)

```jsx
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise) // suspends until resolved
  return comments.map((c) => <p key={c.id}>{c.text}</p>)
}

// The promise is created by a parent, a router loader or a cache — not inside Comments
<Suspense fallback={<p>Loading comments…</p>}>
  <Comments commentsPromise={commentsPromise} />
</Suspense>
```
