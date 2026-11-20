---
id: css-formatting-floats
module: html-css-foundations
order: 4
title: Display, formatting contexts and floats
description: Block, inline and inline-block, block formatting contexts, floats and clearing, selector details like nth-child vs nth-of-type, and hiding content accessibly.
levels: [junior, middle]
estimatedMinutes: 20
topics: [css-formatting-contexts]
references:
  - { title: 'MDN — Block formatting context', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Block_formatting_context' }
  - { title: 'MDN — Floats', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Floats' }
  - { title: 'MDN — display', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/display' }
  - { title: 'MDN — :nth-of-type()', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-of-type' }
keyTakeaways:
  - Block boxes take the full width and stack; inline boxes flow in lines and ignore width, height and vertical margins; inline-block flows inline but respects box sizing.
  - A block formatting context (BFC) contains its floats, stops margin collapsing with children and does not overlap floats — display flow-root creates one cleanly.
  - Floats are for wrapping text around media today; clear or a BFC container stops the parent from collapsing.
  - nth-child counts all siblings; nth-of-type counts only siblings with the same element type.
interviewQuestions:
  - question: What is the difference between block, inline and inline-block?
    answer: |
      Block elements (`div`, `p`, `section`) start on a new line, take the full available width and
      respect width, height, margin and padding. Inline elements (`span`, `a`, `em`) flow inside a
      line of text; `width` and `height` are ignored and vertical margins do not push other lines away.
      `inline-block` sits in the line like inline but is sized like a block — useful for buttons or
      badges in text. Note the whitespace between inline-block elements renders as a gap.
  - question: What is a block formatting context and how do you create one?
    answer: |
      A BFC is an independent layout region for block boxes. Inside it, floats are contained (the
      parent's height includes them), the margins of its children do not collapse through it, and the
      BFC itself does not overlap neighbouring floats. It is created by the root element, floats,
      absolutely positioned elements, `display: flow-root`, `inline-block`, `overflow` other than
      `visible`/`clip`, and flex or grid items. `display: flow-root` is the side-effect-free way.
  - question: How do floats work and how do you clear them?
    answer: |
      A floated element is taken out of normal flow and shifted to the left or right; following
      inline content (text) wraps around it, but block boxes behave as if it were not there. A parent
      that contains only floats collapses to zero height. Fixes: `clear: both` on a following element,
      the clearfix (`.clearfix::after { content: ''; display: block; clear: both }`), or making the
      parent a BFC with `display: flow-root`. Floats were once used for whole page layouts; today
      flexbox and grid do that and floats are kept for wrapping text around images.
  - question: What is the difference between nth-child and nth-of-type?
    answer: |
      `:nth-child(2)` matches an element that is the second child of its parent among all siblings,
      and then the rest of the selector must also match — `p:nth-child(2)` matches nothing if the
      second child is an `h2`. `:nth-of-type(2)` counts only siblings with the same tag name, so
      `p:nth-of-type(2)` is always the second paragraph.
  - question: How do you hide content visually but keep it for screen readers?
    answer: |
      `display: none` and `visibility: hidden` hide it from everyone, including assistive technology.
      For screen-reader-only text use a visually-hidden class: a 1px clipped absolutely positioned
      box (`position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%);
      white-space: nowrap`). `aria-hidden="true"` does the opposite — visible but hidden from
      assistive technology.
quiz:
  - id: q1
    question: Which declaration makes a container include its floated children without side effects?
    options: ["overflow: hidden", "display: flow-root", "position: relative", "float: none"]
    correct: 1
    explanation: flow-root creates a BFC; overflow hidden works but clips content.
  - id: q2
    question: "What happens to `width: 200px` on a `span` with default display?"
    options: ["It applies", "It is ignored", "It becomes max-width", "It applies only in flex containers"]
    correct: 1
    explanation: Inline boxes are sized by their content; flex items are blockified, so it would apply only if the parent were a flex container.
  - id: q3
    question: "`<div><h2/><p/><p/></div>` — which selector matches the first paragraph?"
    options: ["p:nth-child(1)", "p:nth-of-type(1)", "p:first-child", "h2 ~ p:nth-child(1)"]
    correct: 1
    explanation: The first p is the second child, but the first of its type.
  - id: q4
    question: Which hides an element from screen readers too?
    options: ["A visually-hidden class", "display: none", "opacity: 0.5", "clip-path on a 1px box"]
    correct: 1
    explanation: display none removes the element from the accessibility tree.
---

## The display types

```text
block          ████████████████████  full width, new line, all box properties
inline         text text [span] text  flows in the line, no width/height
inline-block   text [ button ] text   in the line, but sized like a block
flex / grid    children laid out by the flex/grid algorithm
none           not rendered, not in the accessibility tree
```

## Block formatting contexts

```css
.media { display: flow-root; } /* contains floats, no clipping, no extra margins */
```

What a new BFC changes:

- **contains floats** — the parent's height includes floated children;
- **stops margin collapsing** between the container and its children;
- **does not overlap floats** — a BFC next to a float shrinks beside it (the classic "media object").

## Floats today

```html
<article>
  <img class="avatar" src="ann.jpg" alt="" />
  <p>The text wraps around the image…</p>
</article>
```

```css
.avatar { float: left; margin: 0 1rem 0.5rem 0; shape-outside: circle(); }
article { display: flow-root; } /* the article grows to contain the image */
```

Legacy codebases use the clearfix:

```css
.clearfix::after { content: ''; display: block; clear: both; }
```

## Selector details

```css
li:nth-child(odd)          /* 1st, 3rd, 5th… child that is also an li */
p:nth-of-type(2)           /* the second p among its siblings */
li:nth-child(n + 4)        /* from the 4th on */
a:not([href^='https'])     /* links that are not https */
.card:has(img)             /* parent selector: cards that contain an image */
```

Pseudo-classes (`:hover`, `:focus-visible`, `:nth-child`) select elements in a state or position;
pseudo-elements (`::before`, `::after`, `::placeholder`, `::marker`) style a part of an element or
generated content.

## Hiding content

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

| Technique | Visible | Screen reader | Takes space |
| --- | --- | --- | --- |
| `display: none` | ✗ | ✗ | ✗ |
| `visibility: hidden` | ✗ | ✗ | ✓ |
| `.visually-hidden` | ✗ | ✓ | ✗ |
| `aria-hidden="true"` | ✓ | ✗ | ✓ |
