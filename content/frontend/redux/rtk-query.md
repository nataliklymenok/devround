---
id: rtk-query
module: state-advanced
order: 1
title: RTK Query
description: Defining an API slice, generated hooks, cache lifetime, tag-based invalidation and optimistic updates.
levels: [middle, senior]
estimatedMinutes: 25
topics: [rtk-query]
references:
  - { title: 'Redux Toolkit — RTK Query Overview', url: 'https://redux-toolkit.js.org/rtk-query/overview' }
  - { title: 'RTK Query — Automated Re-fetching (tags)', url: 'https://redux-toolkit.js.org/rtk-query/usage/automated-refetching' }
  - { title: 'RTK Query — Manual cache updates and optimistic updates', url: 'https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates' }
keyTakeaways:
  - createApi defines endpoints once and generates React hooks (useGetPostsQuery, useAddPostMutation).
  - Requests are deduplicated and cached per endpoint + argument; unused data is removed after keepUnusedDataFor (60 s by default).
  - providesTags and invalidatesTags connect mutations to the queries they make stale.
  - onQueryStarted with updateQueryData enables optimistic updates with rollback.
interviewQuestions:
  - question: How does RTK Query decide when to refetch after a mutation?
    answer: |
      Queries declare which cache tags they provide (`providesTags: ['Post']` or per-item
      `{ type: 'Post', id }`), and mutations declare which tags they invalidate. After a mutation
      succeeds, every active query providing an invalidated tag refetches automatically. Using a
      `LIST` id for collections and item ids for details keeps refetches precise.
  - question: RTK Query or TanStack Query?
    answer: |
      Both solve server-state caching with very similar concepts. RTK Query is a natural fit if the app
      already uses Redux — data lives in the store, appears in Redux DevTools and integrates with
      listeners. TanStack Query is framework-agnostic, has no Redux dependency and offers features like
      infinite queries and fine-grained options out of the box. Choose based on the existing stack.
  - question: How do you implement an optimistic update with RTK Query?
    answer: |
      In the mutation's `onQueryStarted`, call `dispatch(api.util.updateQueryData('getPosts', arg,
      draft => {...}))` to patch the cached data immediately, then `await queryFulfilled`; if it
      throws, call `patchResult.undo()` to roll back.
quiz:
  - id: q1
    question: Which option makes a mutation refetch the post list?
    options: ["keepUnusedDataFor", "invalidatesTags matching the list's providesTags", "refetchOnFocus", "skip"]
    correct: 1
    explanation: Tags connect mutations to stale queries.
  - id: q2
    question: Two components call useGetPostsQuery() with the same argument at the same time. How many requests?
    options: ["Two", "One — requests are deduplicated", "Zero", "Depends on React version"]
    correct: 1
    explanation: Subscriptions share one cache entry.
  - id: q3
    question: How long is unused data kept by default?
    options: ["Forever", "60 seconds", "5 minutes", "Until page reload only"]
    correct: 1
    explanation: keepUnusedDataFor defaults to 60 seconds.
---

## Defining an API

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post'],
  endpoints: (build) => ({
    getPosts: build.query<Post[], void>({
      query: () => 'posts',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Post' as const, id })), { type: 'Post', id: 'LIST' }]
          : [{ type: 'Post', id: 'LIST' }],
    }),
    addPost: build.mutation<Post, Pick<Post, 'title'>>({
      query: (body) => ({ url: 'posts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
  }),
})

export const { useGetPostsQuery, useAddPostMutation } = api
```

Add `api.reducer` under `reducerPath` and `api.middleware` to the store.

## Using the hooks

```tsx
function Posts() {
  const { data = [], isLoading, isError, refetch } = useGetPostsQuery()
  const [addPost, { isLoading: isSaving }] = useAddPostMutation()

  if (isLoading) return <Spinner />
  if (isError) return <ErrorState onRetry={refetch} />
  return (
    <>
      <button disabled={isSaving} onClick={() => addPost({ title: 'New post' })}>Add</button>
      {data.map((p) => <p key={p.id}>{p.title}</p>)}
    </>
  )
}
```

## Optimistic update

```ts
toggleLike: build.mutation<void, { id: string }>({
  query: ({ id }) => ({ url: `posts/${id}/like`, method: 'POST' }),
  async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
    const patch = dispatch(
      api.util.updateQueryData('getPosts', undefined, (draft) => {
        const post = draft.find((p) => p.id === id)
        if (post) post.liked = !post.liked
      }),
    )
    try {
      await queryFulfilled
    } catch {
      patch.undo()
    }
  },
}),
```
