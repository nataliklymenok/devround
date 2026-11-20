---
id: web-url-to-page
module: web-dom-rendering
order: 3
title: From URL to rendered page
description: What happens between typing a URL and seeing the page — DNS, TCP and TLS, the HTTP request, parsing, subresources and rendering.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [web-navigation]
references:
  - { title: 'MDN — How browsers work', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work' }
  - { title: 'MDN — Populating the page: how browsers work (DNS, TCP, TLS)', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work#navigation' }
  - { title: 'web.dev — Preconnect and DNS prefetch', url: 'https://web.dev/articles/preconnect-and-dns-prefetch' }
keyTakeaways:
  - 'Navigation: parse the URL → check caches (service worker, HTTP cache) → DNS → TCP (or QUIC) → TLS → HTTP request → response.'
  - Every new origin costs DNS + connection + TLS round trips; preconnect and HTTP/2/3 connection reuse cut that cost.
  - The browser parses HTML as it streams in; the preload scanner fetches CSS, scripts and images ahead of the parser.
  - CSS blocks rendering, classic scripts block parsing; the first paint happens once the DOM and CSSOM for the visible content are ready.
interviewQuestions:
  - question: What happens when you type a URL into the address bar and press Enter?
    answer: |
      The browser decides whether the input is a URL or a search, then checks for a service worker
      and the HTTP cache. On a miss it resolves the host name with DNS (browser, OS and resolver
      caches first), opens a TCP connection (or QUIC for HTTP/3) and negotiates TLS for HTTPS. It
      sends the HTTP request with cookies and headers; the server may redirect (a new navigation) or
      return HTML. The browser streams and parses the HTML into the DOM, discovers CSS, scripts,
      images and fonts and fetches them, builds the CSSOM, runs scripts, then does style, layout,
      paint and compositing. `DOMContentLoaded` fires when the DOM is parsed and deferred scripts have
      run; `load` fires when all subresources have loaded.
  - question: Why can a page on a new domain be slow even when the server responds quickly?
    answer: |
      Before the first byte, the browser needs a DNS lookup, a TCP handshake (one round trip) and a
      TLS handshake (one more with TLS 1.3, two with TLS 1.2). On a mobile network each round trip
      can cost 100 ms or more. Third-party origins (fonts, CDNs, analytics) repeat this cost. Fixes:
      fewer origins, `<link rel="preconnect">` for critical ones, HTTP/2 or HTTP/3 to reuse one
      connection, and a CDN close to users.
  - question: What is the difference between DOMContentLoaded and load?
    answer: |
      `DOMContentLoaded` fires when the HTML is fully parsed and all deferred and module scripts have
      executed — it does not wait for images, iframes or async scripts. `load` fires on `window` when
      the page and all its subresources (images, stylesheets, iframes) have finished loading. Code
      that only needs the DOM should not wait for `load`.
  - question: What does the preload scanner do?
    answer: |
      While the main parser is blocked (for example by a synchronous script), a secondary scanner
      reads ahead in the HTML and starts downloading resources it finds — stylesheets, scripts,
      images. Resources injected by JavaScript or referenced only from CSS (background images, fonts)
      are invisible to it, which is why critical ones are hinted with `<link rel="preload">`.
quiz:
  - id: q1
    question: Which step happens first for a URL the browser has never visited?
    options: ["TLS handshake", "DNS lookup", "HTML parsing", "Compositing"]
    correct: 1
    explanation: The host name must be resolved to an IP address before a connection can be opened.
  - id: q2
    question: When does DOMContentLoaded fire?
    options: ["After all images load", "After the HTML is parsed and deferred scripts have run", "Before any HTML is parsed", "After the first user interaction"]
    correct: 1
    explanation: It does not wait for images, stylesheets or async scripts.
  - id: q3
    question: What does `<link rel="preconnect" href="https://cdn.example.com">` save?
    options: ["The HTML parse time", "DNS, TCP and TLS setup time for that origin", "JavaScript execution time", "Layout time"]
    correct: 1
    explanation: It opens the connection early so the later request can start immediately.
  - id: q4
    question: Which resource is hidden from the preload scanner?
    options: ["A `<script src>` in the head", "A stylesheet `<link>`", "A background image referenced only in CSS", "An `<img src>` in the body"]
    correct: 2
    explanation: The scanner reads HTML only; CSS-referenced resources are found later.
---

## The navigation, step by step

```text
1. URL or search?           "devround.dev" → https://devround.dev/
2. Caches                   service worker → HTTP cache (fresh? → no network)
3. DNS                      browser → OS → resolver → authoritative server → IP
4. Connection               TCP handshake (HTTP/1.1, HTTP/2) or QUIC (HTTP/3)
5. TLS                      certificate check, keys agreed (HTTPS)
6. HTTP request             GET / + cookies + headers
7. Response                 3xx → new navigation; 200 → HTML starts streaming
8. Parse and fetch          DOM, preload scanner, CSS → CSSOM, scripts
9. Render                   style → layout → paint → composite (first paint)
10. Events                  DOMContentLoaded → load
```

Steps 3–5 happen once per origin and connection; that is why every extra third-party origin has a
cost and why HTTP/2 multiplexing (many requests on one connection) matters.

## Round trips you can save

```html
<!-- connect early to an origin you will need for the first render -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- fetch a critical resource the preload scanner cannot see -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
```

- A 301/302 redirect costs a whole extra request: link to the final URL.
- HSTS makes the browser go straight to HTTPS without an `http://` redirect.
- A CDN shortens the distance for DNS, TCP and TLS.

## Parsing while downloading

The HTML arrives in chunks and the parser works on each chunk as it arrives. That is why a server
that **streams** (flushes the `<head>` early) lets the browser start fetching CSS sooner. A classic
`<script>` stops the parser until it downloads and runs; `defer`, `async` and `type="module"` don't.

## The two load events

```js
document.addEventListener('DOMContentLoaded', () => {
  // DOM is ready, deferred scripts ran — images may still be loading
})

window.addEventListener('load', () => {
  // everything, including images and iframes, has loaded
})
```

## Senior angle

Be ready to go deeper on any step the interviewer picks: DNS caching and TTLs, TCP slow start,
TLS 1.3 (one round trip, 0-RTT resumption), HTTP/2 head-of-line blocking at the TCP level and how
HTTP/3 over QUIC avoids it, and how SSR plus streaming changes what the user sees first.
