---
id: sd-realtime-notifications
order: 4
title: Design real-time notifications
levels: [middle, senior]
timeboxMinutes: 45
topics: [fe-system-design, web-http-caching, react-state-management]
references:
  - { title: 'MDN — Using server-sent events', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events' }
  - { title: 'MDN — WebSockets API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API' }
  - { title: 'MDN — Page Visibility API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API' }
checklist:
  - { id: c1, text: 'Clarified requirements — notification types, unread counts, multiple tabs/devices, push when the app is closed' }
  - { id: c2, text: 'Compared polling, long polling, SSE and WebSockets and justified the choice' }
  - { id: c3, text: 'Designed reconnection with backoff and catch-up using a cursor/last event id' }
  - { id: c4, text: 'Kept unread counts consistent across tabs (BroadcastChannel / shared worker / storage events)' }
  - { id: c5, text: 'Described the data model and API (list, mark read, mark all read, preferences)' }
  - { id: c6, text: 'Handled ordering, de-duplication and idempotent mark-as-read' }
  - { id: c7, text: 'Designed accessible toasts and the notifications panel (live regions, focus, no focus stealing)' }
  - { id: c8, text: 'Considered background tabs, battery and connection limits (visibility, throttling)' }
  - { id: c9, text: 'Mentioned Web Push / service worker for notifications when the app is closed' }
  - { id: c10, text: 'Covered security — authenticated connections, per-user channels, no sensitive data in toasts' }
---

## Prompt

Design in-app notifications for a project-management tool: a bell icon with an unread count, a panel
listing notifications, and toasts for important events (mentions, assignments). Users often keep
several tabs open.

## Requirements

**Functional:** real-time delivery; unread badge; panel with pagination; mark one/all as read; toasts
for high-priority events; user preferences.

**Non-functional:** delivery within a few seconds; consistent state across tabs and devices; resilient
to disconnects; low battery and network cost; accessible.

## High-level architecture

- A notifications service stores notifications and exposes REST endpoints plus a real-time channel.
- Real-time: **SSE** for one-way server→client events (simple, HTTP, auto-reconnect with
  `Last-Event-ID`); WebSockets if the feature later needs two-way messaging.
- One connection per browser, shared across tabs (leader tab via `BroadcastChannel` or a
  `SharedWorker`).
- Web Push via a service worker for notifications when no tab is open (optional, opt-in).

## Component design

```text
NotificationsProvider (connection, cache, cross-tab sync)
├── BellButton (unread count)
├── NotificationsPanel (list, mark read, "load more")
└── ToastRegion (high-priority events)
```

## Data model and API

```http
GET  /api/notifications?cursor=…&limit=20      → { items, nextCursor, unreadCount }
POST /api/notifications/:id/read               (idempotent)
POST /api/notifications/read-all?before=<id>
GET  /api/notifications/stream                 (SSE; events: notification, read, count)
```

Each event has a monotonically increasing id for ordering and catch-up after reconnects.

## State management

Server state in a query cache keyed by user; SSE events update the cache (prepend, update counts).
Mark-as-read is optimistic with rollback. Cross-tab: the leader tab owns the connection and
broadcasts events; all tabs apply them and broadcast local read actions.

## Performance

- One shared connection instead of one per tab; pause or slow down when all tabs are hidden.
- Paginate the panel; virtualize if lists get long.
- Batch rapid events into a single toast ("3 new mentions").
- Exponential backoff with jitter on reconnect to avoid thundering herds.

## Accessibility

Bell button with an accessible name including the count ("Notifications, 3 unread"); panel as a
dialog or disclosure with focus management; toasts in a polite live region (assertive only for
critical alerts), never stealing focus, pausable and dismissible, with enough time to read.

## Edge cases and trade-offs

- Missed events while offline → catch up from the last event id or refetch.
- Duplicate events after reconnect → de-duplicate by id.
- Clock skew → order by server ids, not client timestamps.
- Trade-off: SSE is simpler and works through most proxies; WebSockets add bidirectional flexibility
  at the cost of more infrastructure.
