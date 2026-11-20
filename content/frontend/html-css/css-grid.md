---
id: css-grid
module: css-layout
order: 2
title: CSS Grid
description: Tracks and the fr unit, repeat and minmax, auto-fit vs auto-fill, named areas and subgrid.
levels: [middle, senior]
estimatedMinutes: 20
topics: [css-grid]
reviewed: 2026-11-20
references:
  - { title: 'MDN — Basic concepts of grid layout', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout' }
  - { title: 'MDN — Subgrid', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid' }
keyTakeaways:
  - Grid is two-dimensional — define rows and columns, then place items into cells or areas.
  - The fr unit distributes free space; minmax() sets track limits; repeat(auto-fit, minmax(…)) builds responsive grids without media queries.
  - grid-template-areas gives readable page layouts that are easy to rearrange in media queries.
  - Subgrid lets nested items align to the parent grid's tracks.
interviewQuestions:
  - question: When would you choose grid over flexbox?
    answer: |
      When the layout is two-dimensional — items must line up in both rows and columns (page layouts,
      card galleries, forms with aligned labels) — or when you want the container to define the layout
      and items just fall into it. Flexbox fits one-dimensional flows where content size drives the
      layout (toolbars, tags, button groups). They combine well: grid for the page, flex inside
      components.
  - question: What is the difference between auto-fill and auto-fit?
    answer: |
      Both create as many tracks as fit. `auto-fill` keeps empty tracks when there are fewer items, so
      items keep their minimum size. `auto-fit` collapses empty tracks, so the existing items stretch
      to fill the row. With many items they behave the same.
  - question: What does minmax(0, 1fr) fix compared to 1fr?
    answer: |
      `1fr` means `minmax(auto, 1fr)`, so a track cannot shrink below its content's minimum size — a
      long word or wide table can blow out the column. `minmax(0, 1fr)` allows the track to shrink to
      zero, keeping columns equal.
quiz:
  - id: q1
    question: "grid-template-columns: 200px 1fr 2fr in a 800px container (no gap). Width of the last column?"
    options: ["200px", "300px", "400px", "600px"]
    correct: 2
    explanation: 600px of free space split 1:2 → 200px and 400px.
  - id: q2
    question: Which declaration creates a responsive card grid without media queries?
    options: ["grid-template-columns: 1fr 1fr 1fr", "grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))", "grid-auto-flow: column", "display: inline-grid"]
    correct: 1
    explanation: auto-fit with minmax adds or removes columns as space allows.
  - id: q3
    question: What does subgrid allow?
    options: ["Nested grids to reuse the parent's track sizes", "Grids inside flex items only", "Animating grid tracks", "Overlapping items"]
    correct: 0
    explanation: subgrid aligns a nested grid's tracks to its parent's.
---

## Tracks and fr

```css
.layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  gap: 24px;
}
```

## Responsive grid without media queries

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 16px;
}
```

`min(240px, 100%)` prevents overflow on screens narrower than 240px.

## Named areas

```css
.page {
  display: grid;
  grid-template-areas:
    'header header'
    'nav    main'
    'footer footer';
  grid-template-columns: 220px 1fr;
}
.page > header { grid-area: header; }
.page > nav { grid-area: nav; }
.page > main { grid-area: main; }
.page > footer { grid-area: footer; }

@media (max-width: 700px) {
  .page {
    grid-template-areas: 'header' 'main' 'nav' 'footer';
    grid-template-columns: 1fr;
  }
}
```

## Subgrid

```css
.cards { display: grid; grid-template-columns: repeat(3, 1fr); }
.card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid; /* titles, bodies and footers align across cards */
}
```
