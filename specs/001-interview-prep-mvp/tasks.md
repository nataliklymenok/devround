---

description: "Task list for Interview Prep MVP"
---

# Tasks: Interview Prep MVP (Sign-in, Personalized Plan, Lessons, Progress)

**Input**: Design documents from `/specs/001-interview-prep-mvp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md,
contracts/content-format.md, quickstart.md

**Tests**: Included — required by Constitution V (unit for domain logic, API integration on a real
PostgreSQL test DB, fake Google verifier, E2E for the critical journey).

**Organization**: Tasks are grouped by user story so each story can be implemented and tested
independently. All paths are relative to the repository root (`devround/`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 from spec.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Turn the single Vite project into the npm-workspaces monorepo from plan.md

- [X] T001 Move the existing Vite app (`index.html`, `vite.config.js`, `src/`, `public/`, its `package.json` deps) into `apps/web/`, rename package to `@devround/web`, delete the old `eslint.config.js` (replaced by the root config in T007), and keep `.specify/`, `.claude/`, `specs/` at the root
- [X] T002 Create root `package.json` with `"private": true`, `"workspaces": ["apps/*", "packages/*"]`, `"engines": { "node": ">=24" }` and scripts `dev`, `build`, `test`, `lint`, `typecheck`, `content:validate`, `content:sync`, `e2e` delegating to workspaces; add root `.gitignore` entries for `node_modules`, `dist`, `.env`, `playwright-report`
- [X] T003 [P] Create `tsconfig.base.json` (`strict: true`, `noUncheckedIndexedAccess: true`, `module`/`moduleResolution` `NodeNext` for node packages) and per-workspace `tsconfig.json` in `apps/web/`, `apps/api/`, `packages/shared/`
- [X] T004 Convert `apps/web` to TypeScript: rename `src/main.jsx`→`src/main.tsx`, `src/App.jsx`→`src/App.tsx`, `vite.config.js`→`vite.config.ts`; add dev proxy `/api` → `http://localhost:3000`; remove scaffold demo content from `apps/web/src/App.tsx`
- [X] T005 [P] Scaffold `packages/shared/` (`package.json` name `@devround/shared`, deps `zod`, `src/index.ts`, Vitest config)
- [X] T006 [P] Scaffold `apps/api/` (`package.json` name `@devround/api`; deps `fastify`, `@fastify/cookie`, `@fastify/rate-limit`, `@fastify/static`, `@prisma/client`, `google-auth-library`, `zod`, `gray-matter`, `yaml`, `@devround/shared`; dev deps `prisma`, `tsx`, `vitest`; scripts `dev` (tsx watch), `build`, `test`, `db:migrate`, `content:validate`, `content:sync`)
- [X] T007 [P] Configure shared ESLint (typescript-eslint, react-hooks for web) and Prettier at root in `eslint.config.js` and `.prettierrc`
- [X] T008 [P] Create `docker-compose.yml` with services `db` (postgres:17, port 5432) and `db-test` (postgres:17, port 5433, tmpfs storage)
- [X] T009 [P] Create `apps/api/.env.example` (`NODE_ENV=development`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `AUTH_PROVIDER=google`, `WEB_ORIGIN=http://localhost:5173`, `PORT=3000`, `CONTENT_DIR=../../content`) and `apps/web/.env.example` (`VITE_GOOGLE_CLIENT_ID`)
- [X] T010 [P] Create CI workflow `.github/workflows/ci.yml`: Node 24, `npm ci` with full git history (`fetch-depth: 0`), Postgres service, `typecheck`, `lint`, `content:validate`, `content:check-ids` against the PR base branch, `test`, `build`
- [X] T011 [P] Create `CLAUDE.md` with runtime guidance referenced by the constitution (commands, monorepo structure, content rules incl. permanent ids and `retired.yaml`, testing rules, "no runtime LLM calls")

**Checkpoint**: `npm install`, `npm run typecheck`, `npm run build` succeed on the empty skeleton

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schemas, database, content pipeline, API skeleton and web shell used by every story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Shared schemas

