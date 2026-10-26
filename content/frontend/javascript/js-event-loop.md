---
id: js-event-loop
module: js-async
order: 1
title: The event loop, tasks and microtasks
description: Call stack, task queue, microtask queue and why promise callbacks run before setTimeout.
levels: [junior, middle, senior]
estimatedMinutes: 25
keyTakeaways:
  - JavaScript runs one call stack at a time; async work is scheduled as tasks or microtasks.
  - After each task the engine drains the entire microtask queue before rendering or running the next task.
  - Promise callbacks and queueMicrotask are microtasks; setTimeout, I/O and UI events are tasks.
  - Long synchronous work blocks rendering and input — split it up or move it to a worker.
interviewQuestions:
  - question: Explain the event loop.
    answer: |
      JavaScript executes code on a single call stack. When the stack is empty, the event loop picks
      the next **task** (macrotask) — a timer callback, an I/O callback, a UI event — and runs it.
      After every task it runs **all** queued **microtasks** (promise reactions, `queueMicrotask`,
      `MutationObserver`), then the browser may render, and the cycle repeats.
  - question: In which order are setTimeout(fn, 0) and Promise.resolve().then(fn) executed?
    answer: |
      The promise callback runs first. It is a microtask, and microtasks are drained right after the
      current script (task) finishes, before the next task — the timer callback — is picked up.
  - question: Why can a long-running loop freeze the page even with async code around it?
    answer: |
      Async callbacks only run when the call stack is empty. A long synchronous loop keeps the stack
      busy, so no timers, events or rendering can happen until it ends. Break the work into chunks
      (yielding with `setTimeout` or `scheduler.yield()` where available) or move it to a Web Worker.
  - question: Can microtasks starve the event loop?
    answer: |
      Yes. Because the microtask queue is drained completely, a microtask that keeps scheduling new
      microtasks (e.g. a recursive `.then` chain) prevents tasks and rendering from ever running.
quiz:
  - id: q1
    question: "Order of logs: console.log('A'); setTimeout(() => console.log('B')); Promise.resolve().then(() => console.log('C')); console.log('D')"
    options: ["A B C D", "A D C B", "A D B C", "A C D B"]
    correct: 1
    explanation: Synchronous code first (A, D), then microtasks (C), then the next task — the timer (B).
  - id: q2
    question: Which of these schedules a microtask?
    options: ["setTimeout", "setInterval", "queueMicrotask", "requestAnimationFrame"]
    correct: 2
    explanation: queueMicrotask (like promise reactions) adds to the microtask queue.
  - id: q3
    question: When does the browser get a chance to render?
    options: ["Between any two lines of code", "After a task and its microtasks have finished", "Only after all timers have fired", "Before each microtask"]
    correct: 1
    explanation: Rendering can happen between tasks, after the microtask queue has been drained.
  - id: q4
    question: What does setTimeout(fn, 0) guarantee?
    options: ["fn runs immediately", "fn runs after at least 0 ms, in a later task", "fn runs before pending promises", "fn runs on another thread"]
    correct: 1
    explanation: The delay is a minimum; the callback becomes a task and runs after current work and microtasks.
---

## One stack, many queues

```js
console.log('script start')

setTimeout(() => console.log('timeout'), 0) // task

Promise.resolve()
  .then(() => console.log('promise 1')) // microtask
  .then(() => console.log('promise 2')) // microtask

console.log('script end')

// script start
// script end
// promise 1
// promise 2
// timeout
```

The whole script is itself a task. When it finishes, the engine drains **all** microtasks
(`promise 1`, then the newly queued `promise 2`) before taking the next task (`timeout`).

## Tasks vs microtasks

| Tasks (macrotasks) | Microtasks |
| --- | --- |
| `setTimeout`, `setInterval` | Promise `.then` / `catch` / `finally` |
| I/O callbacks, `MessageChannel` | `await` continuations |
| UI events (click, input) | `queueMicrotask`, `MutationObserver` |

## async/await is microtasks too

```js
async function run() {
  console.log(1)
  await null // the rest of the function becomes a microtask
  console.log(3)
}
run()
console.log(2) // 1, 2, 3
```

## Keeping the UI responsive

```js
async function processInChunks(items, chunkSize = 500) {
  for (let i = 0; i < items.length; i += chunkSize) {
    items.slice(i, i + chunkSize).forEach(processItem)
    await new Promise((resolve) => setTimeout(resolve)) // yield a task so the page can render
  }
}
```

Note that yielding with `await Promise.resolve()` would **not** help — it only schedules a microtask,
which still runs before rendering.
