---
id: css-flexbox
module: css-layout
order: 1
title: Flexbox
description: Main and cross axes, flex-grow/shrink/basis, alignment, wrapping and common layout patterns.
levels: [junior, middle]
estimatedMinutes: 20
topics: [css-flexbox]
references:
  - { title: 'MDN — Basic concepts of flexbox', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox' }
  - { title: 'MDN — flex', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/flex' }
keyTakeaways:
  - Flexbox lays items out along one axis; justify-content aligns on the main axis, align-items on the cross axis.
  - flex is shorthand for flex-grow, flex-shrink and flex-basis — flex 1 means 1 1 0%.
  - Flex items have min-width auto, so long content can overflow — set min-width 0 to allow shrinking.
  - Use gap for spacing and flex-wrap for responsive rows.
interviewQuestions:
  - question: What does flex 1 mean?
    answer: |
      It expands to `flex: 1 1 0%` — grow factor 1, shrink factor 1, basis 0. All items with `flex: 1`
      share the free space equally regardless of their content size. `flex: auto` (1 1 auto) shares
      space based on content size, and `flex: none` (0 0 auto) keeps the item at its content size.
  - question: Why does a long word or code block overflow a flex item?
    answer: |
      Flex items default to `min-width: auto`, which prevents them from shrinking below their
      min-content size. Set `min-width: 0` (or `overflow: hidden`) on the item so it can shrink, and
      let the content wrap or scroll.
  - question: How do you center an element horizontally and vertically?
    answer: |
      On the parent: `display: flex; justify-content: center; align-items: center;` (or with grid:
      `display: grid; place-items: center;`). Absolute positioning with `inset: 0; margin: auto` also
      works for fixed-size elements.
quiz:
  - id: q1
    question: In a row flex container, which property aligns items vertically?
    options: ["justify-content", "align-items", "flex-direction", "text-align"]
    correct: 1
    explanation: align-items works on the cross axis, which is vertical for rows.
  - id: q2
    question: "flex: 1 is shorthand for…"
    options: ["1 0 auto", "1 1 0%", "0 1 auto", "1 1 auto"]
    correct: 1
    explanation: grow 1, shrink 1, basis 0%.
  - id: q3
    question: A sidebar item with a long URL overflows. Which fix allows it to shrink?
    options: ["flex-grow: 0", "min-width: 0 on the flex item", "display: block", "z-index: 1"]
    correct: 1
    explanation: The default min-width auto blocks shrinking below content size.
---

## Axes and alignment

```css
.toolbar {
  display: flex;
  flex-direction: row; /* main axis: horizontal */
  justify-content: space-between; /* main axis */
  align-items: center; /* cross axis */
  gap: 12px;
}
```

## Sizing items

```css
.sidebar { flex: 0 0 240px; } /* fixed width, does not grow or shrink */
.content { flex: 1; min-width: 0; } /* takes the rest and can shrink */
```

## Wrapping cards

```css
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.cards > * {
  flex: 1 1 240px; /* at least ~240px, grow to fill the row */
}
```

## Patterns

```css
/* push the last item to the end */
.nav { display: flex; gap: 8px; }
.nav .account { margin-left: auto; }

/* sticky footer */
body { min-height: 100vh; display: flex; flex-direction: column; }
main { flex: 1; }
```

Use flexbox for one-dimensional layouts (rows or columns of items); use grid when you need rows and
columns to line up together.
