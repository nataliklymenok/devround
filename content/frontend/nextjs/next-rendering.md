---
id: next-rendering
module: next-fundamentals
order: 3
title: Rendering strategies and streaming
description: Static vs dynamic rendering, SSR, SSG and ISR in App Router terms, generateStaticParams, and streaming with Suspense.
levels: [middle, senior]
estimatedMinutes: 25
topics: [next-rendering]
references:
  - { title: 'Next.js Docs — Fetching data (streaming)', url: 'https://nextjs.org/docs/app/getting-started/fetching-data' }
  - { title: 'Next.js Docs — generateStaticParams', url: 'https://nextjs.org/docs/app/api-reference/functions/generate-static-params' }
  - { title: 'web.dev — Rendering on the Web', url: 'https://web.dev/articles/rendering-on-the-web' }
keyTakeaways:
  - Static rendering produces HTML at build time (or on revalidation); dynamic rendering produces it per request.
  - Using request-time data (cookies, headers, searchParams) or uncached data makes a route dynamic.
  - ISR = static output regenerated after a revalidate interval or on demand.
  - Streaming sends the shell immediately and fills Suspense boundaries as their data arrives.
interviewQuestions:
  - question: Explain CSR, SSR, SSG and ISR.
    answer: |
      CSR renders in the browser after JavaScript loads — fast server, slow first paint and weaker
      SEO. SSR renders HTML on each request — fresh data, server cost per request. SSG renders at build
      time — fastest, but data is as old as the build. ISR serves static HTML and regenerates it in the
      background after a time interval or when explicitly revalidated — static speed with bounded
      staleness. The App Router picks static or dynamic per route based on the data you use.
  - question: What makes an App Router route dynamic?
    answer: |
      Reading request-specific data — `cookies()`, `headers()`, `searchParams`, `connection()` — or
      fetching data that is not cached, or explicitly opting out (e.g. `export const dynamic =
      'force-dynamic'`). Otherwise Next.js can prerender the route. Check the build output, which marks
      each route as static or dynamic.
  - question: How does streaming improve perceived performance?
    answer: |
      Instead of waiting for the slowest query before sending anything, the server sends the layout and
      fast parts immediately, with Suspense fallbacks for slow parts. As each async component resolves,
      its HTML is streamed and swapped in. Users see content sooner (better LCP/TTFB perception), and
      slow widgets do not block the page.
quiz:
  - id: q1
    question: Which call makes a route dynamically rendered?
    options: ["Importing a component", "Calling cookies()", "Using next/link", "Exporting metadata"]
    correct: 1
    explanation: cookies() depends on the incoming request.
  - id: q2
    question: What is ISR?
    options: ["Rendering on every request", "Static pages regenerated after a revalidate period or on demand", "Client-side rendering", "Rendering at build time only, never updated"]
    correct: 1
    explanation: Incremental Static Regeneration combines static speed with updates.
  - id: q3
    question: What does generateStaticParams do?
    options: ["Validates params", "Lists dynamic segment values to prerender at build time", "Reads searchParams", "Creates API routes"]
    correct: 1
    explanation: It tells Next.js which [slug] pages to build statically.
---

## Static vs dynamic

```tsx
// Static: prerendered, regenerated at most every hour (ISR)
export const revalidate = 3600

export default async function BlogPage() {
  const posts = await getPosts()
  return <PostList posts={posts} />
}
```

```tsx
// Dynamic: depends on the request
import { cookies } from 'next/headers'

export default async function AccountPage() {
  const session = (await cookies()).get('session')
  const account = await getAccount(session?.value)
  return <Account data={account} />
}
```

## Prerendering dynamic segments

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```

## Streaming with Suspense

```tsx
import { Suspense } from 'react'

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <ProductDetails params={params} /> {/* fast */}
      <Suspense fallback={<p>Loading reviews…</p>}>
        <Reviews params={params} /> {/* slow query streams in later */}
      </Suspense>
    </>
  )
}
```

`loading.tsx` is the same idea applied to a whole route segment. Newer Next.js versions add Partial
Prerendering (a static shell with dynamic holes) — check your version's docs before relying on it.