- [X] T012 [P] Create error envelope schema `ApiErrorSchema` (`{ error: { code, message, details? } }`) and the error code enum from contracts/api.md in `packages/shared/src/schemas/errors.ts`
- [X] T013 [P] Create content file schemas in `packages/shared/src/schemas/content.ts`: `CatalogFileSchema`, `ModulesFileSchema`, `LessonFileSchema` with rules from contracts/content-format.md — `id` kebab-case 3–80 chars; `title` 3–120; `description` ≤ 500; `estimatedMinutes` integer 5–90; `levels` non-empty; `keyTakeaways` 3–6 non-empty strings; `interviewQuestions` 3–8 `{ question, answer }`; `quiz` 3–5 items with unique `id`, `options` 2–5 unique non-empty strings, `correct` integer within options range, non-empty `explanation`
- [X] T014 [P] Unit tests for content schemas (valid lesson, each rule violated) in `packages/shared/tests/content.test.ts`
- [X] T015 Export all schemas and inferred types from `packages/shared/src/index.ts`

### Database

- [X] T016 Write `apps/api/prisma/schema.prisma` with all entities from data-model.md: `Track` (`id` string PK, `isAvailable`, `position`), `Level` (`id`, `rank` 1..3), `Technology` (`trackId`, `isAvailable`, `position`), `Module` (`technologyId`, `title`, `description`, `order` unique per technology), `Lesson` (`moduleId`, `order` unique per module, `levels` string[], `estimatedMinutes`, `body` text, `interviewQuestions`/`keyTakeaways`/`quiz` JSON, `isPublished`, `contentHash`), `User` (`googleSub` unique), `Session` (`tokenHash` unique, `expiresAt`, `lastSeenAt`, cascade delete), `Plan` (`status` enum `active`·`archived`, `archivedAt`), `PlanTechnology` (composite PK), `PlanLesson` (composite PK `planId+lessonId`, `moduleId`, `order` unique per plan), `LessonProgress` (composite PK `userId+lessonId`, `completedAt?`, `bestScore?` 0–100, `lastOpenedAt`), `QuizAttempt` (`answers` int[], `questionIds` string[], `correctCount`, `totalCount`, `score`)
- [X] T017 Generate the initial migration and append raw SQL `CREATE UNIQUE INDEX plan_one_active_per_user ON "Plan"("userId") WHERE status = 'active';` in `apps/api/prisma/migrations/<timestamp>_init/migration.sql`
- [X] T018 [P] Create Prisma client singleton in `apps/api/src/db.ts`

### Content pipeline

- [X] T019 Implement content loader (walk `CONTENT_DIR`, parse `catalog.yaml`, `modules.yaml`, lesson `.md` via `gray-matter`, return typed catalog or per-file parse errors with file path) in `apps/api/scripts/content/load.ts`
- [X] T020 Implement cross-file rules in `apps/api/scripts/content/rules.ts`: lesson `id` equals file name and unique across library; module ids unique per track; lesson `module` exists in its technology's `modules.yaml`; `order` unique per module; directory names match catalog ids; lesson `levels` ⊆ catalog levels; body has ≥ 1 `##` section, no raw HTML tags, fenced code blocks declare a language; every module has ≥ 1 lesson; coverage — each available technology has ≥ 6 lessons and ≥ 3 lessons per level
- [X] T021 Implement `content:validate` CLI printing `file:rule:message` and exiting non-zero on errors in `apps/api/scripts/content/validate.ts`
- [X] T022 Implement `content:sync` in `apps/api/scripts/content/sync.ts`: run validation, upsert tracks/levels/technologies/modules/lessons by id in one transaction, compute `contentHash` (SHA-256 of normalized file) and skip unchanged lessons, set `isPublished=false` for lessons absent from files (never delete), print created/updated/unpublished counts; reject (fail the whole sync) when a lesson id that is unpublished in the DB reappears as a file
- [X] T023 Implement id permanence per contracts/content-format.md: parse `content/retired.yaml` (`lessons`/`modules` with `id`, `retiredAt`, `reason`) in `apps/api/scripts/content/load.ts`; validator rule "retired id MUST NOT exist as a file/module" in `apps/api/scripts/content/rules.ts`; CLI `content:check-ids --base <ref>` that lists lesson/module ids on the base ref via `git ls-tree`/`git show` and fails with "id removed without retirement" for ids missing in the working tree and absent from `retired.yaml` in `apps/api/scripts/content/check-ids.ts`
- [X] T024 [P] Create small fixture library (1 available track, 2 technologies, 2 modules each, ≥ 6 lessons per technology and ≥ 3 lessons for each level per technology so the coverage rule passes, plus an empty `retired.yaml`) in `apps/api/tests/fixtures/content/`
- [X] T025 [P] Unit tests for rules (duplicate id, bad module ref, coverage failure, raw HTML, quiz `correct` out of range → V13, retired id reused as a file, check-ids detects a removed id not listed in `retired.yaml`) in `apps/api/tests/unit/content-rules.test.ts`
- [X] T026 Integration test for sync (first sync creates rows; re-sync is no-op; removed file → `isPublished=false`; edited file → updated) in `apps/api/tests/integration/content-sync.test.ts`

