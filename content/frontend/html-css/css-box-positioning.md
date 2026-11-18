---
id: css-box-positioning
module: html-css-foundations
order: 3
title: Box model, positioning and stacking contexts
description: content-box vs border-box, margin collapsing, display types, position values and why z-index sometimes does not work.
levels: [junior, middle, senior]
estimatedMinutes: 25
topics: [css-box-positioning]
references:
  - { title: 'MDN — The box model', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model' }
  - { title: 'MDN — position', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/position' }
  - { title: 'MDN — Stacking context', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context' }
keyTakeaways:
  - With box-sizing border-box, width includes padding and border — most resets set it globally.
  - Vertical margins of adjacent blocks collapse; flex and grid items do not collapse margins.
  - absolute positions relative to the nearest positioned ancestor; fixed to the viewport (unless an ancestor has transform); sticky until its container scrolls away.
  - z-index works only inside the element's stacking context; transform, opacity below 1, filter and position with z-index create new contexts.
interviewQuestions:
  - question: Explain the CSS box model and box-sizing.
    answer: |
      Every element is a box of content, padding, border and margin. With the default
      `box-sizing: content-box`, `width` sets only the content, so padding and border are added on top.
      With `border-box`, `width` includes padding and border, which makes sizing predictable — hence
      `*, *::before, *::after { box-sizing: border-box }` in most resets.
  - question: 'Why does z-index: 9999 not put my dropdown above a modal?'
    answer: |
      z-index only orders elements within the same stacking context. If the dropdown's ancestor creates
      a stacking context (e.g. it has `transform`, `opacity` below 1, `filter`, `isolation: isolate`, or
      `position` with a `z-index`), the dropdown can never escape above siblings of that ancestor with a
      higher z-index. Fix it by restructuring, adjusting the ancestor's z-index, or rendering the
      dropdown in a portal / the top layer (`popover`, `dialog`).
  - question: What is the difference between relative, absolute, fixed and sticky?
    answer: |
      `relative` keeps the element in flow and offsets it visually; it also becomes the containing block
      for absolute children. `absolute` removes it from flow and positions it against the nearest
      positioned ancestor. `fixed` positions against the viewport (or an ancestor with `transform`).
      `sticky` behaves like relative until a scroll threshold, then sticks within its parent's bounds.
quiz:
  - id: q1
    question: "width: 200px; padding: 20px; border: 2px; box-sizing: content-box — rendered width?"
    options: ["200px", "220px", "244px", "240px"]
    correct: 2
    explanation: 200 + 2×20 padding + 2×2 border = 244px.
  - id: q2
    question: An absolute element is positioned relative to…
    options: ["The body always", "Its nearest positioned ancestor", "The viewport", "Its previous sibling"]
    correct: 1
    explanation: The nearest ancestor with position other than static (or the initial containing block).
  - id: q3
    question: Which property creates a new stacking context?
    options: ["color", "margin", "transform: translateX(0)", "display: block"]
    correct: 2
    explanation: Any transform other than none creates a stacking context.
  - id: q4
    question: Do vertical margins collapse between flex items?
    options: ["Yes", "No", "Only with gap", "Only in Safari"]
    correct: 1
    explanation: Margin collapsing happens in normal block flow, not in flex or grid formatting contexts.
---

## Box sizing

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

## Margin collapsing

```css
h2 { margin-bottom: 24px; }
p { margin-top: 16px; }
/* gap between them is 24px, not 40px */
```

Use `gap` in flex/grid layouts to avoid margin puzzles.

## Positioning

```css
.card { position: relative; }
.card .badge { position: absolute; top: 8px; right: 8px; }

.toolbar { position: sticky; top: 0; }

.toast { position: fixed; bottom: 16px; right: 16px; }
```

## Stacking contexts

```css
.header { position: relative; z-index: 10; }
.page { transform: translateZ(0); } /* new stacking context */
.page .dropdown { position: absolute; z-index: 9999; } /* still under .header if .page sits below it */
```

Modern escape hatches: the `popover` attribute and `dialog` with `showModal()` render in the browser's
**top layer**, above every stacking context.

## display quick reference

| Value | Behaviour |
| --- | --- |
| `block` | Full width, starts on a new line |
| `inline` | Flows with text, ignores width/height |
| `inline-block` | Inline, but respects width/height |
| `flex` / `grid` | Establishes a flex/grid formatting context |
| `contents` | Box disappears, children participate in the parent's layout |
| `none` | Not rendered |
