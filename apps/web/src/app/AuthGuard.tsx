import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { UNAUTHENTICATED_EVENT } from '../api/client'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'
import { meKey, useMe } from '../features/auth/hooks'
import { Header } from './Header'
import { Layout } from './Layout'

function signInPath(location: { pathname: string; search: string }) {
  return `/?returnTo=${encodeURIComponent(location.pathname + location.search)}`
}

/** Guards personal pages: signed-out users (including on any 401) go to sign-in and come back. */
export function AuthGuard() {
  const me = useMe()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const onUnauthenticated = () => {
      queryClient.setQueryData(meKey, null)
      navigate(signInPath(window.location), { replace: true })
    }
    window.addEventListener(UNAUTHENTICATED_EVENT, onUnauthenticated)
    return () => window.removeEventListener(UNAUTHENTICATED_EVENT, onUnauthenticated)
  }, [navigate, queryClient])

  if (me.isPending) return <Spinner />
  if (me.isError) {
    return <ErrorState message="We could not load your account." onRetry={() => me.refetch()} />
  }
  if (!me.data) return <Navigate to={signInPath(location)} replace />

  return <Layout header={<Header user={me.data.user} />} />
}