### API skeleton

- [X] T027 Implement Zod-validated env config (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `AUTH_PROVIDER` `google`|`fake`, `WEB_ORIGIN`, `PORT`, `CONTENT_DIR`, `NODE_ENV`); fail startup when `AUTH_PROVIDER=fake` and `NODE_ENV=production` in `apps/api/src/config.ts`
- [X] T028 Implement `buildApp(deps)` (registers cookie, rate-limit 300 req/min per IP, error handler, origin check, routes under `/api/v1`, static `apps/web/dist` in production) in `apps/api/src/app.ts` and entry point `apps/api/src/server.ts`
- [X] T029 [P] Implement error handler mapping Zod errors → 400 `VALIDATION_ERROR`, `AppError(code,status)` → envelope, unknown → 500 `INTERNAL` (no stack in body) in `apps/api/src/plugins/error-handler.ts`
- [X] T030 [P] Implement origin check for POST/PUT/PATCH/DELETE (require `application/json` and `Origin === WEB_ORIGIN`, else 403 `FORBIDDEN_ORIGIN`) in `apps/api/src/plugins/origin-check.ts`
- [X] T031 Create test harness: `db-test` reset (`prisma migrate reset --force` once, truncate user tables between tests), fixture content sync, `buildTestApp()` with fake verifier, `signIn(app, email)` helper returning a cookie in `apps/api/tests/helpers.ts` and `apps/api/vitest.config.ts`

### Web shell

- [X] T032 [P] Implement typed fetch client (`credentials: 'include'`, JSON headers, parse responses with shared schemas, throw `ApiError` with code) in `apps/web/src/api/client.ts`
- [X] T033 [P] Create base UI components with accessible markup: `Spinner`, `ErrorState` (message + optional retry button), `EmptyState`, `ProgressBar` (`role="progressbar"`, aria values) in `apps/web/src/components/`
- [X] T034 [P] Create design tokens and base styles (CSS custom properties, light/dark, focus-visible outlines, responsive layout) in `apps/web/src/styles/global.css`
- [X] T035 Set up React Router + TanStack Query provider and app layout with header slot in `apps/web/src/app/router.tsx`, `apps/web/src/app/Layout.tsx`, `apps/web/src/main.tsx`

**Checkpoint**: `npm test` passes (schemas, rules, sync); API starts and returns 404 envelope for unknown routes; web renders the empty layout

---

## Phase 3: User Story 1 - Sign in with Google (Priority: P1) 🎯 MVP

**Goal**: Visitors sign in with Google, stay signed in for 30 days of activity, and can sign out

**Independent Test**: Sign in as a new user → personal area shows name/avatar → reload keeps
session → sign out → `/api/v1/me` returns 401 (quickstart V1–V3)

### Tests for User Story 1

- [X] T036 [P] [US1] Integration tests for `POST /auth/google` (new user created with only `googleSub`, `email`, `name`, `avatarUrl`; returning user updated; invalid token → 401; cookie `HttpOnly`, `SameSite=Lax`), `GET /me` (401 without cookie), `POST /auth/logout` (204, session row deleted, cookie cleared), expired session → 401 in `apps/api/tests/integration/auth.test.ts`
- [X] T037 [P] [US1] Unit tests for session token generation/hashing and sliding expiry (30 days, refreshed at most hourly) in `apps/api/tests/unit/session.test.ts`

### Implementation for User Story 1

