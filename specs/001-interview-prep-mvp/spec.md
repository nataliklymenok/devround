# Feature Specification: Interview Prep MVP (Sign-in, Personalized Plan, Lessons, Progress)

**Feature Branch**: `001-interview-prep-mvp`

**Created**: 2026-10-23

**Status**: Draft (rev. 2 — curated lesson catalog instead of AI-generated content)

**Input**: User description: "DevRound is a website that requires Google sign-in. A person comes in and
chooses which type of interview they are preparing for, for example a Middle-level interview with
the stack React, JavaScript, TypeScript, Node.js. The main goal is to build a lesson plan, load the
lessons, show the user their progress, and gradually prepare them for interviews. Initially only
frontend development; later QA, Automation, and other kinds of development."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in with Google (Priority: P1)

A visitor opens DevRound, sees a short explanation of what the product does, and signs in with
their Google account. After sign-in they land in their personal area. On later visits they stay
signed in until they sign out or the session expires. They can sign out at any time.

**Why this priority**: Every other capability is personal (plans, progress) and requires knowing
who the user is. This is the foundation of the product.

**Independent Test**: Open the site as a new visitor, sign in with a Google account, confirm the
personal area shows the user's name and avatar, reload the page and confirm the user is still
signed in, sign out and confirm the personal area is no longer accessible.

**Acceptance Scenarios**:

1. **Given** a visitor who is not signed in, **When** they open any personal page, **Then** they
   are redirected to the landing page with a "Sign in with Google" action.
2. **Given** a visitor on the landing page, **When** they complete Google sign-in for the first
   time, **Then** an account is created and they are taken to interview setup (User Story 2).
3. **Given** a returning user with an existing plan, **When** they sign in, **Then** they are taken
   to their dashboard.
4. **Given** a signed-in user, **When** they choose "Sign out", **Then** their session ends and
   personal pages are no longer accessible without signing in again.
5. **Given** a visitor, **When** they cancel or fail Google sign-in, **Then** they stay on the
   landing page with a clear, non-technical message and can try again.

---

### User Story 2 - Choose interview target and get a personalized plan (Priority: P2)

A signed-in user without a plan goes through a short setup: they pick a track (only "Frontend" is
available now; other tracks are shown as "coming soon"), a seniority level (Junior, Middle,
Senior), and one or more technologies from that track (JavaScript, TypeScript, React, Node.js
basics; others shown as "coming soon"). DevRound immediately assembles a personalized preparation
plan from its curated lesson library: the lessons relevant to the chosen level and technologies,
grouped into modules and ordered from fundamentals to advanced topics. The user sees the plan
outline (module and lesson titles, short descriptions, estimated time) right away.

**Why this priority**: The personalized plan is the core value proposition; it turns "I have an
interview" into a concrete path.

**Independent Test**: As a signed-in user with no plan, complete setup choosing Middle + React +
TypeScript; confirm a plan appears instantly containing only React and TypeScript modules, with
lessons marked as relevant for Middle, in library order.

**Acceptance Scenarios**:

1. **Given** a signed-in user without a plan, **When** they open the app, **Then** they see the
   interview setup screen.
2. **Given** the setup screen, **When** the user has not chosen a level or at least one
   technology, **Then** they cannot submit and see which choice is missing.
3. **Given** valid choices, **When** the user submits, **Then** the plan outline is shown within
   a few seconds.
4. **Given** a plan, **When** the user views it, **Then** it contains every library lesson that
   matches the chosen technologies and level, and no lesson for unchosen technologies or other
   levels.
5. **Given** the same choices made by two different users, **When** their plans are created,
   **Then** both plans contain the same lessons in the same order.
6. **Given** a user with an existing plan, **When** they start a new interview setup, **Then**
   they are warned that it will replace the current plan, and the previous plan is archived
   (not deleted) once the new plan is created.

---

### User Story 3 - Study a lesson and self-check (Priority: P3)

From the plan, the user opens a lesson. The lesson contains an explanation of the topic, code
examples where relevant, common interview questions on the topic with model answers, key
takeaways, and a short self-check quiz (3–5 questions). The user answers the quiz, immediately sees
which answers are correct with brief explanations, and the lesson is marked as completed.

**Why this priority**: Lessons are where actual preparation happens; without them the plan is
just a list of titles.

**Independent Test**: Open the first lesson of a plan, confirm it shows explanation, examples,
interview questions and a quiz; complete the quiz and confirm the score and explanations are shown
and the lesson is marked completed.

