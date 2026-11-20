import type { ReactNode } from 'react'
import styles from './components.module.css'

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      {children}
    </div>
  )
}
