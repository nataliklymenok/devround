# DevRound — agent guide

Interview-prep web app: Google sign-in → choose interview target → plan assembled from a curated
lesson library → lessons with quizzes → progress dashboard. Built with Spec Kit (SDD).

Governance: `.specify/memory/constitution.md` (wins over everything else).
Current feature: `specs/001-interview-prep-mvp/` (spec, plan, tasks, contracts).

## Layout

- `apps/web` — React 19 + Vite SPA (TypeScript, React Router, TanStack Query, CSS Modules)
- `apps/api` — Fastify 5 + Prisma 7 (pg adapter) + PostgreSQL
  - `src/domain` pure logic (plan assembly, scoring, dashboard) — unit-tested
  - `src/services`, `src/routes`, `src/plugins`, `src/auth`
  - `scripts/content` — content loader, validator, `check-ids`, `sync`
- `packages/shared` — Zod schemas for the HTTP API and the content format (single source of types)
- `content/` — lesson library (Markdown + YAML front matter), source of truth for the catalog

## Commands

```bash
npm run dev                 # api :3000 + web :5173 (Vite proxies /api)
npm run typecheck && npm run lint
npm test                    # unit + API integration (needs TEST_DATABASE_URL Postgres)
npm run content:validate    # validate content/
npm run content:sync        # validate + load content/ into DATABASE_URL
npm run db:migrate -w @devround/api
npm run e2e                 # Playwright, fake auth
```

## Rules

- TypeScript strict everywhere; request/response/content shapes come from `@devround/shared`.
- No runtime LLM calls. Content may be drafted with AI offline but needs human review.
- Lesson/module ids are permanent. To remove one: delete the file AND add the id to
  `content/retired.yaml`. Never reuse a retired id.
- Never send quiz `correct`/`explanation` from `GET /lessons/:id`; likewise never send coding-task
  hints/solutions or design-exercise section bodies before the user reveals them.
- Content kinds: lessons (`<tech>/<id>.md`), coding tasks (`<tech>/tasks/<id>.md`, `mode: tests` for
  JS with automated tests, `self-check` for React), design exercises (`<track>/system-design/<id>.md`),
  and Middle topic maps (`<tech>/topics.middle.yaml`, every `must` topic needs a Middle lesson).
- Every content item needs `references` (official docs). Items without a `reviewed:` date are drafts:
  fine on feature branches, but PRs into `main` must pass `content:validate --require-reviewed`.
- User code from coding tasks runs only in the user's browser inside the sandboxed iframe runner
  (`apps/web/src/features/task/runner`) — never on the server, never with access to the session.
  The test harness lives in `packages/shared/src/runner` and is shared with `content:validate`.
- Every user-data query filters by the session user; foreign resources return 404.
- Tests: integration tests hit a real Postgres (no Prisma mocks); Google verification uses
  `FakeGoogleVerifier` (`AUTH_PROVIDER=fake`, forbidden in production); tests use the fixture
  library in `apps/api/tests/fixtures/content`, not `content/`.
- Every screen needs loading, empty and error states; keyboard accessible.
