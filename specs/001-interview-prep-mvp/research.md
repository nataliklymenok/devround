# Research: Interview Prep MVP

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-23
(rev. 2 — curated content, no runtime AI)

Each decision lists what was chosen, why, and what else was considered.

## R1. Monorepo layout and tooling

- **Decision**: npm workspaces at the repo root: `apps/web`, `apps/api`, `packages/shared`, plus a
  non-workspace `content/` directory. The existing Vite scaffold moves to `apps/web` and is
  converted to TypeScript (`.tsx`). `@devround/shared` is consumed as a workspace dependency.
- **Rationale**: Constitution mandates this layout; npm is already in use.
- **Alternatives**: pnpm/Turborepo (extra tooling not justified at MVP scale); Nx (too heavy).

## R2. Runtime versions

- **Decision**: Node.js 24 LTS, TypeScript 5.x `strict`, React 19, Vite 8, Fastify 5, Prisma,
  PostgreSQL 17, Zod 4.
- **Rationale**: Current LTS/stable lines as of 2026-10.
- **Alternatives**: Node 22 (acceptable fallback for hosting).

## R3. Google sign-in flow

- **Decision**: Google Identity Services (GIS) "Sign in with Google" button returns an ID token
  (`credential`). Web POSTs it to `POST /api/v1/auth/google`. API verifies it with
  `google-auth-library` `OAuth2Client.verifyIdToken` (signature, `aud` = our client ID, `iss`,
  `exp`, `email_verified`). On success: upsert User by Google `sub`, create a Session.
- **Rationale**: Sign-in only — no Google API access tokens or client secret needed; verification
  is fully server-side (Constitution III).
- **Alternatives**: OAuth authorization-code redirect flow (only needed to call Google APIs on the
  user's behalf); Auth.js/Passport (extra abstraction); Firebase/Supabase Auth (third-party user
  store, conflicts with "own backend").

## R4. Sessions and CSRF

- **Decision**: Opaque random session token (32 bytes, base64url) in cookie `dr_session`
  (`HttpOnly; Secure; SameSite=Lax; Path=/`; `Secure` is set only when `NODE_ENV=production`
  because Safari drops Secure cookies on `http://localhost`). DB stores only its SHA-256 hash. Sliding expiry of
  30 days (refreshed at most hourly). Logout deletes the row and clears the cookie. Mutating
  endpoints require `Content-Type: application/json` and an `Origin` equal to `WEB_ORIGIN`.
- **Rationale**: Revocable sessions, nothing readable by JS (Constitution III).
- **Alternatives**: JWT in cookie (not revocable); JWT in localStorage (forbidden).

## R5. Same-origin deployment

- **Decision**: Dev: Vite proxies `/api` → `http://localhost:3000`. Prod: Fastify serves
  `apps/web/dist` via `@fastify/static` (or a reverse proxy routes `/api`) on one origin.
- **Rationale**: No CORS; `SameSite` cookies work cleanly.

## R6. Content format

- **Decision**: Markdown files with YAML front matter, one file per lesson:

  ```text
  content/
  ├── catalog.yaml                  # tracks, levels, technologies (order, availability)
  └── frontend/
      └── react/
          ├── modules.yaml          # ordered modules: id, title, description
          └── react-hooks-rules.md  # lesson
  ```

  Front matter holds structured parts (`id`, `module`, `order`, `title`, `description`, `levels`,
  `estimatedMinutes`, `interviewQuestions`, `quiz`, `keyTakeaways`); the Markdown body holds the
  explanation with `##` sections and fenced code examples. Full format in
  [contracts/content-format.md](./contracts/content-format.md).
- **Rationale**: Reviewable in PRs, readable diffs, easy to author (also with AI drafting
  offline), one schema in `packages/shared` validates it (Constitution II, IV).
- **Alternatives**: JSON per lesson (poor for long prose); DB + admin UI (much more scope);
  headless CMS (external dependency, cost).

## R7. Content pipeline: validate → sync

- **Decision**: `apps/api/scripts/content/` provides:
  - `content:validate` — parses all files with `gray-matter` + `yaml`, validates with shared Zod
    schemas, and checks cross-file rules: unique lesson/module IDs, module references exist,
    unique `order` within a module, quiz `correct` within range, levels/technologies exist,
    coverage rule (each available technology has ≥ 6 lessons and ≥ 3 per level, SC-005), no raw
    HTML in Markdown. Runs in CI.
  - `content:sync` — runs validation, then upserts catalog, modules, and lessons into PostgreSQL in
    one transaction, keyed by permanent IDs; lessons missing from files are set
    `isPublished=false` (never deleted). Stores `contentHash` per lesson; unchanged lessons are
    skipped. Idempotent; run in dev setup and on every deploy before the API starts.
