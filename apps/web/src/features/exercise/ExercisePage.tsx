import type { ExerciseView } from '@devround/shared'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../../api/client'
import { DraftBadge } from '../../components/DraftBadge'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { Markdown } from '../../components/Markdown'
import { Spinner } from '../../components/Spinner'
import { useAssessExercise, useExercise, useRevealSection } from './hooks'
import { Timebox } from './Timebox'
import styles from './exercise.module.css'

export function ExercisePage() {
  const { exerciseId = '' } = useParams()
  return <ExerciseContent key={exerciseId} exerciseId={exerciseId} />
}

function ExerciseContent({ exerciseId }: { exerciseId: string }) {
  const exercise = useExercise(exerciseId)

  if (exercise.isPending) return <Spinner label="Loading exercise…" />
  if (exercise.isError) {
    const status = exercise.error instanceof ApiError ? exercise.error.status : 0
    if (status === 404 || status === 410) {
      return (
        <EmptyState
          title={status === 410 ? 'This exercise is no longer available' : 'Exercise not found'}
        >
          <p>It is not part of your current plan.</p>
          <Link to="/plan" className="button">
            Back to my plan
          </Link>
        </EmptyState>
      )
    }
    return (
      <ErrorState message="We could not load this exercise." onRetry={() => exercise.refetch()} />
    )
  }
  return <ExerciseWorkspace exercise={exercise.data} />
}

function ExerciseWorkspace({ exercise }: { exercise: ExerciseView }) {
  const reveal = useRevealSection(exercise.id)
  const assess = useAssessExercise(exercise.id)
  const [covered, setCovered] = useState<string[]>(exercise.progress.lastCovered)

  const toggle = (id: string) =>
    setCovered((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    assess.mutate(covered)
  }

  return (
    <article className={styles.page}>
      <header>
        <p className={styles.eyebrow}>System design · {exercise.timeboxMinutes} min timebox</p>
        <h1 className={styles.title}>{exercise.title}</h1>
        <div className={styles.badges}>
          {exercise.isDraft && <DraftBadge long />}
          {exercise.progress.bestScore !== null && (
            <span className={styles.scoreBadge}>
              Best self-assessment {exercise.progress.bestScore}%
            </span>
          )}
        </div>
      </header>

      <section aria-labelledby="prompt" className={styles.prompt}>
        <h2 id="prompt">The prompt</h2>
        <Markdown>{exercise.prompt}</Markdown>
        <p className={styles.muted}>
          Try it yourself first: talk through requirements, architecture and trade-offs within the
          timebox, then compare with the walkthrough.
        </p>
        <Timebox minutes={exercise.timeboxMinutes} />
      </section>

      <section aria-labelledby="walkthrough" className={styles.section}>
        <h2 id="walkthrough">Walkthrough</h2>
        <ol className={styles.sections}>
          {exercise.sections.map((section, index) => (
            <li key={section.key} className={styles.sectionItem}>
              <h3>
                {index + 1}. {section.title}
              </h3>
              {section.body !== null ? (
                <Markdown>{section.body}</Markdown>
              ) : (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => reveal.mutate(section.key)}
                  disabled={reveal.isPending}
                  aria-label={`Reveal ${section.title}`}
                >
                  Reveal
                </button>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="assessment" className={styles.section}>
        <h2 id="assessment">Self-assessment</h2>
        <p className={styles.muted}>Tick everything your answer covered.</p>
        <form onSubmit={submit} className={styles.checklist}>
          {exercise.checklist.map((item) => (
            <label key={item.id}>
              <input
                type="checkbox"
                checked={covered.includes(item.id)}
                onChange={() => toggle(item.id)}
              />{' '}
              {item.text}
            </label>
          ))}
          <div className={styles.actions}>
            <button type="submit" className="button" disabled={assess.isPending}>
              {assess.isPending ? 'Saving…' : 'Save self-assessment'}
            </button>
            {assess.data && (
              <p role="status" className={styles.result}>
                You covered {assess.data.coveredCount} of {assess.data.total} ({assess.data.score}%)
                · best {assess.data.progress.bestScore}%
              </p>
            )}
            {assess.isError && (
              <p role="alert" className={styles.error}>
                Could not save your self-assessment. Please try again.
              </p>
            )}
          </div>
        </form>
      </section>

      {exercise.references.length > 0 && (
        <section aria-labelledby="exercise-reading" className={styles.section}>
          <h2 id="exercise-reading">Further reading</h2>
          <ul>
            {exercise.references.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.title}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className={styles.pager} aria-label="Exercise navigation">
        {exercise.prevExerciseId ? (
          <Link to={`/exercises/${exercise.prevExerciseId}`} className="button button-secondary">
            ← Previous exercise
          </Link>
        ) : (
          <span />
        )}
        {exercise.nextExerciseId ? (
          <Link to={`/exercises/${exercise.nextExerciseId}`} className="button button-secondary">
            Next exercise →
          </Link>
        ) : (
          <Link to="/plan" className="button button-secondary">
            Back to plan
          </Link>
        )}
      </nav>
    </article>
  )
}
