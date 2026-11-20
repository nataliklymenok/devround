import { execFileSync } from 'node:child_process'

/** Apply migrations to the dedicated test database before the suite runs. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error('TEST_DATABASE_URL is not set (see apps/api/.env.example)')
  if (!/test/i.test(url)) throw new Error('TEST_DATABASE_URL must point to a *test* database')
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  })
}