- **Rationale**: Files are the source of truth; the DB is a queryable read model that progress
  rows can reference with foreign keys.
- **Alternatives**: Read files at API startup into memory (no FKs for progress; harder to query
  dashboard aggregates); bundle content into the web app (would expose quiz answers — violates
  Constitution III).

## R8. Plan assembly algorithm

- **Decision**: Pure function `assemblePlan(catalog, { trackId, levelSlug, technologyIds })`:
  1. Take available technologies in the selection, sorted by catalog `position`.
  2. For each technology, take its modules sorted by `order`.
  3. For each module, take published lessons where `levels` includes the chosen level, sorted by
     `order`; drop modules with no matching lessons.
  4. Produce an ordered list `{ lessonId, moduleId, order }` with global `order` 1..N.
  The result is persisted as a snapshot (`PlanLesson` rows) in the same transaction that archives
  the previous plan and creates the new one.
- **Rationale**: Deterministic (Constitution IV, FR-013/014), trivially unit-testable, instant.
- **Alternatives**: Recompute plan on every read (plans would shift when content changes,
  violating FR-014); weighted/adaptive ordering (out of scope).

## R9. Quiz integrity

- **Decision**: `GET /lessons/:id` strips `correct` and `explanation` from quiz items. They are
  returned only by `POST /lessons/:id/attempts` after server-side scoring.
- **Rationale**: FR-018, Constitution III.

## R10. Markdown rendering on the web

- **Decision**: `react-markdown` with `remark-gfm`, raw HTML disabled; code highlighting via
  `shiki` (lazy-loaded). Content is also checked for raw HTML at validation time.
- **Rationale**: Safe by default (no `dangerouslySetInnerHTML`), good code display for a
  developer audience.
- **Alternatives**: Pre-render Markdown to HTML on the server (then HTML sanitization is needed);
  `highlight.js` (fine, smaller themes choice).

## R11. Frontend architecture

- **Decision**: React Router (data routes), TanStack Query for server state, CSS Modules + CSS
  custom properties, thin local wrapper over the GIS script (no `@react-oauth/google`).
- **Rationale**: Minimal dependencies; query cache makes revisits instant.
- **Alternatives**: Redux Toolkit (unneeded), Tailwind/MUI (acceptable, not needed).

## R12. Rate limiting

- **Decision**: `@fastify/rate-limit` global per-IP limit (300 req/min) and a stricter limit on
  `POST /auth/google` (20 req/min). No per-user quotas — there is no per-user cost anymore.

## R13. Testing strategy (Constitution V)

- **Decision**:
  - Unit (Vitest): `assemblePlan`, scoring, progress/dashboard aggregation, content validators,
    shared schemas.
  - API integration: Vitest + `app.inject()` on a real PostgreSQL test DB (docker compose
    `db-test`), synced from a small fixture catalog at `apps/api/tests/fixtures/content/`.
  - Fake auth: `GoogleTokenVerifier` interface; `FakeGoogleVerifier` accepts `test:<email>`
    tokens; enabled only with `AUTH_PROVIDER=fake`; startup fails if combined with
    `NODE_ENV=production`.
  - Content: `content:validate` against real `content/` in CI (SC-005, SC-006 structural part).
  - E2E: Playwright on the full stack with fake auth and fixture content.
- **Alternatives**: Testcontainers (fine, compose is simpler to share with CI); mocking Prisma
  (forbidden).

## R14. Configuration

- **Decision**: API env validated with Zod at startup: `DATABASE_URL`, `GOOGLE_CLIENT_ID`,
  `AUTH_PROVIDER` (`google` | `fake`), `WEB_ORIGIN`, `PORT`, `CONTENT_DIR` (default `../../content`).
  Web: `VITE_GOOGLE_CLIENT_ID` (public by design).

## R15. Content authoring workflow (outside the app)

- **Decision**: Lessons are drafted by a person or with AI assistance (e.g., Claude) offline,
  then edited and reviewed in a PR; `content:validate` must pass. The MVP library (≥ 24 lessons:
  JavaScript, TypeScript, React, Node.js basics × ≥ 6) is produced as a dedicated task phase.
- **Rationale**: Constitution IV — no runtime AI; human review guarantees quality.
