---
id: next-app-router
module: next-fundamentals
order: 1
title: App Router fundamentals
description: File-system routing with page, layout, loading, error and not-found files, dynamic segments, route groups and navigation.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [next-app-router]
reviewed: 2026-11-20
references:
  - { title: 'Next.js Docs — Layouts and Pages', url: 'https://nextjs.org/docs/app/getting-started/layouts-and-pages' }
  - { title: 'Next.js Docs — File-system conventions', url: 'https://nextjs.org/docs/app/api-reference/file-conventions' }
  - { title: 'Next.js Docs — Linking and Navigating', url: 'https://nextjs.org/docs/app/getting-started/linking-and-navigating' }
keyTakeaways:
  - Folders define URL segments; page.tsx makes a segment routable; layout.tsx wraps it and keeps state across navigations.
  - loading.tsx and error.tsx create Suspense and error boundaries for a segment automatically.
  - Dynamic segments ([id]), catch-all ([...slug]) and route groups ((marketing)) shape URLs without extra code.
  - Since Next.js 15, params and searchParams passed to pages and layouts are promises and must be awaited.
interviewQuestions:
  - question: What is the difference between layout.tsx and template.tsx?
    answer: |
      A layout wraps a segment and its children and is preserved across navigations between child
      routes — its state and DOM are kept and it does not re-render. A template has the same role but
      is re-mounted on every navigation, which is useful for enter animations or resetting state per
      page.
  - question: How do loading.tsx and error.tsx work?
    answer: |
      `loading.tsx` wraps the segment's page in a React `Suspense` boundary with the loading UI as the
      fallback, so the layout shows instantly while the page streams in. `error.tsx` (a Client
      Component) wraps the segment in an error boundary and receives the `error` and a `reset`
      function. `global-error.tsx` handles errors in the root layout, and `not-found.tsx` renders when
      `notFound()` is called.
  - question: How do you read route params in the App Router?
    answer: |
      Pages and layouts receive `params` (and pages `searchParams`) as props. In Next.js 15 and later
      they are promises: `export default async function Page({ params }: { params: Promise<{ id:
      string }> }) { const { id } = await params }`. In Client Components use `useParams` and
      `useSearchParams` hooks.
quiz:
  - id: q1
    question: Which file makes app/blog/[slug] a routable page?
    options: ["route.ts", "page.tsx", "layout.tsx", "index.tsx"]
    correct: 1
    explanation: A segment becomes publicly accessible when it has a page file.
  - id: q2
    question: What does a folder named (marketing) do?
    options: ["Creates /marketing in the URL", "Groups routes without affecting the URL", "Makes routes private", "Creates a parallel route"]
    correct: 1
    explanation: Route groups organize files and can have their own layouts.
  - id: q3
    question: Is a layout re-rendered when navigating between its child pages?
    options: ["Yes, always", "No, layouts are preserved", "Only on the server", "Only in development"]
    correct: 1
    explanation: Layouts keep their state; use template.tsx when you need a remount.
  - id: q4
    question: In Next.js 15, how do you read params in an async page?
    options: ["props.params.id directly", "const { id } = await params", "useRouter().query.id", "getServerSideProps"]
    correct: 1
    explanation: params became a promise in Next.js 15.
---

## File conventions

```text
app/
├── layout.tsx            # root layout (html, body)
├── page.tsx              # /
├── (marketing)/
│   └── pricing/page.tsx  # /pricing — group does not appear in the URL
└── dashboard/
    ├── layout.tsx        # shared UI for /dashboard/*
    ├── loading.tsx       # Suspense fallback for the segment
    ├── error.tsx         # error boundary ('use client')
    ├── page.tsx          # /dashboard
    └── orders/
        └── [id]/
            ├── page.tsx       # /dashboard/orders/123
            └── not-found.tsx
```

## Pages and params (Next.js 15+)

```tsx
// app/dashboard/orders/[id]/page.tsx
import { notFound } from 'next/navigation'

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()
  return <h1>Order {order.number}</h1>
}
```

## Layouts

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}
```

## Error boundary for a segment

```tsx
'use client'
// app/dashboard/error.tsx
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert">
      <p>Could not load the dashboard.</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

## Navigation

```tsx
import Link from 'next/link'

<Link href={`/dashboard/orders/${order.id}`}>Open</Link> // prefetches in production

'use client'
const router = useRouter() // from next/navigation
router.push('/dashboard')
```

Advanced patterns worth knowing by name: parallel routes (`@slot`) and intercepting routes
(`(.)photo/[id]`) for modals with shareable URLs.
