<!--
Sync Impact Report
- Version change: 2.0.0 → 2.0.1 (PATCH: clarification, no principle change)
- Modified: Technology & Architecture Constraints — `packages/shared` may also hold pure,
  environment-agnostic utilities used by more than one workspace (e.g. the code-task test harness
  shared by the browser runner and content validation, feature 002).
- Added/removed sections: none
- Templates: no changes required.
- Deferred TODOs: none
-->

# DevRound Constitution

DevRound is a web platform that prepares developers for technical interviews. A user signs in
with Google, selects a target interview (track, seniority level, technology stack), receives a
personalized lesson plan assembled from a curated lesson catalog, studies lessons, and tracks
progress toward interview readiness. The initial scope is the Frontend track; QA, Automation,
Backend, and other tracks follow later.

## Core Principles

### I. Spec-Driven, Incremental Delivery

- Every feature MUST start with a specification (`/speckit-specify`) describing user value and
  acceptance criteria before any plan or code is written.
- Implementation MUST follow the chain spec → plan → tasks → implementation; code that is not
  traceable to a task in an approved spec MUST NOT be merged.
- Features MUST be sliced into independently deliverable user stories, each demonstrable on its
  own (for example: sign-in works before plans exist).

Rationale: the project is built with Spec Kit; specs are the source of truth and keep scope
controlled.

### II. End-to-End Type Safety

- All application code (web, api, shared) MUST be TypeScript with `strict: true`. Plain `.js`
  source is allowed only for tool configuration files.
- Every HTTP request/response body and the lesson content format MUST have a runtime schema (Zod)
  defined once in `packages/shared` and reused by web, api, and content tooling; TypeScript types
  are inferred from those schemas, not duplicated by hand.
- `any` MUST NOT be used without an inline justification comment.

Rationale: a single schema source prevents drift between frontend, backend, and content.

### III. Security & Privacy by Default (NON-NEGOTIABLE)

- Authentication MUST use Google OAuth / Google Identity; the Google ID token MUST be verified on
  the backend (signature, audience, issuer, expiry) before a user record is created or a session
  is issued.
- Sessions MUST be stored in `httpOnly`, `Secure`, `SameSite` cookies; tokens MUST NOT be stored
  in `localStorage` or exposed to client JavaScript.
- Secrets (Google client secret if used, database URL, session secret) MUST live only in backend
  environment variables and MUST NOT be committed or sent to the browser.
- Every API endpoint that returns or mutates user data MUST enforce authorization: a user can
  access only their own plans, answers, and progress.
- All external input (request bodies, query params, content files) MUST be validated before use.
- Quiz correct answers MUST NOT be sent to the client before the user submits answers.
- Only the minimum Google profile data needed (id, email, name, avatar) MAY be stored.

Rationale: the product handles personal accounts; leaks are unacceptable.

### IV. Curated, Versioned Content

- Lesson content (explanations, code examples, interview questions, quizzes) MUST live in the
  repository as human-readable files under `content/`, reviewed through pull requests like code.
- Every content file MUST validate against the shared Zod content schema; CI MUST fail on invalid
  content, duplicate IDs, or broken references.
- Lesson and module IDs are permanent: once published they MUST NOT be renamed or reused.
  Removing a lesson MUST unpublish it, not delete it, so user progress stays intact.
- Content MAY be drafted with AI tools offline, but MUST be reviewed by a human before merge.
  The running application MUST NOT call LLM APIs; introducing runtime AI requires a
  constitution amendment.
- Plans MUST be assembled deterministically from the catalog: the same inputs and catalog version
  produce the same plan.

Rationale: curated content gives predictable quality, zero per-user cost, and instant responses.

### V. Test Discipline

- Unit tests (Vitest) are REQUIRED for domain logic: plan assembly, progress calculation, quiz
  scoring, and schema validation.
- API routes MUST have integration tests against a real PostgreSQL test database (no DB mocks),
  covering the happy path, validation errors, and authorization (access to another user's data
  is denied).
- Google token verification MUST be replaced by a deterministic fake in tests; tests MUST NOT call
  real external services. Tests use a small fixture content catalog, not production content.
- Critical user journeys (sign in → choose interview → get plan → open lesson → progress
  updates) MUST have at least one end-to-end test before a release.
- Tests for a user story MUST be written before or together with its implementation and MUST pass
  in CI before merge.

Rationale: progress and plan logic are where silent bugs hurt users the most.

### VI. Data-Driven, Extensible Domain

- Tracks (Frontend, QA, Automation, ...), seniority levels, technologies, modules, and lessons
  MUST be modeled as data (content catalog synced to the database), not as hard-coded enums in UI
  or business logic.
- Adding a new track, technology, or lesson MUST NOT require a database schema change or a code
  change in plan/lesson/progress logic; only content files.
- The MVP ships with the Frontend track only and levels Junior, Middle, Senior.

Rationale: expansion to QA and other tracks is an explicit product goal.

### VII. Simplicity First

- Prefer the simplest solution that satisfies the current spec (YAGNI). New dependencies,
  services, queues, or caches MUST be justified in the plan's Complexity Tracking section.
- One web app, one API service, one database for the MVP; no microservices.
- Every user-facing screen MUST define loading, empty, and error states, and meet WCAG 2.1 AA
  basics (keyboard navigation, labels, contrast).

Rationale: a small, understandable system ships faster and is easier to extend.

## Technology & Architecture Constraints

- **Repository**: npm workspaces monorepo:
  - `apps/web`: React 19 + Vite + TypeScript (SPA)
  - `apps/api`: Node.js (LTS) + Fastify + TypeScript
  - `packages/shared`: Zod schemas, inferred types, shared constants, and pure environment-agnostic
    utilities needed by more than one workspace (no DOM, Node or database access)
  - `content/`: curated lesson catalog (Markdown + YAML front matter)
- **Database**: PostgreSQL, accessed only through Prisma; schema changes only through Prisma
  migrations committed to the repo. Content is synced into the database by a validated,
  idempotent sync command; the files remain the source of truth.
- **Auth**: Google Identity Services on the client; ID token verification and session issuance on
  the API.
- **Configuration**: all environment-specific values come from env variables validated at
  startup; a `.env.example` MUST list every variable without real values.
- **API style**: JSON REST under `/api/v1`, with request/response schemas from `packages/shared`.
- **Tooling**: ESLint + Prettier; Vitest for unit/integration tests; Playwright for E2E.

## Development Workflow & Quality Gates

- Work happens on a feature branch per spec (`NNN-feature-name`).
- Before merge, a change MUST pass: typecheck, lint, content validation, unit and integration
  tests, and a build of every workspace.
- `/speckit-analyze` SHOULD be run after `/speckit-tasks` and before `/speckit-implement` for
  non-trivial features.
- Every plan MUST include a Constitution Check; violations MUST be listed and justified in
  Complexity Tracking or the plan MUST be revised.
- Database migrations, new env variables, and content ID removals/unpublishing MUST be called out
  in the PR description.

## Governance

- This constitution supersedes other conventions in the repository. When guidance conflicts, the
  constitution wins.
- Amendments are made via `/speckit-constitution`, MUST include a Sync Impact Report, and MUST
  bump the version:
  - MAJOR: removing or redefining a principle in a backward-incompatible way;
  - MINOR: adding a principle or section, or materially expanding guidance;
  - PATCH: clarifications and wording fixes.
- Every spec, plan, and code review MUST verify compliance with these principles.
- Runtime development guidance for agents lives in `CLAUDE.md`.

**Version**: 2.0.1 | **Ratified**: 2026-10-23 | **Last Amended**: 2026-11-18
