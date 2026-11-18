---

description: "Task list for Middle Frontend Interview Coverage"
---

# Tasks: Middle Frontend Interview Coverage

**Input**: Design documents from `/specs/002-middle-interview-coverage/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md,
contracts/content-format.md, contracts/code-runner.md, quickstart.md

**Tests**: Included — required by Constitution V (unit, integration on real Postgres, E2E).

**Organization**: by user story. Paths are relative to the repository root (`devround/`).
Content tasks produce AI-drafted material: every file is created **without** a `reviewed:` date
(draft) and is reviewed by the owner before production publication (Constitution IV, R2).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Add `codemirror` and `@codemirror/lang-javascript` to `apps/web/package.json` (lazy-loaded later; no other new dependencies)
- [X] T002 [P] Update `CLAUDE.md` with the new content kinds (topic maps, `tasks/`, `system-design/`), the `reviewed:` draft rule, `--require-reviewed`, and the runner isolation rule (user code never runs on the server)

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ No user story work can begin until this phase is complete**

### Shared schemas

- [X] T003 [P] Extend content schemas in `packages/shared/src/schemas/content.ts`: `ReferenceSchema` (`{ title, url }`, url must start with `https://`), lesson front matter `topics: string[]` (kebab-case; ≥ 1 required for technologies that have a topic map — enforced in rules) and `references` (≥ 1) and optional `reviewed` (ISO date); `TopicMapFileSchema` (`topics: [{ id, title, priority: 'must'|'good' }]`); catalog technology `recommends: string[]` (default `[]`); `RetiredFileSchema` + `tasks`, `exercises` lists
- [X] T004 [P] Add `TaskFileSchema` in `packages/shared/src/schemas/content.ts` per contracts/content-format.md: `order` (int ≥ 1), `difficulty` `easy|medium|hard`, `estimatedMinutes` 5–90, `mode` `tests|self-check`, `hints` 1–4, and a discriminated union — `tests`: `starterCode`, `entry`, `tests` (≥ 5 `{ name, code }`), `naiveSolution`; `self-check`: `starterCode`, `acceptanceCriteria` (3–10)
- [X] T005 [P] Add `ExerciseFileSchema` in `packages/shared/src/schemas/content.ts`: `order` (int ≥ 1), `timeboxMinutes` 15–90, `checklist` 8–15 `{ id, text }` with unique ids, plus `topics`, `references`, `reviewed`
- [X] T006 [P] Unit tests for T003–T005 schemas (valid files and each rule violated) in `packages/shared/tests/content-002.test.ts`

### Test harness (shared by browser runner and validator)

- [X] T007 [P] Unit tests for the harness in `packages/shared/tests/runner.test.ts`: assert helpers (`equal`, `deepEqual`, `ok`, `throws`, `rejects`), fake clock (`tick`, `tickAsync`, `setInterval`, `clearTimeout`, `Date.now`), fresh scope per case (no state leak), `failed` vs `error` statuses with expected/actual, console capture caps (100 × 500 chars)
- [X] T008 Implement the harness in `packages/shared/src/runner/` (`assert.ts`, `clock.ts`, `run-cases.ts`, `index.ts`) per contracts/code-runner.md → "Harness semantics"; environment-agnostic (no DOM/Node APIs); export from `packages/shared/src/index.ts`

### Database

- [X] T009 Extend `apps/api/prisma/schema.prisma` per data-model.md: `Technology.recommends String[]`; `Lesson.topics String[]`, `references Json`, `isDraft Boolean`, `reviewedAt DateTime?`; new models `CodingTask` (mode enum `tests|self_check`, difficulty enum, `hints Json` and `solution` hidden fields), `DesignExercise` (`sections Json` with the 8 fixed keys, `checklist Json`), `PlanTask`, `PlanExercise` (composite PKs, `@@unique([planId, order])`), `TaskProgress` (status enum `solved_own|solved_with_hints|revisit`, `hintsRevealed`, `solutionRevealed`, `draftCode` ≤ 20 KB, `draftContentHash`, `lastCheckPassed/Total`, `attemptStartedAt`), `ExerciseProgress` (`sectionsRevealed String[]`, `bestScore Int?` 0–100, `lastCovered String[]`, `completedAt`); create migration `apps/api/prisma/migrations/<ts>_middle_coverage/`

