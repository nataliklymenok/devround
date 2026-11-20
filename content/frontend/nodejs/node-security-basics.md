---
id: node-security-basics
module: node-web
order: 3
title: Security basics for Node APIs
description: Input validation, injection, authentication cookies, CORS, CSRF, rate limiting and dependencies.
levels: [middle, senior]
estimatedMinutes: 30
reviewed: 2026-11-20
keyTakeaways:
  - Validate and parse every input at the boundary; never build SQL or shell commands from strings.
  - Store sessions in httpOnly, Secure, SameSite cookies — not in localStorage.
  - Authorize every request against the current user; return 404 for resources they do not own.
  - Rate-limit sensitive endpoints, keep secrets in the environment and audit dependencies.
interviewQuestions:
  - question: How do you prevent SQL injection?
    answer: |
      Never concatenate user input into SQL. Use parameterized queries or prepared statements, or an
      ORM/query builder that parameterizes for you. The database then treats input strictly as data,
      not as part of the query. Also validate input types and apply least-privilege database users.
  - question: Where should a web app store its session token and why?
    answer: |
      In a cookie with `HttpOnly` (not readable by JavaScript, so XSS cannot steal it), `Secure` (HTTPS
      only) and `SameSite=Lax` or `Strict` (not sent on most cross-site requests, which mitigates
      CSRF). Tokens in localStorage are exposed to any injected script.
  - question: What is CORS, and is it a security mechanism for your API?
    answer: |
      CORS is a browser mechanism that lets a server allow cross-origin JavaScript to read its
      responses. It protects users' browsers, not your server — any non-browser client can still call
      your API. Allow only the origins you need, and never combine `*` with credentials. Real
      protection comes from authentication and authorization.
  - question: What is broken object level authorization (IDOR)?
    answer: |
      Returning or modifying a resource just because the client knows its id, without checking that
      the current user owns it — e.g. `GET /orders/123` returning someone else's order. Fix it by
      scoping every query to the authenticated user (`WHERE id = $1 AND user_id = $2`).
quiz:
  - id: q1
    question: Which query is safe from SQL injection?
    options: ["`SELECT * FROM users WHERE email = '${email}'`", "db.query('SELECT * FROM users WHERE email = $1', [email])", "'SELECT * FROM users WHERE email = ' + escape(email)", "db.query(`SELECT * FROM users WHERE email = ${JSON.stringify(email)}`)"]
    correct: 1
    explanation: Parameterized queries send data separately from the SQL text.
  - id: q2
    question: Which cookie attribute stops JavaScript from reading the session cookie?
    options: ["Secure", "HttpOnly", "SameSite", "Path"]
    correct: 1
    explanation: HttpOnly hides the cookie from document.cookie and therefore from XSS.
  - id: q3
    question: "GET /api/invoices/42 returns another customer's invoice when you change the id. What is the vulnerability?"
    options: ["XSS", "CSRF", "Broken object level authorization (IDOR)", "Clickjacking"]
    correct: 2
    explanation: The API does not check ownership of the requested object.
  - id: q4
    question: What does CORS protect?
    options: ["Your server from all unauthorized clients", "Users' browsers from cross-origin pages reading responses", "Your database from injection", "Cookies from being stolen over HTTP"]
    correct: 1
    explanation: CORS is enforced by browsers; servers still need authentication and authorization.
topics: [node-api-security]
references:
  - { title: 'OWASP — API Security Top 10', url: 'https://owasp.org/API-Security/' }
  - { title: 'Node.js — Security Best Practices', url: 'https://nodejs.org/en/learn/getting-started/security-best-practices' }
---

## Validate at the boundary

```js
import { z } from 'zod'

const CreateOrder = z.object({
  productId: z.string().uuid(),
  quantity: z.int().min(1).max(100),
})

app.post('/orders', async (request, reply) => {
  const input = CreateOrder.parse(request.body) // throws → 400
  // ...
})
```

## Injection

```js
// ❌ SQL injection
await db.query(`SELECT * FROM users WHERE email = '${email}'`)
// ✅ parameterized
await db.query('SELECT * FROM users WHERE email = $1', [email])

// ❌ command injection
exec(`convert ${filename} out.png`)
// ✅ no shell, arguments as an array
execFile('convert', [filename, 'out.png'])
```

## Sessions and cookies

```js
reply.setCookie('session', token, {
  httpOnly: true, // not readable by JS
  secure: true, // HTTPS only
  sameSite: 'lax', // not sent with cross-site POSTs
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
})
```

Store only a hash of the session token in the database, and make sessions revocable on logout.

## Authorization on every request

```js
// ❌ any signed-in user can read any order
const order = await db.order.findUnique({ where: { id } })

// ✅ scope to the current user; respond 404 when it is not theirs
const own = await db.order.findFirst({ where: { id, userId: request.user.id } })
if (!own) throw new AppError('Order not found', { statusCode: 404, code: 'NOT_FOUND' })
```

## The rest of the checklist

- **CSRF**: `SameSite` cookies plus checking the `Origin` header on state-changing requests.
- **CORS**: allow-list specific origins; never `*` with credentials.
- **Rate limiting**: especially on login, sign-up and password reset.
- **Secrets**: environment variables or a secret manager, never in git or logs.
- **Headers**: `helmet`-style headers (CSP, HSTS, `X-Content-Type-Options`).
- **Dependencies**: `npm audit`, automated updates, and a lockfile.
