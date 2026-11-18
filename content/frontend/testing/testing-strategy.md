---
id: testing-strategy
module: testing-foundations
order: 1
title: Testing strategy
description: The testing pyramid and trophy, what each test type is good at, what to test in a frontend, and why coverage is not a goal.
levels: [junior, middle, senior]
estimatedMinutes: 20
topics: [testing-strategy]
references:
  - { title: 'Kent C. Dodds — The Testing Trophy and Testing Classifications', url: 'https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications' }
  - { title: 'Martin Fowler — The Practical Test Pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' }
keyTakeaways:
  - Unit tests are fast and precise, integration tests check pieces working together, E2E tests prove real user journeys.
  - For UI code the "testing trophy" favors integration tests that render components with real children and mock only the network.
  - Test behaviour users and callers rely on, not implementation details.
  - Coverage shows what is not tested; high coverage does not prove the tests are meaningful.
interviewQuestions:
  - question: How do you decide what to test in a frontend application?
    answer: |
      Start from risk and value: critical user journeys (sign-in, checkout) get a few E2E tests;
      components and features get integration tests through their public behaviour (render, interact,
      assert what the user sees); pure logic (formatters, reducers, validation) gets fast unit tests.
      Skip testing third-party libraries and trivial markup. Every bug fix gets a test that would have
      caught it.
  - question: What is the difference between the test pyramid and the testing trophy?
    answer: |
      The pyramid says: many unit tests, fewer integration tests, very few E2E tests — because higher
      levels are slower and more brittle. The trophy (popular for frontend) adds static analysis at the
      base (TypeScript, ESLint) and puts the most weight on integration tests, since they give the best
      confidence-to-cost ratio for UI code where units are tiny and wiring is where bugs live.
  - question: What makes a good test?
    answer: |
      It fails when behaviour breaks and only then (no false positives on refactors), it is readable as
      documentation (arrange, act, assert), deterministic (no real time, network or random data), fast,
      and isolated from other tests' state. Tests coupled to internals — component state, private
      functions, CSS class names — break on refactors without catching bugs.
quiz:
  - id: q1
    question: Which test type gives the best confidence-to-cost ratio for typical React features according to the testing trophy?
    options: ["Unit tests of hooks internals", "Integration tests rendering the feature and mocking only the network", "Snapshot tests of every component", "Only E2E tests"]
    correct: 1
    explanation: Integration tests exercise real wiring without the cost of a full browser stack.
  - id: q2
    question: Your coverage is 95%. What does it guarantee?
    options: ["No bugs", "That 95% of lines ran during tests — not that behaviour was asserted", "Fast tests", "Accessibility"]
    correct: 1
    explanation: Coverage measures execution, not assertion quality.
  - id: q3
    question: Which is an implementation detail you should avoid asserting?
    options: ["The text shown after submitting", "A component's internal state variable", "That an error message appears", "That a request was sent with the right body"]
    correct: 1
    explanation: Users and callers cannot observe internal state directly.
---

## Test types

| Type | Scope | Speed | Typical tools |
| --- | --- | --- | --- |
| Static | Types, lint | Instant | TypeScript, ESLint |
| Unit | One function/module | ms | Vitest, Jest |
| Integration | Component + children + store, network mocked | ms–s | Testing Library, MSW |
| E2E | Real app in a browser | s | Playwright, Cypress |

## A balanced frontend suite

```text
         E2E   ← a handful of critical journeys
     Integration ← most tests: features through their UI
       Unit     ← pure logic, edge cases
      Static    ← TypeScript strict + ESLint
```

## Behaviour, not implementation

```tsx
// ❌ coupled to internals
expect(wrapper.state('isOpen')).toBe(true)

// ✅ what the user sees
await user.click(screen.getByRole('button', { name: 'Show details' }))
expect(screen.getByRole('region', { name: 'Details' })).toBeVisible()
```

## Signals of a healthy suite

- Runs on every PR and is fast enough that people run it locally
- Fails for real regressions, rarely for refactors
- Flaky tests are fixed or quarantined immediately, never ignored