### Content pipeline

- [X] T010 Extend the loader in `apps/api/scripts/content/load.ts`: per-technology `topics.middle.yaml`, `<technology>/tasks/*.md` (split body into public `## Problem/Constraints/Examples` and hidden `## Solution/Explanation/Complexity/Common mistakes`; extract the single code block of `## Solution` as reference code), `<track>/system-design/*.md` (split `## Prompt` and the 8 fixed sections), retired `tasks`/`exercises`; treat `tasks` and `system-design` as reserved directory names
- [X] T011 Extend rules in `apps/api/scripts/content/rules.ts`: topic ids exist and are unique across topic files; lessons in technologies with a topic map have ≥ 1 topic; task `order` unique per technology and exercise `order` unique per track; every available technology has a topic file; **coverage** — each `must` topic covered by ≥ 1 published lesson of that technology with `middle` in `levels`; **ordering** — within a module, a Middle lesson whose topics are all `good` must not precede one with a `must` topic; task/exercise ids unique and not retired; required task/exercise headings present and in order; hints 1–4; tests ≥ 5
- [X] T012 Implement `apps/api/scripts/content/verify-solutions.ts`: for every `tests`-mode task run the shared harness in `node:vm` with a 5 s timeout — reference solution must pass all cases, `naiveSolution` must fail ≥ 1 case (SC-004, SC-008); call it from `content:validate`
- [X] T013 Extend `apps/api/scripts/content/sync-library.ts` and `sync.ts`: upsert `CodingTask`/`DesignExercise` (hash-based skip, unpublish removed, refuse republishing retired ids), lesson `topics/references/isDraft/reviewedAt`, technology `recommends`; flag `--require-reviewed` fails if any item would be published as a draft; print draft count
- [X] T014 Add `--require-reviewed` to `content:validate` (fails listing every lesson, task and exercise without a `reviewed:` date) in `apps/api/scripts/content/validate.ts`, and a CI step in `.github/workflows/ci.yml` that runs it for pull requests targeting `main` — drafts may exist only on feature branches (Constitution IV)
- [X] T015 Extend `apps/api/scripts/content/check-ids.ts` and `rules.ts#findRemovedIds` to cover task and exercise ids
- [X] T016 [P] Extend the fixture library in `apps/api/tests/fixtures/content/`: `topics.middle.yaml` for javascript and react (covered), `topics`/`references` on all fixture lessons, two JS `tests`-mode tasks (one timer-based), one React `self-check` task, two design exercises, `retired.yaml` with empty `tasks`/`exercises`
- [X] T017 [P] Unit tests for new rules and solution verification (uncovered `must` topic, wrong ordering, unknown topic id, missing heading, reference solution failing, naive solution passing, retired task id reused) in `apps/api/tests/unit/content-rules-002.test.ts`
- [X] T018 Migrate existing content to the new format (blocks CI otherwise; FR-007): create `topics.middle.yaml` for javascript, typescript, react, nodejs listing the topics the existing lessons already cover (new `must` topics are added together with their lessons in the US1 batches, so validation stays green); add `topics` and ≥ 1 official `references` to all 25 existing lessons in `content/frontend/{javascript,typescript,react,nodejs}/`
- [X] T019 Integration test for sync of tasks/exercises and `--require-reviewed` in `apps/api/tests/integration/content-sync-002.test.ts`

### Plan assembly

- [X] T020 [P] Unit tests: `assemblePlan` returns `tasks` (chosen technologies, level match, published; order technology position → difficulty easy<medium<hard → task order) and `exercises` (track + level, by order) in `apps/api/tests/unit/assemble-plan.test.ts`
- [X] T021 Extend `apps/api/src/domain/assemble-plan.ts` and `apps/api/src/services/plan-service.ts` to snapshot `PlanTask` and `PlanExercise` in the same transaction; `PlanDetailSchema` in `packages/shared/src/schemas/plan.ts` gains `tasks`, `exercises`, and `isDraft` on lessons (contracts/api.md); plans created before this feature return empty sections

