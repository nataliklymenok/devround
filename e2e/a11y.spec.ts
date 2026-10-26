import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { createPlan, signIn, uniqueEmail } from './helpers'

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(
    serious.map(
      (v) =>
        `${v.id}: ${v.help} — ${v.nodes.map((n) => n.failureSummary?.split('\n').slice(1, 2).join('') + ' @ ' + n.target.join(' ')).join('; ')}`,
    ),
  ).toEqual([])
}

for (const scheme of ['light', 'dark'] as const) {
  test(`pages have no serious WCAG A/AA violations (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expectNoSeriousViolations(page)

    await signIn(page, uniqueEmail(`a11y-${scheme}`))
    await expect(page.getByRole('heading', { name: 'Choose your interview' })).toBeVisible()
    await expectNoSeriousViolations(page)

    await createPlan(page, 'Middle', ['React'])
    await expectNoSeriousViolations(page)

    await page.goto('/lessons/react-jsx')
    await expect(page.getByRole('heading', { level: 1, name: 'React Jsx' })).toBeVisible()
    await expectNoSeriousViolations(page)

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Your interview prep' })).toBeVisible()
    await expectNoSeriousViolations(page)
  })
}

test('quiz can be completed with the keyboard only', async ({ page }) => {
  await page.goto('/')
  await signIn(page, uniqueEmail('keyboard'))
  await createPlan(page, 'Middle', ['React'])
  await page.goto('/lessons/react-props')
  await expect(page.getByRole('heading', { level: 1, name: 'React Props' })).toBeVisible()

  // Focus the first option of question 1, then use Tab / arrow keys like a keyboard user.
  await page.locator('form fieldset').first().getByLabel('Right', { exact: true }).focus()
  await page.keyboard.press('Space') // q1 → option 0 (Right)
  await page.keyboard.press('Tab') // → q2 group
  await page.keyboard.press('ArrowDown') // q2 → option 1 (Right)
  await page.keyboard.press('Tab') // → q3 group
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown') // q3 → option 2 (Right)
  await page.keyboard.press('Tab') // → submit
  await expect(page.getByRole('button', { name: 'Check answers' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status').filter({ hasText: 'You scored 100%' })).toBeVisible()
})
