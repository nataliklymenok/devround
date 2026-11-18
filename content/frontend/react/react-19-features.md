---
id: react-19-features
module: react-advanced
order: 2
title: What is new in React 19
description: Actions, useActionState, useFormStatus, useOptimistic, use, ref as a prop, metadata and the React Compiler.
levels: [middle, senior]
estimatedMinutes: 25
topics: [react-19]
references:
  - { title: 'React — React 19 release post', url: 'https://react.dev/blog/2024/12/05/react-19' }
  - { title: 'React — useOptimistic', url: 'https://react.dev/reference/react/useOptimistic' }
  - { title: 'React — use', url: 'https://react.dev/reference/react/use' }
keyTakeaways:
  - Actions are async functions run in transitions; React tracks pending state, errors and optimistic updates for them.
  - useOptimistic shows the expected result immediately and rolls back automatically if the action fails.
  - use reads a promise (suspending) or a context, and unlike hooks it may be called conditionally.
  - ref is a prop, Context can be rendered as a provider, and title/meta tags in components are hoisted to the head.
interviewQuestions:
  - question: What problem do Actions solve?
    answer: |
      Before React 19 every mutation needed hand-written state for pending, errors and optimistic UI,
      plus care with race conditions. Actions — async functions passed to `startTransition`,
      `form action`, or `useActionState` — let React manage the pending state, keep the UI responsive
      during the transition, reset forms after success and combine with `useOptimistic`.
  - question: How does useOptimistic work?
    answer: |
      `const [optimisticItems, addOptimistic] = useOptimistic(items, (state, newItem) => [...state,
      newItem])` returns a value that equals `items` normally. Inside an action you call
      `addOptimistic(newItem)` to show the expected result immediately; when the action finishes and
      the real `items` update (or the action fails), React switches back to the real state.
  - question: What other changes in React 19 come up in interviews?
    answer: |
      `ref` as a prop for function components (no `forwardRef`), ref cleanup functions, `Context` used
      directly as a provider, document metadata (`title`, `meta`, `link`) rendered from components,
      stylesheet and script preloading APIs, better hydration error messages, Server Components and
      Server Functions as stable features for frameworks, and the separate React Compiler that
      automates memoization.
quiz:
  - id: q1
    question: Which hook shows an expected result before the server confirms it?
    options: ["useTransition", "useOptimistic", "useDeferredValue", "useId"]
    correct: 1
    explanation: useOptimistic overlays a temporary state during an action.
  - id: q2
    question: What is special about use compared to other hooks?
    options: ["It only works in class components", "It can be called conditionally and in loops", "It runs only on the server", "It replaces useState"]
    correct: 1
    explanation: use can be called conditionally; other hooks cannot.
  - id: q3
    question: In React 19, how do you provide a context value?
    options: ["Only with Context.Provider", "Render the context directly, e.g. ThemeContext value={…}", "With useContext", "With createPortal"]
    correct: 1
    explanation: The context object itself can be rendered as a provider.
---

## Actions and transitions

```jsx
function UpdateName({ currentName }) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      const result = await updateName(name)
      if (result.error) setError(result.error)
    })

  return (
    <>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={save} disabled={isPending}>Save</button>
      {error && <p role="alert">{error}</p>}
    </>
  )
}
```

## useOptimistic

```jsx
function Messages({ messages, sendMessage }) {
  const [optimistic, addOptimistic] = useOptimistic(messages, (state, text) => [
    ...state,
    { id: crypto.randomUUID(), text, sending: true },
  ])

  async function formAction(formData) {
    const text = formData.get('text')
    addOptimistic(text) // shown immediately
    await sendMessage(text) // real state replaces it when done
  }

  return (
    <>
      {optimistic.map((m) => (
        <p key={m.id}>{m.text} {m.sending && <small>(sending…)</small>}</p>
      ))}
      <form action={formAction}>
        <input name="text" aria-label="Message" />
      </form>
    </>
  )
}
```

## use

```jsx
function Theme({ show }) {
  if (!show) return null
  const theme = use(ThemeContext) // allowed after an early return
  return <p>Theme: {theme}</p>
}
```

## Smaller changes worth knowing

```jsx
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} /> // no forwardRef
}

<ThemeContext value="dark">{children}</ThemeContext> // context as provider

function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title> {/* hoisted into head */}
      <h1>{post.title}</h1>
    </article>
  )
}
```
