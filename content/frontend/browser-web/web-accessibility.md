---
id: web-accessibility
module: web-quality
order: 2
title: Accessibility essentials
description: Semantic HTML, the rules of ARIA, keyboard support, focus management and how to test accessibility.
levels: [junior, middle, senior]
estimatedMinutes: 30
topics: [web-accessibility]
references:
  - { title: 'W3C — WCAG 2.2 Quick Reference', url: 'https://www.w3.org/WAI/WCAG22/quickref/' }
  - { title: 'W3C — ARIA Authoring Practices Guide', url: 'https://www.w3.org/WAI/ARIA/apg/' }
  - { title: 'MDN — Accessibility', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility' }
keyTakeaways:
  - Native elements (button, a, label, input, dialog) give you roles, keyboard support and states for free.
  - First rule of ARIA — do not use ARIA if a native element does the job; no ARIA is better than bad ARIA.
  - Everything clickable must work with the keyboard and show a visible focus indicator.
  - Manage focus on route changes and in dialogs; announce dynamic updates with live regions.
interviewQuestions:
  - question: Why is a div with an onClick not a good button?
    answer: |
      It is not focusable, does not react to Enter/Space, has no button role for screen readers and
      does not support `disabled`. You would have to add `role="button"`, `tabIndex={0}`, key handlers
      and states yourself — and still miss details. A `button` element provides all of it.
  - question: What are the main WCAG principles and some concrete requirements?
    answer: |
      POUR — Perceivable (text alternatives, captions, contrast at least 4.5:1 for normal text),
      Operable (keyboard access, no keyboard traps, enough time, visible focus), Understandable
      (labels, error messages, predictable behaviour) and Robust (valid markup, correct names, roles
      and states). Most products target WCAG 2.1 or 2.2 level AA.
  - question: How do you make a modal dialog accessible?
    answer: |
      Use the native `dialog` element with `showModal()` (or follow the APG dialog pattern): give it an
      accessible name (`aria-labelledby`), move focus into it when it opens, keep focus inside while it
      is open, close on Escape, and return focus to the element that opened it. Content behind it must
      be inert.
  - question: How do you test accessibility?
    answer: |
      Automated checks (axe, Lighthouse, eslint-plugin-jsx-a11y) catch around a third of issues such as
      missing labels and low contrast. Then test manually: navigate with the keyboard only, zoom to
      200%, check with a screen reader (VoiceOver, NVDA), and verify reduced-motion and color-scheme
      preferences.
quiz:
  - id: q1
    question: What is the first rule of ARIA?
    options: ["Always add role attributes", "Do not use ARIA if a native HTML element provides the semantics", "Use aria-label on every element", "ARIA replaces HTML"]
    correct: 1
    explanation: Native elements come with behaviour that ARIA alone does not add.
  - id: q2
    question: Minimum contrast ratio for normal body text at WCAG AA?
    options: ["3:1", "4.5:1", "7:1", "2:1"]
    correct: 1
    explanation: 4.5:1 for normal text, 3:1 for large text and UI components.
  - id: q3
    question: How should a form input get its accessible name?
    options: ["A placeholder", "A label element associated with the input", "A title attribute only", "Bold text above it"]
    correct: 1
    explanation: A label (for/id or wrapping) is announced and enlarges the click target.
  - id: q4
    question: Where should focus go when a modal dialog closes?
    options: ["To the top of the page", "Back to the element that opened it", "Nowhere", "To the first link"]
    correct: 1
    explanation: Returning focus keeps keyboard and screen-reader users oriented.
---

## Semantics first

```jsx
// ✅ native elements: role, keyboard and states included
<button type="button" onClick={save}>Save</button>
<a href="/settings">Settings</a>
<label htmlFor="email">Email</label>
<input id="email" type="email" required aria-describedby="email-hint" />
<p id="email-hint">We never share it.</p>

// ❌ needs role, tabIndex, key handlers, states… and is still worse
<div onClick={save}>Save</div>
```

Use landmarks (`header`, `nav`, `main`, `footer`), one `h1`, and headings in order.

## Keyboard and focus

```css
:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 2px;
}
```

- Tab order follows the DOM — avoid positive `tabindex`.
- Custom widgets follow APG keyboard patterns (arrow keys in tabs, menus, listboxes).
- After client-side navigation, move focus to the new page heading or a skip target.

## Dialogs

```jsx
function ConfirmDialog({ open, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal() // focus moves inside, background becomes inert
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog ref={ref} aria-labelledby="confirm-title" onClose={onClose}>
      <h2 id="confirm-title">Delete item?</h2>
      {children}
    </dialog>
  )
}
```

## Announcing changes

```jsx
<p role="status" aria-live="polite">{savedMessage}</p>
<p role="alert">{errorMessage}</p>
```

## Images and media

- Informative images: meaningful `alt`; decorative ones: `alt=""`.
- Icons-only buttons need an accessible name (`aria-label` or visually hidden text).
- Respect `prefers-reduced-motion` for animations.