**Checkpoint**: `npm test` green; `content:validate` passes on the real library (existing lessons migrated by T018; coverage enforced for javascript, typescript, react, nodejs from here on)

---

## Phase 3: User Story 1 - Complete theory coverage for Middle (Priority: P1) 🎯 MVP

**Goal**: New technologies, Middle topic maps, coverage, references, draft badges, setup recommendations

**Independent Test**: Middle plan with all frontend technologies; every `must` topic covered (`content:validate`); new technologies selectable; lessons show Further reading (V1–V5)

### Tests for User Story 1

- [ ] T022 [P] [US1] Integration tests: `GET /catalog` returns `recommends`; `GET /lessons/:id` returns `references` and `isDraft`; plan lesson items carry `isDraft` in `apps/api/tests/integration/catalog-lessons-002.test.ts`
- [ ] T023 [P] [US1] E2E: setup recommendation hint adds JavaScript + Browser & Web when React is chosen; lesson page shows "Further reading" and the Draft badge in `e2e/coverage.spec.ts`

### Implementation for User Story 1

- [ ] T024 [US1] API: include `recommends` in `apps/api/src/routes/catalog.ts`; `references`, `isDraft` in `apps/api/src/services/lesson-service.ts`; extend `CatalogResponseSchema`/`LessonViewSchema` in `packages/shared/src/schemas/`
- [ ] T025 [P] [US1] Setup page recommendation hint ("Often asked together with …" + one-click add, non-blocking) in `apps/web/src/features/setup/SetupPage.tsx`
- [ ] T026 [P] [US1] Lesson page "Further reading" list (external links with `rel="noopener noreferrer"`) and "Draft — not yet reviewed" badge in `apps/web/src/features/lesson/LessonPage.tsx`; Draft badge on plan items in `apps/web/src/features/plan/PlanPage.tsx`
- [ ] T027 [US1] Catalog update in `content/catalog.yaml`: technologies in order `html-css`, `browser-web`, `javascript`, `typescript`, `react`, `nextjs`, `redux` ("Redux & state management"), `testing`, `nodejs` with `recommends` (R11); new ones start `available: false` and are switched on by their batch
- [ ] T028 [US1] Apply corrections from the owner's review of the 25 feature-001 lessons (task T079 of feature 001) in `content/frontend/{javascript,typescript,react,nodejs}/` and add their `reviewed:` dates — non-blocking, can happen any time before the PR into `main`
- [ ] T029 [P] [US1] Batch — JavaScript gaps: add the missing Middle topics to `topics.middle.yaml` and lessons for uncovered `must` topics (e.g. arrays & immutability, Map/Set/WeakMap & GC, iterators & generators, error handling, timers & debounce/throttle concepts, deep vs shallow copy) in `content/frontend/javascript/`
- [ ] T030 [P] [US1] Batch — Browser & Web (new, set available): `modules.yaml`, `topics.middle.yaml`, lessons on DOM & events (bubbling/capturing/delegation), rendering pipeline (reflow/repaint), HTTP & caching, CORS, cookies vs storage, security (XSS/CSRF/CSP), accessibility, Core Web Vitals & performance, plus `fe-system-design-approach` (FR-020) in `content/frontend/browser-web/`
- [ ] T031 [P] [US1] Batch — React gaps: forms (controlled/uncontrolled, actions), refs & ref as prop, portals, error boundaries, Suspense & lazy, React 19 (`useActionState`, `useOptimistic`, `use`), concurrent rendering & transitions, testing-friendly component design in `content/frontend/react/`
- [ ] T032 [P] [US1] Batch — HTML & CSS (set available): semantics, forms, box model, specificity & cascade, flexbox, grid, positioning & stacking context, responsive design, CSS custom properties, modern CSS (`:has`, container queries) in `content/frontend/html-css/`
- [ ] T033 [P] [US1] Batch — TypeScript gaps: `satisfies`, enums vs unions, overloads, classes & access modifiers, `tsconfig` strictness, declaration files & module augmentation in `content/frontend/typescript/`
- [ ] T034 [P] [US1] Batch — Next.js (new, set available): App Router & layouts, Server vs Client Components, rendering (SSR/SSG/ISR/streaming), data fetching & caching/revalidation, Server Actions, routing & middleware, images/fonts/metadata in `content/frontend/nextjs/`
- [ ] T035 [P] [US1] Batch — Redux & state management (new, set available): when to use global state, Redux Toolkit (slices, store, immutability with Immer), async (thunks), RTK Query, selectors & memoization, alternatives (Zustand, Context, TanStack Query) in `content/frontend/redux/`
- [ ] T036 [P] [US1] Batch — Testing (new, set available): testing pyramid & strategy, unit tests with Vitest/Jest, React Testing Library (queries, user-event, async), mocking & MSW, E2E with Playwright, accessibility testing in `content/frontend/testing/`
- [ ] T037 [P] [US1] Batch — Node.js gaps (Middle `must` topics only, e.g. middleware, auth with sessions vs JWT, REST design) in `content/frontend/nodejs/`
- [ ] T038 [US1] Run `npm run content:validate` until coverage passes for all available technologies; confirm a Middle plan with all technologies has ≥ 60 lessons (SC-002 lessons part)

