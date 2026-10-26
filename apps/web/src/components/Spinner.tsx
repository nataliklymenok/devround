import styles from './components.module.css'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className={styles.center} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.muted}>{label}</span>
    </div>
  )
}
