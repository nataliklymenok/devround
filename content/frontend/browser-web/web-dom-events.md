---
id: web-dom-events
module: web-dom-rendering
order: 1
title: DOM events, propagation and delegation
description: Capturing, target and bubbling phases, preventDefault vs stopPropagation, event delegation and passive listeners.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [web-dom-events]
references:
  - { title: 'MDN — Introduction to events', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events' }
  - { title: 'MDN — EventTarget.addEventListener()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener' }
keyTakeaways:
  - Events travel in three phases — capturing (window → target), target, bubbling (target → window).
  - event.target is where the event started; event.currentTarget is the element whose listener is running.
  - preventDefault cancels the browser's default action; stopPropagation stops the event from reaching other elements.
  - Event delegation attaches one listener to a parent and uses event.target.closest() to handle many children.
interviewQuestions:
  - question: Explain event bubbling and capturing.
    answer: |
      When an event fires on an element it first travels from `window` down to the target
      (capturing phase), runs listeners on the target, then travels back up to `window` (bubbling
      phase). `addEventListener` registers bubbling listeners by default; pass `{ capture: true }`
      for the capturing phase. Some events, such as `focus`, `blur`, `mouseenter` and `load` on
      elements, do not bubble (`focusin`/`focusout` do).
  - question: What is event delegation and why is it useful?
    answer: |
      Instead of adding a listener to every child, you add one listener to a common ancestor and
      check `event.target.closest(selector)` to find which child was interacted with. It uses less
      memory, works for elements added later, and keeps setup code simple — useful for long lists,
      tables and dynamic content.
  - question: What is the difference between preventDefault and stopPropagation?
    answer: |
      `preventDefault()` cancels the default browser behaviour (following a link, submitting a form,
      scrolling on touch) but the event keeps propagating. `stopPropagation()` stops the event from
      reaching further elements but does not cancel the default action. `stopImmediatePropagation()`
      also prevents other listeners on the same element from running.
  - question: What are passive event listeners?
    answer: |
      `{ passive: true }` promises the listener will not call `preventDefault`, so the browser can
      start scrolling immediately instead of waiting for JavaScript. Browsers make `touchstart`,
      `touchmove` and `wheel` listeners on `window`, `document` and `body` passive by default.
quiz:
  - id: q1
    question: "A click on a button inside a div with click listeners on both (no options). Which runs first?"
    options: ["The div's listener", "The button's listener", "They run in parallel", "Only the div's listener runs"]
    correct: 1
    explanation: Listeners are bubbling by default, so the target runs before its ancestors.
  - id: q2
    question: Inside a delegated listener on a ul, which property gives you the element that was actually clicked?
    options: ["event.currentTarget", "event.target", "this", "event.relatedTarget"]
    correct: 1
    explanation: currentTarget is the ul (where the listener is); target is where the event started.
  - id: q3
    question: What does preventDefault() on a link's click event do?
    options: ["Stops bubbling", "Prevents navigation but the event still bubbles", "Removes the link", "Stops all other listeners"]
    correct: 1
    explanation: preventDefault cancels the default action only.
  - id: q4
    question: Which event does NOT bubble?
    options: ["click", "input", "focus", "keydown"]
    correct: 2
    explanation: focus does not bubble; use focusin for delegation.
---

## The three phases

```js
document.querySelector('#list').addEventListener('click', () => console.log('list (bubble)'))
document.querySelector('#list').addEventListener('click', () => console.log('list (capture)'), { capture: true })
document.querySelector('#item').addEventListener('click', () => console.log('item'))

// Clicking #item inside #list logs:
// list (capture) → item → list (bubble)
```

## target vs currentTarget

```js
list.addEventListener('click', (event) => {
  event.target // the innermost element clicked, e.g. a span inside the li
  event.currentTarget // always list
})
```

## Event delegation

```js
const list = document.querySelector('#todos')

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button || !list.contains(button)) return
  const id = button.closest('li').dataset.id
  if (button.dataset.action === 'delete') deleteTodo(id)
  if (button.dataset.action === 'toggle') toggleTodo(id)
})
```

Works for items added later and needs one listener instead of hundreds.

## preventDefault vs stopPropagation

```js
form.addEventListener('submit', (event) => {
  event.preventDefault() // no page reload; event still bubbles
  save(new FormData(form))
})

menu.addEventListener('click', (event) => {
  event.stopPropagation() // e.g. keep a document-level "click outside" handler from closing it
})
```

Prefer checking `event.target` in the outer handler over `stopPropagation`, which can break other
code (analytics, other widgets) that relies on bubbling.

## Removing listeners

```js
const controller = new AbortController()
window.addEventListener('resize', onResize, { signal: controller.signal })
window.addEventListener('scroll', onScroll, { signal: controller.signal, passive: true })
controller.abort() // removes both
```
