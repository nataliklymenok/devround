import { expect, type Page } from '@playwright/test'

let counter = 0

/** A unique email per test so tests never share accounts. */
export function uniqueEmail(prefix = 'e2e'): string {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}@example.com`
}

export async function signIn(page: Page, email: string) {
  await page.getByLabel('Dev sign-in (fake auth)').fill(email)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // Wait until the app has navigated away from the sign-in form (session cookie is set).
  await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCount(0)
}

export async function createPlan(page: Page, level: string, technologies: string[]) {
  await page.goto('/setup')
  await page.getByRole('radio', { name: level }).check()
  for (const t of technologies) await page.getByRole('checkbox', { name: t }).check()
  await page.getByRole('button', { name: 'Create my plan' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Your plan/ })).toBeVisible()
}

/** Fixture quizzes: question 1 → "Right" is option 0, 2 → option 1, 3 → option 2. */
export async function answerQuiz(page: Page, labels: string[]) {
  const groups = page.locator('form fieldset')
  for (const [i, label] of labels.entries()) {
    await groups.nth(i).getByLabel(label, { exact: true }).check()
  }
}
