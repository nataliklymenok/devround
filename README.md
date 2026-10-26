# DevRound

Interview preparation for developers. Sign in with Google, choose the interview you are preparing
for (track, level, technologies), and get a personal plan of lessons from a curated library — each
with explanations, code examples, typical interview questions with model answers and a short quiz.
Your progress and weakest topics are tracked on a dashboard.

The MVP covers the **Frontend** track (JavaScript, TypeScript, React, Node.js basics). QA,
Automation and Backend are planned and show up as "coming soon".

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

## Writing lessons

Lessons live in `content/<track>/<technology>/<lesson-id>.md`; modules are listed in
`modules.yaml` next to them and tracks/technologies in `content/catalog.yaml`. The full format and
rules are in [contracts/content-format.md](specs/001-interview-prep-mvp/contracts/content-format.md).

```markdown
---
id: react-effects              # permanent, equals the file name
module: react-hooks
order: 2
title: useEffect done right
description: One sentence shown in the plan.
levels: [junior, middle, senior]
estimatedMinutes: 30
keyTakeaways: [...]            # 3–6
interviewQuestions: [...]      # 3–8 × { question, answer }
quiz: [...]                    # 3–5 × { id, question, options, correct, explanation }
---

## First section
Markdown with fenced code blocks (always with a language). No raw HTML.
```

Rules worth remembering:

- `npm run content:validate` must pass: schema, cross-file references, and coverage (each available
  technology needs ≥ 6 lessons and ≥ 3 per level).
- Ids are permanent. To remove a lesson, delete the file **and** add its id to
  `content/retired.yaml`; it is unpublished, never deleted, so user progress survives.
- Lessons may be drafted with AI tools, but every lesson is reviewed by a person before merge.
- Existing plans are snapshots: new lessons appear in newly created plans only.

## Project layout

```text
apps/api/src/domain     pure logic: plan assembly, quiz scoring, dashboard aggregation
apps/api/src/services   database access per feature (sessions, plans, lessons, progress)
apps/api/src/routes     HTTP routes under /api/v1 (see contracts/api.md)
apps/api/scripts        content validate / check-ids / sync, e2e reset
apps/web/src/features   auth, setup, plan, lesson, dashboard
e2e/                    Playwright journeys, accessibility and responsive checks
```
