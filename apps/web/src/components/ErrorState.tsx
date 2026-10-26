import styles from './components.module.css'

interface Props {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: Props) {
  return (
    <div className={styles.panel} role="alert">
      <h2 className={styles.panelTitle}>{title}</h2>
      <p className={styles.muted}>{message}</p>
      {onRetry && (
        <button type="button" className="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
