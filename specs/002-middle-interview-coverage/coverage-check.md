# SC-005 Coverage Check (T069)

**Date**: 2026-11-20 | **Library before the check**: 78 lessons, 15 tasks, 5 exercises

SC-005: at least 90% of the questions in 3 real Middle interview question lists map to a library
item; anything unmapped above 10% gets new topics or lessons.

## Method

Each question title from the three lists below was mapped to library items by topic map and by
searching lesson bodies, interview Q&A and quizzes for the concept. A question counts as mapped
when a lesson explains the concept and ideally has it as an interview question. Behavioral
questions ("What did you learn this week?", "tabs or spaces?") were excluded from list 3.

| # | List | Questions | Unmapped | Coverage |
| --- | --- | --- | --- | --- |
| 1 | [GreatFrontEnd — Top React interview questions](https://github.com/greatfrontend/top-reactjs-interview-questions) | 50 | 5 | 90% |
| 2 | [GreatFrontEnd — Top JavaScript interview questions](https://github.com/greatfrontend/top-javascript-interview-questions) (full list) | 193 | 22 | 89% |
| 3 | [h5bp — Front-end Developer Interview Questions](https://github.com/h5bp/Front-end-Developer-Interview-Questions) (HTML, CSS, general) | 61 technical | 8 | 87% |

## Gaps found

| List | Unmapped questions | Closed by |
| --- | --- | --- |
| 1 | Higher-order components; render props; Flux; one-way data flow; React anti-patterns | `react-component-patterns` (new topic `react-patterns`, must) |
| 2 | Design patterns: singleton, factory, observer, module, prototype, decorator, strategy, command; IIFE | `js-design-patterns` (new topic `js-design-patterns`, good) |
| 2 | `Object.freeze` / `seal` / `preventExtensions`; property descriptors; tagged templates | `js-objects-descriptors` (new topic `js-objects-metaprogramming`, good) |
| 2 | Attribute vs property; XHR vs fetch; JSONP; Intl; History API; iframe communication | `web-platform-apis` (new topic `web-platform-apis`, good) |
| 2 | TDD | Not added: one paragraph is enough — candidate for an addition to `testing-strategy` |
| 3 | What happens when you enter a URL | `web-url-to-page` (new topic `web-navigation`, must) |
| 3 | Floats and clearing; BFC; clearfix; `nth-of-type` vs `nth-child` | `css-formatting-floats` (new topic `css-formatting-contexts`, good) |
| 3 | Canvas vs SVG | `web-platform-apis` |

After the additions, every list is above 95% (the remaining items are TDD, retina graphics and
"styling SVG", which are covered only briefly).

## Follow-up

The 6 new lessons are drafts: they need the owner's review (`reviewed:` date) before the PR into
`main` — the CI `content-review` job enforces it.
