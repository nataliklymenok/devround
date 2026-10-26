import { useEffect, useRef, useState, type FormEvent } from 'react'
import styles from './auth.module.css'

interface GoogleId {
  initialize(options: { client_id: string; callback: (r: { credential: string }) => void }): void
  renderButton(el: HTMLElement, options: Record<string, string | number>): void
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } }
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
export const fakeAuth = import.meta.env.VITE_FAKE_AUTH === 'true'

let gisPromise: Promise<GoogleId> | null = null

function loadGis(): Promise<GoogleId> {
  gisPromise ??= new Promise((resolve, reject) => {
    if (window.google) return resolve(window.google.accounts.id)
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = () =>
      window.google ? resolve(window.google.accounts.id) : reject(new Error('GIS unavailable'))
    script.onerror = () => {
      gisPromise = null
      reject(new Error('Could not load Google sign-in'))
    }
    document.head.appendChild(script)
  })
  return gisPromise
}

interface Props {
  onCredential: (credential: string) => void
  onError: (message: string) => void
  disabled?: boolean
}

export function GoogleSignInButton(props: Props) {
  return fakeAuth ? <DevSignIn {...props} /> : <GoogleButton {...props} />
}

function GoogleButton({ onCredential, onError }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const callback = useRef(onCredential)

  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!clientId) {
      onError('Google sign-in is not configured (VITE_GOOGLE_CLIENT_ID).')
      return
    }
    let cancelled = false
    loadGis()
      .then((gis) => {
        if (cancelled || !ref.current) return
        gis.initialize({ client_id: clientId, callback: (r) => callback.current(r.credential) })
        gis.renderButton(ref.current, { theme: 'outline', size: 'large', text: 'signin_with', width: 280 })
      })
      .catch(() => onError('Could not load Google sign-in. Check your connection and try again.'))
    return () => {
      cancelled = true
    }
  }, [onError])

  return <div ref={ref} className={styles.googleButton} />
}

function DevSignIn({ onCredential, disabled }: Props) {
  const [email, setEmail] = useState('dev@example.com')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onCredential(`test:${email.trim()}`)
  }
  return (
    <form className={styles.devForm} onSubmit={submit}>
      <label htmlFor="dev-email">Dev sign-in (fake auth)</label>
      <div className={styles.devRow}>
        <input
          id="dev-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="button" disabled={disabled}>
          Sign in
        </button>
      </div>
    </form>
  )
}
