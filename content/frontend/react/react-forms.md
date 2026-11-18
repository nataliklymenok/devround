---
id: react-forms
module: react-core
order: 4
title: Forms in React
description: Controlled vs uncontrolled inputs, form actions in React 19, validation and accessible error messages.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [react-forms]
references:
  - { title: 'React — input (controlled and uncontrolled)', url: 'https://react.dev/reference/react-dom/components/input' }
  - { title: 'React — form (actions)', url: 'https://react.dev/reference/react-dom/components/form' }
  - { title: 'React — useActionState', url: 'https://react.dev/reference/react/useActionState' }
keyTakeaways:
  - Controlled inputs keep the value in state (value + onChange); uncontrolled inputs keep it in the DOM (defaultValue, FormData, refs).
  - Never switch an input between controlled and uncontrolled — initialize state with an empty string, not undefined.
  - In React 19 a form can take an action function; useActionState tracks its result and pending state.
  - Validate on the client for UX and always again on the server; connect errors to fields with aria-describedby.
interviewQuestions:
  - question: What is the difference between controlled and uncontrolled components?
    answer: |
      A controlled input gets its `value` from React state and reports changes through `onChange`;
      React is the single source of truth, which makes instant validation, formatting and dependent
      fields easy, at the cost of a re-render per keystroke. An uncontrolled input keeps its own value
      in the DOM; you set `defaultValue` and read the value on submit (via `FormData` or a ref). It is
      simpler and fast for large forms. Libraries like React Hook Form are mostly uncontrolled.
  - question: How do form actions work in React 19?
    answer: |
      Pass a function to `form action={...}`. On submit React calls it with the `FormData`, inside a
      transition, so you can show pending state. `useActionState(action, initialState)` returns the
      last result (e.g. errors) and an `isPending` flag; `useFormStatus` lets a nested submit button read
      the pending state. With React Server Components the action can be a server function.
  - question: How do you make form validation accessible?
    answer: |
      Use real labels, mark required fields, show errors in text next to the field, link them with
      `aria-describedby` and set `aria-invalid`, move focus to the first invalid field (or to an error
      summary) on submit, and do not rely on color alone. Native constraint validation (`required`,
      `type="email"`, `pattern`) is a good baseline.
quiz:
  - id: q1
    question: "Why does React warn when you render input value={undefined} and later set a string?"
    options: ["undefined is not a valid prop", "The input switches from uncontrolled to controlled", "Strings are not allowed", "onChange is missing"]
    correct: 1
    explanation: Initialize controlled values with '' instead of undefined.
  - id: q2
    question: How do you read values of an uncontrolled form on submit?
    options: ["From React state", "new FormData(event.currentTarget) or refs", "document.cookie", "useEffect"]
    correct: 1
    explanation: Uncontrolled inputs keep their values in the DOM.
  - id: q3
    question: What does useActionState return?
    options: ["Only a dispatch function", "The current state, a wrapped action and an isPending flag", "A ref to the form", "A promise"]
    correct: 1
    explanation: "const [state, formAction, isPending] = useActionState(action, initialState)"
---

## Controlled inputs

```jsx
function EmailField() {
  const [email, setEmail] = useState('') // '' not undefined
  const invalid = email !== '' && !email.includes('@')
  return (
    <>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? 'email-error' : undefined}
      />
      {invalid && <p id="email-error">Enter a valid email address.</p>}
    </>
  )
}
```

## Uncontrolled inputs

```jsx
function SearchForm({ onSearch }) {
  function handleSubmit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onSearch(String(data.get('q')))
  }
  return (
    <form onSubmit={handleSubmit}>
      <input name="q" defaultValue="" />
      <button type="submit">Search</button>
    </form>
  )
}
```

## Actions and useActionState (React 19)

```jsx
async function subscribe(previousState, formData) {
  const email = formData.get('email')
  const res = await fetch('/api/subscribe', { method: 'POST', body: formData })
  if (!res.ok) return { error: 'Could not subscribe. Try again.' }
  return { error: null, done: true }
}

function Newsletter() {
  const [state, formAction, isPending] = useActionState(subscribe, { error: null })
  return (
    <form action={formAction}>
      <label htmlFor="nl-email">Email</label>
      <input id="nl-email" name="email" type="email" required />
      <button disabled={isPending}>{isPending ? 'Subscribing…' : 'Subscribe'}</button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.done && <p role="status">Thanks for subscribing!</p>}
    </form>
  )
}
```

`useFormStatus()` inside a child component (e.g. a reusable submit button) reads the pending state
of the parent form.

## Choosing an approach

| Need | Approach |
| --- | --- |
| Instant formatting, dependent fields | Controlled |
| Big forms, performance | Uncontrolled / React Hook Form |
| Progressive enhancement, server mutations | Form actions |
| Complex schema validation | Zod (or similar) shared with the server |
