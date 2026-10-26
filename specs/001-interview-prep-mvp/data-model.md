# Data Model: Interview Prep MVP

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-23
(rev. 2 — curated content)

Storage: PostgreSQL via Prisma. User-data IDs are `cuid` strings; catalog IDs are the permanent
string IDs from content files (e.g. `react-hooks-rules`). All tables have `createdAt`; mutable
tables also have `updatedAt`.

## Entity overview

```text
Track 1─* Technology 1─* Module 1─* Lesson          (catalog, synced from content/)
Level (catalog)

User 1─* Session
User 1─* Plan *─1 Track, *─1 Level, *─* Technology (PlanTechnology)
Plan 1─* PlanLesson *─1 Lesson
User 1─* LessonProgress *─1 Lesson
User 1─* QuizAttempt    *─1 Lesson
```

## Catalog (read model of `content/`, written only by `content:sync`)

### Track
| Field | Type | Rules |
|---|---|---|
| id | string | PK, permanent slug, e.g. `frontend`, `qa` |
| name | string | |
| isAvailable | boolean | only `frontend` true in MVP (FR-011) |
| position | int | display order |

### Level
| Field | Type | Rules |
|---|---|---|
| id | string | PK: `junior`, `middle`, `senior` |
| name | string | |
| rank | int | 1..3 |

### Technology
| Field | Type | Rules |
|---|---|---|
| id | string | PK, e.g. `react` |
| trackId | FK → Track | |
| name | string | |
| isAvailable | boolean | false → "coming soon" (FR-008) |
| position | int | plan ordering (R8) |

### Module
| Field | Type | Rules |
|---|---|---|
| id | string | PK, permanent, e.g. `react-hooks` |
| technologyId | FK → Technology | |
| title | string | 3–120 chars |
| description | string | ≤ 500 chars |
| order | int | position in `modules.yaml` (unique by construction; DB index, not unique constraint) |

### Lesson
| Field | Type | Rules |
|---|---|---|
| id | string | PK, permanent, never reused (Constitution IV) |
| moduleId | FK → Module | |
| order | int | unique per module |
| title | string | 3–120 chars |
| description | string | ≤ 500 chars |
| levels | Level id[] | ≥ 1 |
| estimatedMinutes | int | 5–90 |
| body | text | Markdown, no raw HTML |
| interviewQuestions | JSON | `[{ question, answer }]`, 3–8 |
| keyTakeaways | JSON | string[3..6] |
| quiz | JSON | `[{ id, question, options[2..5], correct, explanation }]`, 3–5, ids unique |
| isPublished | boolean | false when the file is removed (never delete) |
| contentHash | string | SHA-256 of normalized file; sync skips unchanged |

Validation is enforced twice: by `content:validate` (shared Zod `LessonFileSchema` + cross-file
rules, see [contracts/content-format.md](./contracts/content-format.md)) and by the sync
transaction.

## Users & auth

### User
| Field | Type | Rules |
|---|---|---|
| id | string | PK |
| googleSub | string | unique |
| email | string | refreshed on sign-in |
| name | string | refreshed on sign-in |
| avatarUrl | string? | refreshed on sign-in |

### Session
| Field | Type | Rules |
|---|---|---|
| id | string | PK |
| userId | FK → User | cascade delete |
| tokenHash | string | unique; SHA-256 of cookie token |
| expiresAt | timestamp | sliding 30 days (FR-003) |
| lastSeenAt | timestamp | |

## Plans

### Plan
| Field | Type | Rules |
|---|---|---|
| id | string | PK |
| userId | FK → User | owner; every access check filters by it |
| trackId | FK → Track | must be available at creation |
| levelId | FK → Level | |
| status | enum | `active` · `archived` |
| archivedAt | timestamp? | |

- `PlanTechnology(planId, technologyId)` composite PK; ≥ 1 row; technologies must be available
  and belong to the track (FR-012).
- Partial unique index `ON plan(user_id) WHERE status = 'active'` (raw SQL in migration) — at most
  one active plan, protects against double submit (FR-015).

**State transitions**: `(create) → active ──(new plan created)──→ archived`. Archive of the old
plan and creation of the new plan with its `PlanLesson` rows happen in one transaction.

### PlanLesson (snapshot, FR-014)
| Field | Type | Rules |
|---|---|---|
| planId | FK → Plan | composite PK with lessonId; cascade delete |
| lessonId | FK → Lesson | |
| moduleId | FK → Module | module grouping at creation time |
| order | int | 1..N global order, unique per plan |

A lesson is "available" in a plan when `Lesson.isPublished = true`; otherwise it is shown as
"no longer available" and excluded from totals (FR-016, FR-023).

## Progress

### LessonProgress
| Field | Type | Rules |
|---|---|---|
| userId | FK → User | composite PK with lessonId |
| lessonId | FK → Lesson | |
| completedAt | timestamp? | set on first quiz submission (FR-019) |
| bestScore | int? | 0–100, max over attempts (FR-020) |
| lastOpenedAt | timestamp | updated on lesson open |

Progress is per user + lesson, so it carries over if the same lesson appears in a later plan.

### QuizAttempt
| Field | Type | Rules |
|---|---|---|
| id | string | PK |
| userId | FK → User | |
| lessonId | FK → Lesson | must be in the user's active plan and published |
| answers | int[] | one option index per quiz question, in quiz order |
| questionIds | string[] | quiz ids at submission time (content may change later) |
| correctCount | int | |
| totalCount | int | |
| score | int | round(correctCount / totalCount × 100) |

Attempt insert and LessonProgress upsert run in one transaction (FR-023, SC-008).

## Derived (not stored): Dashboard

Computed over the active plan's available lessons:
- `overall` = completed / total, `percent` rounded
- per module (in plan order): completed / total
- `averageBestScore` = mean `bestScore` over completed lessons (null if none)
- `topicsToReview` = up to 3 completed lessons with `bestScore < 70`, lowest first (FR-021)
- `continueLessonId` = lowest `order` available lesson without `completedAt` (FR-022); null when
  all done → `isComplete = true`
