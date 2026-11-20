import styles from './components.module.css'

interface Props {
  value: number
  max?: number
  label: string
}

export function ProgressBar({ value, max = 100, label }: Props) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${percent}%`}
    >
      <div className={styles.progressFill} style={{ width: `${percent}%` }} />
    </div>
  )
}
