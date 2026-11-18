---
id: testing-mocking-msw
module: testing-advanced
order: 1
title: Test doubles and mocking the network with MSW
description: Choosing what to mock, why mocking at the network level is more realistic, and MSW handlers for tests and development.
levels: [middle, senior]
estimatedMinutes: 20
topics: [testing-mocking]
references:
  - { title: 'Mock Service Worker — Documentation', url: 'https://mswjs.io/docs/' }
  - { title: 'Martin Fowler — Mocks Aren’t Stubs', url: 'https://martinfowler.com/articles/mocksArentStubs.html' }
keyTakeaways:
  - Mock the boundaries you do not control (network, time, randomness), not the code you are testing.
  - MSW intercepts requests at the network level, so your real fetch/axios/query code runs in tests.
  - Define default happy-path handlers and override them per test with server.use for errors and edge cases.
  - Fail tests on unhandled requests so missing mocks are noticed.
interviewQuestions:
  - question: Why mock at the network level instead of mocking your API client module?
    answer: |
      Mocking the client module replaces your request-building, headers, error mapping and caching
      code, so tests pass even if that code is broken. With MSW, the real code sends a real request
      that is intercepted and answered by a handler, so the tests cover more of the actual behaviour,
      and the same handlers can power local development and Storybook.
  - question: How do you test error states with MSW?
    answer: |
      Keep default handlers for success, then in the specific test call `server.use(http.get(url, () =>
      HttpResponse.json({ message: 'Oops' }, { status: 500 })))` to override for that test only.
      `server.resetHandlers()` in `afterEach` restores the defaults. You can also simulate network
      errors with `HttpResponse.error()` and delays with `await delay()`.
  - question: What are the risks of mocking too much?
    answer: |
      Tests verify your assumptions rather than reality: mocks drift from the real API, internal
      refactors break tests, and integration bugs slip through. Mitigate with contract tests or typed
      API schemas shared between client and server, and a few E2E tests against the real backend.
quiz:
  - id: q1
    question: What does MSW intercept?
    options: ["React component renders", "Network requests made by your code", "CSS imports", "Console output"]
    correct: 1
    explanation: MSW answers HTTP requests with handlers.
  - id: q2
    question: How do you override a handler for a single test?
    options: ["Edit the global handler file", "server.use(...) inside the test", "vi.mock('msw')", "Restart the server"]
    correct: 1
    explanation: server.use prepends runtime handlers until resetHandlers.
  - id: q3
    question: Which dependency is a good candidate to mock?
    options: ["The function under test", "The current time and the network", "Your own pure helpers", "The React library"]
    correct: 1
    explanation: Mock non-deterministic boundaries.
---

## Handlers

```ts
// test/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/orders', () =>
    HttpResponse.json([{ id: '1001', total: 42 }]),
  ),
  http.post('/api/orders', async ({ request }) => {
    const body = (await request.json()) as { productId: string }
    return HttpResponse.json({ id: '1002', ...body }, { status: 201 })
  }),
]
```

## Test setup (Node)

```ts
// test/setup.ts
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Overriding per test

```tsx
it('shows an error when orders fail to load', async () => {
  server.use(http.get('/api/orders', () => HttpResponse.json({ message: 'Down' }, { status: 500 })))
  render(<Orders />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load orders')
})
```

The browser version (`setupWorker`) uses a Service Worker so the same handlers mock the API during
local development.
