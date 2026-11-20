# Feature Specification: Middle Frontend Interview Coverage

**Feature Branch**: `002-middle-interview-coverage`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Content coverage for Middle frontend interviews. Expand the DevRound lesson
library so a Middle frontend developer can prepare for real interviews end to end. Scope: (1) a topic
map of what is asked at Middle level for the frontend track — JavaScript, TypeScript, HTML & CSS,
Browser & Web (DOM, events, rendering, HTTP, caching, CORS, storage, security XSS/CSRF/CSP,
accessibility, performance/Core Web Vitals), React (incl. React 19 features, forms, refs, portals,
error boundaries, Suspense), Next.js (App Router, Server Components, SSR/SSG/ISR, data fetching,
caching), Redux / state management (Redux Toolkit, RTK Query, alternatives), Testing (unit, React
Testing Library, e2e), Node.js basics; gap analysis against the existing 25 lessons and new lessons
to close the gaps, prioritized by how often the topic is asked. (2) A new content type: live coding
tasks — a problem statement, progressive hints, a reference solution with explanation and
complexity notes (e.g. implement debounce, Promise.all polyfill, deep clone, a React component).
(3) Frontend system design practice for Middle level — design walkthroughs (e.g. autocomplete,
infinite feed, image gallery) with a structured approach. Context: the project owner is a Middle
frontend developer who will personally use these materials to prepare for interviews, so accuracy
and real-interview relevance matter more than volume."

## Context

Feature 001 delivered the product (sign-in, plans, lessons, quizzes, progress) with a minimal
library of 25 lessons. This feature makes the library genuinely sufficient for **Middle-level
frontend interviews** and adds the two interview formats the library cannot express today:
**live coding** and **frontend system design**. The first and most important user is a Middle
frontend developer preparing for interviews with React, Next.js, Redux and testing in the stack, so
correctness and relevance of every item outweigh the number of items.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete theory coverage for a Middle frontend interview (Priority: P1)

A Middle frontend developer creates a plan for "Frontend · Middle" with the technologies their target
jobs list (e.g. JavaScript, TypeScript, HTML & CSS, Browser & Web, React, Next.js, Redux & state
management, Testing). The plan now contains lessons for every topic that is commonly asked at
Middle level for those technologies — prioritized so the most frequently asked topics come first
within each module — and each lesson points to authoritative documentation for further reading.

**Why this priority**: Theory questions are part of every interview round, and the current library
leaves whole areas (HTML & CSS, browser fundamentals, Next.js, Redux, testing) uncovered. This is
the largest gap between DevRound and real interview preparation.

**Independent Test**: Create a Middle plan with all available frontend technologies; compare its
lessons with the published Middle topic map; every "must-know" topic is covered by at least one
lesson, and the new technologies are selectable and populated.

**Acceptance Scenarios**:

1. **Given** the setup screen, **When** the user opens the technology list for Frontend, **Then**
   HTML & CSS, Browser & Web, Next.js, Redux & state management and Testing are available in
   addition to the existing technologies.
2. **Given** a Middle plan with a technology selected, **When** the user views the plan, **Then**
   every "must-know" topic of that technology in the topic map is covered by at least one lesson in
   the plan.
3. **Given** a lesson, **When** the user reads it, **Then** it ends with a "Further reading" list of
   at least one authoritative source (official documentation or a specification).
4. **Given** a module in the plan, **When** the user looks at its lessons, **Then** lessons on
   "must-know" topics come before "good to know" topics.
