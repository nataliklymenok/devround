---
id: node-runtime-event-loop
module: node-runtime
order: 1
title: The Node.js runtime and event loop
description: V8, libuv, the thread pool, event loop phases and why you must not block the main thread.
levels: [junior, middle, senior]
estimatedMinutes: 25
keyTakeaways:
  - Node runs your JavaScript on one main thread; libuv handles I/O asynchronously around it.
  - Some work (file system, DNS lookup, crypto, zlib) runs on libuv's thread pool, four threads by default.
  - process.nextTick callbacks run before promise microtasks, which run before the next event loop phase.
  - CPU-heavy work blocks every request — offload it to worker threads or another service.
interviewQuestions:
  - question: Node.js is single-threaded — how can it handle thousands of connections?
    answer: |
      Your JavaScript runs on a single thread, but I/O is non-blocking: Node asks the operating system
      (through libuv) to perform network and file operations and continues running other code. When an
      operation completes, its callback is queued and executed by the event loop. As long as callbacks
      are short, one thread can serve many concurrent connections.
  - question: Name the main phases of the Node.js event loop.
    answer: |
      Timers (`setTimeout`/`setInterval` callbacks), pending callbacks, poll (retrieve new I/O events
      and run their callbacks), check (`setImmediate`), and close callbacks. Between each callback,
      Node drains the `process.nextTick` queue and then the promise microtask queue.
  - question: What happens if you run a CPU-intensive loop in a request handler?
    answer: |
      The main thread is busy, so the event loop cannot process any other events — every other
      request, timer and I/O callback waits. Latency spikes for all users. Move such work to
      `worker_threads`, a job queue, or a separate service, or break it into chunks.
  - question: What is the difference between setImmediate and setTimeout(fn, 0)?
    answer: |
      `setImmediate` runs in the check phase, right after the poll phase; `setTimeout(fn, 0)` runs in
      the timers phase of a later iteration (with a minimum delay of about 1 ms). Inside an I/O
      callback `setImmediate` always runs first; in the main module their order is not guaranteed.
quiz:
  - id: q1
    question: Which runs first?
    options: ["setTimeout(fn, 0)", "setImmediate(fn)", "Promise.resolve().then(fn)", "process.nextTick(fn)"]
    correct: 3
    explanation: The nextTick queue is drained first, then promise microtasks, then event loop phases.
  - id: q2
    question: Which of these uses the libuv thread pool?
    options: ["Incoming TCP connections", "fs.readFile", "setTimeout", "Array.prototype.map"]
    correct: 1
    explanation: File system operations (and DNS lookup, crypto, zlib) run on the thread pool; network sockets use OS async I/O.
  - id: q3
    question: What is the main risk of a synchronous, CPU-heavy computation in an API route?
    options: ["It uses more memory", "It blocks all other requests until it finishes", "It crashes Node immediately", "Nothing — Node parallelizes it"]
    correct: 1
    explanation: The single JavaScript thread cannot process other events while it is busy.
  - id: q4
    question: Which module lets you run JavaScript in parallel threads?
    options: ["cluster", "worker_threads", "child_process only", "events"]
    correct: 1
    explanation: worker_threads run JS on separate threads; cluster forks separate processes.
topics: [node-event-loop]
references:
  - { title: 'Node.js — The Node.js Event Loop', url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick' }
  - { title: 'Node.js — Don''t Block the Event Loop', url: 'https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop' }
---

## The pieces

- **V8** executes your JavaScript.
- **libuv** provides the event loop, asynchronous I/O and a small **thread pool** (4 threads by
  default, `UV_THREADPOOL_SIZE`) for operations without async OS APIs: file system, DNS lookup,
  crypto, compression.
- **Node APIs** (`fs`, `http`, `net`, ...) connect the two.

## Event loop phases

```text
┌─> timers          (setTimeout / setInterval)
│   pending callbacks
│   poll            (new I/O events; waits here when idle)
│   check           (setImmediate)
└── close callbacks (socket.on('close'))
```

Between every callback Node drains `process.nextTick` callbacks, then promise microtasks.

```js
setTimeout(() => console.log('timeout'), 0)
setImmediate(() => console.log('immediate'))
Promise.resolve().then(() => console.log('promise'))
process.nextTick(() => console.log('nextTick'))
console.log('sync')
// sync, nextTick, promise, then timeout/immediate (order of these two varies in the main module)
```

## Do not block the loop

```js
import { Worker } from 'node:worker_threads'

// ❌ blocks every request while hashing
app.post('/report', (req, res) => {
  const result = heavyComputation(req.body) // e.g. 2 seconds of CPU
  res.json(result)
})

// ✅ run CPU-bound work in a worker thread
function runInWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./heavy-worker.js', import.meta.url), { workerData: data })
    worker.once('message', resolve)
    worker.once('error', reject)
  })
}
```

Prefer the async versions of APIs (`fs/promises`) in servers; `readFileSync` is fine in startup
scripts, but not in request handlers.
