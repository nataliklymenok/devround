import { Link } from 'react-router'
import { DraftBadge } from '../../components/DraftBadge'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { ProgressBar } from '../../components/ProgressBar'
import { Spinner } from '../../components/Spinner'
import { useCurrentPlan } from './hooks'
import styles from './plan.module.css'

const TASK_STATUS = {
  solved_own: 'Solved on my own',
  solved_with_hints: 'Solved with hints',
  revisit: 'Revisit',
} as const

const isSolved = (status: keyof typeof TASK_STATUS | null) =>
  status === 'solved_own' || status === 'solved_with_hints'

function formatDuration(minutes: number): string {
  return minutes < 60 ? `${minutes} min` : `about ${Math.round(minutes / 60)} h`
}

export function PlanPage() {
  const plan = useCurrentPlan()

  if (plan.isPending) return <Spinner label="Loading your plan…" />
  if (plan.isError) {
    return <ErrorState message="We could not load your plan." onRetry={() => plan.refetch()} />
  }
  if (!plan.data) {
    return (
      <EmptyState title="You don't have a plan yet">
        <p>Choose the interview you are preparing for and we will build one for you.</p>
        <Link to="/setup" className="button">
          Choose your interview
        </Link>
      </EmptyState>
    )
  }

  const { target, modules } = plan.data
  const lessons = modules.flatMap((m) => m.lessons).filter((l) => l.isAvailable)
  const completed = lessons.filter((l) => l.progress.completed).length
  const minutes = lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            {target.track} · {target.level}
          </p>
          <h1 className={styles.title}>Your plan: {target.technologies.join(', ')}</h1>
          <p className={styles.meta}>
            {lessons.length} lessons · {formatDuration(minutes)} · {completed} completed
          </p>
        </div>
        <Link to="/setup" className="button button-secondary">
          Change interview target
        </Link>
      </header>

      <ol className={styles.modules}>
        {modules.map((module) => {
          const available = module.lessons.filter((l) => l.isAvailable)
          const done = available.filter((l) => l.progress.completed).length
          return (
            <li key={module.id} className={styles.module}>
              <div className={styles.moduleHeader}>
                <div>
                  <span className={styles.tag}>{module.technology}</span>
                  <h2 className={styles.moduleTitle}>{module.title}</h2>
                </div>
                <span className={styles.count}>
                  {done}/{available.length}
                </span>
              </div>
              <ProgressBar value={done} max={available.length} label={`${module.title} progress`} />
              <ol className={styles.lessons}>
                {module.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className={styles.lesson}
                    data-unavailable={!lesson.isAvailable || undefined}
                  >
                    <span className={styles.order}>{lesson.order}</span>
                    <div className={styles.lessonBody}>
                      {lesson.isAvailable ? (
                        <Link to={`/lessons/${lesson.id}`} className={styles.lessonTitle}>
                          {lesson.title}
                        </Link>
                      ) : (
                        <span className={styles.lessonTitle}>{lesson.title}</span>
                      )}
                      <p className={styles.description}>{lesson.description}</p>
                    </div>
                    <div className={styles.status}>
                      {lesson.isDraft && lesson.isAvailable && <DraftBadge />}
                      {!lesson.isAvailable ? (
                        <span className={styles.badge}>No longer available</span>
                      ) : lesson.progress.completed ? (
                        <span className={styles.badge} data-variant="done">
                          Completed
                          {lesson.progress.bestScore !== null && ` · ${lesson.progress.bestScore}%`}
                        </span>
                      ) : (
                        <span className={styles.badge}>Not started</span>
                      )}
                      <span className={styles.minutes}>{lesson.estimatedMinutes} min</span>
                    </div>
                  </li>
                ))}
              </ol>
            </li>
          )
        })}
      </ol>

      {plan.data.tasks.length > 0 && (
        <section className={styles.module} aria-labelledby="live-coding">
          <div className={styles.moduleHeader}>
            <div>
              <span className={styles.tag}>Practice</span>
              <h2 id="live-coding" className={styles.moduleTitle}>
                Live coding
              </h2>
            </div>
            <span className={styles.count}>
              {plan.data.tasks.filter((t) => t.isAvailable && isSolved(t.progress.status)).length}/
              {plan.data.tasks.filter((t) => t.isAvailable).length}
            </span>
          </div>
          <ol className={styles.lessons}>
            {plan.data.tasks.map((task) => (
              <li
                key={task.id}
                className={styles.lesson}
                data-unavailable={!task.isAvailable || undefined}
              >
                <span className={styles.order}>{task.order}</span>
                <div className={styles.lessonBody}>
                  {task.isAvailable ? (
                    <Link to={`/tasks/${task.id}`} className={styles.lessonTitle}>
                      {task.title}
                    </Link>
                  ) : (
                    <span className={styles.lessonTitle}>{task.title}</span>
                  )}
                  <p className={styles.description}>
                    {task.technology} · {task.difficulty} ·{' '}
                    {task.mode === 'tests' ? 'auto-checked' : 'self-check'}
                    {task.progress.lastCheck &&
                      ` · last run ${task.progress.lastCheck.passed}/${task.progress.lastCheck.total}`}
                  </p>
                </div>
                <div className={styles.status}>
                  {task.isDraft && task.isAvailable && <DraftBadge />}
                  {!task.isAvailable ? (
                    <span className={styles.badge}>No longer available</span>
                  ) : task.progress.status ? (
                    <span
                      className={styles.badge}
                      data-variant={isSolved(task.progress.status) ? 'done' : undefined}
                    >
                      {TASK_STATUS[task.progress.status]}
                    </span>
                  ) : (
                    <span className={styles.badge}>Not started</span>
                  )}
                  <span className={styles.minutes}>{task.estimatedMinutes} min</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
