import { useEffect, useState } from 'react'
import styles from './exercise.module.css'

const format = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/** Optional practice timer for the exercise timebox. */
export function Timebox({ minutes }: { minutes: number }) {
  const [remaining, setRemaining] = useState(minutes * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  const finished = remaining === 0
  return (
    <div className={styles.timer}>
      <span className={styles.time} aria-label={`Time left ${format(remaining)}`}>
        {finished ? 'Time is up' : format(remaining)}
      </span>
      <button
        type="button"
        className="button button-secondary"
        onClick={() => setRunning((r) => !r)}
        disabled={finished}
      >
        {running ? 'Pause' : remaining === minutes * 60 ? 'Start timer' : 'Resume'}
      </button>
      <button
        type="button"
        className="button button-secondary"
        onClick={() => {
          setRunning(false)
          setRemaining(minutes * 60)
        }}
      >
        Reset
      </button>
    </div>
  )
}
