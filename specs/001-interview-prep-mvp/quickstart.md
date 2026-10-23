# Quickstart & Validation: Interview Prep MVP

**Feature**: [spec.md](./spec.md) | **API**: [contracts/api.md](./contracts/api.md) |
**Content**: [contracts/content-format.md](./contracts/content-format.md)

## Prerequisites

- Node.js 24 LTS, npm 10+
- Docker (for PostgreSQL)
- A Google Cloud OAuth **Web client ID** with `http://localhost:5173` as an authorized JavaScript
  origin (only for real sign-in; tests and offline dev use fake auth)

## Setup

```bash
npm install                                  # installs all workspaces
docker compose up -d db db-test              # Postgres for dev (5432) and tests (5433)
cp apps/api/.env.example apps/api/.env       # fill GOOGLE_CLIENT_ID (or AUTH_PROVIDER=fake)
cp apps/web/.env.example apps/web/.env       # fill VITE_GOOGLE_CLIENT_ID
npm run db:migrate -w apps/api               # prisma migrate dev
npm run content:sync                         # validate content/ and load it into the DB
npm run dev                                  # api :3000 + web :5173 (Vite proxies /api)
```

With `AUTH_PROVIDER=fake` the landing page shows a dev sign-in field (any email).
In development the session cookie is sent without `Secure` (plain `http://localhost`); in
production it is always `Secure`.

## Quality gates

```bash
npm run typecheck
npm run lint
npm run content:validate   # real content/ library: schema, cross-file, coverage rules
npm test                   # unit + API integration (db-test, fixture content)
npm run build
npm run e2e                # Playwright, full stack with fake auth
```

## Validation scenarios

| # | Story | Steps | Expected |
|---|---|---|---|
| V1 | US1 | Open `/plan` signed out | Redirect to landing with "Sign in with Google" |
| V2 | US1 | Sign in as a new user | Account created, setup screen; `dr_session` cookie is HttpOnly |
| V3 | US1 | Reload, then Sign out | Still signed in after reload; after sign-out `/api/v1/me` → 401 |
| V4 | US2 | Setup: Middle + React + TypeScript | Plan shown < 2 s; only TS and React modules; every lesson has `middle` in its levels; TS before React (catalog order) |
| V5 | US2 | Submit setup with no technology | Submit disabled; message names the missing choice |
| V6 | US2 | Same choices as another user | Identical lesson ids and order |
| V7 | US2 | New setup while a plan exists | Replace warning; old plan `archived` in DB |
| V8 | US3 | Open a lesson | Body, examples, ≥ 3 interview Qs, takeaways, 3–5 quiz Qs; response contains no `correct`/`explanation` |
| V9 | US3 | Submit quiz, retake with lower score | Score + explanations; lesson completed; best score kept |
| V10 | US4 | Open dashboard after V9 | Percent, per-module progress, average match; Continue → next uncompleted lesson |
| V11 | Sec | As user B, request user A's lesson ids/plan | 404 for lessons not in B's plan |
| V12 | Content | Remove a lesson file, run `content:sync` | Lesson shown "no longer available" in existing plans; excluded from totals |
| V13 | Content | Break a quiz `correct` index, run `content:validate` | Fails with file path and rule name |

V1–V12 run automatically in API integration and E2E suites; V13 is a unit test of the validator.
