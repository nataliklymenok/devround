import { expect, test, type Page } from '@playwright/test'
import { createPlan, signIn, uniqueEmail } from './helpers'

const DEBOUNCE = `function debounce(fn, wait) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}`

async function openTask(page: Page, id: string, title: string) {
  await page.goto(`/tasks/${id}`)
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
}

async function replaceCode(page: Page, code: string) {
  const editor = page.locator('.cm-content')
  await editor.click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.press('Backspace')
  await page.keyboard.insertText(code)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await signIn(page, uniqueEmail('coding'))
  await createPlan(page, 'Middle', ['JavaScript', 'React'])
})

test('statement without hints or solution; failing then passing checks (V6, V7, SC-007)', async ({ page }) => {
  const taskStart = Date.now()
  await openTask(page, 'js-debounce-fx', 'Implement debounce')
  expect(Date.now() - taskStart).toBeLessThan(2000) // SC-006
  await expect(page.getByText('Keep the timer id in a closure.')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Reveal solution' })).toBeVisible()

  await page.getByRole('button', { name: 'Run checks' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'tests passed' })).toHaveText('0/5 tests passed')

  await replaceCode(page, DEBOUNCE)
  const start = Date.now()
  await page.getByRole('button', { name: 'Run checks' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'tests passed' })).toHaveText('✓ 5/5 tests passed')
  expect(Date.now() - start).toBeLessThan(3000)
  await expect(page.getByText('All checks passed without help')).toBeVisible()
  await page.getByRole('button', { name: 'Solved on my own' }).click()
  await expect(page.getByRole('button', { name: 'Solved on my own' })).toHaveAttribute('aria-pressed', 'true')
})

test('an infinite loop is stopped and the page stays responsive (V8)', async ({ page }) => {
  await openTask(page, 'js-debounce-fx', 'Implement debounce')
  await replaceCode(page, 'function debounce() {}\nwhile (true) {}')
  const start = Date.now()
  await page.getByRole('button', { name: 'Run checks' }).click()
  await expect(page.getByRole('alert')).toContainText('Timed out after 5 s', { timeout: 8000 })
  expect(Date.now() - start).toBeLessThan(6000)
  await page.getByRole('button', { name: 'Show hint 1 of 2' }).click() // UI still responsive
  await expect(page.getByText('Keep the timer id in a closure.')).toBeVisible()
})

test('user code cannot reach the session, storage or the network (V9)', async ({ page }) => {
  await openTask(page, 'js-debounce-fx', 'Implement debounce')
  const apiCalls: string[] = []
  page.on('request', (req) => {
    if (req.url().includes('/api/v1/me')) apiCalls.push(req.url())
  })
  await replaceCode(
    page,
    `${DEBOUNCE}
console.log('document: ' + (typeof document === 'undefined' ? 'unavailable' : document.cookie))
console.log('localStorage: ' + (typeof localStorage === 'undefined' ? 'unavailable' : 'AVAILABLE'))
try { await fetch('/api/v1/me'); console.log('fetch: ALLOWED') } catch { console.log('fetch: blocked') }`,
  )
  await page.getByRole('button', { name: 'Run checks' }).click()
  await page.getByText(/^Console output/).click()
  const consoleOutput = page.locator('details', { hasText: 'Console output' }).locator('pre')
  await expect(consoleOutput).toContainText('document: unavailable')
  await expect(consoleOutput).toContainText('localStorage: unavailable')
  await expect(consoleOutput).toContainText('fetch: blocked')
  await expect(consoleOutput).not.toContainText('ALLOWED')
  expect(apiCalls).toEqual([])
})

test('revealing a hint disables "Solved on my own" (V10)', async ({ page }) => {
  await openTask(page, 'js-debounce-fx', 'Implement debounce')
  await page.getByRole('button', { name: 'Show hint 1 of 2' }).click()
  await expect(page.getByText('Keep the timer id in a closure.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Solved on my own' })).toBeDisabled()
  await page.getByRole('button', { name: 'Solved with hints' }).click()
  await expect(page.getByRole('button', { name: 'Solved with hints' })).toHaveAttribute('aria-pressed', 'true')
})

test('drafts are restored after reload and Start over restores the starter code (V11)', async ({ page }) => {
  await openTask(page, 'js-debounce-fx', 'Implement debounce')
  const saved = page.waitForResponse((r) => r.url().endsWith('/draft') && r.status() === 204)
  await replaceCode(page, '// my draft\nfunction debounce() {}')
  await saved
  await page.reload()
  await expect(page.locator('.cm-content')).toContainText('// my draft')

  await page.getByRole('button', { name: 'Start over' }).click()
  await expect(page.locator('.cm-content')).toContainText('// your code')
  await expect(page.locator('.cm-content')).not.toContainText('// my draft')
})

test('React tasks are solved outside the app (V12)', async ({ page }) => {
  await openTask(page, 'react-counter-fx', 'Build a counter component')
  await expect(page.locator('.cm-content')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Run checks' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Copy starter code' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Increment and decrement buttons work' })).toBeVisible()
})

test('the plan lists live coding tasks with their status', async ({ page }) => {
  await page.goto('/plan')
  const section = page.getByRole('region', { name: 'Live coding' })
  await expect(section.getByRole('link')).toHaveText(['Sum an array', 'Implement debounce', 'Build a counter component'])
  await expect(section.getByText('auto-checked').first()).toBeVisible()
})
