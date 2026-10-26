# Implementation Plan: Middle Frontend Interview Coverage

**Branch**: `002-middle-interview-coverage` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-middle-interview-coverage/spec.md`

## Summary

Make the DevRound library sufficient for Middle-level frontend interviews and add two new content
kinds. (1) A Middle topic map (`content/frontend/topic-map.middle.yaml`) with must/good priorities,
validated coverage, five new technologies (HTML & CSS, Browser & Web, Next.js, Redux & state,
Testing), further-reading references and a draft/reviewed status on every item. (2) Live coding
tasks: JavaScript tasks with an in-app CodeMirror editor and automated tests executed in an
isolated sandbox (opaque-origin iframe + Web Worker, 5 s limit) using a shared harness that the
validator also uses to prove reference solutions pass and naive ones fail; React tasks solved in
the user's own environment with acceptance criteria. (3) System design exercises with a fixed
walkthrough structure revealed section by section and a self-assessment checklist. Plans and the
dashboard gain "Live coding" and "System design" sections and per-area readiness. See
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.x / 6 (`strict`), Node.js 24 LTS (unchanged)

**Primary Dependencies**: Existing stack from 001. New: `codemirror` 6 +
`@codemirror/lang-javascript` (web, lazy-loaded). Harness and sandbox are in-house, no new deps.

**Storage**: PostgreSQL via Prisma — new tables `CodingTask`, `DesignExercise`, `PlanTask`,
`PlanExercise`, `TaskProgress`, `ExerciseProgress`; new columns on `Technology` and `Lesson`.

**Testing**: Vitest (harness unit tests run in Node; content rules; API integration on real
Postgres), Playwright (runner isolation, timeouts, editor flow, a11y, responsive)

**Target Platform**: Modern browsers (Chromium, Firefox, Safari — runner must work in all three);
API on Node 24

**Project Type**: Web application (existing monorepo)

**Performance Goals**: content opens ≤ 2 s; JS checks return ≤ 3 s for correct code; runaway code
stopped ≤ 6 s (SC-006, SC-007)

**Constraints**: user code never runs on the server and cannot reach the session/storage/network;
hints, solutions and walkthrough bodies are never sent before reveal; drafts never published to
production; existing plans unchanged

**Scale/Scope**: content ≥ 60 lessons, ≥ 15 tasks, ≥ 5 design exercises; ~3 new pages
(task, exercise, extended plan/dashboard)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* (Constitution v2.0.0)

| Principle | Gate | Pre-research | Post-design |
|---|---|---|---|
| I. Spec-Driven | Spec with prioritized independent stories | ✅ P1–P4 | ✅ quickstart V1–V16 map to stories |
| II. Type Safety | New content kinds and endpoints have shared Zod schemas | ✅ | ✅ TaskFile/ExerciseFile/TopicMap schemas; Task/Exercise view schemas; runner messages validated with Zod |
| III. Security | No secrets exposure; hidden answers server-side; ownership | ✅ | ✅ R5 opaque-origin sandbox + CSP, no server execution; R7 hints/solutions/sections withheld until reveal; 404/410 rules reused |
| IV. Curated content | Content in repo, validated, permanent ids, human review, no runtime AI, deterministic plans | ✅ | ✅ R1 coverage check; R2 `reviewed:` + `--require-reviewed`; R3/R4 solutions verified in CI; retired.yaml extended; R10 snapshots |
| V. Tests | Unit for domain + harness, integration on Postgres, E2E for critical journeys | ✅ | ✅ harness tests in Node, isolation tests in real browsers (E2E) |
| VI. Data-driven | New technologies/tasks/exercises are content only | ✅ | ✅ adding a task or exercise = adding a file |
| VII. Simplicity | Justify new deps; UI states; WCAG AA | ✅ | ✅ one new dep (CodeMirror, justified R6); no server sandbox, no queue |

**Result**: PASS — no violations. Note on Principle IV: running *user-written* code in the browser
is not runtime AI and does not change content; it is covered by Principle III's isolation rules.

## Project Structure

### Documentation (this feature)

```text
specs/002-middle-interview-coverage/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md            # new/changed endpoints
│   ├── content-format.md # topic map, tasks, exercises, references, review status
│   └── code-runner.md    # sandbox isolation + message protocol + harness semantics
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (changes to the existing monorepo)

