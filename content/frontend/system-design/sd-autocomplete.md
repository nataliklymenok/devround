---
id: sd-autocomplete
order: 1
title: Design an autocomplete (typeahead)
levels: [middle, senior]
timeboxMinutes: 45
topics: [fe-system-design, web-performance, web-accessibility]
references:
  - { title: 'W3C APG — Combobox pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/' }
  - { title: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' }
checklist:
  - { id: c1, text: 'Clarified functional requirements (sources of suggestions, keyboard use, recent searches) and non-functional ones (latency, mobile, accessibility)' }
  - { id: c2, text: 'Proposed a component API (props such as fetcher, debounce, minimum query length, onSelect, renderItem)' }
  - { id: c3, text: 'Debounced input and skipped short or unchanged queries' }
  - { id: c4, text: 'Handled race conditions — aborted or ignored stale responses' }
  - { id: c5, text: 'Added a client-side cache for recent queries (with size limit / TTL)' }
  - { id: c6, text: 'Described the API contract (query, limit, response shape) and error handling' }
  - { id: c7, text: 'Covered loading, empty and error states without UI flicker' }
  - { id: c8, text: 'Implemented the ARIA combobox pattern with full keyboard support' }
  - { id: c9, text: 'Discussed performance — render cost of long lists, highlighting, virtualization when needed' }
  - { id: c10, text: 'Mentioned edge cases — IME composition, mobile keyboards, offline, very fast typing, XSS in highlighted text' }
---

## Prompt

Design an autocomplete input for a large e-commerce site. As the user types, suggestions (products,
categories and recent searches) appear below the input. Users can pick a suggestion with the mouse or
keyboard. The component will be reused in several places.

## Requirements

**Functional:** suggestions after typing at least 2 characters; mixed result types with grouping;
recent searches when the input is focused and empty; mouse and keyboard selection; highlight the
matching part.

**Non-functional:** suggestions visible within ~300 ms after the user pauses; works on mobile;
accessible to keyboard and screen-reader users; resilient to slow and failing networks; reusable API.

**Out of scope:** the ranking algorithm on the server.

## High-level architecture

- A reusable `Autocomplete` UI component plus a data layer (`useSuggestions`) that owns debouncing,
  caching and request cancellation.
- Suggestions come from a dedicated search endpoint (backed by a search index) behind a CDN; recent
  searches live in `localStorage`.
- Rendering: client-side component; the page itself can be SSR — the input works without
  JavaScript as a normal search form (progressive enhancement).

## Component design

```text
Autocomplete
├── Input (role=combobox)
└── Popup (role=listbox)
    ├── Group "Recent"   → Option…
    └── Group "Products" → Option (renderItem)…
```

API: `fetchSuggestions(query, { signal })`, `minChars`, `debounceMs`, `onSelect(item)`,
`renderItem(item, { query })`, `getKey(item)`. State: `query`, `results`, `status`, `activeIndex`,
`isOpen` — kept inside a hook so the UI stays presentational.

## Data model and API

```http
GET /api/suggest?q=lap&limit=8
200 { "query": "lap", "items": [{ "id": "p1", "type": "product", "label": "Laptop 14”", "url": "/p/1" }] }
```

Client cache: `Map<query, { items, at }>` with LRU size ~50 and a short TTL. Prefix reuse is
possible (results for "lapt" can be filtered from "lap" if the server returns enough items).

## State management

All state is local to the component (no global store). The "latest request wins" rule: each request
gets an `AbortController`; a new query aborts the previous one, and a response is only applied if it
belongs to the current query. Recent searches are written on select.

## Performance

- Debounce ~200–300 ms, `minChars` 2, skip identical queries.
- Cache hits render instantly; prefetch on focus for recent searches.
- Keep the list short (8–10 items); highlight with string slicing rather than heavy regex per render.
- Server: CDN caching for popular prefixes, small payloads.

## Accessibility

ARIA combobox pattern: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`
on the input; `role="listbox"`/`role="option"` with `aria-selected`; focus stays in the input; arrow
keys, Enter, Escape; a polite live region announcing "8 suggestions available"; visible focus and
sufficient contrast for the active option.

## Edge cases and trade-offs

- IME composition (Japanese, Chinese input): do not query during `compositionstart`…`compositionend`.
- Escape HTML when highlighting matches — never inject raw strings.
- Slow network: keep showing previous results with a subtle loading indicator instead of flickering.
- Offline: show recent searches only.
- Trade-off: aggressive debounce reduces load but feels slower — tune with real data.
