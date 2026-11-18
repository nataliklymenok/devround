import styles from './components.module.css'

/** Marks content that has not been reviewed by a person yet (Constitution IV). */
export function DraftBadge({ long = false }: { long?: boolean }) {
  return (
    <span className={styles.draftBadge} title="Drafted content that has not been reviewed yet">
      {long ? 'Draft — not yet reviewed' : 'Draft'}
    </span>
  )
}
