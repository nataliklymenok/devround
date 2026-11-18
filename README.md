# DevRound

Interview preparation for developers. Sign in with Google, choose the interview you are preparing
for (track, level, technologies), and get a personal plan of lessons from a curated library — each
with explanations, code examples, typical interview questions with model answers and a short quiz.
Your progress and weakest topics are tracked on a dashboard.

The **Frontend** track covers HTML & CSS, Browser & Web, JavaScript, TypeScript, React, Next.js,
Redux & state management, Testing and Node.js basics — theory lessons, auto-checked JavaScript
live-coding tasks, React self-check tasks and frontend system design exercises. QA Automation is
specified next (feature 003); other tracks show up as "coming soon".

The project is built spec-first with [Spec Kit](https://github.com/github/spec-kit):
[constitution](.specify/memory/constitution.md) ·
[spec](specs/001-interview-prep-mvp/spec.md) ·
[plan](specs/001-interview-prep-mvp/plan.md) ·
[tasks](specs/001-interview-prep-mvp/tasks.md).

## Stack

| Part | Tech |
| --- | --- |
| `apps/web` | React 19, Vite, TypeScript, React Router, TanStack Query, CSS Modules |
| `apps/api` | Node.js 24, Fastify 5, Prisma 7 (pg adapter), PostgreSQL 17 |
| `packages/shared` | Zod schemas shared by web, API and content tooling |
| `content/` | Lesson library: Markdown + YAML front matter |
| Tests | Vitest (unit + API integration on real Postgres), Playwright + axe (E2E, a11y) |

## Getting started

Prerequisites: Node.js 24+, PostgreSQL 17 (Homebrew `brew install postgresql@17` or
`docker compose up -d db db-test`), and — for real sign-in — a Google OAuth **Web client ID** with
`http://localhost:5173` as an authorized JavaScript origin.

```bash
npm install
cp apps/api/.env.example apps/api/.env   # set DATABASE_URL, TEST_DATABASE_URL, GOOGLE_CLIENT_ID
cp apps/web/.env.example apps/web/.env   # set VITE_GOOGLE_CLIENT_ID
npm run db:migrate -w @devround/api      # apply migrations
npm run content:sync                     # validate content/ and load it into the database
npm run dev                              # API on :3000, web on :5173
```

No Google client yet? Set `AUTH_PROVIDER=fake` in `apps/api/.env` and `VITE_FAKE_AUTH=true` in
`apps/web/.env` — the landing page then offers a dev sign-in by email. Fake auth refuses to start
with `NODE_ENV=production`.

## Quality gates

```bash
npm run typecheck
npm run lint
npm run content:validate
npm test        # needs TEST_DATABASE_URL (a database whose name contains "test")
npm run build
npm run e2e     # Playwright: starts its own API (:3100) and web (:5174) on the test database
```

CI runs all of them, plus `content:check-ids` on pull requests.

## Writing content

The library lives in `content/` (format and rules:
[001 content-format](specs/001-interview-prep-mvp/contracts/content-format.md) and
[002 additions](specs/002-middle-interview-coverage/contracts/content-format.md)).

| Kind | Where | Notes |
| --- | --- | --- |
| Lesson | `content/<track>/<technology>/<id>.md` | theory, interview Q&A, quiz, `topics`, `references` |
| Topic map | `content/<track>/<technology>/topics.middle.yaml` | every `must` topic needs a Middle lesson |
| Coding task | `content/<track>/<technology>/tasks/<id>.md` | `mode: tests` (JS, in-app editor + tests) or `self-check` (React) |
| Design exercise | `content/<track>/system-design/<id>.md` | prompt + 8 fixed walkthrough sections + checklist |

Rules worth remembering:

- `npm run content:validate` must pass: schemas, cross-file references, coverage (each available
  technology needs ≥ 6 lessons and ≥ 3 per level, and every Middle `must` topic is covered), and for
  `tests`-mode tasks the reference solution must pass **all** tests while `naiveSolution` must fail
  at least one.
- Every item needs at least one official `references` link.
- Ids are permanent. To remove a lesson, task or exercise, delete the file **and** list its id in
  `content/retired.yaml`; it is unpublished, never deleted, so user progress survives.
- Items without a `reviewed: YYYY-MM-DD` date are **drafts**: they show a "Draft" badge locally and
  are fine on feature branches, but pull requests into `main` must pass
  `npm run content:validate -- --require-reviewed` (CI gate). Production deploys run
  `npm run content:sync -- --require-reviewed`.
- Content may be drafted with AI tools, but every item is reviewed by a person before merge.
- Existing plans are snapshots: new content appears in newly created plans only.

Coding task tests are small snippets run by the shared harness (`packages/shared/src/runner`), with
`assert.equal/deepEqual/ok/throws/rejects` and a fake clock (`clock.tick(ms)`,
`await clock.tickAsync(ms)`, `await clock.runAll()`). In the app, user code runs only in the
browser inside a sandboxed iframe + Web Worker with no network, storage or session access.

## Project layout

```text
apps/api/src/domain     pure logic: plan assembly, quiz scoring, dashboard aggregation
apps/api/src/services   database access per feature (sessions, plans, lessons, progress)
apps/api/src/routes     HTTP routes under /api/v1 (see contracts/api.md)
apps/api/scripts        content validate / check-ids / sync, e2e reset
apps/web/src/features   auth, setup, plan, lesson, task (editor + sandbox runner), exercise, dashboard
e2e/                    Playwright journeys, accessibility and responsive checks
```
