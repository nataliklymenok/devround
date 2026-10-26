import { defineConfig } from 'vitest/config'

try {
  process.loadEnvFile('.env')
} catch {
  // CI provides env vars directly
}

export default defineConfig({
  test: {
    globalSetup: ['./tests/global-setup.ts'],
    // Integration tests share one PostgreSQL test database.
    fileParallelism: false,
  },
})
