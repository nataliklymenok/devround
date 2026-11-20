---
id: testing-e2e-playwright
module: testing-advanced
order: 2
title: End-to-end tests with Playwright
description: Locators and web-first assertions, auto-waiting, fixtures and authentication, test isolation and fighting flakiness.
levels: [middle, senior]
estimatedMinutes: 25
topics: [testing-e2e]
reviewed: 2026-11-20
references:
  - { title: 'Playwright — Writing tests', url: 'https://playwright.dev/docs/writing-tests' }
  - { title: 'Playwright — Best Practices', url: 'https://playwright.dev/docs/best-practices' }
  - { title: 'Playwright — Authentication', url: 'https://playwright.dev/docs/auth' }
keyTakeaways:
  - E2E tests cover a few critical journeys in a real browser against a running app.
  - Use role and label locators; Playwright auto-waits for elements to be actionable.
  - Web-first assertions (expect(locator).toBeVisible()) retry until they pass or time out — never use fixed sleeps.
  - Isolate tests (fresh context per test, own test data) and reuse authentication state to keep them fast.
interviewQuestions:
  - question: What makes E2E tests flaky and how do you fix it?
    answer: |
      Fixed waits and race conditions (asserting before the UI updated), shared or leftover test data,
      dependence on external services, animations, non-unique locators and order dependence between
      tests. Fixes: web-first assertions instead of sleeps, unique data per test, mocking third
      parties, stable role/test-id locators, isolated browser contexts, and traces on failure to
      diagnose. Quarantine and fix flaky tests instead of retrying them forever.
  - question: How do you handle login in Playwright tests?
    answer: |
      Log in once in a setup project (through the UI or an API call), save `storageState` (cookies and
      local storage) to a file, and configure dependent projects to start with that state. Tests then
      begin already authenticated, which is faster and keeps the login flow tested in one place.
  - question: Playwright or Cypress?
    answer: |
      Playwright runs tests out of process via browser protocols, supports Chromium, Firefox and
      WebKit, multiple tabs and origins, parallel execution for free, and multiple languages. Cypress
      runs inside the browser with an excellent interactive runner and time-travel debugging, but has
      limits around multiple tabs/origins and Safari, and parallelization is tied to its cloud or extra
      setup. Both are solid; Playwright is often chosen for cross-browser coverage and speed.
quiz:
  - id: q1
    question: How should you wait for a toast after clicking Save?
    options: ["await page.waitForTimeout(2000)", "await expect(page.getByRole('status')).toHaveText('Saved')", "while (!visible) {}", "setTimeout in the test"]
    correct: 1
    explanation: Web-first assertions retry automatically.
  - id: q2
    question: How do you avoid logging in through the UI in every test?
    options: ["Disable auth in tests", "Reuse a saved storageState from a setup project", "Share one browser page across all tests", "Use page.evaluate to set a global"]
    correct: 1
    explanation: storageState restores cookies and storage for each new context.
  - id: q3
    question: Which locator is most resilient?
    options: ["page.locator('div > div:nth-child(3) button')", "page.getByRole('button', { name: 'Checkout' })", "page.locator('.btn-primary')", "XPath by index"]
    correct: 1
    explanation: User-facing locators survive markup changes.
---

## A test

```ts
import { expect, test } from '@playwright/test'

test('user can add a product to the cart and check out', async ({ page }) => {
  await page.goto('/products')
  await page.getByRole('link', { name: 'Mechanical keyboard' }).click()
  await page.getByRole('button', { name: 'Add to cart' }).click()
  await expect(page.getByRole('status')).toHaveText('Added to cart')

  await page.getByRole('link', { name: 'Cart (1)' }).click()
  await page.getByRole('button', { name: 'Checkout' }).click()
  await expect(page).toHaveURL(/\/checkout$/)
})
```

## Authentication once

```ts
// auth.setup.ts
import { test as setup } from '@playwright/test'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.E2E_USER!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/dashboard')
  await page.context().storageState({ path: 'playwright/.auth/user.json' })
})
```

```ts
// playwright.config.ts (excerpt)
projects: [
  { name: 'setup', testMatch: /auth\.setup\.ts/ },
  { name: 'chromium', use: { storageState: 'playwright/.auth/user.json' }, dependencies: ['setup'] },
]
```

## Network control

```ts
await page.route('**/api/recommendations', (route) => route.fulfill({ json: [] })) // stub a flaky third party
```

## Debugging

`npx playwright test --ui`, `--debug`, and traces (`trace: 'on-first-retry'`) show every action, DOM
snapshot and network request of a failed run.