**Acceptance Scenarios**:

1. **Given** a lesson in the user's plan, **When** the user opens it, **Then** the full lesson
   content is shown.
2. **Given** a lesson with a quiz, **When** the user submits answers, **Then** they see their
   score, the correct answer for each question, and a short explanation.
3. **Given** a lesson whose quiz has not been submitted, **When** the user inspects the page,
   **Then** the correct answers are not available to them.
4. **Given** a submitted quiz, **When** results are shown, **Then** the lesson is marked as
   completed regardless of score, and the score is saved.
5. **Given** a completed lesson, **When** the user retakes the quiz, **Then** the new score is
   saved and the best score is kept for progress.
6. **Given** a lesson, **When** the user finishes it, **Then** a "Next lesson" action takes them to
   the next lesson in plan order.

---

### User Story 4 - See progress and continue where I left off (Priority: P4)

The signed-in user's dashboard shows their interview target (track, level, technologies), overall
plan progress (completed lessons / total, as a percentage), progress per module, average quiz
score, and the topics with the weakest quiz results. A prominent "Continue" action opens the next
uncompleted lesson.

**Why this priority**: Visible progress motivates regular study and helps the user judge
readiness; it builds on data produced by Stories 2 and 3.

**Independent Test**: With a plan where some lessons are completed with different quiz scores,
open the dashboard and verify the counts, percentages, per-module progress, weakest topics, and
that "Continue" opens the first uncompleted lesson.

**Acceptance Scenarios**:

1. **Given** a user with a plan and no completed lessons, **When** they open the dashboard,
   **Then** progress shows 0% and "Continue" opens the first lesson.
2. **Given** a user who just completed a lesson, **When** they return to the dashboard, **Then**
   the overall and module progress already include that lesson.
3. **Given** a user with quiz results, **When** they view the dashboard, **Then** up to 3 lessons
   with the lowest best scores below 70% are listed as "Topics to review".
4. **Given** all lessons are completed, **When** the user views the dashboard, **Then** they see a
   completion state with 100% progress and suggested review topics.

---

### Edge Cases

- User clicks "Create plan" repeatedly: only one plan is created.
- User tries to open a plan or lesson URL that is not part of their own plan: access is denied
  (shown as "not found").
- Google account email or name changes: the user's profile shows updated data on next sign-in;
  their plan and progress are unaffected.
- Session expires mid-lesson: quiz answers are not silently lost; the user is asked to sign in
  again and returns to the same lesson.
- A lesson's text is improved after a user completed it: the user sees the updated text; their
  completion and best score are kept.
- A lesson is withdrawn from the library after it was added to a user's plan: it is shown as
  "no longer available", cannot be opened, and is excluded from progress totals.
- New lessons are added to the library after a user's plan was created: the existing plan is not
  changed (plans are stable); new lessons appear in newly created plans.
- User creates a new plan that includes lessons they already completed in a previous plan: those
  lessons are shown as completed with their best score, and count toward the new plan's progress.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & account**

- **FR-001**: Users MUST be able to sign in and sign up using only their Google account.
- **FR-002**: System MUST create a user account on first successful sign-in, storing only Google
  account identifier, email, display name, and avatar.
- **FR-003**: System MUST keep users signed in across visits until sign-out or session expiry
  (30 days of inactivity by default).
- **FR-004**: Users MUST be able to sign out from any personal page.
- **FR-005**: System MUST restrict all plans, quiz results, and progress to their owner; any
  attempt to access another user's data MUST be denied.

**Lesson library**

- **FR-006**: System MUST provide a curated lesson library organized as track → technology →
  module → lesson; each lesson declares the levels (Junior, Middle, Senior) it is relevant for.
- **FR-007**: Each lesson MUST include: topic explanation, code examples (where relevant), at
  least 3 common interview questions with model answers, 3–6 key takeaways, and a self-check quiz
  of 3–5 single-choice questions with explanations.
- **FR-008**: The MVP library MUST cover the Frontend technologies JavaScript, TypeScript, React,
  and Node.js basics, with at least 6 lessons per technology and at least 3 lessons relevant to
  each level per technology. Technologies without content are shown as "coming soon".
- **FR-009**: Adding or updating tracks, technologies, modules, or lessons MUST be possible by
  editing the library content alone, without changes to application behavior.
- **FR-010**: Library content MUST be checked for completeness and correctness of structure
  before it is published; incomplete or malformed lessons MUST NOT be published.

**Interview target & plan**

