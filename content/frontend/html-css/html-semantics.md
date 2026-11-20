---
id: html-semantics
module: html-css-foundations
order: 1
title: Semantic HTML
description: Landmarks, headings, the right element for the job, forms and the document head.
levels: [junior, middle, senior]
estimatedMinutes: 20
topics: [html-semantics]
reviewed: 2026-11-20
references:
  - { title: 'MDN — HTML elements reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements' }
  - { title: 'MDN — Web forms', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms' }
keyTakeaways:
  - Semantic elements describe meaning (nav, main, article, button), which helps accessibility, SEO and maintenance.
  - Use one main landmark, a logical heading outline and lists for lists.
  - Links navigate, buttons act — never swap them.
  - The viewport meta tag, lang attribute and charset belong in every document.
interviewQuestions:
  - question: Why does semantic HTML matter?
    answer: |
      Assistive technologies build their navigation from it (landmarks, headings, lists, form
      labels), search engines understand content structure, native elements bring keyboard support and
      states for free, and the code is easier to read. A `div` soup needs ARIA and JavaScript to
      approximate what the right element gives by default.
  - question: When do you use a link and when a button?
    answer: |
      A link (`a href`) navigates to a URL — it can be opened in a new tab, bookmarked, and is
      announced as a link. A button performs an action on the current page (submit, open a dialog,
      toggle). Styling one to look like the other is fine; changing its semantics is not.
  - question: What is the difference between section, article and div?
    answer: |
      `article` is self-contained content that makes sense on its own (a post, a comment, a card).
      `section` groups thematically related content and usually has a heading. `div` has no meaning and
      is used only for styling or scripting hooks.
quiz:
  - id: q1
    question: Which element should wrap the primary content of the page?
    options: ["div id=\"content\"", "main", "section", "article"]
    correct: 1
    explanation: main is the landmark for the primary content; use it once per page.
  - id: q2
    question: A control that opens a modal should be…
    options: ["An a without href", "A button type=\"button\"", "A div with onclick", "A span with tabindex"]
    correct: 1
    explanation: Actions use buttons; links are for navigation.
  - id: q3
    question: What does meta name="viewport" content="width=device-width, initial-scale=1" do?
    options: ["Improves SEO ranking", "Makes mobile browsers lay out the page at device width instead of a zoomed-out desktop width", "Disables zoom", "Sets the charset"]
    correct: 1
    explanation: Without it mobile browsers render a 980px-wide layout and scale it down.
---

## A semantic page skeleton

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Orders — Shop</title>
  </head>
  <body>
    <header>
      <nav aria-label="Main">…</nav>
    </header>
    <main>
      <h1>Orders</h1>
      <section aria-labelledby="recent">
        <h2 id="recent">Recent orders</h2>
        <ul>
          <li><article>…</article></li>
        </ul>
      </section>
    </main>
    <footer>…</footer>
  </body>
</html>
```

## The right element for the job

| Need | Element |
| --- | --- |
| Navigate | `a href` |
| Act | `button type="button"` |
| Submit | `button type="submit"` inside `form` |
| Toggle | `input type="checkbox"` or `button aria-pressed` |
| Disclosure | `details` / `summary` |
| Modal | `dialog` |
| Data table | `table` with `th scope` and `caption` |

## Forms

```html
<form action="/subscribe" method="post">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" required />
  <fieldset>
    <legend>Frequency</legend>
    <label><input type="radio" name="freq" value="weekly" checked /> Weekly</label>
    <label><input type="radio" name="freq" value="monthly" /> Monthly</label>
  </fieldset>
  <button type="submit">Subscribe</button>
</form>
```

`type`, `autocomplete` and `inputmode` give mobile users the right keyboard and autofill.
