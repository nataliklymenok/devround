---
id: testing-a11y-visual
module: testing-advanced
order: 3
title: Accessibility and visual regression tests
description: Automated accessibility checks with axe, their limits, and screenshot-based visual regression testing.
levels: [middle, senior]
estimatedMinutes: 15
topics: [testing-a11y-visual]
reviewed: 2026-11-20
references:
  - { title: 'Playwright — Accessibility testing', url: 'https://playwright.dev/docs/accessibility-testing' }
  - { title: 'Playwright — Visual comparisons', url: 'https://playwright.dev/docs/test-snapshots' }
keyTakeaways:
  - axe-based checks catch many WCAG issues automatically (labels, contrast, ARIA misuse) but not all.
  - Run accessibility checks in component and E2E tests on key pages and states (open dialogs, error states).
  - Visual regression compares screenshots against baselines to catch unintended UI changes.
  - Stabilize screenshots — fixed viewport, fonts, disabled animations and masked dynamic content.
interviewQuestions:
  - question: Can automated tools guarantee an accessible app?
    answer: |
      No. Tools like axe find roughly a third to a half of issues — missing labels, low contrast, invalid
      ARIA, duplicate ids. They cannot judge whether alt text is meaningful, focus order makes sense, or
      a custom widget is usable with a screen reader. Combine automated checks in CI with manual
      keyboard and screen-reader testing.
  - question: How do you keep visual regression tests from being flaky?
    answer: |
      Run them in a consistent environment (same OS and browser, often in Docker or CI only), fix the
      viewport and fonts, disable animations and caret blinking, mask or stub dynamic content (dates,
      avatars, ads), wait for images and fonts to load, and allow a small pixel threshold. Review
      baseline updates like code.
  - question: Where in the pipeline do accessibility and visual tests belong?
    answer: |
      Linting (`eslint-plugin-jsx-a11y`) and component-level axe checks run on every commit because they
      are fast. Page-level axe and visual tests run in CI against key pages and states (dialogs, error
      and empty states, dark mode) on pull requests. Visual baselines are updated only in reviewed PRs,
      and accessibility violations above an agreed impact level fail the build.
quiz:
  - id: q1
    question: Which issue can axe detect automatically?
    options: ["Whether alt text is meaningful", "A form input without a label", "Whether the tab order is logical for the task", "Whether copy is easy to understand"]
    correct: 1
    explanation: Missing accessible names are detectable; meaning and usability need humans.
  - id: q2
    question: Why do visual tests often run only in CI or Docker?
    options: ["They are slow", "Font rendering differs across operating systems", "Browsers forbid screenshots locally", "They need a GPU"]
    correct: 1
    explanation: Consistent rendering environments avoid false diffs.
  - id: q3
    question: What should you do with a timestamp shown on the page in a screenshot test?
    options: ["Nothing", "Mask it or freeze time", "Increase the threshold to 50%", "Skip the test"]
    correct: 1
    explanation: Dynamic content must be stabilized.
---

## Accessibility checks with axe

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('checkout has no serious accessibility violations', async ({ page }) => {
  await page.goto('/checkout')
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
  expect(serious).toEqual([])
})
```

In component tests, `vitest-axe` / `jest-axe` run the same engine against rendered markup.

## Visual regression

```ts
test('pricing page looks right', async ({ page }) => {
  await page.goto('/pricing')
  await expect(page).toHaveScreenshot('pricing.png', {
    fullPage: true,
    animations: 'disabled',
    mask: [page.getByTestId('live-visitors')],
    maxDiffPixelRatio: 0.01,
  })
})
```

Update baselines deliberately with `npx playwright test --update-snapshots` and review the diffs in
the pull request.
