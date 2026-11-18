---
id: css-cascade-specificity
module: html-css-foundations
order: 2
title: Cascade, specificity and inheritance
description: How the browser decides which declaration wins, specificity math, inheritance and cascade layers.
levels: [junior, middle, senior]
estimatedMinutes: 20
topics: [css-cascade]
references:
  - { title: 'MDN — Introducing the CSS cascade', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade' }
  - { title: 'MDN — Specificity', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity' }
  - { title: 'MDN — @layer', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@layer' }
keyTakeaways:
  - The cascade sorts by origin and importance, then cascade layers, then specificity, then order of appearance.
  - Specificity is a triple (IDs, classes/attributes/pseudo-classes, elements/pseudo-elements); inline styles beat selectors.
  - Some properties inherit (color, font) and some do not (margin, border); inherit, initial, unset and revert control it.
  - Cascade layers (@layer) let you order whole groups of styles regardless of specificity.
interviewQuestions:
  - question: How is specificity calculated?
    answer: |
      Count three columns: (A) ID selectors, (B) classes, attribute selectors and pseudo-classes,
      (C) type selectors and pseudo-elements. Compare A first, then B, then C. `#nav .item a` is
      (1,1,1); `.menu .item.active` is (0,3,0) and loses to it. `:where()` has zero specificity,
      `:is()` and `:not()` take the specificity of their most specific argument, and the universal
      selector adds nothing.
  - question: Why is !important considered a smell, and what are cascade layers for?
    answer: |
      `!important` jumps to a higher cascade level, so overriding it requires another `!important`,
      leading to escalation. Cascade layers (`@layer reset, base, components, utilities;`) give an
      explicit order between groups of styles: a later layer wins even with lower specificity, so
      third-party CSS can be put in a low layer and utilities in a high one without specificity wars.
  - question: Which properties inherit?
    answer: |
      Mostly text-related ones: `color`, `font-*`, `line-height`, `letter-spacing`, `text-align`,
      `visibility`, `cursor` and custom properties. Box-model and layout properties (`margin`,
      `padding`, `border`, `background`, `width`, `display`) do not. `inherit` forces inheritance,
      `initial` uses the spec default, `unset` acts as inherit or initial, `revert` goes back to the
      browser style.
quiz:
  - id: q1
    question: "Which selector has the higher specificity: #header a or .nav .link.active?"
    options: ["#header a (1,0,1)", ".nav .link.active (0,3,0)", "They are equal", "Depends on order"]
    correct: 0
    explanation: Any ID outweighs any number of classes.
  - id: q2
    question: What is the specificity of :where(.card) p?
    options: ["(0,1,1)", "(0,0,1)", "(1,0,1)", "(0,1,0)"]
    correct: 1
    explanation: ":where() contributes zero specificity."
  - id: q3
    question: Which property is inherited by default?
    options: ["margin", "border", "color", "width"]
    correct: 2
    explanation: Text properties like color inherit.
  - id: q4
    question: "@layer base, components; — a rule in components with lower specificity than a rule in base wins?"
    options: ["Yes, later layers win regardless of specificity", "No, specificity always wins", "Only with !important", "Only for IDs"]
    correct: 0
    explanation: Layer order is compared before specificity.
---

## The cascade order

1. Origin and importance (user agent, user, author; `!important` reverses the order)
2. Cascade layers
3. Specificity
4. Order of appearance (later wins)

Inline `style` attributes beat any selector specificity (but not `!important` author rules).

## Specificity examples

```css
a                    /* (0,0,1) */
.button              /* (0,1,0) */
.nav a:hover         /* (0,2,1) */
#main .card > h2     /* (1,1,1) */
:is(#main, .x) p     /* (1,0,1) — takes the most specific argument */
:where(#main) p      /* (0,0,1) */
```

## Cascade layers

```css
@layer reset, vendor, base, components, utilities;

@layer vendor {
  @import url('datepicker.css') layer(vendor);
}

@layer components {
  .button { background: var(--primary); }
}

@layer utilities {
  .bg-danger { background: var(--danger); } /* wins over .button even though specificity is equal */
}
```

Styles outside any layer beat all layered styles.

## Inheritance keywords

```css
button { font: inherit; }       /* buttons don't inherit fonts by default */
.reset * { all: revert; }       /* back to browser styles */
```