- [X] T038 [P] [US1] Create `MeResponseSchema` (`user { id, email, name, avatarUrl }`, `hasActivePlan`) and `GoogleSignInRequestSchema` (`{ credential: string }`) in `packages/shared/src/schemas/auth.ts`
- [X] T039 [P] [US1] Implement `GoogleTokenVerifier` interface and Google implementation using `OAuth2Client.verifyIdToken` (check `aud` = `GOOGLE_CLIENT_ID`, issuer, expiry, `email_verified`) in `apps/api/src/auth/google-verifier.ts`
- [X] T040 [P] [US1] Implement `FakeGoogleVerifier` accepting tokens `test:<email>` in `apps/api/src/auth/fake-google-verifier.ts`
- [X] T041 [US1] Implement session service (create: 32-byte base64url token, store SHA-256 `tokenHash`, `expiresAt` = now + 30 days; resolve: lookup by hash, reject expired, slide expiry if `lastSeenAt` older than 1 h; destroy) in `apps/api/src/services/session-service.ts`
- [X] T042 [US1] Implement session plugin decorating `request.user` and `requireAuth` preHandler returning 401 `UNAUTHENTICATED` in `apps/api/src/plugins/session-auth.ts`
- [X] T043 [US1] Implement routes `POST /auth/google` (stricter rate limit 20 req/min, upsert user by `googleSub`, set `dr_session` cookie `HttpOnly; SameSite=Lax; Path=/`, plus `Secure` only when `NODE_ENV=production`), `POST /auth/logout`, `GET /me` in `apps/api/src/routes/auth.ts` and `apps/api/src/routes/me.ts`
- [X] T044 [P] [US1] Implement GIS script loader and `GoogleSignInButton` component (renders official button, returns `credential`; in fake mode renders an email input "Dev sign-in") in `apps/web/src/features/auth/GoogleSignInButton.tsx`
- [X] T045 [US1] Implement `useMe` query and `useSignIn`/`useSignOut` mutations in `apps/web/src/features/auth/hooks.ts`
- [X] T046 [US1] Implement landing page (product pitch, sign-in button, non-technical error message on cancel/failure with retry) in `apps/web/src/features/auth/LandingPage.tsx`
- [X] T047 [US1] Implement auth guard route (redirect signed-out users — including on any 401 from the API — to `/?returnTo=<current path>`; after sign-in navigate to `returnTo` if it is a same-origin relative path, else to `/setup` when `hasActivePlan=false`, else `/dashboard`) and header with avatar, name, "Sign out" in `apps/web/src/app/AuthGuard.tsx` and `apps/web/src/app/Header.tsx`

**Checkpoint**: US1 independently functional and tested (V1–V3)

---

## Phase 4: User Story 2 - Choose interview target and get a personalized plan (Priority: P2)

**Goal**: User picks track, level, technologies and immediately gets a deterministic plan from the
library; a new plan archives the previous one

**Independent Test**: Setup Middle + React + TypeScript → plan shown < 2 s with only TS and React
modules, all lessons tagged `middle`, catalog order; same input for another user gives identical
plan; re-setup archives old plan (quickstart V4–V7)

### Tests for User Story 2

- [ ] T048 [P] [US2] Unit tests for `assemblePlan` (filters by technologies and level, excludes unpublished lessons, orders by technology `position` → module `order` → lesson `order`, drops empty modules, global `order` 1..N, deterministic) in `apps/api/tests/unit/assemble-plan.test.ts`
- [ ] T049 [P] [US2] Integration tests for `GET /catalog`, `POST /plans` (201; 400 empty `technologyIds`; 422 unavailable track/technology or technology not in track; 409 `ACTIVE_PLAN_EXISTS` without `replaceExisting`; `replaceExisting=true` archives old plan in same transaction; concurrent double submit creates one plan) and `GET /plans/current` (404 without plan; user isolation) in `apps/api/tests/integration/plans.test.ts`

### Implementation for User Story 2