```text
content/
├── catalog.yaml                    # new technologies, recommends
├── retired.yaml                    # + tasks, exercises
└── frontend/
    ├── topic-map.middle.yaml       # NEW
    ├── system-design/*.md          # NEW design exercises
    ├── html-css/ browser-web/ nextjs/ redux/ testing/   # NEW technologies (modules + lessons)
    └── <technology>/tasks/*.md     # NEW coding tasks (javascript, react)

packages/shared/src/
├── schemas/content.ts              # + TopicMapFile, TaskFile, ExerciseFile, references/reviewed
├── schemas/task.ts                 # NEW TaskView, status/draft/check-result requests
├── schemas/exercise.ts             # NEW ExerciseView, assessment
├── schemas/plan.ts, dashboard.ts   # extended sections/areas
└── runner/                         # NEW harness: assert, fake clock, runCases (env-agnostic)

apps/api/
├── prisma/schema.prisma            # new tables/columns + migration
├── scripts/content/
│   ├── load.ts, rules.ts           # topic map, tasks/, system-design/, ordering, review status
│   ├── verify-solutions.ts         # NEW: run harness in node:vm for reference/naive solutions
│   └── sync-library.ts, sync.ts    # tasks/exercises upsert, --require-reviewed
└── src/
    ├── domain/assemble-plan.ts     # + tasks/exercises selection
    ├── domain/dashboard.ts         # areas + mixed review list
    ├── services/task-service.ts    # NEW
    ├── services/exercise-service.ts# NEW
    └── routes/tasks.ts, exercises.ts  # NEW

apps/web/src/
├── features/task/                  # NEW TaskPage, CodeEditor (lazy CodeMirror), TestResults, Hints
├── features/task/runner/           # NEW sandbox iframe host + srcdoc + worker bootstrap
├── features/exercise/              # NEW ExercisePage, sections, checklist
├── features/plan/PlanPage.tsx      # + Live coding / System design sections, draft badges
├── features/setup/SetupPage.tsx    # + recommendations
├── features/lesson/LessonPage.tsx  # + Further reading, draft badge
└── features/dashboard/             # + areas, mixed review list

e2e/
├── live-coding.spec.ts             # editor, checks, timeout, isolation (V6–V12)
└── system-design.spec.ts           # V13
```

**Structure Decision**: Same monorepo; new feature folders mirror 001 (`features/<name>`,
`services/<name>-service.ts`, `routes/<name>.ts`). The runner harness lives in `packages/shared` so
the browser and the validator execute identical checks.

## Implementation Order (input for /speckit-tasks)

1. **Foundation**: schemas (content + API), Prisma migration, loader/rules for topic map,
   references, review status, tasks/ and system-design/ folders, retired.yaml extension,
   `--require-reviewed`; shared harness + Node verification; plan assembly with three sections.
2. **US1 (P1)**: new technologies in catalog, topic map, recommends in setup, references + draft
   badge on lessons, update the existing 25 lessons (topics, references, corrections — FR-007),
   new lessons per R13 order until coverage passes.
3. **US2 (P2)**: **spike first** — verify blob Worker inside an opaque-origin sandboxed iframe in
   Chromium, Firefox and WebKit (fallback: run the harness directly in the iframe without a worker,
   still killed on timeout by removing the iframe). Then API (task routes), runner, task page,
   editor, React self-check page, then the 15+ tasks.
4. **US3 (P3)**: approach lesson, exercise API + page, 5+ exercises.
5. **US4 (P4)**: dashboard areas and mixed review list.
6. **Polish**: E2E (isolation, timeouts, cross-browser runner), a11y of editor and reveal controls,
   SC-005 self-check with the owner, README/CLAUDE.md updates.

## Risks

| Risk | Mitigation |
|---|---|
| Blob workers in opaque-origin iframes behave differently across browsers | Spike in step 3 across Playwright's three engines; fallback without worker (iframe removal still enforces the time limit) |
| Fake timers do not cover all timer APIs a solution might use | Harness covers setTimeout/setInterval/Date.now/performance.now; tasks document allowed APIs in Constraints; validator proves reference solutions pass |
| Large content volume delays the feature | R13 batching; drafts usable locally immediately; production publish gated by review |
| Content accuracy for fast-moving topics (Next.js caching, React 19) | Every item cites official docs (`references`); `reviewed:` date makes staleness visible |

## Complexity Tracking

No constitution violations to justify.
