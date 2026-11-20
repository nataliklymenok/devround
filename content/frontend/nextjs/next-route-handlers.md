---
id: next-route-handlers
module: next-data
order: 3
title: Route handlers and middleware
description: Building HTTP endpoints with route.ts, when to use them instead of Server Actions, and request interception with middleware (proxy in Next.js 16).
levels: [middle, senior]
estimatedMinutes: 20
topics: [next-route-handlers]
reviewed: 2026-11-20
references:
  - { title: 'Next.js Docs — Route Handlers', url: 'https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware' }
  - { title: 'Next.js Docs — route.js file convention', url: 'https://nextjs.org/docs/app/api-reference/file-conventions/route' }
keyTakeaways:
  - route.ts exports functions named after HTTP methods and returns Web Response objects.
  - Use route handlers for webhooks, public APIs, file downloads and clients other than your React UI; use Server Actions for your own form mutations.
  - Middleware runs before routing on every matched request — for redirects, rewrites, headers and coarse auth checks; Next.js 16 renamed the convention to proxy.
  - Do not rely on middleware alone for authorization — check access where the data is read or written.
interviewQuestions:
  - question: Route handler or Server Action?
    answer: |
      Server Actions are ideal for mutations triggered from your own UI: they integrate with forms,
      revalidation and pending states. Route handlers are regular HTTP endpoints — use them when
      something other than your React components calls the server (webhooks from Stripe, mobile apps,
      third-party integrations), for GET APIs with custom caching, streaming or file responses.
  - question: What is middleware good for, and what are its limits?
    answer: |
      It runs before a request is routed, so it can redirect unauthenticated users, rewrite URLs for
      A/B tests or localization, and set headers. It should stay fast and lightweight. It is not a
      complete authorization layer — matcher mistakes or direct data access paths can bypass it — so
      verify sessions and permissions again in the data layer, pages and actions.
  - question: How do route handlers relate to the old pages/api routes?
    answer: |
      They replace them in the App Router. Instead of a single default export receiving Node-style
      `req`/`res`, you export one function per HTTP method that receives a Web `Request` and returns a
      Web `Response` (or `NextResponse`). They can stream, run on the Node or Edge runtime, and since
      Next.js 15 GET handlers are not cached by default.
quiz:
  - id: q1
    question: How does a route handler respond to GET /api/health?
    options: ["export default function handler(req, res)", "export async function GET() { return Response.json({ ok: true }) }", "export const get = true", "getServerSideProps"]
    correct: 1
    explanation: Export functions named after HTTP methods returning Web Responses.
  - id: q2
    question: Stripe needs to call your app when a payment succeeds. What do you build?
    options: ["A Server Action", "A route handler (webhook endpoint)", "A Client Component", "A layout"]
    correct: 1
    explanation: External callers need a stable HTTP endpoint.
  - id: q3
    question: Is a middleware redirect enough to protect admin data?
    options: ["Yes", "No — also check authorization where the data is accessed", "Only in production", "Only with matchers"]
    correct: 1
    explanation: Defence in depth; middleware can be misconfigured or bypassed.
---

## A route handler

```ts
// app/api/orders/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const order = await db.order.findFirst({ where: { id, userId: session.userId } })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}
```

## A webhook

```ts
// app/api/webhooks/payments/route.ts
export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('x-signature')
  if (!verifySignature(payload, signature)) return new Response('Invalid signature', { status: 400 })
  await handlePaymentEvent(JSON.parse(payload))
  return new Response(null, { status: 204 })
}
```

## Middleware / proxy

```ts
// middleware.ts (renamed to proxy.ts in Next.js 16 — check your version's docs)
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('session')
  if (!hasSession && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }
```
