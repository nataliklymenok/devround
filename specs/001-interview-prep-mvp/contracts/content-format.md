# Content Format Contract: `content/`

**Feature**: [../spec.md](../spec.md) | **Research**: [../research.md](../research.md) (R6, R7)

The lesson library is the source of truth for tracks, technologies, modules, and lessons.
Validated by shared Zod schemas (`CatalogFileSchema`, `ModulesFileSchema`, `LessonFileSchema` in
`packages/shared`) via `npm run content:validate`, then loaded into the DB by `content:sync`.

**Terminology**: "lesson library" (spec) = "catalog" (plan/data model) = the `content/` directory.
YAML field `available` maps to DB column `isAvailable`.

## Layout

```text
content/
├── catalog.yaml
├── retired.yaml                 # permanently retired lesson/module ids
└── <trackId>/
    └── <technologyId>/
        ├── modules.yaml
        └── <lessonId>.md
```

## `catalog.yaml`

```yaml
levels:
  - { id: junior, name: Junior, rank: 1 }
  - { id: middle, name: Middle, rank: 2 }
  - { id: senior, name: Senior, rank: 3 }
tracks:
  - id: frontend
    name: Frontend
    available: true
    technologies:
      - { id: javascript, name: JavaScript, available: true }
      - { id: typescript, name: TypeScript, available: true }
      - { id: react, name: React, available: true }
      - { id: nodejs, name: Node.js basics, available: true }
      - { id: html-css, name: HTML & CSS, available: false }
  - { id: qa, name: QA, available: false, technologies: [] }
  - { id: automation, name: Automation, available: false, technologies: [] }
  - { id: backend, name: Backend, available: false, technologies: [] }
```
List order defines `position`.

## `modules.yaml`

```yaml
modules:
  - id: react-hooks
    title: Hooks in depth
    description: State, effects, refs, custom hooks and the rules of hooks.
```
List order defines module `order` within the technology.

## Lesson file `<lessonId>.md`

```markdown
---
id: react-hooks-rules          # must equal file name; permanent
module: react-hooks            # module id in the same technology
order: 2                       # unique within module
title: Rules of Hooks
description: Why hooks must be called unconditionally and how React tracks them.
levels: [junior, middle, senior]
estimatedMinutes: 20
keyTakeaways:
  - Hooks rely on call order between renders.
  - Never call hooks inside conditions, loops, or nested functions.
  - Custom hooks are the way to share stateful logic.
interviewQuestions:
  - question: Why can't you call useState inside an if statement?
    answer: |
      React identifies each hook by its call order...
  - question: ...
    answer: ...
  - question: ...
    answer: ...
quiz:
  - id: q1
    question: What does React use to associate state with a useState call?
    options:
      - The variable name
      - The order of hook calls during render
      - A unique key passed to useState
    correct: 1
    explanation: React stores hook state in a list indexed by call order.
  - id: q2
    ...
---

## Why the rules exist

Explanation in Markdown...

```tsx
function Profile({ show }: { show: boolean }) {
  // ❌ conditional hook
}
```

## Common mistakes
...
```

## Validation rules

**Per file (Zod)**
- `id`: kebab-case, 3–80 chars, equals file name; `module` exists in the technology's
  `modules.yaml`.
- `title` 3–120, `description` ≤ 500, `estimatedMinutes` 5–90 integer.
- `levels`: non-empty, subset of catalog level ids.
- `keyTakeaways`: 3–6 non-empty strings.
- `interviewQuestions`: 3–8 items with non-empty `question` and `answer`.
- `quiz`: 3–5 items; `id` unique within lesson; `options` 2–5 unique non-empty strings;
  `correct` integer within options range; non-empty `explanation`.
- Body: ≥ 1 `##` section; no raw HTML tags; fenced code blocks must declare a language.

**Cross-file**
- Lesson ids unique across the whole library; module ids unique per track.
- `order` unique per module; module ids in `modules.yaml` unique.
- Directory names match catalog track/technology ids.
- Coverage (SC-005): each `available` technology has ≥ 6 published lessons and ≥ 3 lessons for
  each level.
- Every module has ≥ 1 lesson.

**Permanence (Constitution IV)**

`content/retired.yaml`:
```yaml
lessons:
  - id: js-var-hoisting
    retiredAt: 2026-11-02
    reason: merged into js-scope-closures
modules: []
```
- Validator: an id listed in `retired.yaml` MUST NOT exist as a lesson file / module entry
  (prevents id reuse).
- `content:check-ids` (CI, compares with the base branch via git): every lesson/module id present
  on the base branch MUST either still exist or be listed in `retired.yaml`; otherwise CI fails
  with "id removed without retirement" (prevents silent renames).

## Sync semantics (`content:sync`)

- Upsert by id for tracks, levels, technologies, modules, lessons in one transaction.
- Lesson present in DB but absent from files (i.e. retired) → `isPublished = false`; never deleted.
- An unpublished lesson id reappearing as a file is rejected (it must be in `retired.yaml`, which
  the validator forbids) — sync never republishes a retired id.
- Unchanged `contentHash` → skipped. Output: counts of created / updated / unpublished.
