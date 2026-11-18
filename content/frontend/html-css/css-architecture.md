---
id: css-architecture
module: css-layout
order: 4
title: Modern CSS and styling architecture
description: Custom properties, :has and nesting, theming, and the trade-offs between BEM, CSS Modules, utility CSS and CSS-in-JS.
levels: [middle, senior]
estimatedMinutes: 25
topics: [css-architecture]
references:
  - { title: 'MDN — Using CSS custom properties', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties' }
  - { title: 'MDN — :has()', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:has' }
  - { title: 'MDN — CSS nesting', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting' }
keyTakeaways:
  - Custom properties are inherited, live values — ideal for design tokens and theming, changeable at runtime.
  - :has() selects elements based on their descendants or following siblings — a "parent selector".
  - Native nesting and cascade layers cover much of what preprocessors were used for.
  - Choose a styling approach for scoping and consistency; runtime CSS-in-JS costs performance and does not fit Server Components well.
interviewQuestions:
  - question: How do CSS custom properties differ from Sass variables?
    answer: |
      Sass variables are replaced at build time and do not exist in the browser. Custom properties are
      real CSS values: they inherit through the DOM, can be changed per element or media query, read
      and written from JavaScript, and update live — which makes runtime theming (dark mode, user
      themes) trivial.
  - question: Compare BEM, CSS Modules, utility-first CSS and CSS-in-JS.
    answer: |
      BEM is a naming convention for global CSS — no tooling, but scoping relies on discipline. CSS
      Modules scope class names at build time with zero runtime cost. Utility-first (e.g. Tailwind)
      composes small classes in markup — fast to build consistent UIs, but markup gets verbose. Runtime
      CSS-in-JS (styled-components, Emotion) colocates styles and supports props-based styling but
      adds JavaScript work during rendering and complicates streaming SSR/Server Components;
      zero-runtime variants (vanilla-extract, Linaria) extract CSS at build time.
  - question: What can you do with :has()?
    answer: |
      Style a parent or earlier element based on what it contains or what follows it:
      `.card:has(img)` for cards with images, `form:has(:invalid) button[type=submit]` to dim the
      submit button, `label:has(+ input:focus)` for focused fields, or `body:has(dialog[open])` to lock
      scrolling — things that previously required JavaScript.
quiz:
  - id: q1
    question: Can you change a CSS custom property at runtime with JavaScript?
    options: ["No, they are compiled away", "Yes, e.g. element.style.setProperty('--accent', 'red')", "Only in Chrome", "Only inside @media"]
    correct: 1
    explanation: Custom properties are live CSS values.
  - id: q2
    question: Which selector styles a card only if it contains an image?
    options: [".card img", ".card:has(img)", ".card > img", "img + .card"]
    correct: 1
    explanation: ":has() matches the parent based on its descendants."
  - id: q3
    question: Which approach scopes class names at build time with no runtime cost?
    options: ["Runtime CSS-in-JS", "CSS Modules", "Inline styles", "Global CSS"]
    correct: 1
    explanation: CSS Modules generate unique class names during the build.
---

## Design tokens with custom properties

```css
:root {
  --color-bg: #fff;
  --color-text: #1b1b1f;
  --color-accent: #4f46e5;
  --radius: 8px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #121216;
    --color-text: #ececf1;
  }
}

.button {
  background: var(--color-accent);
  border-radius: var(--radius);
  color: var(--button-text, white); /* fallback */
}
```

## Modern selectors and nesting

```css
.card {
  padding: 16px;

  &:hover { box-shadow: 0 2px 8px rgb(0 0 0 / 0.1); }

  &:has(img) { padding-top: 0; }

  & .title { font-weight: 600; }
}

form:has(:invalid) button[type='submit'] { opacity: 0.6; }
```

## Comparing approaches

| Approach | Scoping | Runtime cost | Notes |
| --- | --- | --- | --- |
| Global CSS + BEM | Convention | None | Simple, needs discipline |
| CSS Modules | Build-time | None | Great default for component apps |
| Utility-first | N/A (utilities) | None | Consistency via design tokens |
| Runtime CSS-in-JS | Runtime | Yes | Props-driven styles, SSR complexity |
| Zero-runtime CSS-in-JS | Build-time | None | TypeScript-typed styles |

Whatever you choose, keep tokens (colors, spacing, typography) centralized and document component
variants.
