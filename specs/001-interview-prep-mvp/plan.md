# Implementation Plan: Interview Prep MVP (Sign-in, Personalized Plan, Lessons, Progress)

**Branch**: `001-interview-prep-mvp` | **Date**: 2026-10-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-interview-prep-mvp/spec.md` (rev. 2)

## Summary

Build the DevRound MVP: Google sign-in, interview target setup (Frontend track; level;
technologies), a personalized plan assembled deterministically from a curated lesson library,
lessons with self-check quizzes, and a progress dashboard. Technical approach: npm-workspaces
monorepo with a React 19 + Vite SPA (`apps/web`), a Fastify + TypeScript API (`apps/api`) backed
by PostgreSQL via Prisma, shared Zod schemas (`packages/shared`), and a `content/` library of
Markdown + YAML lessons validated in CI and synced into the database. No runtime AI; all
operations are synchronous. See [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`), Node.js 24 LTS

**Primary Dependencies**: Web — React 19, Vite 8, React Router, TanStack Query, react-markdown +
remark-gfm, shiki, Zod. API — Fastify 5 (`@fastify/cookie`, `@fastify/rate-limit`,
`@fastify/static`), Prisma, `google-auth-library`, Zod. Content tooling — `gray-matter`, `yaml`.

**Storage**: PostgreSQL 17 (Prisma migrations; partial unique index via raw SQL); content files in
`content/` are the source of truth for the catalog

**Testing**: Vitest (unit + API integration via `fastify.inject` on a real test Postgres with
fixture content), Playwright (E2E), fake Google verifier

**Target Platform**: Modern desktop and mobile browsers; API on Linux server/container (Node 24)

**Project Type**: Web application (SPA + REST API) in a monorepo

**Performance Goals**: plan shown ≤ 2 s (p95), lesson shown ≤ 2 s (p95) (SC-002, SC-003)

**Constraints**: no LLM calls at runtime; quiz answers never sent before submission; httpOnly
sessions; content IDs permanent; single API instance

**Scale/Scope**: up to ~1k users, ~50 concurrent; ~8 screens; 4 user stories; MVP library
≥ 24 lessons (4 technologies × ≥ 6)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* (Constitution v2.0.0)

| Principle | Gate | Pre-research | Post-design |
|---|---|---|---|
| I. Spec-Driven | Spec approved, stories independently deliverable | ✅ P1–P4 | ✅ quickstart scenarios map to stories |
| II. Type Safety | TS strict; Zod in `packages/shared` for HTTP + content format | ✅ | ✅ API schemas + `LessonFileSchema` shared by validator, sync, API |
| III. Security | Server-side Google verification; httpOnly cookie; ownership; quiz answers hidden | ✅ | ✅ R3/R4/R9; 404 for lessons outside user's plan; Origin check |
| IV. Curated content | Files in repo, validated in CI, permanent IDs, unpublish not delete, no runtime AI, deterministic plans | ✅ | ✅ R6/R7/R8; `isPublished`; `PlanLesson` snapshot |
| V. Tests | Unit domain, integration on real Postgres, fake Google, fixture content, E2E | ✅ | ✅ R13 |
| VI. Data-driven | Catalog/modules/lessons as data; no per-track code | ✅ | ✅ `catalog.yaml`; `assemblePlan` is generic |
| VII. Simplicity | One web, one API, one DB; justified deps; UI states; WCAG AA | ✅ | ✅ no queue/cache/CMS; sync is a script |

**Result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-interview-prep-mvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md             # REST contract /api/v1
│   └── content-format.md  # content/ library format + validation + sync
├── checklists/
│   └── requirements.md
└── tasks.md               # /speckit-tasks output
```

### Source Code (repository root)

```text
package.json                  # npm workspaces root; scripts: dev, test, lint, typecheck,
                              #   content:validate, content:sync, e2e
tsconfig.base.json
docker-compose.yml            # db (5432), db-test (5433)
.github/workflows/ci.yml      # typecheck, lint, content:validate, test, build

content/                      # curated library (source of truth)
├── catalog.yaml
└── frontend/
    ├── javascript/  (modules.yaml, *.md)
    ├── typescript/
    ├── react/
    └── nodejs/

packages/shared/
├── src/
│   ├── schemas/              # api: auth, catalog, plan, lesson, quiz, dashboard, errors
│   │                         # content: catalog-file, modules-file, lesson-file
│   └── index.ts
└── tests/

apps/api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/content/          # validate.ts, sync.ts, load.ts (parse files), rules.ts
├── src/
│   ├── app.ts                # buildApp(deps)
│   ├── server.ts
│   ├── config.ts             # Zod-validated env
│   ├── plugins/              # session auth, origin check, error handler, rate limit
│   ├── routes/               # auth, me, catalog, plans, lessons, dashboard
│   ├── domain/               # assemble-plan, scoring, dashboard (pure functions)
│   ├── services/             # session, plan, lesson, progress
│   └── auth/                 # google-verifier.ts, fake-google-verifier.ts
└── tests/
    ├── fixtures/content/     # small valid library for tests
    ├── unit/
    └── integration/

apps/web/                     # existing Vite scaffold moved here, converted to TS
├── src/
│   ├── main.tsx
│   ├── app/                  # router, query client, layout, auth guard
│   ├── api/                  # typed fetch client using shared schemas
│   ├── features/
│   │   ├── auth/             # landing, Google button, sign-out
│   │   ├── setup/            # interview target form
│   │   ├── plan/             # plan outline
│   │   ├── lesson/           # lesson view (markdown), quiz
│   │   └── dashboard/
│   ├── components/           # Spinner, ErrorState, EmptyState, ProgressBar, Markdown
│   └── styles/
└── tests/

e2e/
└── journey.spec.ts           # sign in → setup → plan → lesson → quiz → dashboard
```

**Structure Decision**: Web application in an npm-workspaces monorepo (`apps/web`, `apps/api`,
`packages/shared`) plus a top-level `content/` library. The current root Vite project is relocated
to `apps/web` as the first setup task; `.specify/`, `.claude/`, and `specs/` stay at the root.

## Phase 0 / Phase 1 Outputs

- [research.md](./research.md) — R1–R15; no open NEEDS CLARIFICATION.
- [data-model.md](./data-model.md) — catalog read model, plans with lesson snapshot, progress.
- [contracts/api.md](./contracts/api.md) — REST endpoints, schemas, error codes.
- [contracts/content-format.md](./contracts/content-format.md) — library layout, file format,
  validation and sync rules.
- [quickstart.md](./quickstart.md) — setup, quality gates, validation scenarios V1–V13.

## Implementation Order (input for /speckit-tasks)

1. **Setup**: monorepo restructure, TS configs, lint, docker compose, CI, env validation.
2. **Foundation**: shared schemas (API + content), Prisma schema, content loader/validator/sync
   with fixture library, Fastify skeleton, error envelope, origin check, test harness.
3. **US1** (P1): Google verification, sessions, `/auth/*`, `/me`, landing + auth guard.
4. **US2** (P2): `/catalog`, `assemblePlan`, `POST /plans`, `GET /plans/current`, setup UI,
   plan outline UI.
5. **US3** (P3): `GET /lessons/:id`, quiz attempts, lesson view with Markdown, quiz UI.
6. **US4** (P4): dashboard aggregation + UI.
7. **Content**: author and review the MVP library (JS, TS, React, Node.js basics; ≥ 6 lessons
   each, ≥ 3 per level) — can run in parallel with US2–US4 once the format exists.
8. **Polish**: E2E journey, accessibility pass, README.

## Complexity Tracking

No constitution violations to justify.
