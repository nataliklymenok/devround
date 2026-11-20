import { OAuth2Client } from 'google-auth-library'

export interface VerifiedGoogleUser {
  sub: string
  email: string
  name: string
  avatarUrl: string | null
}

/** Verifies a Google Identity Services ID token; returns null when the token is not acceptable. */
export interface GoogleTokenVerifier {
  verify(credential: string): Promise<VerifiedGoogleUser | null>
}

export class GoogleIdTokenVerifier implements GoogleTokenVerifier {
  private readonly client: OAuth2Client

  constructor(private readonly clientId: string) {
    this.client = new OAuth2Client(clientId)
  }

  async verify(credential: string): Promise<VerifiedGoogleUser | null> {
    try {
      // Checks signature, expiry, audience and issuer (accounts.google.com).
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.clientId,
      })
      const payload = ticket.getPayload()
      if (!payload?.sub || !payload.email || payload.email_verified !== true) return null
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? null,
      }
    } catch {
      return null
    }
  }
}
