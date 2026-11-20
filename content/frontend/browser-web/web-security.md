---
id: web-security
module: web-quality
order: 1
title: 'Web security: XSS, CSRF, CSP and clickjacking'
description: The attacks frontend developers are asked about most and the defences that actually work.
levels: [middle, senior]
estimatedMinutes: 30
topics: [web-security]
reviewed: 2026-11-20
references:
  - { title: 'OWASP — Cross Site Scripting Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html' }
  - { title: 'OWASP — Cross-Site Request Forgery Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html' }
  - { title: 'MDN — Content Security Policy (CSP)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP' }
keyTakeaways:
  - XSS runs attacker JavaScript in your origin; prevent it by escaping output by context and never injecting untrusted HTML.
  - Frameworks escape text by default — the dangerous spots are innerHTML, dangerouslySetInnerHTML, javascript URLs and eval-like APIs.
  - CSRF abuses the browser sending cookies automatically; SameSite cookies, Origin checks and CSRF tokens prevent it.
  - CSP is defence in depth that limits which scripts can run; frame-ancestors prevents clickjacking.
interviewQuestions:
  - question: What are the types of XSS and how do you prevent them in a React app?
    answer: |
      Stored (saved on the server and rendered to others), reflected (echoed from the URL or form) and
      DOM-based (client code writes untrusted data into dangerous sinks). React escapes values in JSX,
      so the risks are `dangerouslySetInnerHTML` (sanitize with DOMPurify or avoid), URLs in `href`
      that may be `javascript:` (allow-list protocols), direct DOM access with `innerHTML`, and
      third-party scripts. Add a CSP as a second layer and keep session cookies HttpOnly.
  - question: How does CSRF work and how do you defend against it?
    answer: |
      A malicious site makes the victim's browser send a state-changing request to your site; the
      browser attaches the victim's cookies, so the server thinks it is legitimate. Defences:
      `SameSite=Lax` or `Strict` cookies, verifying the `Origin`/`Referer` header on unsafe methods,
      synchronizer or double-submit CSRF tokens, and never changing state on GET. Token-based APIs that
      read a bearer token from JavaScript are not vulnerable to CSRF but are more exposed to XSS.
  - question: What does a Content Security Policy do?
    answer: |
      The `Content-Security-Policy` header tells the browser which sources of scripts, styles, images,
      frames and connections are allowed. A strict policy using nonces or hashes
      (`script-src 'nonce-…' 'strict-dynamic'`) blocks injected inline scripts even if an XSS bug
      exists. `frame-ancestors` controls who may embed the page, and `report-to` collects violations.
      Start with `Content-Security-Policy-Report-Only` to find breakage.
  - question: What is clickjacking?
    answer: |
      An attacker loads your page in an invisible iframe and tricks the user into clicking buttons on
      it. Prevent it with `Content-Security-Policy: frame-ancestors 'self'` (or the legacy
      `X-Frame-Options: DENY`).
quiz:
  - id: q1
    question: Which React code is an XSS risk with user-provided content?
    options: ["The JSX expression {comment.text}", "dangerouslySetInnerHTML with unsanitized HTML", "Using a key prop", "useState with a string"]
    correct: 1
    explanation: JSX text is escaped; raw HTML injection is not.
  - id: q2
    question: Which cookie setting blocks most CSRF attacks by default in modern browsers?
    options: ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"]
    correct: 2
    explanation: SameSite=Lax stops cookies on cross-site POSTs and subresource requests.
  - id: q3
    question: Which CSP directive prevents your page from being framed by other sites?
    options: ["script-src", "frame-ancestors", "connect-src", "img-src"]
    correct: 1
    explanation: frame-ancestors controls who may embed the page.
  - id: q4
    question: "A link uses href={user.website}. What is the risk?"
    options: ["None — React escapes it", "A javascript: URL could run code when clicked", "Only a broken link", "SQL injection"]
    correct: 1
    explanation: 'Allow-list protocols such as https: and mailto: for user-provided URLs.'
---

## XSS: untrusted data in the wrong place

```jsx
// ✅ escaped automatically
<p>{comment.text}</p>

// ❌ raw HTML from users
<div dangerouslySetInnerHTML={{ __html: comment.html }} />

// ✅ if you must render user HTML, sanitize it
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.html) }} />

// ❌ javascript: URLs
<a href={profile.website}>Website</a>

// ✅ allow-list protocols
const safeUrl = (url) => (/^(https?:|mailto:)/i.test(url) ? url : '#')
```

Other dangerous sinks: `element.innerHTML`, `insertAdjacentHTML`, `document.write`, `eval`,
`new Function`, `setTimeout` with a string.

## CSRF

```text
1. User is signed in to bank.example (session cookie)
2. User visits evil.example with: form action="https://bank.example/transfer" method="POST" (auto-submitted)
3. Browser attaches bank cookies → transfer happens
```

Defences, in layers:

- `SameSite=Lax` (or `Strict`) session cookies
- check `Origin` on POST/PUT/PATCH/DELETE on the server
- CSRF token for cookie-authenticated forms
- no state changes on GET

## Content Security Policy

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-r4nd0m' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'self';
  report-to csp-endpoint
```

## Checklist

- Escape by default, sanitize the rare HTML you render, allow-list URL protocols
- HttpOnly + Secure + SameSite session cookies
- CSP with nonces, `frame-ancestors`
- Keep dependencies updated; review third-party scripts — they run with your origin's privileges
