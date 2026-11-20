import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import styles from './Layout.module.css'

export function Layout({ header }: { header?: ReactNode }) {
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      {header}
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
