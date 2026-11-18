---
id: node-auth
module: node-web
order: 4
title: 'Authentication: sessions vs JWT'
description: Server-side sessions and stateless tokens, where to store them, refresh tokens, and delegating sign-in with OAuth/OIDC.
levels: [middle, senior]
estimatedMinutes: 25
topics: [node-auth]
references:
  - { title: 'OWASP — Session Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html' }
  - { title: 'RFC 7519 — JSON Web Token (JWT)', url: 'https://datatracker.ietf.org/doc/html/rfc7519' }
  - { title: 'OpenID Connect — How it works', url: 'https://openid.net/developers/how-connect-works/' }
keyTakeaways:
  - A session stores state on the server and gives the browser an opaque id in an HttpOnly cookie — easy to revoke.
  - A JWT is a signed, self-contained token — verifiable without a lookup, but hard to revoke before it expires.
  - Keep access tokens short-lived and use refresh tokens (rotated, HttpOnly cookie) to get new ones.
  - Authentication proves who the user is; authorization (checked on every request) decides what they may do.
interviewQuestions:
  - question: Sessions or JWT — which would you choose for a web app?
    answer: |
      For a browser app talking to its own backend, server-side sessions with an HttpOnly, Secure,
      SameSite cookie are usually simpler and safer: revocation is instant (delete the session),
      nothing sensitive is readable by JavaScript, and payloads stay small. JWTs shine when many
      services must verify identity without a shared session store, or for service-to-service and
      third-party API access. Many systems combine them: a session at the edge, short-lived tokens
      between services.
  - question: How do refresh tokens work?
    answer: |
      The client gets a short-lived access token (minutes) and a long-lived refresh token. When the
      access token expires, the client calls a refresh endpoint with the refresh token (ideally in an
      HttpOnly cookie) to get a new pair. Rotation — issuing a new refresh token each time and
      invalidating the old one — lets the server detect reuse of a stolen token and revoke the family.
  - question: What is OAuth 2.0 / OpenID Connect in one paragraph?
    answer: |
      OAuth 2.0 lets an app obtain limited access to a user's resources at another service without
      their password, via an authorization server. OpenID Connect adds identity on top: an ID token
      telling the app who the user is. For "Sign in with Google" in a web app, use the authorization
      code flow with PKCE (or the provider's SDK) and verify the ID token on your server before creating
      your own session.
quiz:
  - id: q1
    question: What is the main drawback of long-lived JWT access tokens?
    options: ["They are too large for headers", "They cannot easily be revoked before they expire", "They cannot carry user ids", "They require a database lookup"]
    correct: 1
    explanation: Stateless tokens stay valid until expiry unless you add a denylist.
  - id: q2
    question: Where should a browser app keep a session identifier?
    options: ["localStorage", "An HttpOnly, Secure, SameSite cookie", "A global JavaScript variable", "The URL"]
    correct: 1
    explanation: HttpOnly protects it from XSS; SameSite helps against CSRF.
  - id: q3
    question: What is refresh token rotation?
    options: ["Changing the signing key daily", "Issuing a new refresh token on every refresh and invalidating the old one", "Refreshing the page", "Storing tokens in two places"]
    correct: 1
    explanation: Reuse of an old token reveals theft.
---

## Server-side sessions

```ts
// on sign-in
const token = crypto.randomBytes(32).toString('base64url')
await db.session.create({ data: { userId, tokenHash: sha256(token), expiresAt: in30Days() } })
reply.setCookie('session', token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 30 * 86400 })

// on each request
const session = await db.session.findUnique({ where: { tokenHash: sha256(request.cookies.session) } })
if (!session || session.expiresAt < new Date()) throw unauthorized()
```

Store only a hash of the token so a database leak does not leak live sessions.

## JWT

```ts
import { jwtVerify, SignJWT } from 'jose'

const accessToken = await new SignJWT({ sub: user.id, role: user.role })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('10m')
  .sign(secret)

const { payload } = await jwtVerify(accessToken, secret) // verify signature and expiry
```

A JWT is signed, **not encrypted** — anyone can read its payload. Never put secrets in it.

## Comparison

| | Session | JWT |
| --- | --- | --- |
| State | Server | In the token |
| Revocation | Instant | Hard before expiry |
| Lookup per request | Yes (cacheable) | No |
| Best for | Browser apps with own backend | Distributed services, APIs for third parties |

## Authorization on every request

```ts
const order = await db.order.findFirst({ where: { id, userId: session.userId } })
if (!order) throw notFound() // not "forbidden": do not reveal that it exists
```
