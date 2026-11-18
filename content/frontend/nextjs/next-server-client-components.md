---
id: next-server-client-components
module: next-fundamentals
order: 2
title: Server Components and Client Components
description: What runs where, the 'use client' boundary, passing data across it, and composition patterns.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [next-server-client]
references:
  - { title: 'Next.js Docs — Server and Client Components', url: 'https://nextjs.org/docs/app/getting-started/server-and-client-components' }
  - { title: 'React — Server Components', url: 'https://react.dev/reference/rsc/server-components' }
  - { title: "React — 'use client'", url: 'https://react.dev/reference/rsc/use-client' }
keyTakeaways:
  - In the App Router components are Server Components by default — they run on the server, can be async and ship no JavaScript.
  - "'use client' marks the boundary: that module and everything it imports become client code."
  - Props from Server to Client Components must be serializable; functions cannot cross except Server Actions.
  - Keep client components small leaves and pass server-rendered content into them as children.
interviewQuestions:
  - question: When do you need a Client Component?
    answer: |
      When the component uses state or effects (`useState`, `useEffect`), event handlers, browser APIs
      (`window`, `localStorage`), or client-only libraries. Everything else — fetching data, accessing
      the database or secrets, rendering static or data-driven markup — can stay a Server Component,
      which keeps JavaScript out of the bundle.
  - question: What can be passed from a Server Component to a Client Component?
    answer: |
      Serializable values: primitives, plain objects and arrays, `Date`, `Map`, `Set`, promises (to be
      read with `use`), JSX elements, and Server Functions. Class instances and ordinary functions
      cannot cross the boundary. Large objects also cost bytes in the RSC payload, so pass only what
      the client needs.
  - question: Can a Client Component render a Server Component?
    answer: |
      It cannot import one (the import would turn it into client code), but it can receive one as
      `children` or another prop from a Server Component parent. This "slot" pattern lets an
      interactive wrapper (a tab bar, a modal) display server-rendered content.
quiz:
  - id: q1
    question: By default, a component in the app directory is…
    options: ["A Client Component", "A Server Component", "Both", "Static HTML only"]
    correct: 1
    explanation: Opt into client code with the 'use client' directive.
  - id: q2
    question: Which needs 'use client'?
    options: ["An async component that queries the database", "A component with useState and onClick", "A component that renders Markdown on the server", "A layout with static navigation links"]
    correct: 1
    explanation: State and event handlers require client JavaScript.
  - id: q3
    question: Can you pass an onClick function from a Server Component to a Client Component?
    options: ["Yes", "No — regular functions are not serializable", "Only arrow functions", "Only with JSON.stringify"]
    correct: 1
    explanation: Only Server Functions (Server Actions) can be passed as functions.
---

## Default: Server Components

```tsx
// app/products/page.tsx — Server Component
import { db } from '@/lib/db'
import { AddToCartButton } from './add-to-cart-button'

export default async function ProductsPage() {
  const products = await db.product.findMany() // direct DB access, secrets stay on the server
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          {p.name} — {p.price}
          <AddToCartButton productId={p.id} />
        </li>
      ))}
    </ul>
  )
}
```

## The client boundary

```tsx
'use client'
// app/products/add-to-cart-button.tsx
import { useState } from 'react'

export function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false)
  return <button onClick={() => setAdded(true)}>{added ? 'Added' : 'Add to cart'}</button>
}
```

## Composition: server content inside client wrappers

```tsx
// Server Component
<Tabs>
  <ServerRenderedReviews productId={id} /> {/* rendered on the server, passed as children */}
</Tabs>

// Client Component
'use client'
export function Tabs({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return <section>{open && children}</section>
}
```

## Keeping server code on the server

```ts
import 'server-only' // build error if imported into a Client Component
export async function getSecretReport() { /* … */ }
```
