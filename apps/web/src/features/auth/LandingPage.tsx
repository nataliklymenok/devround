import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { Spinner } from '../../components/Spinner'
import styles from './auth.module.css'
import { GoogleSignInButton } from './GoogleSignInButton'
import { safeReturnTo, useMe, useSignIn } from './hooks'

const FEATURES = [
  ['Pick your interview', 'Junior, Middle or Senior — and the stack you will be asked about.'],
  ['Get a personal plan', 'Lessons from a curated library, ordered from fundamentals to advanced.'],
  ['Practice and track', 'Interview questions, quick quizzes and progress you can see.'],
] as const

export function LandingPage() {
  const me = useMe()
  const signIn = useSignIn()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const returnTo = safeReturnTo(params.get('returnTo'))

  const handleCredential = useCallback(
    (credential: string) => {
      setError(null)
      signIn.mutate(credential, {
        onSuccess: (result) =>
          navigate(returnTo ?? (result.hasActivePlan ? '/dashboard' : '/setup'), { replace: true }),
        onError: () => setError('We could not sign you in with Google. Please try again.'),
      })
    },
    [navigate, returnTo, signIn],
  )

  if (me.isPending) return <Spinner />
  if (me.data && !signIn.isPending && !signIn.isSuccess) {
    return <Navigate to={returnTo ?? (me.data.hasActivePlan ? '/dashboard' : '/setup')} replace />
  }

  return (
    <div className={styles.landing}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>DevRound</p>
        <h1 className={styles.title}>
          Prepare for your next frontend interview, one round at a time.
        </h1>
        <p className={styles.lead}>
          Choose the level and technologies you will be interviewed on. DevRound builds a focused
          plan of lessons, interview questions and self-checks — and keeps track of your progress.
        </p>
        {returnTo && (
          <p className={styles.notice} role="status">
            Your session has ended. Sign in again to continue where you left off.
          </p>
        )}
        <div className={styles.signIn}>
          <GoogleSignInButton
            onCredential={handleCredential}
            onError={setError}
            disabled={signIn.isPending}
          />
          {signIn.isPending && <Spinner label="Signing in…" />}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
      <ul className={styles.features}>
        {FEATURES.map(([title, text]) => (
          <li key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