**Checkpoint**: US1 independently functional (V1–V5)

---

## Phase 4: User Story 2 - Practice live coding tasks (Priority: P2)

**Goal**: JS tasks with in-app editor and isolated automated checks; React self-check tasks

**Independent Test**: V6–V12 in quickstart.md

### Spike

- [ ] T039 [US2] Spike: verify a blob Web Worker can be created inside `<iframe sandbox="allow-scripts" srcdoc>` with CSP `default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:` in Chromium, Firefox and WebKit (Playwright projects); record the result in research.md R5 and pick the fallback (harness directly in the iframe) where it fails

### Tests for User Story 2

- [ ] T040 [P] [US2] Integration tests in `apps/api/tests/integration/tasks.test.ts`: `GET /tasks/:id` hides hints/solution until revealed (no `solution`/unrevealed hints in the body); hints reveal in order and 409 when none left; solution reveal; draft save (≤ 20 KB, 400 for self-check tasks) and restore; check-result validation (`passed ≤ total`); `solved_own` → 409 `HINTS_USED` after any reveal; reset keeps status and clears attempt; 404 outside the active plan, 410 unpublished; user isolation
- [ ] T041 [P] [US2] E2E in `e2e/live-coding.spec.ts`: V6 (no hints/solution visible), V7 (failing then passing checks ≤ 3 s), V8 (`while (true) {}` → timed out ≤ 6 s, UI responsive), V9 (user code cannot read `document.cookie`/`localStorage` or `fetch('/api/v1/me')`), V10, V11 (draft restore, reset), V12 (React task has no editor), task page content shown ≤ 2 s (SC-006)

### Implementation for User Story 2

