# Research: Middle Frontend Interview Coverage

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-26

Builds on feature 001 (monorepo, Fastify + Prisma, content pipeline `validate → sync`, plan
snapshots). Each decision: what, why, alternatives.

## R1. Topic map format and coverage check

- **Decision**: One file per technology and level, next to its lessons:
  `content/frontend/<technology>/topics.middle.yaml`:
  ```yaml
  topics:
    - { id: js-closures, title: Closures and lexical scope, priority: must }
    - { id: js-generators, title: Iterators and generators, priority: good }
  ```
  The Middle topic map is the union of these files. Per-technology files let content batches for
  different technologies be written in parallel without editing a shared file.
  Lessons declare `topics: [topic ids]` in front matter. `content:validate` checks (a) every topic id
  a lesson references exists in a map of its technology, (b) **every `must` topic is covered by at
  least one published lesson of that technology whose `levels` include `middle`** (FR-003, SC-001),
  (c) within a module, among Middle lessons, no lesson whose topics are all `good` is ordered before
  a lesson with a `must` topic (FR-005).
- **Rationale**: Content-only (Constitution IV/VI), reviewable, machine-checkable. The topic map is
  validation metadata, so it does not need database tables.
- **Alternatives**: Topic table in the DB + per-topic readiness UI (not required by the spec;
  revisit for a "readiness by topic" feature); numeric frequency scores (no data source — spec
  assumption says must/good).

## R2. Further reading and human review status

- **Decision**: Lesson, task and exercise front matter get:
  - `references: [{ title, url }]` — at least 1, `https://` only (FR-006);
  - `reviewed: YYYY-MM-DD` — optional; absent = draft.
  `content:sync` publishes drafts in development and marks them `isDraft = true` (shown with a
  "Draft — not yet reviewed" badge). `content:sync --require-reviewed` (used for production
  deploys) refuses to publish drafts. CI reports the number of drafts.
- **Rationale**: Constitution IV requires human review before publication. The project owner studies
  the material locally *while* reviewing it, so drafts must be usable locally but never reach
  production unreviewed. The review is recorded in the file itself (and in the PR), per change.
- **Alternatives**: Block all drafts everywhere (owner could not study from drafts); review only in
  PR descriptions (not machine-checkable).

## R3. Coding task content format

- **Decision**: `content/<track>/<technology>/tasks/<task-id>.md`.
  Front matter: `id`, `title`, `levels`, `difficulty` (`easy|medium|hard`), `estimatedMinutes`,
  `mode` (`tests` for JavaScript, `self-check` for React), `topics`, `references`, `reviewed?`,
  `hints` (1–4 strings), and per mode:
  - `tests` mode: `starterCode` (JS string), `entry` (name of the function the user implements),
    `tests` (≥ 5 cases: `{ name, code }` where `code` is a JS snippet using the harness API below),
    `naiveSolution` (JS that must fail ≥ 1 case — SC-008).
  - `self-check` mode: `starterCode` (JSX to copy), `acceptanceCriteria` (3–10 strings).
  Body Markdown with required sections: public `## Problem`, `## Constraints`, `## Examples`;
  hidden `## Solution` (must contain one fenced code block = reference solution),
  `## Explanation`, `## Complexity` (optional for self-check), `## Common mistakes`.
- **Rationale**: Same authoring experience as lessons; hidden sections are split by heading at sync
  time and stored separately so the API can withhold them (like quiz answers, Constitution III).
  Test cases as small code snippets (not just input→output pairs) are needed for tasks with timers,
  callbacks, `this` binding or thrown errors (debounce, event emitter, bind polyfill).
- **Alternatives**: Input/expected JSON pairs only (cannot express async/timer behaviour); separate
  `solution.js` files (harder to review alongside the explanation).

## R4. Test harness API (shared by browser runner and validator)

- **Decision**: A tiny, dependency-free harness in `packages/shared/src/runner/` that is plain
  JavaScript-compatible and runs in both a Web Worker and Node `vm`:
  - `assert.equal(actual, expected)`, `assert.deepEqual`, `assert.ok`, `assert.throws(fn, match?)`,
    `await assert.rejects(promiseOrFn, match?)`;
  - `clock.tick(ms)` / `clock.now()` — **fake timers**: the harness replaces `setTimeout`,
    `clearTimeout`, `setInterval`, `clearInterval`, `Date.now` inside the sandbox scope with a
    virtual clock, so timer tasks (debounce, throttle, retry with backoff) are deterministic and fast;
  - each case runs in a fresh scope: user code is evaluated once per case together with the case
    snippet (`(async () => { <user code>; <case code> })()`), so state cannot leak between cases;
  - result per case: `{ name, status: 'passed'|'failed'|'error', message?, expected?, actual? }`;
    console output is captured and capped (100 lines × 500 chars).
- **Rationale**: One implementation guarantees that the validator (SC-004/008) and the browser run
  exactly the same checks.
- **Alternatives**: Bundling a real test framework (Vitest/Jest) into the browser (heavy, needs a
  bundler); `node:test` (Node only).

## R5. Isolated execution of user code in the browser (FR-015a)

