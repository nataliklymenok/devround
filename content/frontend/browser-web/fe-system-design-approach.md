---
id: fe-system-design-approach
module: web-architecture
order: 1
title: How to approach a frontend system design interview
description: A repeatable structure for frontend system design questions and what interviewers look for.
levels: [middle, senior]
estimatedMinutes: 25
topics: [fe-system-design]
reviewed: 2026-11-20
references:
  - { title: 'web.dev — Rendering on the Web', url: 'https://web.dev/articles/rendering-on-the-web' }
  - { title: 'W3C — ARIA Authoring Practices Guide', url: 'https://www.w3.org/WAI/ARIA/apg/' }
  - { title: 'web.dev — Web Vitals', url: 'https://web.dev/articles/vitals' }
keyTakeaways:
  - Clarify requirements and scope before drawing anything — ask about users, devices, scale and constraints.
  - Use the same order every time — requirements, architecture, components, data model and API, state, performance, accessibility, edge cases and trade-offs.
  - Interviewers grade reasoning about trade-offs, not a single right answer.
  - Manage time — leave room for deep dives the interviewer chooses.
interviewQuestions:
  - question: How do you start a frontend system design interview?
    answer: |
      Restate the problem, then ask clarifying questions: who the users are, which devices, the core
      user flows for this interview, expected data size and update frequency, offline needs,
      internationalization, accessibility requirements and any existing constraints. Write the agreed
      functional and non-functional requirements down and confirm scope before designing.
  - question: What should the component design part cover?
    answer: |
      A component tree with responsibilities and boundaries, which components own state, the props and
      events between them, and how they are reused. Name the tricky components (an infinite list, an
      editor, a combobox) and explain their API. Keep it at the level of contracts, not CSS details.
  - question: Which non-functional topics are expected at Middle level?
    answer: |
      Performance (loading strategy, caching, pagination or virtualization, bundle size), accessibility
      (keyboard, focus, screen readers, the right ARIA pattern), error and loading states, offline or
      flaky networks, security basics (XSS, auth handling), internationalization, and observability
      (logging, metrics). You do not need all of them in depth — pick the ones that matter for the
      problem and say why.
quiz:
  - id: q1
    question: What should you do first in a frontend system design interview?
    options: ["Draw the component tree", "Pick a state management library", "Clarify requirements and scope", "Write code for the hardest component"]
    correct: 2
    explanation: Without agreed requirements every later decision is guesswork.
  - id: q2
    question: What do interviewers mostly evaluate?
    options: ["Knowing one correct architecture", "Reasoning about trade-offs and communicating decisions", "Number of libraries mentioned", "Drawing skills"]
    correct: 1
    explanation: There are many valid designs; justification matters.
  - id: q3
    question: Where do accessibility and performance belong in the answer?
    options: ["Nowhere — they are implementation details", "As explicit sections tied to the requirements", "Only if asked at the end", "Only for Senior roles"]
    correct: 1
    explanation: They are non-functional requirements and part of a complete design.
---

## The structure (use it every time)

1. **Requirements** — functional (core flows) and non-functional (performance, accessibility,
   devices, offline, i18n, security). Agree on scope.
2. **High-level architecture** — rendering strategy (CSR, SSR, SSG, streaming), main modules,
   server/API boundaries, CDN and caching.
3. **Component design** — component tree, responsibilities, which components own state, public props
   and events.
4. **Data model and API** — entities on the client, endpoint shapes, pagination (cursor vs offset),
   real-time updates (polling, SSE, WebSocket).
5. **State management** — server state vs client state, cache and invalidation, optimistic updates,
   URL state.
6. **Performance** — what loads first, code splitting, images, virtualization, debouncing, prefetching,
   Core Web Vitals.
7. **Accessibility** — semantics, the right APG pattern, keyboard, focus, announcements.
8. **Edge cases and trade-offs** — errors, empty states, slow/offline network, races, security, and
   what you would do differently at bigger scale.

## Example: requirements for an autocomplete

```text
Functional:   suggestions while typing, keyboard selection, recent searches, highlight matches
Non-funct.:   results < 300 ms after pause, works on mobile, screen-reader friendly (combobox pattern),
              handles slow network, no flicker, i18n input (IME composition)
Out of scope: ranking algorithm on the server
```

## Time plan for a 45-minute round

| Minutes | Focus |
| --- | --- |
| 0–7 | Requirements and scope |
| 7–15 | Architecture and component tree |
| 15–25 | Data model, API and state |
| 25–40 | Deep dives: performance, accessibility, edge cases |
| 40–45 | Trade-offs and what you would improve |

## Signals interviewers look for

- You ask before you assume and write decisions down.
- You explain trade-offs ("cursor pagination because items are inserted at the top").
- You cover non-functional requirements without being prompted.
- You adapt when the interviewer changes a constraint.
