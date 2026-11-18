# Feature Specification: QA Automation Track

**Feature Branch**: `003-qa-automation-track`

**Created**: 2026-11-18

**Status**: Draft — to be implemented after feature 002

**Input**: User description: "Add QA automation lessons, in particular on Python; also add theory on
using pytest, Playwright and Cypress."

Clarified with the project owner (2026-11-18): implement after feature 002 (so content uses 002's
format: topics, further reading, review status); Playwright is taught with **Python** as the main
language plus the differences of Playwright Test in **TypeScript**; levels Junior, Middle and
Senior; **theory only** (lessons, interview questions, quizzes) — no live coding tasks in Python in
this feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prepare for a QA Automation interview (Priority: P1)

A QA automation engineer opens interview setup, picks the **QA Automation** track (no longer
"coming soon"), a level, and the technologies their target jobs ask for — e.g. Python, pytest and
Playwright. They get a plan of lessons in the same format as the Frontend track: explanation, code
examples, interview questions with model answers, key takeaways, a quiz and further reading.

**Why this priority**: It is the whole feature — the track is unusable without lessons.

**Independent Test**: Create plans for Junior, Middle and Senior with each QA technology; every
plan contains lessons for that level; lessons render with code examples in Python (and TypeScript /
JavaScript where relevant).

**Acceptance Scenarios**:

1. **Given** the setup screen, **When** the user opens the track list, **Then** QA Automation is
   selectable and shows its technologies.
2. **Given** QA Automation + any level + any technology, **When** the plan is created, **Then** it
   contains at least 3 lessons relevant to that level for each chosen technology.
3. **Given** a Playwright lesson, **When** the user reads it, **Then** examples use Python
   (pytest-playwright), and a dedicated lesson explains how the same concepts look in Playwright
   Test with TypeScript.
4. **Given** a Cypress lesson, **When** the user reads it, **Then** examples use JavaScript /
   TypeScript (Cypress's own languages) and explain how Cypress differs from Playwright.
5. **Given** a user who selects Playwright or Cypress only, **When** they are on the setup screen,
   **Then** they are recommended the foundations commonly asked together (e.g. Playwright → Python,
   pytest, QA automation fundamentals).

---

### User Story 2 - Compare tools the way interviewers ask (Priority: P2)

Interviewers often ask "Why Playwright over Cypress (or Selenium)?" and "How would you structure a
test framework?". The user finds lessons that compare tools and teach framework design, so they can
answer with trade-offs instead of tool trivia.

**Why this priority**: Comparison and framework-design questions are typical for Middle/Senior QA
automation interviews; they build on the per-tool lessons from US1.

**Independent Test**: A Middle or Senior plan with Playwright and Cypress contains a comparison
lesson and a framework-design lesson with interview questions about trade-offs.

**Acceptance Scenarios**:

1. **Given** a plan with Playwright and Cypress, **When** the user views it, **Then** it contains a
   lesson comparing Playwright, Cypress and Selenium (architecture, browser support, languages,
   parallelism, debugging, flakiness handling, cost).
2. **Given** a Middle or Senior plan with QA automation fundamentals, **When** the user views it,
   **Then** it contains lessons on framework design (Page Object Model and alternatives, fixtures,
   test data, configuration, reporting, CI integration).

### Edge Cases

- A user selects only Cypress: lessons are in JavaScript/TypeScript; the setup screen recommends
  QA automation fundamentals (Cypress does not need Python).
- Tool versions change (Playwright and Cypress release often): every lesson states the version it
  was written for in its further-reading notes, and the review date makes staleness visible.
- Existing Frontend "Testing" lessons (feature 002) overlap with QA topics (e.g. Playwright for
  frontend developers): QA lessons are separate items in the QA track and go deeper; they can link
  to each other in further reading.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The QA Automation track MUST become available, with these technologies:
  **Python for QA**, **pytest**, **Playwright**, **Cypress**, and **QA automation fundamentals**.
- **FR-002**: Each technology MUST have at least 6 published lessons and at least 3 lessons relevant
  to each level (Junior, Middle, Senior) — the existing coverage rule.
- **FR-003**: Each technology MUST have a Middle topic map with must-know / good-to-know topics, and
  every must-know topic MUST be covered (same rule as feature 002).
- **FR-004**: Python for QA MUST cover at least: core data types and collections, functions and
  arguments (`*args`, `**kwargs`), classes and dataclasses, exceptions, context managers,
  decorators, modules and virtual environments/packaging, type hints, file and JSON handling, and
  working with HTTP APIs (e.g. `requests` / `httpx`).
- **FR-005**: pytest MUST cover at least: test discovery and assertions, fixtures (scopes,
  `yield`, `conftest.py`, factories), parametrization, markers and selection, built-in fixtures
  (`tmp_path`, `monkeypatch`, `capsys`), mocking, plugins (e.g. xdist for parallel runs), and
  configuration and reporting.
- **FR-006**: Playwright MUST cover at least: architecture and browser contexts, locators and
  auto-waiting, web-first assertions, pytest-playwright fixtures, authentication state reuse,
  network interception and API testing, tracing and debugging, parallelism and CI, plus a lesson on
  Playwright Test with TypeScript (test runner, fixtures, config) and how it differs from the Python
  setup.
- **FR-007**: Cypress MUST cover at least: architecture (runs in the browser) and its limitations,
  commands and the command queue, retry-ability and assertions, selectors and best practices,
  `cy.intercept` and network stubbing, fixtures and custom commands, component vs E2E testing, and
  CI/parallelization.
- **FR-008**: QA automation fundamentals MUST cover at least: test pyramid and strategy, test
  design techniques (equivalence partitioning, boundary values, decision tables), what to automate,
  flaky tests (causes and fixes), Page Object Model and alternatives, test data management, API vs
  UI testing, CI/CD integration and reporting, and a Playwright vs Cypress vs Selenium comparison.
- **FR-009**: Code examples MUST use the tool's current, non-deprecated APIs and state the version
  they were written for; Python examples follow modern Python 3 style with type hints where
  helpful.
- **FR-010**: Technologies MUST recommend related ones on the setup screen (FR-008 of feature 002),
  e.g. Playwright → Python for QA, pytest, QA automation fundamentals; Cypress → QA automation
  fundamentals.
- **FR-011**: All lessons MUST include further reading to official documentation and pass human
  review before production publication (constitution IV, feature 002 review status).

### Key Entities

No new entities. The feature adds catalog data (track availability, technologies, modules, topic
maps) and lessons in the existing content format from feature 002.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A QA Automation plan with all five technologies contains at least 30 lessons for any
  level.
- **SC-002**: 100% of must-know topics in the QA Middle topic maps are covered (verified
  automatically).
- **SC-003**: 100% of lessons have further reading to official documentation and a recorded human
  review before production publication.
- **SC-004**: In a self-check against 2 real QA automation interview question lists, at least 85%
  of questions map to a lesson.

## Assumptions

- Feature 002 is implemented first; this feature uses its content format (topics, references,
  review status) and setup recommendations. No application code changes are expected (constitution
  VI) — if any are needed, they are limited to catalog display.
- "QA automation fundamentals" is added because interviews for QA automation roles consistently ask
  about test design, strategy and framework design, not only tools. It can be dropped or merged if
  the owner prefers.
- Selenium is covered only as a point of comparison, not as a separate technology.
- Live coding tasks in Python (with or without in-browser execution) are out of scope and may be a
  later feature building on 002's runner.
- Content is in English, as in the rest of the library.