- **Decision**: Two layers:
  1. A **sandboxed iframe** created with `sandbox="allow-scripts"` (no `allow-same-origin`) and a
     `srcdoc` that includes a strict CSP
     `default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:` — it gets an opaque
     origin, so it cannot read our cookies, `localStorage`, `sessionStorage`, IndexedDB or the parent
     DOM, and `connect-src 'none'` (via `default-src`) blocks `fetch`, XHR and WebSockets.
  2. Inside it, a **Web Worker** (from a Blob, inheriting the CSP) runs the harness, so heavy code
     never blocks the iframe's message loop.
  The app talks to the iframe with `postMessage` (validated, versioned messages — see
  [contracts/code-runner.md](./contracts/code-runner.md)). The app enforces the **time limit**
  (5 s total per run): on timeout it removes the iframe, which terminates the worker, and reports
  "Timed out". A fresh iframe is created for every run.
- **Rationale**: Uses only browser primitives; user code never runs on our server; an infinite loop
  only blocks a worker that we kill; opaque origin + CSP gives defence in depth for the session.
- **Alternatives**: QuickJS compiled to WebAssembly (strongest isolation and memory limits, but
  ~1 MB extra and a different JS engine than the user's interview environment — keep as a fallback
  if browser sandboxing proves insufficient); running code on the server in containers (cost,
  security surface, contradicts "only in the user's own browser").

## R6. Code editor

- **Decision**: CodeMirror 6 (`codemirror`, `@codemirror/lang-javascript`), lazy-loaded on the task
  page only; keyboard accessible, supports light/dark via CSS variables. Plain JavaScript only
  (no TypeScript in the runner for this feature).
- **Rationale**: Small (~150 KB gzipped with the JS language) compared with Monaco (~2 MB+), good
  accessibility and mobile support. Justified new dependency (Constitution VII).
- **Alternatives**: Monaco (too heavy); a plain `<textarea>` (no indentation, highlighting or bracket
  matching — poor live-coding practice).

## R7. Hiding hints and solutions; enforcing "Solved on my own"

- **Decision**: `GET /tasks/:id` returns only revealed hints and the solution only if revealed.
  Reveal actions are explicit `POST` calls that persist `hintsRevealed` / `solutionRevealed` for the
  current attempt. `POST /tasks/:id/status` with `solved_own` is rejected (409) if any hint or the
  solution was revealed in the current attempt (FR-012). `POST /tasks/:id/reset` starts a new
  attempt (counters back to 0, draft back to starter code, status kept until changed — FR-013).
- **Rationale**: Mirrors quiz answers in feature 001 (server is the source of truth).

## R8. Check results and drafts

- **Decision**: The browser posts the last check summary (`passed`, `total`) to the API for display
  and dashboard; it is self-reported (the user could tamper with it, which only affects their own
  practice). Drafts (≤ 20 KB) autosave 1 s after typing stops via `POST /tasks/:id/draft`; they are
  stored server-side so they follow the user across devices (FR-015b).
- **Rationale**: Re-running user code on the server would contradict R5 and adds no value for
  self-practice.

## R9. System design exercises

- **Decision**: `content/<track>/system-design/<exercise-id>.md` (track-level folder, reserved
  name). Front matter: `id`, `title`, `levels`, `timeboxMinutes`, `topics`, `references`,
  `reviewed?`, `checklist` (8–15 `{ id, text }`). Body: `## Prompt` (public) followed by exactly the
  fixed walkthrough sections in this order: `## Requirements`, `## High-level architecture`,
  `## Component design`, `## Data model and API`, `## State management`, `## Performance`,
  `## Accessibility`, `## Edge cases and trade-offs` (FR-016). The validator enforces order and
  presence. The "structured approach" itself is a regular lesson (`fe-system-design-approach`) in
  Browser & Web (FR-020).
- **Rationale**: Fixed sections make every walkthrough comparable and let the UI reveal them one by
  one (FR-018).

## R10. Plans with three sections

- **Decision**: Plan snapshots gain `PlanTask` and `PlanExercise` rows created in the same
  transaction as `PlanLesson`. Selection rules: tasks of the chosen technologies whose `levels`
  include the level, ordered by technology position → difficulty → task order; exercises of the
  chosen track whose `levels` include the level, by order. Existing plans are untouched (spec US1-5).
- **Rationale**: Same determinism and stability guarantees as lessons (Constitution IV).

## R11. Setup recommendations (FR-008)

- **Decision**: `catalog.yaml` technologies get `recommends: [technology ids]` (e.g. react →
  javascript, browser-web; nextjs → react, javascript, browser-web; redux → react). The setup page
  shows a non-blocking hint "Often asked together with: …" with a one-click add.

## R12. New technologies and taxonomy

- **Decision**: Catalog order for the Frontend track:
  `html-css`, `browser-web`, `javascript`, `typescript`, `react`, `nextjs`, `redux`, `testing`,
  `nodejs`. `html-css` becomes available. Redux is named "Redux & state management" and also covers
  alternatives (Zustand, server-state libraries).

## R13. Volume and drafting workflow

- **Decision**: Content is produced per technology in this order of interview impact:
  JavaScript gaps + live coding (JS) → Browser & Web → React gaps + React tasks → HTML & CSS →
  TypeScript gaps → Next.js → Redux & state → Testing → system design → Node.js gaps. Each batch:
  topic map entries → lessons/tasks → `content:validate` (coverage + reference solutions) → owner
  review (`reviewed:` date) → merge. Targets: ≥ 60 lessons, ≥ 15 tasks (≥ 10 JS, ≥ 5 React),
  ≥ 5 design exercises (SC-002).
- **Rationale**: The owner can start studying the most valuable areas while the rest is written.
