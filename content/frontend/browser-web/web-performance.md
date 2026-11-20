---
id: web-performance
module: web-quality
order: 3
title: Core Web Vitals and performance
description: LCP, INP and CLS, how to measure them in the lab and in the field, and the fixes that move them.
levels: [middle, senior]
estimatedMinutes: 30
topics: [web-performance]
reviewed: 2026-11-20
references:
  - { title: 'web.dev — Web Vitals', url: 'https://web.dev/articles/vitals' }
  - { title: 'web.dev — Optimize Largest Contentful Paint', url: 'https://web.dev/articles/optimize-lcp' }
  - { title: 'web.dev — Optimize Interaction to Next Paint', url: 'https://web.dev/articles/optimize-inp' }
keyTakeaways:
  - LCP (loading) ≤ 2.5 s, INP (responsiveness) ≤ 200 ms, CLS (visual stability) ≤ 0.1 at the 75th percentile.
  - Lab tools (Lighthouse, DevTools) help debug; field data (RUM, CrUX) shows what real users experience.
  - LCP improves by making the hero resource discoverable early, prioritized and small.
  - INP improves by shortening long tasks; CLS improves by reserving space for images, ads and late content.
interviewQuestions:
  - question: What are the Core Web Vitals?
    answer: |
      Largest Contentful Paint — when the largest image or text block becomes visible (good ≤ 2.5 s).
      Interaction to Next Paint — the latency from user input to the next frame, across the page's
      interactions (good ≤ 200 ms; it replaced FID in 2024). Cumulative Layout Shift — how much visible
      content moves unexpectedly (good ≤ 0.1). They are judged at the 75th percentile of real page
      loads.
  - question: How would you improve a slow LCP?
    answer: |
      Find the LCP element first. Then reduce server response time (caching, CDN), make the hero image
      discoverable in the initial HTML (not loaded by JavaScript), add `fetchpriority="high"` and avoid
      lazy-loading it, serve modern formats (AVIF/WebP) at the right size with `srcset`, inline or
      preload critical CSS and fonts, and avoid render-blocking scripts.
  - question: What causes a poor INP and how do you fix it?
    answer: |
      Long tasks on the main thread — heavy event handlers, large re-renders, hydration, third-party
      scripts — delay the next paint after an interaction. Fixes: do less work per interaction, show
      feedback first and defer the rest (`requestAnimationFrame`, `scheduler.yield()`,
      `setTimeout`), use `startTransition`/`useDeferredValue` in React, virtualize long lists, move
      heavy computation to a Web Worker, and audit third-party scripts.
  - question: How do you prevent layout shifts?
    answer: |
      Always set `width`/`height` (or `aspect-ratio`) on images and video, reserve space for ads,
      embeds and banners, avoid inserting content above existing content unless in response to user
      input, use `font-display` with metric-compatible fallbacks, and animate with `transform` rather
      than properties that change layout.
quiz:
  - id: q1
    question: Which metric measures responsiveness to user input?
    options: ["LCP", "CLS", "INP", "TTFB"]
    correct: 2
    explanation: Interaction to Next Paint measures input-to-paint latency.
  - id: q2
    question: Good LCP threshold?
    options: ["≤ 1 s", "≤ 2.5 s", "≤ 4 s", "≤ 10 s"]
    correct: 1
    explanation: Good LCP is 2.5 seconds or less at the 75th percentile.
  - id: q3
    question: "The hero image has loading=\"lazy\". What happens to LCP?"
    options: ["It improves", "It usually gets worse because the image loads later", "No effect", "CLS increases"]
    correct: 1
    explanation: Never lazy-load the LCP image; prioritize it instead.
  - id: q4
    question: Which fix reduces CLS from images?
    options: ["Using PNG", "Setting width and height or aspect-ratio", "Lazy-loading everything", "Inlining scripts"]
    correct: 1
    explanation: Reserved space prevents content from jumping when the image loads.
---

## The metrics

| Metric | Measures | Good |
| --- | --- | --- |
| LCP | Loading of the main content | ≤ 2.5 s |
| INP | Responsiveness to interactions | ≤ 200 ms |
| CLS | Unexpected layout movement | ≤ 0.1 |

Measure in the field with the `web-vitals` library or your RUM tool; use Lighthouse and the DevTools
Performance panel to understand *why*.

```js
import { onCLS, onINP, onLCP } from 'web-vitals'

onLCP(send)
onINP(send)
onCLS(send)
```

## LCP

```html
<!-- discoverable, prioritized, right-sized hero image -->
<img
  src="/hero-800.avif"
  srcset="/hero-800.avif 800w, /hero-1600.avif 1600w"
  sizes="(max-width: 800px) 100vw, 800px"
  width="800"
  height="450"
  fetchpriority="high"
  alt="Team planning on a whiteboard"
/>
```

## INP

```js
button.addEventListener('click', async () => {
  showSpinner() // immediate visual feedback
  await new Promise((r) => setTimeout(r)) // yield so the browser can paint
  runExpensiveFilter() // or move to a Web Worker
})
```

In React: `startTransition` for non-urgent updates, memoize expensive subtrees, virtualize lists.

## CLS

```css
img, video { height: auto; aspect-ratio: attr(width) / attr(height); }
.ad-slot { min-height: 250px; } /* reserve space before the ad loads */
```

## JavaScript budget

- Code-split routes and heavy widgets (`import()`), tree-shake, avoid shipping unused polyfills.
- Defer third-party scripts; load them after interaction where possible.
- Check bundles with a bundle analyzer and set budgets in CI.
