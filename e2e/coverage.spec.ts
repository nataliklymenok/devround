import { expect, test } from '@playwright/test'
import { createPlan, signIn, uniqueEmail } from './helpers'

test('setup recommends technologies often asked together and adds them in one click', async ({ page }) => {
  await page.goto('/')
  await signIn(page, uniqueEmail('recommend'))
  await page.getByRole('radio', { name: 'Middle' }).check()
  await page.getByRole('checkbox', { name: 'React' }).check()

  const hint = page.getByRole('note')
  await expect(hint).toContainText('Often asked together with your selection: JavaScript')
  await hint.getByRole('button', { name: 'Add it' }).click()
  await expect(page.getByRole('checkbox', { name: 'JavaScript' })).toBeChecked()
  await expect(page.getByRole('note')).toHaveCount(0)
})

test('lessons show further reading and the draft badge', async ({ page }) => {
  await page.goto('/')
  await signIn(page, uniqueEmail('reading'))
  await createPlan(page, 'Middle', ['JavaScript'])
  await expect(page.getByText('Draft', { exact: true })).toHaveCount(1) // only js-values is a draft

  await page.goto('/lessons/js-values')
  await expect(page.getByText('Draft — not yet reviewed')).toBeVisible()
  const reading = page.getByRole('region', { name: 'Further reading' })
  const link = reading.getByRole('link', { name: /MDN/ })
  await expect(link).toHaveAttribute('href', 'https://developer.mozilla.org/')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')

  await page.goto('/lessons/js-scope')
  await expect(page.getByRole('heading', { level: 1, name: 'Js Scope' })).toBeVisible()
  await expect(page.getByText('Draft — not yet reviewed')).toHaveCount(0)
})
