import { buildApp } from './app.js'
import { FakeGoogleVerifier } from './auth/fake-google-verifier.js'
import { GoogleIdTokenVerifier } from './auth/google-verifier.js'
import { loadConfig } from './config.js'
import { createDb } from './db.js'

const config = loadConfig()
const db = createDb(config.DATABASE_URL)
const verifier =
  config.AUTH_PROVIDER === 'fake'
    ? new FakeGoogleVerifier()
    : new GoogleIdTokenVerifier(config.GOOGLE_CLIENT_ID!)

const app = await buildApp({ config, db, verifier })

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await app.close()
    await db.$disconnect()
    process.exit(0)
  })
}

await app.listen({ port: config.PORT, host: '0.0.0.0' })
