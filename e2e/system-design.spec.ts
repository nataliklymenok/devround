import { expect, test } from '@playwright/test'
import { createPlan, signIn, uniqueEmail } from './helpers'

test('design exercise: prompt and timebox, reveal sections one by one, self-assessment keeps the best score (V13)', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page, uniqueEmail('design'))
  await createPlan(page, 'Middle', ['JavaScript'])

  const section = page.getByRole('region', { name: 'System design' })
  await expect(section.getByRole('link')).toHaveText(['Design an autocomplete', 'Design a news feed'])

  const start = Date.now()
  await section.getByRole('link', { name: 'Design an autocomplete' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Design an autocomplete' })).toBeVisible()
  expect(Date.now() - start).toBeLessThan(2000) // SC-006

  await expect(page.getByText('45 min timebox')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible()
  await expect(page.getByText('requirements notes')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Reveal / })).toHaveCount(8)

  await page.getByRole('button', { name: 'Reveal Requirements' }).click()
  await expect(page.getByText('Design an autocomplete: requirements notes.')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Reveal / })).toHaveCount(7)

  const checks = page.getByRole('checkbox')
  for (let i = 0; i < 6; i++) await checks.nth(i).check()
  await page.getByRole('button', { name: 'Save self-assessment' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'You covered' })).toHaveText('You covered 6 of 8 (75%) · best 75%')

  for (let i = 1; i < 6; i++) await checks.nth(i).uncheck()
  await page.getByRole('button', { name: 'Save self-assessment' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'You covered' })).toHaveText('You covered 1 of 8 (13%) · best 75%')

  await page.reload()
  await expect(page.getByText('Best self-assessment 75%')).toBeVisible()
  await expect(page.getByText('Design an autocomplete: requirements notes.')).toBeVisible() // revealed state persists

  await page.goto('/plan')
  await expect(page.getByRole('region', { name: 'System design' }).getByText('Done · 75%')).toBeVisible()
})
