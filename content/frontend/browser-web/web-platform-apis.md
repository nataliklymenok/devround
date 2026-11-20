---
id: web-platform-apis
module: web-dom-rendering
order: 4
title: Browser APIs interviewers ask about
description: Attributes vs properties, innerHTML vs textContent, the History API, postMessage between windows, fetch vs XMLHttpRequest, Intl, and canvas vs SVG.
levels: [junior, middle]
estimatedMinutes: 25
topics: [web-platform-apis]
reviewed: 2026-11-20
references:
  - { title: 'MDN — HTML attribute reference: content vs IDL attributes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes' }
  - { title: 'MDN — History API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/History_API' }
  - { title: 'MDN — Window.postMessage()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage' }
  - { title: 'MDN — Using the Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' }
  - { title: 'MDN — Intl', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl' }
keyTakeaways:
  - Attributes are the HTML source; properties are live values on the DOM object — `value` the property changes as the user types, the attribute does not.
  - Use textContent for text; innerHTML parses HTML and is an XSS risk with untrusted data.
  - pushState changes the URL without a request; popstate fires on back/forward — the basis of client-side routing.
  - postMessage is the safe way for windows and iframes on different origins to talk — always check event.origin.
  - fetch rejects only on network errors, not on 404 or 500 — check response.ok.
interviewQuestions:
  - question: What is the difference between an attribute and a property in the DOM?
    answer: |
      Attributes are written in HTML and read with `getAttribute`; they are always strings. Properties
      are fields of the DOM object, can have any type, and reflect the current state. Many are linked
      (`id`, `href`), but not always one to one: for an input, the `value` attribute is the initial
      value while the `value` property is what the user has typed; `checked` works the same way. The
      `href` property returns the resolved absolute URL while the attribute keeps what was written.
  - question: What is the difference between innerHTML and textContent?
    answer: |
      `textContent` reads or writes plain text — writing it never creates elements, so it is safe for
      user data. `innerHTML` parses a string as HTML and replaces the children, which runs the HTML
      parser, destroys existing nodes and listeners, and can execute attacker-controlled markup (XSS)
      if the string contains untrusted data. `innerText` is layout-aware (ignores hidden text) and
      therefore slower.
  - question: How does client-side routing work without reloading the page?
    answer: |
      The router intercepts link clicks, calls `history.pushState(state, '', url)` to change the URL
      and add a history entry without a request, and renders the matching view. When the user presses
      back or forward, the browser fires `popstate` and the router renders the view for the restored
      URL. `replaceState` updates the current entry without adding one (for example to sync filters).
      The server must return the app's HTML for every route so a refresh or a shared link works.
  - question: How can a page and an iframe on another origin communicate?
    answer: |
      Through `postMessage`: the sender calls `otherWindow.postMessage(data, targetOrigin)` and the
      receiver listens to `message` events. The data is structured-cloned, not shared. The receiver
      must check `event.origin` (and usually `event.source`) and validate the payload; the sender
      should pass an exact `targetOrigin` rather than `'*'` when the data is sensitive. Direct access
      to the other window's DOM is blocked by the same-origin policy.
  - question: What are the differences between fetch and XMLHttpRequest?
    answer: |
      `fetch` is promise-based, has a cleaner API with `Request`/`Response` objects, supports streams,
      and is cancelled with `AbortController`. It rejects only on network failures — an HTTP error
      status still resolves, so you check `response.ok`. It does not send cookies cross-origin unless
      `credentials: 'include'`. `XMLHttpRequest` is callback/event based, older, but supports upload
      progress events natively. JSONP is a pre-CORS hack that loaded data via a `<script>` tag calling
      a global callback — GET only and dangerous, replaced by CORS.
quiz:
  - id: q1
    question: The user typed "abc" into `<input value="x">`. What does `input.getAttribute('value')` return?
    options: ["abc", "x", "an empty string", "null"]
    correct: 1
    explanation: The attribute keeps the initial value; the property holds the current one.
  - id: q2
    question: Which call changes the URL without a request and adds a history entry?
    options: ["location.assign(url)", "history.pushState(state, '', url)", "history.replaceState(state, '', url)", "location.reload()"]
    correct: 1
    explanation: replaceState does not add an entry; location.assign navigates with a request.
  - id: q3
    question: "`fetch('/api')` gets a 500 response. What happens?"
    options: ["The promise rejects", "The promise resolves with response.ok === false", "An exception is thrown synchronously", "fetch retries automatically"]
    correct: 1
    explanation: fetch rejects only on network errors.
  - id: q4
    question: What must a message listener check before trusting a postMessage?
    options: ["event.timeStamp", "event.origin", "event.ports.length", "Nothing, messages are safe"]
    correct: 1
    explanation: Any window can post a message; validate the origin and the payload.
---

## Attributes vs properties

```js
// <input id="email" value="a@b.c">
email.value = 'new@b.c'
email.value                  // 'new@b.c'  — property: current state
email.getAttribute('value')  // 'a@b.c'    — attribute: initial value
email.defaultValue           // 'a@b.c'    — the property that reflects the attribute

link.getAttribute('href')    // '/docs'
link.href                    // 'https://devround.dev/docs' — resolved
```

`data-*` attributes are exposed as `element.dataset` (`data-user-id` → `dataset.userId`).

## Writing content safely

```js
el.textContent = userInput   // ✅ text only
el.innerHTML = userInput     // ❌ parses HTML — XSS with untrusted input
el.append(document.createElement('li')) // ✅ build nodes instead of strings
```

## History API

```js
history.pushState({ tab: 'billing' }, '', '/settings/billing')  // new entry, no request
history.replaceState({ q: 'react' }, '', '?q=react')            // same entry

window.addEventListener('popstate', (event) => {
  render(location.pathname, event.state) // back/forward
})

new URLSearchParams(location.search).get('q') // read query string values
```

## Talking across windows

```js
// parent
iframe.contentWindow.postMessage({ type: 'theme', value: 'dark' }, 'https://widget.example.com')

// inside the iframe
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://app.example.com') return
  if (event.data?.type === 'theme') applyTheme(event.data.value)
})
```

## fetch in practice

```js
const controller = new AbortController()
const res = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Ann' }),
  signal: controller.signal,
})
if (!res.ok) throw new Error(`HTTP ${res.status}`) // fetch does not do this for you
const user = await res.json()
```

## Intl: formatting without libraries

```js
new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(1234.5) // '1 234,50 ₴'
new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date())
new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-1, 'day') // 'yesterday'
new Intl.PluralRules('en').select(2) // 'other'
```

Localizing an app = translated strings (a message catalog, often ICU format) + `Intl` for numbers,
dates and plurals + the `lang` attribute + right-to-left support (`dir="rtl"`, logical CSS
properties).

## canvas vs SVG

| | `<canvas>` | `<svg>` |
| --- | --- | --- |
| Model | Pixels drawn by JavaScript (immediate mode) | DOM elements (retained mode) |
| Scaling | Blurs unless redrawn at device pixel ratio | Vector, sharp at any size |
| Events, a11y | Manual hit-testing, no built-in accessibility | Per-element events, CSS, ARIA |
| Good for | Many objects, games, charts with 10k+ points | Icons, diagrams, interactive charts |