- [ ] T050 [P] [US2] Create `CatalogResponseSchema`, `CreatePlanRequestSchema` (`technologyIds` non-empty, unique; `replaceExisting` boolean default false), `PlanDetailSchema` (target, modules with lessons `{ id, order, title, description, estimatedMinutes, isAvailable, progress { completed, bestScore } }`) in `packages/shared/src/schemas/catalog.ts` and `packages/shared/src/schemas/plan.ts`
- [ ] T051 [P] [US2] Implement pure `assemblePlan(catalog, { trackId, levelId, technologyIds })` per research R8 in `apps/api/src/domain/assemble-plan.ts`
- [ ] T052 [US2] Implement plan service: load catalog, validate availability, run `assemblePlan`, in one transaction archive current active plan (`status='archived'`, `archivedAt`) and insert `Plan`, `PlanTechnology`, `PlanLesson` rows; map unique-index violation to 409; build `PlanDetail` joined with `LessonProgress` and `Lesson.isPublished` in `apps/api/src/services/plan-service.ts`
- [ ] T053 [US2] Implement routes `GET /catalog`, `POST /plans`, `GET /plans/current` in `apps/api/src/routes/catalog.ts` and `apps/api/src/routes/plans.ts`
- [ ] T054 [US2] Update `GET /me` to compute `hasActivePlan` in `apps/api/src/routes/me.ts`
- [ ] T055 [P] [US2] Implement setup page: track cards (unavailable shown "Coming soon", disabled), level radio group, technology checkboxes (unavailable disabled), submit disabled with message naming missing choice, replace-plan confirm dialog when a plan exists, submit button disabled while the create request is pending in `apps/web/src/features/setup/SetupPage.tsx`
- [ ] T056 [P] [US2] Implement plan outline page: modules with lessons (title, description, estimated time, status badge not started / completed / "No longer available", best score), loading/empty/error states, links to lessons in `apps/web/src/features/plan/PlanPage.tsx`
- [ ] T057 [US2] Add hooks `useCatalog`, `useCurrentPlan`, `useCreatePlan` (invalidates `me`, `plan`, `dashboard`) and routes `/setup`, `/plan` in `apps/web/src/features/plan/hooks.ts` and `apps/web/src/app/router.tsx`

**Checkpoint**: US1 + US2 work independently (V4–V7)

---

## Phase 5: User Story 3 - Study a lesson and self-check (Priority: P3)

**Goal**: User reads a lesson and takes its quiz; answers are hidden until submission; best score
is kept

**Independent Test**: Open a lesson → body, examples, ≥ 3 interview Qs, takeaways, 3–5 quiz Qs,
no `correct`/`explanation` in the response → submit → score + explanations, lesson completed →
retake lower → best kept (quickstart V8, V9, V11)

### Tests for User Story 3

