import type { GoogleTokenVerifier, VerifiedGoogleUser } from './google-verifier.js'

/** Test/dev verifier: accepts `test:<email>` tokens. Never enabled in production (config.ts). */
export class FakeGoogleVerifier implements GoogleTokenVerifier {
  async verify(credential: string): Promise<VerifiedGoogleUser | null> {
    const match = /^test:([^@\s]+@[^@\s]+)$/.exec(credential)
    if (!match) return null
    const email = match[1]!.toLowerCase()
    return { sub: `fake-${email}`, email, name: email.split('@')[0]!, avatarUrl: null }
  }
}
