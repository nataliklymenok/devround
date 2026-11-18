---
id: web-http-caching
module: web-network-storage
order: 1
title: HTTP and caching
description: Methods, status codes and headers that frontend developers use daily, and how browser and CDN caching works.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [web-http-caching]
references:
  - { title: 'MDN — HTTP caching', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching' }
  - { title: 'MDN — HTTP response status codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status' }
  - { title: 'web.dev — Prevent unnecessary network requests with the HTTP Cache', url: 'https://web.dev/articles/http-cache' }
keyTakeaways:
  - GET and HEAD are safe; GET, PUT and DELETE are idempotent; POST is neither.
  - Cache-Control controls freshness (max-age, no-cache, no-store, immutable); ETag and Last-Modified enable revalidation (304).
  - Hashed asset file names + long max-age + immutable give instant repeat visits; HTML should be revalidated.
  - HTTP/2 multiplexes requests over one connection; HTTP/3 runs over QUIC.
interviewQuestions:
  - question: What is the difference between no-cache and no-store?
    answer: |
      `no-cache` allows storing the response but requires revalidation with the server before every
      reuse (the server can answer `304 Not Modified`). `no-store` forbids storing the response at
      all — use it for sensitive data. `max-age=0, must-revalidate` behaves similarly to `no-cache`.
  - question: How would you set up caching for a single-page app?
    answer: |
      Build assets with content hashes in their file names (`app.3f9a.js`) and serve them with
      `Cache-Control: public, max-age=31536000, immutable` — a new deploy produces new URLs. Serve
      `index.html` with `no-cache` (and an `ETag`) so users always get the latest asset references.
      API responses get explicit headers per endpoint, often `no-store` or short `max-age` plus
      `stale-while-revalidate`.
  - question: What happens during a conditional request?
    answer: |
      The browser has a stale cached response with an `ETag` (or `Last-Modified`). It sends
      `If-None-Match` (or `If-Modified-Since`). If the resource is unchanged the server answers
      `304 Not Modified` with no body and the browser reuses its copy; otherwise it gets `200` with the
      new content.
  - question: Which status codes should a frontend handle explicitly?
    answer: |
      `200/201/204` success; `301/302/307/308` redirects (fetch follows them); `304` cache
      revalidation; `400/422` validation errors to show next to fields; `401` sign in again; `403` not
      allowed; `404` not found UI; `409` conflict (e.g. edited by someone else); `429` back off and
      retry later (respect `Retry-After`); `5xx` generic error with retry.
quiz:
  - id: q1
    question: Which header lets the browser revalidate a cached response cheaply?
    options: ["Content-Type", "ETag", "Accept", "Origin"]
    correct: 1
    explanation: The ETag is sent back as If-None-Match; an unchanged resource returns 304.
  - id: q2
    question: Which method is NOT idempotent?
    options: ["GET", "PUT", "DELETE", "POST"]
    correct: 3
    explanation: Repeating a POST may create multiple resources.
  - id: q3
    question: Best Cache-Control for app.3f9a1c.js (hashed file name)?
    options: ["no-store", "no-cache", "public, max-age=31536000, immutable", "private, max-age=0"]
    correct: 2
    explanation: The URL changes when the content changes, so it can be cached forever.
  - id: q4
    question: What should the client do with a 429 response?
    options: ["Retry immediately in a loop", "Back off and retry later, respecting Retry-After", "Log the user out", "Treat it as success"]
    correct: 1
    explanation: 429 means too many requests.
---

## Methods and their guarantees

| Method | Safe | Idempotent | Typical use |
| --- | --- | --- | --- |
| GET | ✓ | ✓ | Read |
| POST | | | Create, actions |
| PUT | | ✓ | Replace |
| PATCH | | | Partial update |
| DELETE | | ✓ | Delete |

## Freshness and revalidation

```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=60, stale-while-revalidate=300
ETag: "a1b2c3"
```

- Fresh for 60 s → served from cache without a request.
- Then for up to 300 s → served stale while the browser revalidates in the background.
- Revalidation: `If-None-Match: "a1b2c3"` → `304 Not Modified` if unchanged.

## A caching strategy for SPAs

```text
/index.html            Cache-Control: no-cache            (always revalidate)
/assets/app.3f9a1c.js  Cache-Control: public, max-age=31536000, immutable
/api/me                Cache-Control: no-store             (private data)
```

## Handling responses in code

```js
const res = await fetch('/api/orders', { method: 'POST', body: JSON.stringify(order), headers: { 'content-type': 'application/json' } })

if (res.status === 401) return redirectToSignIn()
if (res.status === 422) return showFieldErrors(await res.json())
if (res.status === 429) return retryAfter(Number(res.headers.get('retry-after') ?? 5))
if (!res.ok) throw new Error(`Request failed: ${res.status}`)
```

Remember that `fetch` only rejects on network errors; HTTP error statuses resolve normally and you
must check `res.ok`.
