---
id: sd-infinite-feed
order: 2
title: Design an infinite news feed
levels: [middle, senior]
timeboxMinutes: 45
topics: [fe-system-design, web-performance, web-http-caching]
reviewed: 2026-11-20
references:
  - { title: 'MDN — Intersection Observer API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API' }
  - { title: 'TanStack Query — Infinite Queries', url: 'https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries' }
checklist:
  - { id: c1, text: 'Clarified requirements — post types, interactions (like, comment), new posts arriving, devices' }
  - { id: c2, text: 'Chose cursor pagination and explained why (live inserts, stable pages)' }
  - { id: c3, text: 'Triggered loading with IntersectionObserver instead of scroll listeners' }
  - { id: c4, text: 'Addressed DOM size with virtualization or windowing for long sessions' }
  - { id: c5, text: 'Handled new posts at the top without jumping the scroll position ("N new posts" pill)' }
  - { id: c6, text: 'Covered optimistic updates for likes with rollback' }
  - { id: c7, text: 'Described image/media loading (lazy, sizes, placeholders) and CLS prevention' }
  - { id: c8, text: 'Considered rendering strategy (SSR of the first page) and caching' }
  - { id: c9, text: 'Kept accessibility — feed semantics, keyboard navigation, focus, announcements, a way to reach the footer' }
  - { id: c10, text: 'Covered errors, retry, end of feed and scroll restoration on back navigation' }
---

## Prompt

Design the home feed of a social network. Users scroll an endless list of posts (text, images,
videos), can like and comment, and new posts keep arriving while they read.

## Requirements

**Functional:** endless scrolling; post types text/image/video; like and comment; indicate new posts;
remember the position when navigating to a post and back.

**Non-functional:** smooth scrolling on mid-range phones; fast first paint; low data usage; accessible;
handles flaky networks.

## High-level architecture

- SSR (or streaming) of the first page for a fast first paint and good LCP; the client takes over
  pagination after hydration.
- A feed service API with cursor pagination; media served from a CDN with responsive variants.
- A query cache (TanStack Query / RTK Query) owns server state; UI state (open comment boxes) stays
  local.

## Component design

```text
FeedPage
├── NewPostsPill
├── VirtualizedList
│   └── PostCard (Header, Body, Media, Actions, CommentsPreview)
├── LoadMoreSentinel (IntersectionObserver)
└── FeedStatus (loading / error / end)
```

`PostCard` is memoized and receives only the post and callbacks; `Media` handles lazy loading and
fixed aspect ratio.

## Data model and API

```http
GET /api/feed?cursor=eyJpZCI6IjEwMjQifQ&limit=20
200 { "items": [Post], "nextCursor": "…", "hasMore": true }

GET /api/feed/new-count?since=<newest id>   (or SSE/WebSocket push)
POST /api/posts/:id/like
```

Normalize posts by id in the cache so a like updates the post wherever it appears.

## State management

Infinite query keyed by `['feed']` with pages; `getNextPageParam` from `nextCursor`. New posts are
fetched into a separate buffer and merged at the top only when the user clicks the pill. Likes are
optimistic: update the cached post, roll back on error.

## Performance

- Virtualize after a few hundred posts (react-virtual / content-visibility) to keep DOM size bounded.
- IntersectionObserver with a root margin to prefetch the next page before the end.
- Images: `srcset`/`sizes`, lazy below the fold, width/height to avoid CLS; videos play only when
  visible.
- Memoize cards, avoid re-rendering the whole list on a like.

## Accessibility

Use `role="feed"` with `article` elements (`aria-posinset`, `aria-setsize` when known) or a plain list;
keep keyboard order logical; do not move focus when new items load; announce "20 more posts loaded"
politely; provide a "Load more" button alternative and a way to reach the footer.

## Edge cases and trade-offs

- Duplicate or missing items when posts are inserted — solved by cursors.
- Scroll restoration on back navigation: keep the cache and restore the offset.
- Deleted posts mid-scroll; errors on page N with a retry that keeps earlier pages.
- Trade-off: virtualization complicates in-page search (Ctrl+F) and accessibility — apply it only when
  needed.
