import { defineConfig } from 'prisma/config'

try {
  process.loadEnvFile('.env')
} catch {
  // .env is optional (CI provides env vars directly)
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // url is optional for `prisma generate`; migrate commands require DATABASE_URL
  datasource: { url: process.env.DATABASE_URL },
})
