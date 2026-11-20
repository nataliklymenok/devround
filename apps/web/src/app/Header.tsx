import type { User } from '@devround/shared'
import { NavLink, useNavigate } from 'react-router'
import { useSignOut } from '../features/auth/hooks'
import styles from './Header.module.css'

export function Header({ user }: { user: User }) {
  const signOut = useSignOut()
  const navigate = useNavigate()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/dashboard" className={styles.brand}>
          DevRound
        </NavLink>
        <nav aria-label="Main" className={styles.nav}>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/plan">My plan</NavLink>
        </nav>
        <div className={styles.user}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className={styles.avatar}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={styles.avatar} aria-hidden="true">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className={styles.name}>{user.name}</span>
          <button
            type="button"
            className="button button-secondary"
            disabled={signOut.isPending}
            onClick={() =>
              signOut.mutate(undefined, { onSettled: () => navigate('/', { replace: true }) })
            }
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
