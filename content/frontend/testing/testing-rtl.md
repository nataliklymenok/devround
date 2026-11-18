---
id: testing-rtl
module: testing-foundations
order: 3
title: React Testing Library
description: Query priorities, user-event, async UI with findBy and waitFor, and testing components with providers.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [testing-rtl]
references:
  - { title: 'Testing Library — Guiding Principles', url: 'https://testing-library.com/docs/guiding-principles' }
  - { title: 'Testing Library — Which query should I use?', url: 'https://testing-library.com/docs/queries/about/#priority' }
  - { title: 'Testing Library — user-event', url: 'https://testing-library.com/docs/user-event/intro' }
keyTakeaways:
  - Query the way users find things — getByRole with a name first, then label, text; getByTestId is a last resort.
  - getBy throws when missing, queryBy returns null (for asserting absence), findBy waits (async).
  - user-event simulates real interactions (typing, clicking, keyboard) more faithfully than fireEvent.
  - Wrap components in the providers they need with a custom render helper.
interviewQuestions:
  - question: What is the difference between getBy, queryBy and findBy?
    answer: |
      `getBy*` returns the element or throws immediately — use it for things that should be there.
      `queryBy*` returns `null` instead of throwing — use it to assert that something is not rendered.
      `findBy*` returns a promise that retries until the element appears or a timeout — use it for
      content that shows up after async work. Each has an `*AllBy*` variant for multiple elements.
  - question: Why prefer getByRole over getByTestId?
    answer: |
      Role queries (with an accessible name) mirror how users and assistive technologies find
      elements, so tests also verify accessibility and survive markup refactors. If a role query cannot
      find a button, a screen reader user probably cannot either. Test ids are invisible to users and
      couple tests to implementation; keep them for cases with no accessible handle.
  - question: How do you test a component that fetches data?
    answer: |
      Mock the network (MSW) to return a known response, render the component, assert the loading
      state, then `await screen.findByText(...)` for the loaded content. Test the error path by making
      the handler return an error. Avoid mocking the component's own hooks; and avoid wrapping
      everything in `waitFor` — prefer `findBy`.
quiz:
  - id: q1
    question: How do you assert that an error message is NOT shown?
    options: ["expect(screen.getByText('Error')).toBeNull()", "expect(screen.queryByText('Error')).not.toBeInTheDocument()", "await screen.findByText('Error')", "screen.getByTestId('error')"]
    correct: 1
    explanation: getBy would throw; queryBy returns null.
  - id: q2
    question: Which query is preferred for a Submit button?
    options: ["getByTestId('submit')", "getByRole('button', { name: 'Submit' })", "container.querySelector('.btn')", "getByText('Submit')"]
    correct: 1
    explanation: Role plus accessible name is the top priority.
  - id: q3
    question: Content appears after an API call. Which query fits?
    options: ["getByText", "findByText", "queryByText", "getAllByText"]
    correct: 1
    explanation: findBy waits for the element to appear.
---

## A component test

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

it('shows an error for an invalid email', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<LoginForm onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText('Email'), 'not-an-email')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email')
  expect(onSubmit).not.toHaveBeenCalled()
})
```

## Query priority

1. `getByRole('button', { name: 'Save' })`
2. `getByLabelText('Email')`
3. `getByPlaceholderText`, `getByText`, `getByDisplayValue`
4. `getByAltText`, `getByTitle`
5. `getByTestId` — last resort

## Async UI

```tsx
it('loads and shows orders', async () => {
  render(<Orders />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading')
  expect(await screen.findByRole('row', { name: /Order #1001/ })).toBeInTheDocument()
})
```

## A custom render with providers

```tsx
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}
```
