---
id: testing-unit
module: testing-foundations
order: 2
title: Unit tests with Vitest
description: Structure, assertions, mocks and spies, module mocking, fake timers and async tests in Vitest (Jest-compatible API).
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [testing-unit]
reviewed: 2026-11-20
references:
  - { title: 'Vitest — Getting Started', url: 'https://vitest.dev/guide/' }
  - { title: 'Vitest — Mocking', url: 'https://vitest.dev/guide/mocking' }
keyTakeaways:
  - Arrange, act, assert — one behaviour per test with a descriptive name.
  - vi.fn creates spies/mocks; vi.mock replaces whole modules; restore mocks between tests.
  - Fake timers (vi.useFakeTimers) make debounce, throttle and timeouts deterministic.
  - Always await async code or return the promise; use rejects/resolves for promise assertions.
interviewQuestions:
  - question: What is the difference between a stub, a spy and a mock?
    answer: |
      A stub returns canned answers to replace a dependency. A spy records how a function was called
      (arguments, count) and may call through to the real implementation. A mock is a fake with
      expectations about how it is called. In Vitest and Jest `vi.fn()`/`jest.fn()` can play all three
      roles, and `vi.spyOn(obj, 'method')` wraps an existing method.
  - question: How do you test code that uses setTimeout?
    answer: |
      Enable fake timers with `vi.useFakeTimers()`, run the code, then advance time with
      `vi.advanceTimersByTime(ms)` (or `vi.runAllTimers()`), assert, and restore real timers in
      `afterEach`. With promises involved, use the async variants such as
      `await vi.advanceTimersByTimeAsync(ms)`.
  - question: When should you mock a module?
    answer: |
      When the real module is slow, non-deterministic or has side effects you cannot control in tests —
      network clients, analytics, date/random providers, browser APIs missing in jsdom. Avoid mocking
      the code under test or its close collaborators; prefer passing dependencies in. For HTTP, mocking
      at the network level (MSW) keeps tests closer to reality than mocking the fetch wrapper.
quiz:
  - id: q1
    question: Which API advances fake timers by 300 ms in Vitest?
    options: ["vi.sleep(300)", "vi.advanceTimersByTime(300)", "setTimeout(300)", "vi.tick(300)"]
    correct: 1
    explanation: Enable vi.useFakeTimers() first.
  - id: q2
    question: How do you assert that an async function rejects?
    options: ["expect(fn()).toThrow()", "await expect(fn()).rejects.toThrow('message')", "expect(await fn()).toBe(false)", "try/catch without assertions"]
    correct: 1
    explanation: Use the rejects modifier and await it.
  - id: q3
    question: What does vi.spyOn(console, 'error') let you do?
    options: ["Delete console.error", "Observe calls to console.error (and optionally replace its implementation)", "Mock the whole console module", "Nothing"]
    correct: 1
    explanation: Spies wrap existing methods.
---

## Structure

```ts
import { describe, expect, it } from 'vitest'
import { formatPrice } from './format-price'

describe('formatPrice', () => {
  it('formats cents as a currency string', () => {
    expect(formatPrice(123456, 'EUR', 'de-DE')).toBe('1.234,56 €')
  })

  it('throws for negative amounts', () => {
    expect(() => formatPrice(-1, 'EUR')).toThrow(RangeError)
  })
})
```

## Mocks and spies

```ts
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => vi.restoreAllMocks())

it('notifies subscribers', () => {
  const listener = vi.fn()
  const store = createStore()
  store.subscribe(listener)
  store.set('theme', 'dark')
  expect(listener).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledWith({ theme: 'dark' })
})

vi.mock('./analytics', () => ({ track: vi.fn() })) // module mock (hoisted)
```

## Fake timers

```ts
it('debounces calls', () => {
  vi.useFakeTimers()
  const fn = vi.fn()
  const debounced = debounce(fn, 300)
  debounced('a')
  debounced('b')
  vi.advanceTimersByTime(299)
  expect(fn).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(fn).toHaveBeenCalledWith('b')
  vi.useRealTimers()
})
```

## Async

```ts
it('loads a user', async () => {
  await expect(loadUser('1')).resolves.toMatchObject({ id: '1' })
  await expect(loadUser('missing')).rejects.toThrow('Not found')
})
```
