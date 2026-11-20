---
id: web-rendering-pipeline
module: web-dom-rendering
order: 2
title: The rendering pipeline
description: Critical rendering path, layout, paint and compositing, layout thrashing, and loading scripts with defer and async.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [web-rendering-pipeline]
reviewed: 2026-11-20
references:
  - { title: 'MDN — Critical rendering path', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path' }
  - { title: 'MDN — The script element: async and defer', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script' }
  - { title: 'web.dev — Avoid large, complex layouts and layout thrashing', url: 'https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing' }
keyTakeaways:
  - HTML → DOM, CSS → CSSOM, together → render tree → layout → paint → composite.
  - CSS is render-blocking; a classic script without defer or async blocks HTML parsing.
  - Changing geometry triggers layout (reflow); changing colors triggers paint; transform and opacity can be composited only.
  - Reading layout (offsetHeight, getBoundingClientRect) after writing styles forces synchronous layout — batch reads before writes.
interviewQuestions:
  - question: Walk through what the browser does to render a page.
    answer: |
      It parses HTML into the DOM and CSS into the CSSOM, combines them into the render tree (visible
      nodes with computed styles), runs layout to compute geometry, paints pixels into layers, and
      composites the layers on the GPU. JavaScript can modify the DOM/CSSOM at any time, which may
      rerun style, layout and paint for the affected parts.
  - question: What is the difference between reflow and repaint?
    answer: |
      Reflow (layout) recalculates sizes and positions — triggered by changing width, height, fonts,
      content, or adding/removing elements, and it can cascade to other elements. Repaint redraws
      pixels without changing geometry (color, background, visibility). Changes to `transform` and
      `opacity` can skip both and run only on the compositor, which is why they are preferred for
      animations.
  - question: What do async and defer do on a script tag?
    answer: |
      Both download the script without blocking HTML parsing. `defer` executes scripts in document
      order after parsing finishes, before `DOMContentLoaded`. `async` executes each script as soon as
      it downloads, in any order, possibly before parsing ends — good for independent scripts like
      analytics. Module scripts (`type="module"`) are deferred by default.
  - question: What is layout thrashing and how do you avoid it?
    answer: |
      Alternating DOM writes and layout reads in a loop (write width, read offsetHeight, write, read)
      forces the browser to recalculate layout synchronously on every read. Avoid it by batching all
      reads first and all writes after, caching measurements, or deferring writes with
      `requestAnimationFrame`.
quiz:
  - id: q1
    question: Which property change can usually be handled by the compositor alone?
    options: ["width", "top", "transform", "font-size"]
    correct: 2
    explanation: transform and opacity changes can skip layout and paint.
  - id: q2
    question: How are scripts with defer executed?
    options: ["As soon as each downloads, in any order", "In document order after HTML parsing", "Before CSS loads", "Only on user interaction"]
    correct: 1
    explanation: defer preserves order and runs after parsing.
  - id: q3
    question: Which pattern causes layout thrashing?
    options: ["Reading all sizes, then writing all styles", "Writing a style and reading offsetHeight inside a loop", "Using transform for animation", "Using a CSS class toggle"]
    correct: 1
    explanation: Each read after a write forces a synchronous layout.
  - id: q4
    question: Is CSS render-blocking?
    options: ["No, never", "Yes, the page is not rendered until the CSSOM for blocking stylesheets is ready", "Only inline styles", "Only in Safari"]
    correct: 1
    explanation: Browsers wait for render-blocking stylesheets to avoid a flash of unstyled content.
---

## From bytes to pixels

1. **Parse HTML** → DOM. A classic `script` tag pauses parsing until it downloads and runs.
2. **Parse CSS** → CSSOM. Stylesheets in the head are render-blocking.
3. **Style** → render tree with computed styles (nodes with `display: none` are excluded).
4. **Layout** → geometry of every box.
5. **Paint** → draw text, colors, borders, images into layers.
6. **Composite** → combine layers on the GPU.

## What triggers what

| Change | Layout | Paint | Composite |
| --- | --- | --- | --- |
| `width`, `height`, `top`, `font-size`, DOM insertions | ✓ | ✓ | ✓ |
| `color`, `background-color`, `box-shadow` | | ✓ | ✓ |
| `transform`, `opacity` | | | ✓ |

```css
/* ✅ smooth: compositor only */
.drawer { transform: translateX(-100%); transition: transform 200ms ease; }
.drawer.open { transform: translateX(0); }
```

## Layout thrashing

```js
// ❌ forces layout on every iteration
for (const box of boxes) {
  box.style.width = `${box.offsetWidth + 10}px`
}

// ✅ read everything, then write everything
const widths = boxes.map((box) => box.offsetWidth)
boxes.forEach((box, i) => {
  box.style.width = `${widths[i] + 10}px`
})
```

## Loading scripts

```text
script            — blocks parsing while downloading and executing
script async      — downloads in parallel, runs as soon as ready (any order)
script defer      — downloads in parallel, runs in order after parsing
script type=module — deferred by default
```

Put critical CSS early, defer non-critical JavaScript, and preload what the first render needs
(`link rel="preload"` for the hero image or key font).
