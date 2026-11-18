---
id: web-cors
module: web-network-storage
order: 2
title: Same-origin policy and CORS
description: What an origin is, what the same-origin policy protects, simple vs preflighted requests and credentials.
levels: [middle, senior]
estimatedMinutes: 20
topics: [web-cors]
references:
  - { title: 'MDN — Same-origin policy', url: 'https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy' }
  - { title: 'MDN — Cross-Origin Resource Sharing (CORS)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS' }
keyTakeaways:
  - An origin is scheme + host + port; https://app.example.com and https://api.example.com are different origins.
  - The same-origin policy stops scripts from reading cross-origin responses; it does not stop requests from being sent.
  - Non-simple requests (custom headers, JSON content type, PUT/DELETE) trigger an OPTIONS preflight.
  - With credentials the server must echo a specific origin and send Access-Control-Allow-Credentials true — the * wildcard is not allowed.
interviewQuestions:
  - question: What is CORS and why does the browser enforce it?
    answer: |
      CORS is a set of HTTP headers that lets a server relax the same-origin policy for specific
      origins. The browser enforces it to protect users: without it, any website could use your
      logged-in cookies to read data from other sites. CORS is checked by the browser — it is not a
      server security feature, and tools like curl ignore it.
  - question: When does the browser send a preflight request?
    answer: |
      When the request is not "simple": a method other than GET/HEAD/POST, a `Content-Type` other than
      `application/x-www-form-urlencoded`, `multipart/form-data` or `text/plain` (so JSON triggers
      it), or custom headers such as `Authorization`. The browser sends `OPTIONS` with
      `Access-Control-Request-Method/Headers`; only if the server allows them does it send the real
      request. `Access-Control-Max-Age` caches the preflight result.
  - question: How do cookies work with cross-origin requests?
    answer: |
      `fetch` must use `credentials: 'include'`; the server must respond with
      `Access-Control-Allow-Origin: <the exact origin>` and `Access-Control-Allow-Credentials: true`.
      The cookie itself must allow being sent cross-site (`SameSite=None; Secure`). Often it is simpler
      to serve the API under the same origin through a reverse proxy.
quiz:
  - id: q1
    question: "Are https://example.com and https://example.com:8443 the same origin?"
    options: ["Yes", "No — the port differs", "Only for GET requests", "Only if cookies are shared"]
    correct: 1
    explanation: Scheme, host and port must all match.
  - id: q2
    question: "A fetch POST with Content-Type: application/json to another origin…"
    options: ["Is a simple request", "Triggers an OPTIONS preflight", "Is blocked always", "Sends no body"]
    correct: 1
    explanation: application/json is not a CORS-safelisted content type.
  - id: q3
    question: "Can a server use Access-Control-Allow-Origin: * together with credentials?"
    options: ["Yes", "No — it must name the exact origin", "Only for GET", "Only on HTTP/2"]
    correct: 1
    explanation: Credentialed responses cannot use the wildcard.
---

## Origins

```text
https://app.example.com:443/page
└─┬─┘   └──────┬──────┘ └┬┘
scheme       host       port
```

Same origin = same scheme, host and port. Subdomains are different origins.

## What the same-origin policy blocks

A page on `https://evil.example` **can** send a request to `https://bank.example` (that is why CSRF
exists), but its JavaScript **cannot read** the response unless the bank allows it with CORS.

## Simple vs preflighted requests

```http
OPTIONS /api/orders HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type, authorization

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: content-type, authorization
Access-Control-Max-Age: 600
```

## Credentials

```js
await fetch('https://api.example.com/me', { credentials: 'include' })
```

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin
```

## Debugging CORS errors

- The console error tells you which header is missing — fix it on the **server** (or proxy), not in
  the frontend.
- `mode: 'no-cors'` does not fix anything: it returns an opaque response you cannot read.
- In development, a dev-server proxy (e.g. Vite's `server.proxy`) makes API calls same-origin.
