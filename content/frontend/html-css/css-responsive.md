---
id: css-responsive
module: css-layout
order: 3
title: Responsive design
description: Mobile-first media queries, container queries, relative units, fluid typography with clamp and responsive images.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [css-responsive]
reviewed: 2026-11-20
references:
  - { title: 'MDN — Responsive web design', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design' }
  - { title: 'MDN — CSS container queries', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries' }
  - { title: 'MDN — Responsive images', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images' }
keyTakeaways:
  - Mobile-first means base styles for small screens and min-width media queries to enhance.
  - Container queries adapt a component to the space it gets, not to the viewport.
  - rem respects user font-size settings; clamp() gives fluid values with limits; dvh fixes mobile 100vh issues.
  - srcset and sizes let the browser choose the right image; picture switches formats or art direction.
interviewQuestions:
  - question: What is the difference between media queries and container queries?
    answer: |
      Media queries respond to the viewport (or device features like `prefers-color-scheme`). Container
      queries respond to the size of a containing element that has `container-type: inline-size`, so
      the same card can be compact in a sidebar and wide in the main column. Use media queries for page
      layout and container queries for reusable components.
  - question: Why prefer rem over px for font sizes?
    answer: |
      `rem` is relative to the root font size, which follows the user's browser setting. With `px`
      fonts, users who increase the default font size get no effect. Spacing in `rem` or `em` keeps
      proportions when text grows. Borders and hairlines can stay in `px`.
  - question: How do srcset and sizes work?
    answer: |
      `srcset` lists image candidates with their widths (`hero-800.jpg 800w`). `sizes` tells the
      browser how wide the image will be displayed at different viewport widths. The browser combines
      that with the device pixel ratio and picks the smallest sufficient file. `picture` with `source`
      elements switches formats (AVIF, WebP) or crops.
quiz:
  - id: q1
    question: Mobile-first CSS typically uses…
    options: ["max-width media queries", "min-width media queries", "Only container queries", "No media queries"]
    correct: 1
    explanation: Base styles target small screens; min-width queries add enhancements.
  - id: q2
    question: "What does font-size: clamp(1rem, 2.5vw, 2rem) do?"
    options: ["Always 2.5vw", "Scales with the viewport but stays between 1rem and 2rem", "Picks a random size", "Uses 2rem on mobile"]
    correct: 1
    explanation: clamp(min, preferred, max).
  - id: q3
    question: What is required on an element before its children can use @container queries on its size?
    options: ["position: relative", "container-type: inline-size", "display: grid", "overflow: hidden"]
    correct: 1
    explanation: A size container must be declared.
---

## Mobile-first media queries

```css
.layout { display: grid; gap: 16px; }

@media (min-width: 48rem) {
  .layout { grid-template-columns: 1fr 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

## Container queries

```css
.card-list { container-type: inline-size; }

.card { display: grid; gap: 8px; }

@container (min-width: 32rem) {
  .card { grid-template-columns: 160px 1fr; }
}
```

## Units

| Unit | Relative to |
| --- | --- |
| `rem` | Root font size (user setting) |
| `em` | Element's font size |
| `%` | Parent size (property-dependent) |
| `vw` / `vh` | Viewport |
| `dvh` / `svh` / `lvh` | Dynamic / small / large viewport height (mobile toolbars) |
| `ch` | Width of "0" — handy for readable line length |

```css
.hero { min-height: 100dvh; }
.prose { max-width: 65ch; }
h1 { font-size: clamp(1.75rem, 1rem + 3vw, 3rem); }
```

## Responsive images

```html
<picture>
  <source type="image/avif" srcset="/hero-800.avif 800w, /hero-1600.avif 1600w" sizes="(min-width: 60rem) 60rem, 100vw" />
  <img
    src="/hero-800.jpg"
    srcset="/hero-800.jpg 800w, /hero-1600.jpg 1600w"
    sizes="(min-width: 60rem) 60rem, 100vw"
    width="1600"
    height="900"
    alt="Product dashboard on a laptop"
  />
</picture>
```
