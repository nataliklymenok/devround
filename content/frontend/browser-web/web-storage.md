---
id: web-storage
module: web-network-storage
order: 3
title: Cookies, Web Storage and IndexedDB
description: Cookie attributes, localStorage vs sessionStorage, IndexedDB, and where to keep tokens and data.
levels: [junior, middle]
estimatedMinutes: 20
topics: [web-storage]
references:
  - { title: 'MDN — Using HTTP cookies', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies' }
  - { title: 'MDN — Web Storage API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API' }
  - { title: 'MDN — IndexedDB API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API' }
keyTakeaways:
  - Cookies are sent with matching requests; HttpOnly, Secure, SameSite, Path, Domain and Max-Age control them.
  - localStorage persists per origin until cleared; sessionStorage lives per tab; both are synchronous strings of about 5 MB.
  - IndexedDB is asynchronous, transactional and stores structured data and files in large amounts.
  - Never store session tokens where JavaScript can read them if you can use an HttpOnly cookie instead.
interviewQuestions:
  - question: Compare cookies, localStorage, sessionStorage and IndexedDB.
    answer: |
      Cookies: small (~4 KB), sent automatically with requests, can be HttpOnly — ideal for session
      identifiers. localStorage: ~5 MB strings per origin, persistent, synchronous, readable by any
      script on the origin — fine for preferences. sessionStorage: same API, scoped to one tab and
      cleared when it closes — drafts, wizard state. IndexedDB: async, large, structured data,
      transactions, works in workers — offline data, caches, files.
  - question: Where should an access token be stored in a SPA?
    answer: |
      Preferably not in JavaScript-readable storage: a session in an `HttpOnly; Secure; SameSite`
      cookie means an XSS bug cannot steal it. If you must use bearer tokens, keep the access token in
      memory, keep it short-lived, and refresh it through an HttpOnly cookie. localStorage tokens are
      exposed to any injected script.
  - question: What does the SameSite cookie attribute do?
    answer: |
      It controls whether the cookie is sent on cross-site requests. `Strict`: only same-site.
      `Lax` (the default in modern browsers): same-site plus top-level navigations with safe methods,
      which blocks most CSRF. `None`: always sent, requires `Secure`, needed for third-party contexts.
quiz:
  - id: q1
    question: Which cookie attribute prevents JavaScript from reading the cookie?
    options: ["Secure", "SameSite", "HttpOnly", "Max-Age"]
    correct: 2
    explanation: HttpOnly hides the cookie from document.cookie.
  - id: q2
    question: Which storage is cleared when the browser tab is closed?
    options: ["localStorage", "sessionStorage", "IndexedDB", "Cookies with Max-Age"]
    correct: 1
    explanation: sessionStorage is scoped to the tab's session.
  - id: q3
    question: You need to store 50 MB of offline data with indexes. What fits best?
    options: ["localStorage", "Cookies", "IndexedDB", "sessionStorage"]
    correct: 2
    explanation: IndexedDB handles large structured data asynchronously.
---

## Cookies

```http
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000
```

| Attribute | Effect |
| --- | --- |
| `HttpOnly` | Not readable from JavaScript |
| `Secure` | Only sent over HTTPS |
| `SameSite=Lax/Strict/None` | Cross-site sending rules |
| `Domain`, `Path` | Which URLs receive it |
| `Max-Age` / `Expires` | Lifetime (session cookie without them) |

## Web Storage

```js
localStorage.setItem('theme', 'dark')
const theme = localStorage.getItem('theme') ?? 'light'

sessionStorage.setItem('checkout-step', '2')

// Store objects as JSON and guard against private mode / quota errors
try {
  localStorage.setItem('prefs', JSON.stringify(prefs))
} catch {
  // storage unavailable — keep working without it
}

window.addEventListener('storage', (e) => {
  if (e.key === 'theme') applyTheme(e.newValue) // fired in other tabs of the same origin
})
```

## IndexedDB

The raw API is event-based; most apps use a small wrapper such as `idb`:

```js
import { openDB } from 'idb'

const db = await openDB('app', 1, {
  upgrade(db) {
    db.createObjectStore('drafts', { keyPath: 'id' })
  },
})
await db.put('drafts', { id: 'post-1', text: 'Hello' })
const draft = await db.get('drafts', 'post-1')
```

## Choosing

- Session/auth → HttpOnly cookie
- UI preferences → localStorage
- Per-tab drafts → sessionStorage
- Offline data, files, large caches → IndexedDB (or the Cache API for HTTP responses)
