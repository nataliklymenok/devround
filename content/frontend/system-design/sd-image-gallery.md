---
id: sd-image-gallery
order: 3
title: Design an image gallery with a lightbox carousel
levels: [junior, middle, senior]
timeboxMinutes: 40
topics: [fe-system-design, web-performance, web-accessibility]
reviewed: 2026-11-20
references:
  - { title: 'MDN — Responsive images', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images' }
  - { title: 'W3C APG — Carousel pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/carousel/' }
checklist:
  - { id: c1, text: 'Clarified requirements — number of images, layouts, zoom, captions, sharing, mobile gestures' }
  - { id: c2, text: 'Designed the grid layout (CSS grid or masonry) with fixed aspect ratios' }
  - { id: c3, text: 'Served responsive images (srcset/sizes, modern formats, CDN transformations)' }
  - { id: c4, text: 'Lazy-loaded thumbnails and preloaded neighbours in the lightbox' }
  - { id: c5, text: 'Made the lightbox a modal dialog with focus management and Escape' }
  - { id: c6, text: 'Supported keyboard (arrows) and touch (swipe) navigation' }
  - { id: c7, text: 'Synced the open image to the URL for sharing and back-button support' }
  - { id: c8, text: 'Covered alt text, captions and announcing the current slide' }
  - { id: c9, text: 'Handled loading, error and slow-network states (placeholders, retries)' }
---

## Prompt

Design a photo gallery page for a travel site: a grid of thumbnails; clicking one opens a full-screen
lightbox where users can move between photos, zoom, and share a link to a specific photo.

## Requirements

**Functional:** responsive grid; lightbox with next/previous, captions, zoom; shareable URL per photo;
works with mouse, keyboard and touch.

**Non-functional:** fast loading on mobile networks; no layout shift; accessible; galleries up to a
few thousand images.

## High-level architecture

- Page rendered on the server with the first batch of thumbnails; more loaded on scroll.
- An image CDN generates sizes and formats on the fly (`?w=400&fm=avif`).
- The lightbox is a client component opened via URL state (`?photo=123`) or an intercepting route.

## Component design

```text
GalleryPage
├── Grid → Thumbnail (img with aspect-ratio, lazy)
└── Lightbox (dialog)
    ├── Slide (zoomable image + caption)
    ├── PrevButton / NextButton
    └── Counter ("3 of 120", live region)
```

## Data model and API

```http
GET /api/galleries/:id/photos?cursor=…&limit=60
200 { "items": [{ "id": "123", "width": 4000, "height": 3000, "alt": "…", "caption": "…", "src": "…" }], "nextCursor": "…" }
```

Width and height come with each item so the grid can reserve space.

## State management

URL holds the open photo id (shareable, back button closes the lightbox). Loaded pages live in a
query cache. Lightbox UI state (zoom level) is local.

## Performance

- `srcset`/`sizes` thumbnails around 300–400 px wide, AVIF/WebP with JPEG fallback.
- `loading="lazy"` and `decoding="async"` for thumbnails; the first row eager for LCP.
- In the lightbox, preload the next and previous full-size images.
- Blur-up or dominant-colour placeholders; fixed aspect ratio → zero CLS.

## Accessibility

Thumbnails are buttons or links with descriptive `alt`; the lightbox is a modal `dialog` with a label,
focus moved inside and returned on close, Escape closes, arrow keys navigate, buttons have names
("Next photo"), and the current position is announced politely. Respect `prefers-reduced-motion` for
slide animations.

## Edge cases and trade-offs

- Missing or failed images — show a placeholder with retry.
- Very tall or panoramic photos — `object-fit` choices.
- Deep link to a photo not in the first page — fetch it directly by id.
- Trade-off: masonry layouts look nice but complicate keyboard order and reserving space.
