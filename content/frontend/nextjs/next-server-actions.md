---
id: next-server-actions
module: next-data
order: 2
title: Server Actions and mutations
description: Server Functions with forms, pending and error states, revalidation and redirects, and the security rules every action needs.
levels: [middle, senior]
estimatedMinutes: 25
topics: [next-server-actions]
reviewed: 2026-11-20
references:
  - { title: 'Next.js Docs — Updating data (Server Functions)', url: 'https://nextjs.org/docs/app/getting-started/updating-data' }
  - { title: "React — 'use server'", url: 'https://react.dev/reference/rsc/use-server' }
  - { title: 'Next.js Blog — How to Think About Security in Next.js', url: 'https://nextjs.org/blog/security-nextjs-server-components-actions' }
keyTakeaways:
  - "A function marked 'use server' becomes a Server Action: callable from forms and client code via an internal POST endpoint."
  - Forms with action work before JavaScript loads (progressive enhancement); useActionState adds results and pending state.
  - Every action is a public endpoint — validate input and check authentication and authorization inside it.
  - Revalidate cached data and redirect after a successful mutation.
interviewQuestions:
  - question: What happens when a form calls a Server Action?
    answer: |
      Next.js gives the action an ID and exposes it through a POST endpoint. On submit the browser (or
      React, once hydrated) sends the form data with that ID; the function runs on the server, can
      read cookies, write to the database and call `revalidatePath`/`redirect`, and the response
      updates the UI with fresh Server Component output in a single round trip.
  - question: Why must Server Actions validate input and check authorization?
    answer: |
      Because they are reachable over HTTP by anyone who discovers the action ID, not only from your
      UI. Treat every action like an API route: parse the input with a schema (e.g. Zod), check the
      session, and verify the user may perform the operation on that specific resource. Never trust
      hidden form fields such as `userId`.
  - question: How do you show pending and error states for an action?
    answer: |
      Use `useActionState(action, initialState)` to get the returned state (validation errors,
      messages) and `isPending`, or `useFormStatus` in a child submit button. For instant feedback, use
      `useOptimistic`. Return expected errors as data; throw only for unexpected failures, which reach
      the nearest `error.tsx`.
quiz:
  - id: q1
    question: How is a Server Action invoked from the browser?
    options: ["Through a WebSocket", "Through an HTTP POST request handled by Next.js", "By importing server code into the bundle", "Through localStorage"]
    correct: 1
    explanation: Actions are exposed as POST endpoints.
  - id: q2
    question: Where should you check that the user may delete a post?
    options: ["Only in the UI by hiding the button", "Inside the Server Action itself", "In CSS", "In the layout"]
    correct: 1
    explanation: Actions are public endpoints; authorize on the server for every call.
  - id: q3
    question: Does a form with a Server Action work before JavaScript has loaded?
    options: ["No", "Yes, when used as the form's action", "Only in Safari", "Only with use client"]
    correct: 1
    explanation: Forms submit natively and the action runs on the server.
---

## A form with a Server Action

```tsx
// app/posts/actions.ts
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const PostInput = z.object({ title: z.string().min(3).max(120) })

export async function createPost(prevState: { error?: string }, formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Please sign in.' }

  const parsed = PostInput.safeParse({ title: formData.get('title') })
  if (!parsed.success) return { error: 'Title must be 3–120 characters.' }

  const post = await db.post.create({ data: { ...parsed.data, authorId: session.userId } })
  revalidatePath('/posts')
  redirect(`/posts/${post.id}`)
}
```

```tsx
'use client'
import { useActionState } from 'react'
import { createPost } from './actions'

export function NewPostForm() {
  const [state, formAction, isPending] = useActionState(createPost, {})
  return (
    <form action={formAction}>
      <label htmlFor="title">Title</label>
      <input id="title" name="title" required />
      <button disabled={isPending}>{isPending ? 'Saving…' : 'Publish'}</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  )
}
```

## Security checklist for every action

- Authenticate (session) and authorize (ownership/role) inside the action
- Validate and parse input; never trust hidden fields
- Return only the data the client needs
- Rate-limit sensitive actions
- Remember closures over server values are encrypted, but the action itself is still public
