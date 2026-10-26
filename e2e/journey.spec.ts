import { expect, test } from '@playwright/test'
import { answerQuiz, createPlan, signIn, uniqueEmail } from './helpers'

test('critical journey: sign in → setup → plan → lesson → quiz → dashboard → sign out', async ({
  page,
}) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/\?returnTo=%2Fdashboard/) // V1: signed-out users go to sign-in

  await signIn(page, uniqueEmail('journey'))
  await expect(page).toHaveURL(/\/dashboard$/) // returnTo honoured
  await expect(
    page.getByRole('heading', { name: "Let's set up your interview prep" }),
  ).toBeVisible()

  // US2 — plan shown within 2 s (SC-002)
  await page.goto('/setup')
  await expect(page.getByRole('button', { name: 'Create my plan' })).toBeDisabled()
  await expect(page.getByText('Choose a level, at least one technology to continue.')).toBeVisible()
  await page.getByRole('radio', { name: 'Middle' }).check()
  await page.getByRole('checkbox', { name: 'React' }).check()
  const planStart = Date.now()
  await page.getByRole('button', { name: 'Create my plan' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Your plan: React' })).toBeVisible()
  expect(Date.now() - planStart).toBeLessThan(2000)
  await expect(page.getByText('6 lessons')).toBeVisible()

  // US3 — lesson shown within 2 s (SC-003)
  const lessonStart = Date.now()
  await page.getByRole('link', { name: 'React Jsx' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'React Jsx' })).toBeVisible()
  expect(Date.now() - lessonStart).toBeLessThan(2000)
  await expect(page.getByRole('button', { name: 'Check answers' })).toBeDisabled()

  await answerQuiz(page, ['Right', 'Right', 'Right'])
  await page.getByRole('button', { name: 'Check answers' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'You scored 100%' })).toBeVisible()
  await expect(page.getByText('The first option is right.')).toBeVisible()

  // US4 — dashboard reflects the result
  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByText('2 of 6 lessons completed')).toBeHidden()
  await expect(page.getByText('17%')).toBeVisible()
  await expect(page.getByText('1 of 6 lessons completed')).toBeVisible()
  await page.getByRole('link', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'React Props' })).toBeVisible()

  // US1 — sign out
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/returnTo=/)
})

test('session expiry mid-quiz: sign in again returns to the lesson with answers restored', async ({
  page,
  context,
}) => {
  const email = uniqueEmail('expiry')
  await page.goto('/')
  await signIn(page, email)
  await createPlan(page, 'Junior', ['JavaScript'])
  await page.goto('/lessons/js-scope')
  await expect(page.getByRole('heading', { level: 1, name: 'Js Scope' })).toBeVisible()
  await answerQuiz(page, ['Right', 'Wrong'])

  await context.clearCookies()
  await page.reload()
  await expect(page).toHaveURL(/returnTo=%2Flessons%2Fjs-scope/)
  await expect(page.getByText('Your session has ended')).toBeVisible()

  await signIn(page, email)
  await expect(page).toHaveURL(/\/lessons\/js-scope$/)
  const groups = page.locator('form fieldset')
  await expect(groups.nth(0).getByLabel('Right', { exact: true })).toBeChecked()
  await expect(groups.nth(1).getByLabel('Wrong', { exact: true })).toBeChecked()
})

test('replacing a plan archives the old one and keeps completed lessons', async ({ page }) => {
  await page.goto('/')
  await signIn(page, uniqueEmail('replace'))
  await createPlan(page, 'Middle', ['JavaScript'])
  await page.goto('/lessons/js-values')
  await answerQuiz(page, ['Right', 'Right', 'Right'])
  await page.getByRole('button', { name: 'Check answers' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'You scored' })).toBeVisible()

  await page.goto('/setup')
  await page.getByRole('radio', { name: 'Junior' }).check()
  await page.getByRole('checkbox', { name: 'JavaScript' }).check()
  await page.getByRole('checkbox', { name: 'React' }).check()
  await page.getByRole('button', { name: 'Create my plan' }).click()
  await expect(page.getByRole('dialog', { name: 'Replace your current plan?' })).toBeVisible()
  await page.getByRole('button', { name: 'Replace plan' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Your plan: JavaScript, React' }),
  ).toBeVisible()
  await expect(page.getByText('Completed · 100%')).toBeVisible() // progress carries over (FR-015)
})
