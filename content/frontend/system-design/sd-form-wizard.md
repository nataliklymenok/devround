---
id: sd-form-wizard
order: 5
title: Design a multi-step form wizard with draft saving
levels: [junior, middle, senior]
timeboxMinutes: 40
topics: [fe-system-design, web-accessibility, react-state-management]
reviewed: 2026-11-20
references:
  - { title: 'W3C WAI — Multi-page forms', url: 'https://www.w3.org/WAI/tutorials/forms/multi-page/' }
  - { title: 'React — Choosing the State Structure', url: 'https://react.dev/learn/choosing-the-state-structure' }
checklist:
  - { id: c1, text: 'Clarified requirements — steps, branching, optional steps, file uploads, resume later' }
  - { id: c2, text: 'Modeled form state as one schema-validated object with per-step validation' }
  - { id: c3, text: 'Kept the current step in the URL for back/forward and refresh' }
  - { id: c4, text: 'Saved drafts (debounced autosave to the server and/or local storage) and restored them' }
  - { id: c5, text: 'Validated on blur/submit with accessible inline errors and an error summary' }
  - { id: c6, text: 'Moved focus to the step heading on navigation and announced progress' }
  - { id: c7, text: 'Handled conditional steps and data that becomes invalid when earlier answers change' }
  - { id: c8, text: 'Covered final submission — idempotency, duplicate submit protection, server-side validation' }
  - { id: c9, text: 'Considered sensitive data, session expiry and multiple devices' }
---

## Prompt

Design a 5-step application form for an insurance quote (personal details, vehicle, coverage, extras,
review). Users often leave in the middle and come back later, sometimes on another device.

## Requirements

**Functional:** steps with validation; back/forward navigation; conditional steps; review page;
save and resume; final submission.

**Non-functional:** no data loss; accessible; works on mobile; secure handling of personal data;
clear progress feedback.

## High-level architecture

- Client-rendered wizard inside an SSR shell; a drafts API stores partial applications per user.
- One shared schema (e.g. Zod) per step, used on the client for UX and on the server for the final
  submission.
- The step lives in the URL (`/apply/vehicle`) so refresh, back and deep links work.

## Component design

```text
WizardLayout (progress indicator, step heading)
├── StepRoute (personal | vehicle | coverage | extras | review)
│   └── Step form (fields, inline errors)
└── WizardFooter (Back, Save and exit, Next/Submit)
```

A `useWizard` hook owns form data, validation per step, draft saving and navigation guards.

## Data model and API

```http
GET  /api/applications/draft            → { id, data, step, updatedAt }
PUT  /api/applications/draft            { data, step }      (debounced autosave)
POST /api/applications                  { data } + Idempotency-Key → 201 { id }
```

## State management

Form state is a single object (not one `useState` per field) managed by a form library or reducer;
derived data (which steps are visible, totals) is computed. Drafts autosave after a pause and on step
change; `beforeunload` warns about unsaved changes only if autosave failed.

## Performance

Lazy-load heavy steps (address lookup, file upload); keep re-renders local to the active step
(uncontrolled inputs or a form library); debounce autosave; prefetch the next step's code.

## Accessibility

Each step has a real heading that receives focus on navigation; progress is text ("Step 2 of 5:
Vehicle"), not just colour; inputs have labels and hints; on submit errors, show an error summary
linking to fields and set `aria-invalid`/`aria-describedby`; do not disable the Next button without
explaining why.

## Edge cases and trade-offs

- Changing an earlier answer invalidates later steps — re-validate and mark affected steps.
- Session expires — keep the draft locally and resume after sign-in.
- Double submit — disable while pending and use an idempotency key.
- Trade-off: local-only drafts are simple but do not follow users across devices; server drafts need
  storage policies for personal data.