- [ ] T042 [P] [US2] Shared API schemas `TaskViewSchema`, `TaskStatusRequestSchema`, `TaskDraftRequestSchema` (≤ 20 000 chars), `TaskCheckResultSchema` in `packages/shared/src/schemas/task.ts`
- [ ] T043 [US2] Task service (find in active plan, reveal hint/solution, draft with `draftContentHash`, `taskUpdated` flag when the hash differs from the task's current `contentHash`, check-result, status rule, reset, `lastOpenedAt`) in `apps/api/src/services/task-service.ts`
- [ ] T044 [US2] Routes per contracts/api.md in `apps/api/src/routes/tasks.ts`; register in `apps/api/src/app.ts`; add `HINTS_USED` to the error code enum in `packages/shared/src/schemas/errors.ts`
- [ ] T045 [US2] Sandbox runner host in `apps/web/src/features/task/runner/`: `srcdoc` builder with CSP, iframe lifecycle (one per run, removed after result/timeout), worker bootstrap embedding the shared harness bundle, Zod-validated message protocol (contracts/code-runner.md), 5 s timeout, "Checks can't run in this browser" fallback state
- [ ] T046 [P] [US2] `CodeEditor` component (lazy-loaded CodeMirror, JavaScript mode, light/dark via CSS variables, accessible label, Tab handling that does not trap focus: Esc then Tab leaves the editor) in `apps/web/src/features/task/CodeEditor.tsx`
- [ ] T047 [P] [US2] `TestResults` (per case status, expected vs actual, console output, summary `passed/total`, `aria-live` announcement) and `Hints` (reveal next hint, count used) components in `apps/web/src/features/task/`
- [ ] T048 [US2] Task page in `apps/web/src/features/task/TaskPage.tsx`: loading, error (with retry) and 404/410 states like LessonPage; "This task was updated" notice with Reset when `taskUpdated`; statement (Markdown), visible tests list, editor with autosave (debounced 1 s), Run checks, Hints, Reveal solution (confirmation), status buttons (Solved on my own only when allowed), Reset; `self-check` mode shows starter code to copy, acceptance criteria checklist and solution reveal; route `/tasks/:taskId`; hooks in `apps/web/src/features/task/hooks.ts`
- [ ] T049 [US2] Plan page "Live coding" section (difficulty, mode, status, last check, Draft badge) in `apps/web/src/features/plan/PlanPage.tsx`
- [ ] T050 [P] [US2] Content — ≥ 10 JavaScript `tests`-mode tasks with ≥ 5 tests and a naive solution each: debounce, throttle, `Promise.all` polyfill, deep clone, event emitter, `bind` polyfill, memoize, flatten, curry, retry with exponential backoff in `content/frontend/javascript/tasks/`
- [ ] T051 [P] [US2] Content — ≥ 5 React `self-check` tasks: accessible tabs, autocomplete input (debounced, keyboard navigation, aborting stale requests), todo list with filters, modal with focus trap, data fetching with loading/error/empty states in `content/frontend/react/tasks/`
- [ ] T052 [US2] Run `content:validate` (all reference solutions pass, all naive solutions fail) and confirm a Middle plan with JavaScript + React shows ≥ 15 tasks

**Checkpoint**: US1 + US2 functional (V6–V12)

---

## Phase 5: User Story 3 - Practice frontend system design (Priority: P3)

**Goal**: Exercises with timebox, section-by-section walkthrough and self-assessment

**Independent Test**: V13

### Tests for User Story 3

- [ ] T053 [P] [US3] Integration tests in `apps/api/tests/integration/exercises.test.ts`: section bodies hidden until revealed; reveal unknown key → 400; assessment with unknown checklist id → 400; score = round(covered/total × 100); best score kept; first submission sets `completedAt`; 404/410/isolation rules
- [ ] T054 [P] [US3] E2E in `e2e/system-design.spec.ts`: V13 (prompt + timebox, collapsed sections, reveal one by one, submit checklist, best score kept), exercise page content shown ≤ 2 s (SC-006)

### Implementation for User Story 3

- [ ] T055 [P] [US3] Shared schemas `ExerciseViewSchema`, `ExerciseAssessmentRequestSchema`, result schema in `packages/shared/src/schemas/exercise.ts`
- [ ] T056 [US3] Exercise service and routes per contracts/api.md in `apps/api/src/services/exercise-service.ts` and `apps/api/src/routes/exercises.ts`; register in `apps/api/src/app.ts`
- [ ] T057 [US3] Exercise page in `apps/web/src/features/exercise/ExercisePage.tsx`: loading, error (with retry) and 404/410 states like LessonPage; prompt, timebox with an optional start/stop timer, "Try it yourself first" note, 8 sections as reveal-on-demand disclosure with persisted state, self-assessment checklist with score and best score; route `/exercises/:exerciseId`; hooks
- [ ] T058 [US3] Plan page "System design" section in `apps/web/src/features/plan/PlanPage.tsx`
- [ ] T059 [P] [US3] Content — ≥ 5 Middle exercises with 8–15 checklist items each: autocomplete, infinite news feed, image gallery/carousel, real-time notifications, multi-step form wizard with validation and draft saving in `content/frontend/system-design/`

**Checkpoint**: US1–US3 functional

---

## Phase 6: User Story 4 - Readiness by topic area (Priority: P4)

**Goal**: Dashboard areas and mixed review list

**Independent Test**: V14

- [ ] T060 [P] [US4] Unit tests for `buildDashboard` areas (theory per technology, coding, design; areas omitted when empty; unavailable excluded; overall across all kinds) and mixed `topicsToReview` (≤ 5, weakest first, task "revisit" = 0) and `continue` `{ kind, id }` in `apps/api/tests/unit/dashboard.test.ts`
- [ ] T061 [P] [US4] Integration test for `GET /dashboard` with lessons, tasks and exercises in `apps/api/tests/integration/dashboard.test.ts`
- [ ] T062 [US4] Extend `apps/api/src/domain/dashboard.ts`, `apps/api/src/services/progress-service.ts` and `DashboardSchema` in `packages/shared/src/schemas/dashboard.ts`
- [ ] T063 [US4] Dashboard UI: area cards (theory per technology, Live coding, System design), mixed "Topics to review" with kind labels, Continue to any item kind in `apps/web/src/features/dashboard/DashboardPage.tsx`

**Checkpoint**: All user stories functional

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T064 Add Firefox and WebKit Playwright projects for `e2e/live-coding.spec.ts` in `playwright.config.ts` (runner must work in all three engines); install browsers in CI
- [ ] T065 [P] Accessibility: axe checks for task and exercise pages (light/dark) and keyboard-only flow (run checks, reveal hint, mark status, reveal section, submit checklist) in `e2e/a11y.spec.ts`
- [ ] T066 [P] Responsive: task and exercise pages at 360/1280 px without horizontal overflow (editor scrolls internally) in `e2e/responsive.spec.ts`
- [ ] T067 [P] Update `README.md` (writing tasks and exercises, topic maps, review workflow, `--require-reviewed`)
- [ ] T068 Owner review: go through drafts, fix issues, add `reviewed:` dates until `content:validate --require-reviewed` passes; required before the PR into `main` (FR-024, SC-003, Constitution IV)
- [ ] T069 SC-005 self-check with the owner: map 3 real Middle interview question lists to library items; add missing topics/lessons for anything unmapped above 10%
- [ ] T070 Run quickstart.md validation V1–V16 and all quality gates (`typecheck`, `lint`, `content:validate`, `test`, `build`, `e2e`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** → **Foundational (2)** → user stories
- **US1 (3)**: after Foundational. content batches T029–T037 are independent of each other
- **US2 (4)**: after Foundational; T039 spike before T045; content T050–T051 can start right after T012 (validator)
- **US3 (5)**: after Foundational; uses T030's approach lesson but is testable without it
- **US4 (6)**: after US2 and US3 data shapes (T043, T056)
- **Polish (7)**: after desired stories; T068/T069 need the content batches

### Parallel Opportunities

- Foundational: T003–T007, T016–T017, T020
- US1: T022–T023, T025–T026, and all content batches T029–T037 (one technology directory each)
- US2: T040–T042, T046–T047, T050–T051
- US3: T053–T055, T059
- US4: T060–T061

## Parallel Example: User Story 1 content

```bash
Task: "Batch — Browser & Web in content/frontend/browser-web/"
Task: "Batch — HTML & CSS in content/frontend/html-css/"
Task: "Batch — Next.js in content/frontend/nextjs/"
Task: "Batch — Redux & state management in content/frontend/redux/"
Task: "Batch — Testing in content/frontend/testing/"
```

## Implementation Strategy

### MVP first (US1)

1. Setup + Foundational
2. US1 with content batches in R13 order — the owner can study each batch as soon as it validates
3. Validate V1–V5

### Incremental delivery

1. + US2 → live coding practice (biggest new capability)
2. + US3 → system design practice
3. + US4 → readiness view
4. Owner review (T068) gates production publication; drafts are usable locally all along

## Notes

- Never send hints, solutions or walkthrough bodies before reveal (Constitution III)
- User code runs only in the sandboxed iframe in the user's browser (R5)
- Content ids (lessons, tasks, exercises) are permanent; removals go to `retired.yaml`
