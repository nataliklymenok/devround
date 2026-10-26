import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../../api/client'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { Markdown } from '../../components/Markdown'
import { Spinner } from '../../components/Spinner'
import { useLesson } from './hooks'
import { Quiz } from './Quiz'
import styles from './lesson.module.css'

export function LessonPage() {
  const { lessonId = '' } = useParams()
  return <LessonContent key={lessonId} lessonId={lessonId} />
}

function LessonContent({ lessonId }: { lessonId: string }) {
  const lesson = useLesson(lessonId)
  const [finished, setFinished] = useState(false)

  if (lesson.isPending) return <Spinner label="Loading lesson…" />
  if (lesson.isError) {
    const status = lesson.error instanceof ApiError ? lesson.error.status : 0
    if (status === 404 || status === 410) {
      return (
        <EmptyState
          title={status === 410 ? 'This lesson is no longer available' : 'Lesson not found'}
        >
          <p>It is not part of your current plan.</p>
          <Link to="/plan" className="button">
            Back to my plan
          </Link>
        </EmptyState>
      )
    }
    return <ErrorState message="We could not load this lesson." onRetry={() => lesson.refetch()} />
  }

  const data = lesson.data
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          {data.technology} · {data.moduleTitle} · Lesson {data.order}
        </p>
        <h1 className={styles.title}>{data.title}</h1>
        <p className={styles.muted}>
          {data.estimatedMinutes} min
          {data.progress.completed &&
            ` · Completed${data.progress.bestScore !== null ? ` · best score ${data.progress.bestScore}%` : ''}`}
        </p>
      </header>

      <Markdown>{data.body}</Markdown>

      <section aria-labelledby="takeaways" className={styles.section}>
        <h2 id="takeaways">Key takeaways</h2>
        <ul className={styles.takeaways}>
          {data.keyTakeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="interview" className={styles.section}>
        <h2 id="interview">Interview questions</h2>
        <p className={styles.muted}>
          Try answering out loud first, then compare with the model answer.
        </p>
        {data.interviewQuestions.map((q) => (
          <details key={q.question} className={styles.details}>
            <summary>{q.question}</summary>
            <Markdown>{q.answer}</Markdown>
          </details>
        ))}
      </section>

      <section aria-labelledby="quiz" className={styles.section}>
        <h2 id="quiz">Check yourself</h2>
        <Quiz lessonId={data.id} quiz={data.quiz} onResult={() => setFinished(true)} />
      </section>

      <nav className={styles.pager} aria-label="Lesson navigation">
        {data.prevLessonId ? (
          <Link to={`/lessons/${data.prevLessonId}`} className="button button-secondary">
            ← Previous lesson
          </Link>
        ) : (
          <span />
        )}
        {data.nextLessonId ? (
          <Link
            to={`/lessons/${data.nextLessonId}`}
            className={finished ? 'button' : 'button button-secondary'}
          >
            Next lesson →
          </Link>
        ) : (
          <Link to="/dashboard" className="button button-secondary">
            Back to dashboard
          </Link>
        )}
      </nav>
    </article>
  )
}
