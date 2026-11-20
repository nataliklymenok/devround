---
id: next-caching
module: next-data
order: 1
title: Data fetching, caching and revalidation
description: Fetching in Server Components, what is cached by default in Next.js 15+, time-based and on-demand revalidation, and avoiding waterfalls.
levels: [middle, senior]
estimatedMinutes: 30
topics: [next-caching]
reviewed: 2026-11-20
references:
  - { title: 'Next.js Docs — Caching and Revalidating', url: 'https://nextjs.org/docs/app/getting-started/caching-and-revalidating' }
  - { title: 'Next.js Docs — Fetching data', url: 'https://nextjs.org/docs/app/getting-started/fetching-data' }
  - { title: 'Next.js Blog — Next.js 15 (caching defaults changed)', url: 'https://nextjs.org/blog/next-15' }
keyTakeaways:
  - Fetch data in Server Components directly (async/await, ORM, fetch) — no useEffect or API layer needed.
  - Since Next.js 15, fetch requests and GET route handlers are not cached by default; you opt in to caching.
  - Revalidate by time (revalidate) or on demand (revalidatePath, revalidateTag) after mutations.
  - Start independent requests in parallel (Promise.all) or split them with Suspense to avoid waterfalls.
interviewQuestions:
  - question: How did caching defaults change in Next.js 15?
    answer: |
      In Next.js 14, `fetch` in Server Components was cached by default, GET route handlers were cached
      and client-side navigation reused page data for a while, which surprised many teams. Next.js 15
      flipped these: `fetch` is uncached unless you pass `cache: 'force-cache'` or a `next.revalidate`
      option, GET route handlers are dynamic by default, and the client router cache no longer reuses
      page segments by default. Newer versions add a `'use cache'` directive model — always check the
      docs for the version you use.
  - question: How do you show fresh data after a mutation?
    answer: |
      Tag or locate the cached data and invalidate it after the write: call `revalidatePath('/posts')`
      or `revalidateTag('posts')` inside the Server Action or route handler that mutates, then
      redirect or return. Data fetched with `next: { tags: ['posts'] }` (or cached functions with the
      same tag) is refetched on the next request.
  - question: What is a request waterfall and how do you avoid it in Server Components?
    answer: |
      Sequential awaits where each request starts only after the previous one finished, even though
      they are independent — e.g. awaiting the user, then the posts, then the comments. Start them in
      parallel with `Promise.all`, move independent slow parts into separate async components inside
      `Suspense` so they stream, and preload data that a child will need.
quiz:
  - id: q1
    question: In Next.js 15, is fetch('https://api.example.com/posts') in a Server Component cached by default?
    options: ["Yes, forever", "No — opt in with cache or revalidate options", "Only in development", "Only for POST"]
    correct: 1
    explanation: Next.js 15 made fetch uncached by default.
  - id: q2
    question: Which call refreshes data tagged 'posts' after a Server Action creates a post?
    options: ["router.refresh() on the server", "revalidateTag('posts')", "cookies().delete('posts')", "notFound()"]
    correct: 1
    explanation: On-demand revalidation by tag.
  - id: q3
    question: Two independent awaits run one after another. How do you parallelize them?
    options: ["Add use client", "await Promise.all([a(), b()])", "Use useEffect", "Use force-static"]
    correct: 1
    explanation: Start both requests before awaiting.
---

## Fetching in Server Components

```tsx
export default async function PostsPage() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60, tags: ['posts'] }, // cache for 60 s, tag for on-demand revalidation
  })
  const posts: Post[] = await res.json()
  return <PostList posts={posts} />
}
```

Database access works the same way — call your ORM directly; wrap reusable queries in a function and
cache them deliberately.

## Opting in and out (Next.js 15+)

```ts
await fetch(url) // not cached
await fetch(url, { cache: 'force-cache' }) // cached until revalidated
await fetch(url, { next: { revalidate: 300 } }) // time-based
export const revalidate = 300 // route segment default
export const dynamic = 'force-dynamic' // always render per request
```

## On-demand revalidation

```ts
'use server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: String(formData.get('title')) } })
  revalidateTag('posts') // everything tagged 'posts'
  revalidatePath('/blog') // or a specific path
}
```

## Avoiding waterfalls

```tsx
export default async function Dashboard() {
  const [user, stats] = await Promise.all([getUser(), getStats()]) // parallel
  return (
    <>
      <Header user={user} />
      <Stats data={stats} />
      <Suspense fallback={<FeedSkeleton />}>
        <Feed /> {/* slow, streams independently */}
      </Suspense>
    </>
  )
}
```
