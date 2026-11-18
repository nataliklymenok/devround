# Content Format Additions (002)

Extends [001 content-format](../../001-interview-prep-mvp/contracts/content-format.md). All rules
are enforced by `content:validate` and shared Zod schemas in `packages/shared`.

## Layout

```text
content/
├── catalog.yaml                       # + recommends per technology
├── retired.yaml                       # + tasks: [], exercises: []
└── frontend/
    ├── system-design/                 # NEW (reserved name): <exercise-id>.md
    └── <technology>/
        ├── modules.yaml
        ├── topics.middle.yaml         # NEW: Middle topic map for this technology
        ├── <lesson-id>.md             # + topics, references, reviewed
        └── tasks/                     # NEW (reserved name): <task-id>.md
```

## catalog.yaml

```yaml
technologies:
  - { id: react, name: React, available: true, recommends: [javascript, browser-web] }
```

## `<technology>/topics.middle.yaml`

```yaml
topics:
  - { id: web-event-delegation, title: Event bubbling, capturing and delegation, priority: must }
  - { id: web-service-workers, title: Service workers and offline, priority: good }
```
Rules: topic ids kebab-case and unique across all topic files; `priority` ∈ `must|good`; an
available technology without a topic file is reported (every available technology needs a Middle
map). Coverage: each `must` topic ⇒ ≥ 1 published lesson in that technology with `middle` in
`levels` and the topic id in `topics`.

## Lesson front matter additions

```yaml
topics: [js-closures, js-scope]   # ≥ 1 for technologies that have a topic map
references:
  - { title: "MDN — Closures", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures" }
reviewed: 2026-10-30        # optional; absent = draft
```
Ordering rule (FR-005): within a module, among lessons with `middle` in `levels`, a lesson whose
topics are all `good` must not precede a lesson with a `must` topic.

## Coding task (`<technology>/tasks/<id>.md`)

```markdown
---
id: js-debounce
order: 1                        # position within the technology's tasks (unique)
title: Implement debounce
levels: [junior, middle, senior]
difficulty: medium
estimatedMinutes: 20
mode: tests                     # tests | self-check (same spelling in the API; DB enum self_check)
topics: [js-closures, js-timers]
references:
  - { title: "MDN — setTimeout", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout" }
hints:
  - Keep the timer id in a closure variable.
  - Clear the previous timer on every call.
entry: debounce
starterCode: |
  function debounce(fn, wait) {
    // your code
  }
tests:
  - name: calls once after the wait
    code: |
      const calls = []
      const d = debounce((x) => calls.push(x), 100)
      d(1); d(2); d(3)
      clock.tick(99)
      assert.deepEqual(calls, [])
      clock.tick(1)
      assert.deepEqual(calls, [3])
  # … ≥ 5 cases
naiveSolution: |
  function debounce(fn, wait) {
    return (...args) => setTimeout(() => fn(...args), wait)
  }
---

## Problem
## Constraints
## Examples
## Solution          ← hidden; must contain exactly one fenced code block
## Explanation       ← hidden
## Complexity        ← hidden (optional for self-check)
## Common mistakes   ← hidden
```

`self-check` mode (React): no `entry`, `tests`, `naiveSolution`; requires `starterCode` (JSX) and
`acceptanceCriteria` (3–10 strings).

Validation (in addition to schema):
- `tests` mode: the reference solution (code block in `## Solution`) passes **all** cases and
  `naiveSolution` fails **at least one** case, both run through the shared harness in Node `vm`
  with a 5 s timeout (SC-004, SC-008).
- Hints 1–4; ≥ 5 tests; headings present and in order.

## Design exercise (`system-design/<id>.md`)

```markdown
---
id: sd-autocomplete
order: 1                        # position within the track's exercises (unique)
title: Design an autocomplete
levels: [middle, senior]
timeboxMinutes: 45
topics: [web-debounce-input, web-caching]
references: [...]
checklist:
  - { id: c1, text: Clarified functional and non-functional requirements }
  # 8–15 items
---

## Prompt
## Requirements
## High-level architecture
## Component design
## Data model and API
## State management
## Performance
## Accessibility
## Edge cases and trade-offs
```
All nine headings are required, in this exact order (FR-016).

## Permanence

`retired.yaml` gains `tasks` and `exercises` lists with the same rules as lessons; `content:check-ids`
covers them.

## Review gate

- `content:validate --require-reviewed`: fail if any lesson, task or exercise has no `reviewed:`
  date. Required in CI for pull requests into `main` (Constitution IV) — drafts live only on feature
  branches.

## Sync

- `--require-reviewed`: fail if any item would be published as a draft (production deploys, second
  guard).
- Without the flag: drafts are published with `isDraft = true`; the summary prints the draft count.
