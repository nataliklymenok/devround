# Quickstart & Validation: Middle Frontend Interview Coverage

Setup is unchanged from [001 quickstart](../001-interview-prep-mvp/quickstart.md). After pulling:

```bash
npm install
npm run db:migrate -w @devround/api
npm run content:validate      # schema, coverage vs topic map, reference/naive solutions
npm run content:sync          # dev: drafts published with a "Draft" badge
npm run dev
```

Production deploys use `npm run content:sync -- --require-reviewed`.

## Validation scenarios

| # | Story | Steps | Expected |
|---|---|---|---|
| V1 | US1 | Setup → Frontend technologies | HTML & CSS, Browser & Web, Next.js, Redux & state management, Testing selectable |
| V2 | US1 | `content:validate` with one `must` topic not covered | Fails naming the topic and technology |
| V3 | US1 | Select React only | Hint recommends JavaScript and Browser & Web; one click adds them |
| V4 | US1 | Open any lesson | "Further reading" with ≥ 1 link; draft badge if not reviewed |
| V5 | US1 | Plan for Middle + all technologies | ≥ 60 lessons, ≥ 15 tasks, ≥ 5 exercises (SC-002) |
| V6 | US2 | Open "Implement debounce" | Statement, starter code, visible tests; no hints, no solution in UI or API response |
| V7 | US2 | Run checks with starter code; then with a correct solution | Failures with expected/actual; then all passed within 3 s (SC-007) |
| V8 | US2 | Run `while (true) {}` | "Timed out after 5 s" within 6 s; page stays responsive |
| V9 | US2 | User code calls `fetch('/api/v1/me')`, reads `document.cookie` / `localStorage` | Blocked / unavailable; no session data reaches the code |
| V10 | US2 | Reveal one hint, try "Solved on my own" | Option unavailable; API returns 409 if forced |
| V11 | US2 | Reload task page | Draft restored; Reset restores starter code |
| V12 | US2 | Open a React task | No editor; starter code to copy, acceptance criteria, self-assessment |
| V13 | US3 | Open "Design an autocomplete" | Prompt + timebox; 8 sections collapsed; reveal one by one; submit checklist → score saved, best kept |
| V14 | US4 | Dashboard with mixed progress | Theory per technology, Live coding, System design areas; review list mixes kinds (≤ 5) |
| V15 | All | `content:sync --require-reviewed` with drafts present | Fails listing draft items |
| V16 | All | `content:validate` with a broken reference solution / passing naive solution | Fails (SC-004, SC-008) |

Automated: V2, V6–V8, V10, V11, V13–V16 in unit/integration/E2E suites; V9 in E2E (browser).
Manual: SC-005 self-check against 3 real Middle interview question lists.
