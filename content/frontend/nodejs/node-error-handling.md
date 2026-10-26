---
id: node-error-handling
module: node-web
order: 2
title: Error handling in Node.js
description: Operational vs programmer errors, async error propagation, unhandled rejections and error responses.
levels: [junior, middle, senior]
estimatedMinutes: 25
keyTakeaways:
  - Operational errors (network down, invalid input) are expected and handled; programmer errors are bugs.
  - Await every promise — an un-awaited rejection escapes try/catch and becomes an unhandled rejection.
  - Since Node 15 an unhandled rejection crashes the process by default.
  - Log the details on the server, return a safe message to the client, never leak stack traces.
interviewQuestions:
  - question: What is the difference between operational and programmer errors?
    answer: |
      Operational errors are runtime problems a correct program must expect: invalid user input, a
      timeout, a full disk, a 404 from another service. You handle them — retry, return 4xx, show a
      message. Programmer errors are bugs: reading a property of `undefined`, passing the wrong type.
      You fix the code; at runtime the safest reaction is often to log and let the process restart.
  - question: What happens to an unhandled promise rejection in modern Node?
    answer: |
      Since Node 15 the default mode is `throw`: an unhandled rejection is raised as an uncaught
      exception and the process exits with a non-zero code. Process managers (Kubernetes, systemd,
      PM2) restart it. Handle rejections where they happen; use `process.on('unhandledRejection')`
      only for logging before exiting.
  - question: How should an API return errors?
    answer: |
      With the correct HTTP status and a consistent JSON body, e.g.
      `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`. Details useful for debugging
      (stack trace, SQL, internal ids) go to logs with a request id, not to the client.
  - question: Why should you throw Error objects instead of strings?
    answer: |
      `Error` objects carry a stack trace and a `name`, work with `instanceof` checks and can be
      extended with fields (`statusCode`, `code`) or chained with `cause`. Thrown strings lose all of
      that and make debugging much harder.
quiz:
  - id: q1
    question: "try { saveUser(user) } catch (e) { ... } — saveUser is async and rejects. What happens?"
    options: ["The catch block runs", "The rejection is unhandled — the promise was not awaited", "Node retries the call", "The error is ignored silently and safely"]
    correct: 1
    explanation: Without await the try/catch only covers starting the call, not its rejection.
  - id: q2
    question: Which is an operational error?
    options: ["Calling undefined as a function", "A typo in a variable name", "A third-party API timing out", "Passing a string where a number is expected"]
    correct: 2
    explanation: Timeouts are expected runtime conditions you must handle.
  - id: q3
    question: What should a 500 response body contain?
    options: ["The full stack trace", "The SQL query that failed", "A generic message and a request id", "Environment variables for debugging"]
    correct: 2
    explanation: Keep internals in logs; give the client something safe and traceable.
  - id: q4
    question: How do you attach the original error when wrapping it?
    options: ["new Error(msg, { cause: original })", "new Error(msg + original)", "Error.wrap(original)", "original.parent = new Error(msg)"]
    correct: 0
    explanation: The cause option preserves the original error chain.
---

## Two kinds of errors

```js
// Operational: expected, handle it
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
  if (!res.ok) throw new Error(`Upstream returned ${res.status}`)
} catch (error) {
  throw new ServiceUnavailableError('Payments are temporarily unavailable', { cause: error })
}

// Programmer error: a bug — fix the code instead of catching it
user.profile.name // TypeError when profile is undefined
```

## Custom error classes

```js
export class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL', cause } = {}) {
    super(message, { cause })
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

throw new AppError('Order not found', { statusCode: 404, code: 'NOT_FOUND' })
```

## Async errors must be awaited

```js
// ❌ the rejection escapes
try {
  sendEmail(user)
} catch {}

// ✅
try {
  await sendEmail(user)
} catch (error) {
  logger.warn({ err: error }, 'welcome email failed') // not fatal for sign-up
}
```

## Centralized handling and last resorts

```js
app.setErrorHandler((error, request, reply) => {
  const status = error.statusCode ?? 500
  if (status >= 500) request.log.error({ err: error }, 'request failed')
  reply.status(status).send({
    error: { code: error.code ?? 'INTERNAL', message: status >= 500 ? 'Something went wrong' : error.message },
  })
})

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandled rejection')
  process.exit(1) // let the process manager restart a clean process
})
```