5. **Given** a user who already has a plan created before this feature, **When** the library
   grows, **Then** their existing plan is unchanged, and creating a new plan includes the new
   lessons (consistent with feature 001's stable-plan rule).

---

### User Story 2 - Practice live coding tasks (Priority: P2)

From their plan, the user opens a live coding task such as "Implement debounce" or "Build an
accessible tabs component". They read the problem statement, constraints and examples, try to solve
it on their own, reveal hints one at a time only if stuck, then reveal the reference solution with a
step-by-step explanation, complexity notes and common mistakes. They mark the task as solved (or
solved with hints) and it counts toward their progress.

**Why this priority**: Most Middle frontend interviews include a live coding round, and the library
has no way to practice it. It is the second-largest gap after theory coverage.

**Independent Test**: Open a coding task from a plan; confirm the statement shows without hints or
solution; reveal hints one by one; reveal the solution; mark the task solved; confirm progress
updates.

**Acceptance Scenarios**:

1. **Given** a Middle plan with JavaScript or React selected, **When** the user views the plan,
   **Then** it contains a "Live coding" section with tasks relevant to the chosen technologies and
   level.
2. **Given** a coding task that was never opened, **When** the user opens it, **Then** they see the
   statement, constraints and examples, but no hints and no solution.
3. **Given** an open task, **When** the user asks for a hint, **Then** exactly one more hint is
   revealed, in order, and the number of hints used is remembered.
4. **Given** an open task, **When** the user reveals the solution, **Then** they see the reference
   solution, an explanation, time/space complexity where relevant, and common mistakes.
5. **Given** a task, **When** the user marks it "Solved on my own", "Solved with hints" or "Need to
   revisit", **Then** the status is saved, shown in the plan, and reflected in the dashboard.
6. **Given** a task whose solution was revealed before the user marked it, **When** they mark it,
   **Then** "Solved on my own" is not offered (only "Solved with hints" or "Need to revisit").
7. **Given** a JavaScript coding task, **When** the user opens it, **Then** an in-app code editor
   with a starter function signature is shown, and their draft is saved automatically.
8. **Given** a JavaScript task with code in the editor, **When** the user runs the checks, **Then**
   the task's automated test cases run against their code and the user sees which cases passed or
   failed (with expected vs actual values) within a few seconds.
9. **Given** user code that never finishes (e.g. an infinite loop) or throws, **When** checks run,
   **Then** the run is stopped after a time limit and reported as failed with a clear message; the
   page stays responsive.
10. **Given** all checks pass without hints or solution revealed, **When** results are shown,
    **Then** the user is offered to mark the task "Solved on my own".
11. **Given** a React coding task, **When** the user opens it, **Then** there is no in-app editor;
    the statement explains how to solve it in their own environment (starter code to copy and the
    acceptance criteria to check), and they self-assess using the reference solution.

---

### User Story 3 - Practice frontend system design (Priority: P3)

The user opens a system design exercise such as "Design an autocomplete" or "Design an infinite
news feed". They see the prompt and a time box, are encouraged to sketch their own answer first,
then step through a walkthrough that follows the same structured approach every time
(requirements, high-level architecture, component design, data model and API, state management,
performance, accessibility, edge cases and trade-offs) and finally check their answer against a
self-assessment checklist.

**Why this priority**: System design appears in many Middle interviews (more often at Senior), and
the structured approach transfers across questions. It builds on the same plan and progress
mechanics as US1 and US2, so it comes after them.

**Independent Test**: Open a system design exercise from a plan; confirm the prompt and time box are
shown first; walk through all sections; complete the self-assessment; confirm progress updates.

**Acceptance Scenarios**:

1. **Given** a Middle plan for the Frontend track, **When** the user views the plan, **Then** it
   contains a "System design" section with at least the exercises marked relevant for Middle.
2. **Given** an exercise, **When** the user opens it, **Then** they see the prompt, a suggested time
   box and the list of sections, with the walkthrough content collapsed until they choose to reveal
   it.
3. **Given** any exercise, **When** the user reveals the walkthrough, **Then** it follows the same
   fixed sequence of sections as every other exercise.
4. **Given** the self-assessment checklist, **When** the user ticks the points they covered and
   submits, **Then** a score (covered / total) is saved, the exercise is marked completed, and the
   best score is kept on retries.

---

### User Story 4 - See readiness by topic area (Priority: P4)

The dashboard shows, besides overall progress, readiness per area: theory per technology, live
coding, and system design, so the user knows what to practice next before an interview.

**Why this priority**: Useful once there is enough content across formats; builds on US1–US3.

**Independent Test**: With lessons, tasks and exercises partially completed, the dashboard shows
separate progress for theory (per technology), live coding and system design, matching the saved
results.

**Acceptance Scenarios**:

1. **Given** a plan with lessons, coding tasks and design exercises, **When** the user opens the
   dashboard, **Then** progress is shown separately for each technology's theory, for live coding
   and for system design.
2. **Given** coding tasks marked "Need to revisit" and lessons with best quiz scores below 70%,
   **When** the user views "Topics to review", **Then** both kinds of items are listed.

---

### Edge Cases

- A user selects only technologies without coding tasks (e.g. only HTML & CSS): the plan has no
  "Live coding" section and the dashboard does not show live coding progress.
- A coding task or design exercise is withdrawn from the library after it entered a plan: it is
  shown as "no longer available" and excluded from totals, like lessons in feature 001.
- A topic is covered by a lesson in a technology the user did not select (e.g. CORS in Browser &
  Web, user selected only React): the topic is considered uncovered for that plan; the setup screen
  recommends technologies that commonly appear together (React → Browser & Web, JavaScript).
- A user reveals the solution, then resets the task to try again later: hints and solution become
  hidden again, previous status is kept until they mark a new one.
- Content is updated after a user completed a task: the user sees the updated version; their status
  is kept. If the starter signature changed, the saved draft is kept but the user is told the task
  was updated and can reset to the new starter code.
- User code tries to access the page, cookies, storage or network: it has no access to them; the
  run fails or the call is unavailable, and the user's session is never exposed.
- User code produces huge output or allocates a lot of memory: the run is stopped and reported as
  failed; the app keeps working.
- The user's browser blocks the isolated runner (very old browser, strict extensions): the task
  still shows statement, hints and solution, and explains that checks cannot run here.
- Existing plans created before this feature: unchanged; the user can create a new plan to get the
  new content.

## Requirements *(mandatory)*

### Functional Requirements

**Topic map and theory coverage**

- **FR-001**: The library MUST include a topic map for the Frontend track at Middle level listing,
  per technology, the topics asked in interviews, each with a priority: "must-know" or
  "good to know".
- **FR-002**: The topic map MUST cover at least these technologies: JavaScript, TypeScript,
  HTML & CSS, Browser & Web, React, Next.js, Redux & state management, Testing, and Node.js basics.
- **FR-003**: Every "must-know" topic in the Middle topic map MUST be covered by at least one
  published lesson relevant for Middle level, and the library MUST be automatically checked for
  this before publication.
- **FR-004**: HTML & CSS, Browser & Web, Next.js, Redux & state management and Testing MUST become
  selectable technologies with lessons.
- **FR-005**: Within a module, lessons on "must-know" topics MUST be ordered before
  "good to know" topics.
- **FR-006**: Every lesson MUST include a "Further reading" list with at least one authoritative
  source (official documentation, specification, or the maintainers' own guides).
- **FR-007**: Existing lessons MUST be reviewed against the topic map and extended or corrected
  where a "must-know" topic is only partially covered.
- **FR-008**: The setup screen MUST recommend related technologies when the selection leaves
  "must-know" foundations uncovered (e.g. selecting React or Next.js recommends JavaScript and
  Browser & Web).

**Live coding tasks**

- **FR-009**: The library MUST support live coding tasks with: title, technology, relevant levels,
  difficulty (easy/medium/hard), estimated time, problem statement, constraints, examples, 1–4
  ordered hints, reference solution, explanation, complexity notes (where relevant), and common
  mistakes.
- **FR-010**: Plans MUST include the coding tasks that match the chosen technologies and level, in a
  "Live coding" section, grouped by technology (catalog order) and ordered by difficulty within each
  technology.
- **FR-011**: Hints and the reference solution MUST stay hidden until the user explicitly reveals
  them; hints are revealed one at a time in order.
- **FR-012**: The user MUST be able to mark a task "Solved on my own", "Solved with hints" or
  "Need to revisit"; "Solved on my own" is not available once hints or the solution were revealed
  in the current attempt.
- **FR-013**: The user MUST be able to reset a task to try again; the latest status is kept until a
  new one is chosen.
- **FR-014**: The Middle library MUST contain at least 15 coding tasks: at least 10 JavaScript
  (e.g. debounce, throttle, `Promise.all` polyfill, deep clone, event emitter, `bind` polyfill,
  memoize, flatten, curry, retry with backoff) and at least 5 React (e.g. accessible tabs,
  autocomplete input, todo list with filters, modal with focus trap, data fetching with loading and
  error states).
- **FR-015**: JavaScript coding tasks MUST provide an in-app code editor with starter code and at
  least 5 automated test cases per task (including edge cases); the user can run the checks any
  number of times and sees per-case results (input, expected, actual, error).
- **FR-015a**: User code MUST run only in the user's own browser, isolated from the application
  (no access to the page, the session or network credentials), and every run MUST stop after a time
  limit (default 5 seconds) without freezing the interface.
- **FR-015b**: The user's latest draft for each JavaScript task MUST be saved and restored on their
  next visit; resetting the task restores the starter code.
- **FR-015c**: React coding tasks MUST be solved outside the app: they provide starter code to copy,
  explicit acceptance criteria to self-check, and the reference solution; no in-app execution.
- **FR-015d**: Test case inputs and expected outputs MUST be visible to the user from the start,
  as in a real interview; only hints and the reference solution stay hidden until revealed
  (FR-011).

**System design exercises**

- **FR-016**: The library MUST support system design exercises with: title, relevant levels, time
  box, prompt, and a walkthrough in a fixed section order — requirements (functional and
  non-functional), high-level architecture, component design, data model and API, state
  management, performance, accessibility, edge cases and trade-offs — plus a self-assessment
  checklist of 8–15 points.
- **FR-017**: Plans for the Frontend track MUST include the design exercises relevant for the chosen
  level in a "System design" section.
- **FR-018**: The walkthrough MUST be hidden until the user reveals it; the user can reveal it
  section by section.
- **FR-019**: Submitting the self-assessment MUST save the score (points covered / total), mark the
  exercise completed, and keep the best score across attempts.
- **FR-020**: The Middle library MUST contain at least 5 system design exercises (e.g. autocomplete,
  infinite feed, image gallery/carousel, real-time notifications, a form wizard with validation and
  draft saving), plus one lesson that teaches the structured approach itself.

**Progress and readiness**

- **FR-021**: The dashboard MUST show progress separately for theory per technology, live coding
  and system design.
- **FR-022**: "Topics to review" MUST include lessons with best quiz score below 70%, coding tasks
  marked "Need to revisit", and design exercises with best self-assessment below 70%, up to 5 items
  in total, weakest first.
- **FR-023**: Items no longer available MUST be excluded from all progress totals.

**Content quality**

- **FR-024**: All new and changed content MUST be reviewed by a person before publication
  (constitution IV); the review is recorded per change.
- **FR-025**: Code in lessons, coding task solutions and design walkthroughs MUST use current,
  non-deprecated APIs of the stated technology versions (e.g. React 19, Next.js App Router), and
  reference solutions MUST be verified to work against their examples before publication.

### Key Entities

- **Topic**: An interview topic within a technology for a level; priority (must-know / good to
  know); linked to the lessons that cover it.
- **Topic Map**: The full set of topics for a track and level; the yardstick for coverage.
- **Lesson** (extended): adds covered topics and further-reading sources.
- **Coding Task**: A live coding problem — technology, levels, difficulty, statement, constraints,
  examples, ordered hints, reference solution, explanation, complexity, common mistakes.
- **Design Exercise**: A system design problem — levels, time box, prompt, walkthrough sections in
  fixed order, self-assessment checklist.
- **Task Progress**: Per user and coding task — hints revealed, solution revealed, status (solved on
  my own / solved with hints / need to revisit), last attempt date, latest code draft (JavaScript
  tasks), last check result (passed / total).
- **Test Case**: Per JavaScript coding task — name, input, expected output; visible to the user.
- **Exercise Progress**: Per user and design exercise — sections revealed, best self-assessment
  score, completed flag.
- **Plan** (extended): now contains three sections — lessons, live coding tasks, design exercises.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of "must-know" topics in the Middle topic map are covered by at least one
  published lesson (verified automatically).
- **SC-002**: A Middle plan with all frontend technologies contains at least 60 lessons, at least
  15 coding tasks and at least 5 system design exercises.
- **SC-003**: 100% of published lessons, tasks and exercises have at least one authoritative
  further-reading source and a recorded human review.
- **SC-004**: 100% of reference solutions to coding tasks produce the documented output for all
  their examples (verified automatically or by recorded manual check).
- **SC-005**: In a self-check by the project owner against 3 real Middle interview question lists
  (from job interviews or public interview guides), at least 90% of the questions map to a lesson,
  task or exercise in the library.
- **SC-006**: Opening any lesson, task or exercise shows its content within 2 seconds (as in
  feature 001).
- **SC-007**: Running the checks of a JavaScript task shows results within 3 seconds for a correct
  solution; a non-terminating solution is stopped and reported within 6 seconds, and the interface
  stays usable throughout.
- **SC-008**: Every JavaScript task's reference solution passes 100% of its test cases, and a
  deliberately wrong "naive" solution fails at least one case (verified automatically).

## Assumptions

- "Prioritized by how often the topic is asked" is based on the curators' judgment informed by
  public interview guides and the project owner's own interview experience; there is no usage data
  yet. Priority is expressed as must-know / good to know rather than a numeric frequency.
- New technologies are part of the existing Frontend track; Next.js and Redux are modelled as
  separate technologies so users can choose them.
- The topic map in this feature targets Middle level; Junior and Senior maps are future work, but
  existing Junior/Senior relevance tags on lessons stay valid.
- Coding tasks and design exercises are part of the personalized plan and follow the same rules as
  lessons: matched by technology and level, stable after plan creation, unavailable items excluded.
- Behavioral (soft skills) interview preparation is out of scope.
- AI-assisted mock interviews remain out of scope (no runtime AI, constitution IV).
- Content is written in English, as in feature 001.
- Lessons, tasks and exercises are drafted with AI assistance and must pass human review; the
  project owner is the primary reviewer.