- [ ] T058 [P] [US3] Unit tests for quiz scoring (`score = round(correctCount / totalCount × 100)`, answers length mismatch, index out of range) in `apps/api/tests/unit/scoring.test.ts`
- [ ] T059 [P] [US3] Integration tests for `GET /lessons/:id` (200 with quiz stripped of `correct`/`explanation`; updates `lastOpenedAt`; 404 for lesson not in user's active plan; 410 for unpublished; prev/next skip unavailable) and `POST /lessons/:id/attempts` (201 result; first attempt sets `completedAt`; retake keeps max `bestScore`; 400 bad answers; user isolation) in `apps/api/tests/integration/lessons.test.ts`

### Implementation for User Story 3

- [ ] T060 [P] [US3] Create `LessonViewSchema` (quiz items `{ id, question, options }` only), `QuizAttemptRequestSchema` (`answers` int[]), `QuizAttemptResultSchema` in `packages/shared/src/schemas/lesson.ts`
- [ ] T061 [P] [US3] Implement pure `scoreQuiz(quiz, answers)` in `apps/api/src/domain/scoring.ts`
- [ ] T062 [US3] Implement lesson service: verify lesson is in user's active plan (else 404) and published (else 410 `LESSON_UNAVAILABLE`), strip answers, compute prev/next by plan `order`, upsert `LessonProgress.lastOpenedAt`; record attempt with `questionIds` and upsert progress (`completedAt` if null, `bestScore = max`) in one transaction in `apps/api/src/services/lesson-service.ts`
- [ ] T063 [US3] Implement routes `GET /lessons/:lessonId`, `POST /lessons/:lessonId/attempts` in `apps/api/src/routes/lessons.ts`
- [ ] T064 [P] [US3] Implement `Markdown` component (`react-markdown` + `remark-gfm`, raw HTML disabled, lazy `shiki` highlighting for fenced code) in `apps/web/src/components/Markdown.tsx`
- [ ] T065 [P] [US3] Implement `Quiz` component (radio group per question with labels, submit disabled until all answered, result view with correct/incorrect per question, explanation, score, "Retake") in `apps/web/src/features/lesson/Quiz.tsx`
- [ ] T066 [US3] Implement lesson page (header with module/technology, Markdown body, interview questions as expandable `<details>` with model answers, key takeaways, Quiz, prev/next and "Next lesson" after submit; persist unsent quiz answers in `sessionStorage` under `quiz-draft:<lessonId>` (wrapped in try/catch), restore them on mount after re-auth, clear on successful submit) in `apps/web/src/features/lesson/LessonPage.tsx`
- [ ] T067 [US3] Add hooks `useLesson`, `useSubmitAttempt` (invalidates `plan`, `dashboard`) and route `/lessons/:lessonId` in `apps/web/src/features/lesson/hooks.ts` and `apps/web/src/app/router.tsx`

**Checkpoint**: US1–US3 work independently (V8, V9, V11)

---

## Phase 6: User Story 4 - See progress and continue where I left off (Priority: P4)

**Goal**: Dashboard with overall/module progress, average score, topics to review, Continue

**Independent Test**: With partially completed plan, dashboard numbers match DB; Continue opens the
first uncompleted available lesson; completion state at 100% (quickstart V10, V12)

### Tests for User Story 4

- [ ] T068 [P] [US4] Unit tests for dashboard aggregation (0% state, per-module counts, `averageBestScore` null when none, `topicsToReview` = up to 3 completed lessons with `bestScore < 70` lowest first, `continueLessonId` skips completed and unavailable, `isComplete`, unpublished lessons excluded from totals) in `apps/api/tests/unit/dashboard.test.ts`
- [ ] T069 [P] [US4] Integration test for `GET /dashboard` (404 without plan; numbers after attempts; unpublished lesson excluded after re-sync → V12) in `apps/api/tests/integration/dashboard.test.ts`

### Implementation for User Story 4

- [ ] T070 [P] [US4] Create `DashboardSchema` in `packages/shared/src/schemas/dashboard.ts`
- [ ] T071 [P] [US4] Implement pure `buildDashboard(planLessons, progress)` in `apps/api/src/domain/dashboard.ts`
- [ ] T072 [US4] Implement progress service loading plan lessons + progress and route `GET /dashboard` in `apps/api/src/services/progress-service.ts` and `apps/api/src/routes/dashboard.ts`
- [ ] T073 [US4] Implement dashboard page (target summary, overall ProgressBar + percent, per-module progress list, average score, "Topics to review" links, prominent "Continue" button, completion state at 100%, "Change interview target" link to `/setup`) and route `/dashboard` in `apps/web/src/features/dashboard/DashboardPage.tsx` and `apps/web/src/app/router.tsx`

**Checkpoint**: All user stories independently functional

---

## Phase 7: MVP Content Library

**Purpose**: Real lessons for FR-008 (JavaScript, TypeScript, React, Node.js basics; ≥ 6 lessons
each, ≥ 3 per level). Can start right after T021 (validator) and run in parallel with Phases 3–6.
Drafts may be AI-assisted but MUST be reviewed by a person before merge (Constitution IV).

- [ ] T074 Create `content/catalog.yaml` (levels junior/middle/senior; tracks frontend (available) with technologies javascript, typescript, react, nodejs (available) and html-css (unavailable); qa, automation, backend (unavailable)) and an empty `content/retired.yaml` (`lessons: []`, `modules: []`)
- [ ] T075 [P] Write `content/frontend/javascript/modules.yaml` and ≥ 6 lessons (e.g. types & coercion, scope & closures, `this` & prototypes, event loop & async, promises/async-await, ES modules & modern syntax) as `content/frontend/javascript/*.md`
- [ ] T076 [P] Write `content/frontend/typescript/modules.yaml` and ≥ 6 lessons (e.g. type system basics, unions & narrowing, generics, utility & mapped types, typing React/props, strictness & config) as `content/frontend/typescript/*.md`
- [ ] T077 [P] Write `content/frontend/react/modules.yaml` and ≥ 6 lessons (e.g. components & JSX, state & props, rules of hooks, effects & lifecycle, performance & memoization, state management & context) as `content/frontend/react/*.md`
- [ ] T078 [P] Write `content/frontend/nodejs/modules.yaml` and ≥ 6 lessons (e.g. runtime & event loop, modules & npm, async I/O & streams, HTTP server basics, error handling, security basics) as `content/frontend/nodejs/*.md`
- [ ] T079 Run `npm run content:validate` on the real library, fix all issues, and record human review sign-off in the PR description

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T080 Playwright setup (starts db-test, syncs fixture content, runs api with `AUTH_PROVIDER=fake` and web) in `playwright.config.ts` and E2E journey sign in → setup → plan → lesson → quiz → dashboard → sign out, asserting plan shown and lesson shown within 2 s (SC-002, SC-003), plus session-expiry case (clear cookie mid-quiz → re-sign-in returns to the same lesson with answers restored) in `e2e/journey.spec.ts`
- [ ] T081 [P] Accessibility pass: keyboard navigation through setup, quiz, dashboard; labels; contrast; add `@axe-core/playwright` check to `e2e/a11y.spec.ts`
- [ ] T082 [P] Responsive check at 360 px and 1280 px widths for all pages; fix layout issues in `apps/web/src/styles/`
- [ ] T083 [P] Write root `README.md` (what DevRound is, stack, setup from quickstart.md, content authoring guide linking contracts/content-format.md)
- [ ] T084 Run full quickstart.md validation V1–V13 and quality gates (`typecheck`, `lint`, `content:validate`, `test`, `build`, `e2e`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories
- **US1–US4 (Phases 3–6)**: depend on Foundational
- **Content (Phase 7)**: depends on T013 + T019–T021 + T023; independent of user stories
- **Polish (Phase 8)**: depends on US1–US4 (T080) and Content (T084)

### User Story Dependencies

- **US1 (P1)**: after Foundational; no story dependencies
- **US2 (P2)**: after Foundational; uses `requireAuth` from US1 (T042) — API tests use the
  test-harness `signIn` helper, so it can be built in parallel once T042 exists
- **US3 (P3)**: needs a plan to exist → depends on US2 service (T052) for real flow; tests seed
  plans directly via Prisma
- **US4 (P4)**: reads plans + progress → depends on US2 (T052) and US3 data shape (T062)

### Within Each Story

- Tests first (must fail) → shared schemas → domain functions → services → routes → web UI

### Parallel Opportunities

- Setup: T003, T005–T011 in parallel after T001–T002
- Foundational: T012–T014, T018, T024–T025, T029–T030, T032–T034 in parallel
- Each story: test tasks and `[P]` schema/domain/UI tasks in parallel
- Content: T075–T078 fully parallel (one technology each)

---

## Parallel Example: User Story 2

```bash
# Tests together:
Task: "Unit tests for assemblePlan in apps/api/tests/unit/assemble-plan.test.ts"
Task: "Integration tests for catalog/plans in apps/api/tests/integration/plans.test.ts"

# Then schemas, domain and UI together:
Task: "Create catalog/plan schemas in packages/shared/src/schemas/"
Task: "Implement assemblePlan in apps/api/src/domain/assemble-plan.ts"
Task: "Implement SetupPage in apps/web/src/features/setup/SetupPage.tsx"
Task: "Implement PlanPage in apps/web/src/features/plan/PlanPage.tsx"
```

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → Phase 2 Foundational
2. Phase 3 US1 → validate V1–V3 (sign-in works end-to-end)
3. Phase 4 US2 → first real value: personalized plan (validate V4–V7)

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. + US1 → demo sign-in
3. + US2 (with fixture or partial real content) → demo plan
4. + US3 → demo lessons and quizzes
5. + US4 → demo dashboard
6. Content library completed in parallel; Polish + E2E before release

---

## Notes

- Commit after each task or logical group; call out migrations and content id removals in PRs
- Never send quiz `correct`/`explanation` from `GET /lessons/:id`
- Lesson/module ids are permanent — never rename or reuse
