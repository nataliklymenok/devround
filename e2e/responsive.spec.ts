import { expect, test } from '@playwright/test'
import { createPlan, signIn, uniqueEmail } from './helpers'

for (const width of [360, 1280]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    const pages: [string, RegExp | string][] = []

    const assertFits = async (name: string) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${name} overflows by ${overflow}px`).toBeLessThanOrEqual(0)
      pages.push([name, page.url()])
    }

    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await assertFits('landing')

    await signIn(page, uniqueEmail(`resp-${width}`))
    await expect(page.getByRole('heading', { name: 'Choose your interview' })).toBeVisible()
    await assertFits('setup')

    await createPlan(page, 'Middle', ['JavaScript', 'React'])
    await assertFits('plan')

    await page.goto('/lessons/js-values')
    await expect(page.getByRole('heading', { level: 1, name: 'Js Values' })).toBeVisible()
    await assertFits('lesson')

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Your interview prep' })).toBeVisible()
    await assertFits('dashboard')

    await page.goto('/tasks/js-debounce-fx')
    await expect(page.locator('.cm-content')).toBeVisible()
    await page.getByRole('button', { name: 'Run checks' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'tests passed' })).toBeVisible()
    await assertFits('task')

    await page.goto('/exercises/sd-fx-autocomplete')
    await page.getByRole('button', { name: 'Reveal Requirements' }).click()
    await expect(page.getByText('requirements notes')).toBeVisible()
    await assertFits('exercise')
    expect(pages).toHaveLength(7)
  })
}