- **FR-011**: System MUST present the available tracks, with only "Frontend" selectable in this
  release and other tracks visible as "coming soon".
- **FR-012**: Users MUST choose exactly one level and at least one available technology from the
  selected track.
- **FR-013**: System MUST assemble the plan from all published lessons that belong to the chosen
  technologies and are relevant for the chosen level, grouped by module and ordered by technology,
  module, and lesson order as defined in the library.
- **FR-014**: Plan assembly MUST be deterministic and the plan MUST be stable: later library
  additions do not change existing plans.
- **FR-015**: Each user MUST have at most one active plan; creating a new plan MUST archive the
  previous one (not delete it). Lesson progress and quiz scores belong to the user and the lesson,
  so they are kept and carry over to any later plan that includes the same lesson.
- **FR-016**: The plan outline MUST show each lesson's title, description, estimated time, status
  (not started, completed, no longer available) and best quiz score.

**Lessons & quizzes**

- **FR-017**: Users MUST be able to open any available lesson in their plan in any order.
- **FR-018**: Quiz correct answers and explanations MUST NOT be revealed before the user submits
  the quiz.
- **FR-019**: System MUST score a quiz on submission, show correct answers and explanations, mark
  the lesson completed, and record the attempt.
- **FR-020**: Users MUST be able to retake a quiz; progress MUST use the best score.

**Progress**

- **FR-021**: Dashboard MUST show the interview target, overall completion percentage, completion
  per module, average best quiz score, and up to 3 "Topics to review" (lowest best scores below
  70%).
- **FR-022**: Dashboard MUST provide a "Continue" action that opens the first uncompleted
  available lesson in plan order.
- **FR-023**: Progress MUST update immediately after a quiz is submitted; lessons that are no
  longer available are excluded from totals.

**General UX**

- **FR-024**: Every screen MUST have clear loading, empty, and error states; errors MUST offer a
  retry where retrying makes sense.
- **FR-025**: The interface MUST be usable on desktop and mobile screen widths and be operable via
  keyboard.
- **FR-026**: Interface language and lesson content for this release are English.

### Key Entities

- **User**: A person signed in via Google; identifier, email, name, avatar, created date.
- **Track**: An interview direction (Frontend; later QA, Automation, Backend); name, availability.
- **Level**: Seniority level (Junior, Middle, Senior).
- **Technology**: A skill within a track (React, TypeScript, ...); availability, display order.
- **Module**: An ordered group of lessons within a technology around one theme.
- **Lesson**: A library unit of study within a module; permanent identifier, title, description,
  estimated time, relevant levels, content (explanation, examples, interview questions,
  takeaways, quiz), published flag.
- **Quiz Question**: A single-choice question within a lesson with options, correct answer, and
  explanation.
- **Plan**: A user's personalized selection of library lessons for one interview target (track,
  level, technologies); status active or archived; fixed ordered list of lessons.
- **Quiz Attempt**: A user's submitted answers for a lesson's quiz; score and timestamp.
- **Lesson Progress**: Per user and lesson — completed flag, best score, last opened date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can go from landing page to a visible personalized plan in under
  2 minutes, including sign-in and setup.
- **SC-002**: 95% of plan creations show the plan within 2 seconds of submitting setup.
- **SC-003**: 95% of lesson opens display full content within 2 seconds.
- **SC-004**: 90% of first-time users complete interview setup on their first attempt without
  errors.
- **SC-005**: Every possible combination of level and available technologies produces a plan
  with at least 3 lessons per chosen technology (verified automatically against the library).
- **SC-006**: 100% of published lessons pass structural checks (all required parts present) and
  have been reviewed by a person before publication.
- **SC-007**: Zero cases where a user can view or change another user's data (verified by
  security tests).
- **SC-008**: Progress shown on the dashboard always matches completed lessons and saved scores
  (100% consistency in tests).

## Assumptions

- Target users are developers preparing for frontend interviews who can read technical English.
- Only the Frontend track is available in this release; other tracks are visible but disabled.
- Lesson content is written by the project team (AI tools may be used for drafting offline) and
  reviewed before publication; there is no content-management UI — content is edited in the
  repository.
- Interview-question practice with free-text answers and AI evaluation ("mock interview") is out
  of scope and would require a separate specification (and a constitution amendment).
- Users cannot manually edit or reorder their plan in this release.
- No payments, subscriptions, admin UI, or social features in this release.
- Archived plans are kept but not browsable in the UI in this release.
- Users have a Google account and a modern desktop or mobile browser.
