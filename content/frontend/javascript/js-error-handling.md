---
id: js-error-handling
module: js-fundamentals
order: 7
title: Error handling
description: try/catch/finally, error types, custom errors with cause, async errors and global handlers in the browser.
levels: [junior, middle, senior]
estimatedMinutes: 20
topics: [js-error-handling]
reviewed: 2026-11-20
references:
  - { title: 'MDN — Control flow and error handling', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling' }
  - { title: 'MDN — Error', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error' }
  - { title: 'MDN — Window: unhandledrejection event', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event' }
keyTakeaways:
  - finally always runs — use it for cleanup; a return inside finally overrides the try/catch result.
  - Throw Error objects (or subclasses), never strings, so you keep the stack trace and can use instanceof.
  - Wrap low-level errors with new Error(message, { cause }) to keep the original.
  - try/catch only catches async errors you await; unhandled rejections reach window's unhandledrejection event.
interviewQuestions:
  - question: How do you create a custom error type?
    answer: |
      Extend `Error`, set `name`, and add the fields callers need:
      `class ValidationError extends Error { constructor(message, field) { super(message);
      this.name = 'ValidationError'; this.field = field } }`. Callers can then branch with
      `instanceof ValidationError`. Pass `{ cause }` to `super` when wrapping another error.
  - question: Will try/catch catch an error thrown inside a setTimeout callback or a promise?
    answer: |
      Not by itself. The callback runs later on a different stack, after the `try` block has
      finished. For promises, `await` them inside the `try` (or attach `.catch`). For callbacks,
      handle the error inside the callback. Errors nobody catches surface as `error` /
      `unhandledrejection` events on `window`.
  - question: How would you report errors from a production frontend?
    answer: |
      Catch expected failures close to where they happen and show a helpful UI state. For everything
      else, register `window.addEventListener('error', ...)` and `'unhandledrejection'` (or use an
      error-tracking SDK) to send the message, stack, URL, user agent and release version to a
      backend, upload source maps so stacks are readable, and avoid sending personal data.
quiz:
  - id: q1
    question: "function f() { try { return 'try' } finally { return 'finally' } } — what does f() return?"
    options: ["'try'", "'finally'", "undefined", "It throws"]
    correct: 1
    explanation: A return in finally overrides the earlier return value.
  - id: q2
    question: What is the main problem with throw 'Something failed'?
    options: ["It is a syntax error", "Strings cannot be caught", "You lose the stack trace and instanceof checks", "It stops the event loop"]
    correct: 2
    explanation: Throw Error objects so you keep the stack and the type.
  - id: q3
    question: "try { fetchData() } catch (e) { … } — fetchData is async and rejects. What happens?"
    options: ["The catch block runs", "The rejection is unhandled because the promise is not awaited", "The page reloads", "The error is ignored safely"]
    correct: 1
    explanation: Without await the try only covers starting the call.
---

## try / catch / finally

```js
function readSettings(raw) {
  try {
    return JSON.parse(raw)
  } catch (error) {
    if (error instanceof SyntaxError) return {} // expected: fall back to defaults
    throw error // unexpected: let it propagate
  } finally {
    console.debug('settings parsed') // always runs
  }
}
```

## Custom errors and cause

```js
class HttpError extends Error {
  constructor(status, message, options) {
    super(message, options)
    this.name = 'HttpError'
    this.status = status
  }
}

async function getUser(id) {
  let res
  try {
    res = await fetch(`/api/users/${id}`)
  } catch (error) {
    throw new Error('Network request failed', { cause: error })
  }
  if (!res.ok) throw new HttpError(res.status, `Request failed with ${res.status}`)
  return res.json()
}
```

## Async errors

```js
// ✅ awaited inside try
try {
  await getUser(1)
} catch (error) {
  if (error instanceof HttpError && error.status === 404) showNotFound()
  else showGenericError()
}

// ✅ or a .catch on the promise you do not await
saveDraft().catch(reportError)
```

## Global handlers

```js
window.addEventListener('error', (event) => report(event.error ?? event.message))
window.addEventListener('unhandledrejection', (event) => report(event.reason))
```

In React, error boundaries catch rendering errors; event-handler and async errors still need the
techniques above.
