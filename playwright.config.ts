import { defineConfig, devices } from '@playwright/test'

try {
  process.loadEnvFile('apps/api/.env')
} catch {
  // CI provides env vars directly
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL
if (!testDatabaseUrl) throw new Error('TEST_DATABASE_URL is required for E2E tests')

const API_PORT = 3100
const WEB_PORT = 5174
const WEB_ORIGIN = `http://localhost:${WEB_PORT}`

const apiEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: testDatabaseUrl,
  AUTH_PROVIDER: 'fake',
  WEB_ORIGIN,
  PORT: String(API_PORT),
  // A full run signs in dozens of times per minute from one IP; production limits would throttle it.
  RATE_LIMIT_PER_MINUTE: '10000',
  AUTH_RATE_LIMIT_PER_MINUTE: '10000',
}

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: WEB_ORIGIN,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // The code runner sandbox must work in every engine (research R5, feature 002)
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /live-coding\.spec\.ts/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: /live-coding\.spec\.ts/ },
  ],
  webServer: [
    {
      // Reset the test database with fixture content, then start the API with fake auth.
      command: 'npm run e2e:reset -w @devround/api && npx tsx apps/api/src/server.ts',
      cwd: '.',
      env: { ...apiEnv, CONTENT_DIR: 'apps/api/tests/fixtures/content' },
      url: `http://localhost:${API_PORT}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npm run dev -w @devround/web -- --port ${WEB_PORT} --strictPort`,
      env: { VITE_FAKE_AUTH: 'true', VITE_API_PROXY: `http://localhost:${API_PORT}` },
      url: WEB_ORIGIN,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
