# Data Model: Middle Frontend Interview Coverage

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-26

Extends feature 001's model ([001 data-model](../001-interview-prep-mvp/data-model.md)). Only
changes are listed. All new catalog rows are written exclusively by `content:sync`.

## Catalog changes

### Technology (changed)
| Field | Change |
|---|---|
| recommends | **new** `String[]` — technology ids suggested together (FR-008, R11) |

### Lesson (changed)
| Field | Type | Rules |
|---|---|---|
| topics | **new** `String[]` | topic ids from the topic map of its technology (validated, R1) |
| references | **new** JSON | `[{ title, url }]`, ≥ 1, `https://` URLs (FR-006) |
| isDraft | **new** boolean | `true` when the file has no `reviewed:` date (R2) |
| reviewedAt | **new** date? | from `reviewed:` |

### CodingTask (new)
| Field | Type | Rules |
|---|---|---|
| id | string | PK, permanent kebab-case, unique across tasks |
| technologyId | FK → Technology | |
| order | int | position within technology (file order key) |
| title | string | 3–120 |
| levels | Level id[] | ≥ 1 |
| difficulty | enum | `easy` · `medium` · `hard` |
| estimatedMinutes | int | 5–90 |
| mode | enum | `tests` (JavaScript, in-app editor) · `self_check` (React, own environment) |
| statement | text | Markdown: Problem + Constraints + Examples (public) |
| starterCode | text | ≤ 5 KB |
| entry | string? | required for `tests`: function name the tests call |
| tests | JSON? | required for `tests`: `[{ name, code }]`, ≥ 5 (public) |
| acceptanceCriteria | JSON? | required for `self_check`: string[3..10] (public) |
| hints | JSON | string[1..4] — **hidden until revealed** |
| solution | text | Markdown: Solution + Explanation + Complexity + Common mistakes — **hidden until revealed** |
| topics, references, isDraft, reviewedAt, isPublished, contentHash | | as for Lesson |

`naiveSolution` lives only in the content file (validation, SC-008) and is not stored.

### DesignExercise (new)
| Field | Type | Rules |
|---|---|---|
| id | string | PK, permanent |
| trackId | FK → Track | |
| order | int | |
| title | string | 3–120 |
| levels | Level id[] | ≥ 1 |
| timeboxMinutes | int | 15–90 |
| prompt | text | Markdown (public) |
| sections | JSON | `[{ key, title, body }]` — exactly the 8 fixed keys in order: `requirements`, `architecture`, `components`, `data-api`, `state`, `performance`, `accessibility`, `edge-cases` — bodies **hidden until revealed** |
| checklist | JSON | `[{ id, text }]`, 8–15 (public) |
| topics, references, isDraft, reviewedAt, isPublished, contentHash | | as for Lesson |

## Plan changes

### PlanTask (new, snapshot)
| Field | Type | Rules |
|---|---|---|
| planId | FK → Plan | composite PK with taskId, cascade |
| taskId | FK → CodingTask | |
| order | int | 1..N, unique per plan; technology position → difficulty → task order |

### PlanExercise (new, snapshot)
| Field | Type | Rules |
|---|---|---|
| planId | FK → Plan | composite PK with exerciseId, cascade |
| exerciseId | FK → DesignExercise | |
| order | int | 1..N, unique per plan |

Created in the same transaction as `PlanLesson` rows (R10). Plans created before this feature have
no rows → their sections are empty, nothing breaks.

## Progress changes

### TaskProgress (new)
| Field | Type | Rules |
|---|---|---|
| userId, taskId | FK | composite PK |
| status | enum? | `solved_own` · `solved_with_hints` · `revisit` · null (not marked) |
| hintsRevealed | int | 0..hints.length, current attempt |
| solutionRevealed | boolean | current attempt |
| draftCode | text? | ≤ 20 KB, `tests` mode only (FR-015b) |
| lastCheckPassed / lastCheckTotal | int? | self-reported by the browser runner (R8) |
| attemptStartedAt | timestamp | reset by `POST /tasks/:id/reset` |
| lastOpenedAt | timestamp | |

**Rules**
- `status = solved_own` is accepted only when `hintsRevealed = 0` and `solutionRevealed = false`
  (FR-012); otherwise 409.
- Reset: `hintsRevealed = 0`, `solutionRevealed = false`, `draftCode = null` (→ starter code),
  `attemptStartedAt = now`; `status` unchanged (FR-013).
- A task counts as **completed** when `status ∈ {solved_own, solved_with_hints}`; `revisit` counts
  as attempted, not completed, and feeds "Topics to review".

### ExerciseProgress (new)
| Field | Type | Rules |
|---|---|---|
| userId, exerciseId | FK | composite PK |
| sectionsRevealed | String[] | section keys revealed (FR-018) |
| bestScore | int? | 0–100 = round(covered / total × 100), max over attempts (FR-019) |
| lastCovered | String[] | checklist ids ticked in the last submission |
| completedAt | timestamp? | first submission |
| lastOpenedAt | timestamp | |

## Derived: Dashboard (extended)

- `areas`: one entry per technology with lessons in the plan (`kind: theory`), plus
  `kind: coding` (completed tasks / total) and `kind: design` (completed exercises / total) when the
  plan has such items (FR-021). Unavailable items excluded (FR-023).
- `overall` = completed items / total items across all three kinds (each item weighs 1).
- `topicsToReview` (FR-022): up to 5 items, weakest first, mixing
  `{ kind: 'lesson', bestScore < 70 }`, `{ kind: 'task', status = revisit }` (treated as score 0),
  `{ kind: 'exercise', bestScore < 70 }`.
- `continue` points to the first uncompleted item in plan order: lessons, then tasks, then
  exercises.
