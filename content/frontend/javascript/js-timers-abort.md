---
id: js-timers-abort
module: js-async
order: 3
title: Timers, debounce, throttle and cancellation
description: setTimeout and setInterval details, debounce vs throttle, requestAnimationFrame and AbortController.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [js-timers-abort]
reviewed: 2026-11-20
references:
  - { title: 'MDN — setTimeout()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout' }
  - { title: 'MDN — requestAnimationFrame()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame' }
  - { title: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' }
keyTakeaways:
  - A timer delay is a minimum, not a guarantee; callbacks run only when the call stack is free.
  - Debounce waits for a pause in events (search input); throttle limits the rate during a burst (scroll, resize).
  - requestAnimationFrame runs right before the next paint — use it for visual updates and animations.
  - AbortController cancels fetch requests and removes event listeners through a single signal.
interviewQuestions:
  - question: What is the difference between debounce and throttle?
    answer: |
      Debounce delays the call until no new events arrived for `wait` ms — only the last event in a
      burst triggers it (search-as-you-type, auto-save). Throttle guarantees at most one call per
      `wait` ms while events keep coming (scroll position, resize, analytics). Both reduce work, but
      debounce reacts after the user stops, throttle reacts regularly during activity.
  - question: Why is setInterval risky for polling, and what would you use instead?
    answer: |
      `setInterval` fires regardless of whether the previous async work finished, so slow requests can
      overlap and pile up, and background tabs throttle it. A recursive `setTimeout` scheduled after
      each request completes (with backoff on errors) avoids overlap; pausing when the tab is hidden
      (`visibilitychange`) saves resources.
  - question: How do you cancel a fetch request?
    answer: |
      Create an `AbortController`, pass `controller.signal` to `fetch`, and call `controller.abort()`.
      The promise rejects with an `AbortError`, which you usually ignore. `AbortSignal.timeout(ms)`
      creates a signal that aborts automatically, and `AbortSignal.any([...])` combines signals.
quiz:
  - id: q1
    question: A search box should query the API only after the user stops typing for 300 ms. Which technique fits?
    options: ["Throttle", "Debounce", "setInterval", "requestAnimationFrame"]
    correct: 1
    explanation: Debounce fires once after the events pause.
  - id: q2
    question: When does a requestAnimationFrame callback run?
    options: ["Immediately", "Before the next repaint", "After all timers", "Only in Web Workers"]
    correct: 1
    explanation: rAF callbacks run once per frame right before the browser paints.
  - id: q3
    question: What happens to a fetch promise when its AbortController is aborted?
    options: ["It resolves with null", "It rejects with an AbortError", "It keeps running in the background and resolves later", "Nothing"]
    correct: 1
    explanation: Aborting rejects the promise with a DOMException named AbortError.
  - id: q4
    question: "setTimeout(fn, 0) inside a long synchronous loop runs…"
    options: ["During the loop", "After the loop and the current task finish", "Before the loop starts", "Never"]
    correct: 1
    explanation: Timer callbacks wait until the call stack is empty.
---

## Timers are minimums

```js
const start = performance.now()
setTimeout(() => console.log(performance.now() - start), 0) // ≥ 0 ms, often more
```

Nested timers are clamped to at least 4 ms, and background tabs throttle timers to save power.

## Debounce vs throttle

```js
function debounce(fn, wait) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}

function throttle(fn, wait) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= wait) {
      last = now
      fn.apply(this, args)
    }
  }
}

input.addEventListener('input', debounce((e) => search(e.target.value), 300))
window.addEventListener('scroll', throttle(updateProgressBar, 100))
```

Production throttles often also run a trailing call so the final position is not missed.

## Polling without overlap

```js
async function poll(signal) {
  while (!signal.aborted) {
    await refresh()
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}
```

## requestAnimationFrame

```js
function animate(element) {
  let x = 0
  function frame() {
    x += 2
    element.style.transform = `translateX(${x}px)`
    if (x < 300) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
```

## AbortController

```js
let controller

async function search(query) {
  controller?.abort() // cancel the previous request
  controller = new AbortController()
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
    })
    render(await res.json())
  } catch (error) {
    if (error.name !== 'AbortError') showError(error)
  }
}
```
