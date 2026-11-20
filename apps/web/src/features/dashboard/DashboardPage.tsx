import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { ProgressBar } from '../../components/ProgressBar'
import { Spinner } from '../../components/Spinner'
import type { Dashboard, ItemKind } from '@devround/shared'
import { useDashboard } from './hooks'
import styles from './dashboard.module.css'

const ITEM_PATH: Record<ItemKind, string> = {
  lesson: 'lessons',
  task: 'tasks',
  exercise: 'exercises',
}
const ITEM_LABEL: Record<ItemKind, string> = {
  lesson: 'Lesson',
  task: 'Live coding',
  exercise: 'System design',
}
const itemHref = (item: { kind: ItemKind; id: string }) => `/${ITEM_PATH[item.kind]}/${item.id}`

function areaTitle(area: Dashboard['areas'][number]) {
  if (area.kind === 'coding') return 'Live coding'
  if (area.kind === 'design') return 'System design'
  return area.technology ?? 'Theory'
}

export function DashboardPage() {
  const dashboard = useDashboard()

  if (dashboard.isPending) return <Spinner label="Loading your progress…" />
  if (dashboard.isError) {
    return (
      <ErrorState message="We could not load your progress." onRetry={() => dashboard.refetch()} />
    )
  }
  if (!dashboard.data) {
    return (
      <EmptyState title="Let's set up your interview prep">
        <p>Choose the interview you are preparing for and we will build your plan.</p>
        <Link to="/setup" className="button">
          Choose your interview
        </Link>
      </EmptyState>
    )
  }

  const d = dashboard.data
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="progress-title">
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>
            {d.target.track} · {d.target.level} · {d.target.technologies.join(', ')}
          </p>
          <h1 id="progress-title" className={styles.title}>
            {d.isComplete ? 'Plan complete — well done!' : 'Your interview prep'}
          </h1>
          <p className={styles.percent}>
            <span className={styles.big}>{d.overall.percent}%</span> · {d.overall.completed} of{' '}
            {d.overall.total} items completed
          </p>
          <ProgressBar
            value={d.overall.completed}
            max={d.overall.total}
            label="Overall plan progress"
          />
        </div>
        <div className={styles.heroActions}>
          {d.continue ? (
            <Link to={itemHref(d.continue)} className="button">
              {d.overall.completed === 0 ? 'Start first lesson' : 'Continue'}
            </Link>
          ) : (
            <Link to="/plan" className="button">
              Review your plan
            </Link>
          )}
          <Link to="/setup" className="button button-secondary">
            Change interview target
          </Link>
        </div>
      </section>

      <div className={styles.grid}>
        <div className={styles.side}>
          <section className={styles.card} aria-labelledby="areas-title">
            <h2 id="areas-title">Readiness by area</h2>
            <ul className={styles.modules}>
              {d.areas.map((a) => (
                <li key={`${a.kind}-${a.technology ?? ''}`}>
                  <div className={styles.moduleRow}>
                    <span>
                      {areaTitle(a)}
                      {a.kind === 'theory' && <span className={styles.muted}> · theory</span>}
                    </span>
                    <span className={styles.muted}>
                      {a.completed}/{a.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={a.completed}
                    max={a.total}
                    label={`${areaTitle(a)} progress`}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card} aria-labelledby="modules-title">
            <h2 id="modules-title">Modules</h2>
            <ul className={styles.modules}>
              {d.modules.map((m) => (
                <li key={m.id}>
                  <div className={styles.moduleRow}>
                    <span>{m.title}</span>
                    <span className={styles.muted}>
                      {m.completed}/{m.total}
                    </span>
                  </div>
                  <ProgressBar value={m.completed} max={m.total} label={`${m.title} progress`} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className={styles.side}>
          <section className={styles.card} aria-labelledby="score-title">
            <h2 id="score-title">Average quiz score</h2>
            <p className={styles.big}>
              {d.averageBestScore === null ? '—' : `${d.averageBestScore}%`}
            </p>
            <p className={styles.muted}>Best score per completed lesson.</p>
          </section>

          <section className={styles.card} aria-labelledby="review-title">
            <h2 id="review-title">Topics to review</h2>
            {d.topicsToReview.length === 0 ? (
              <p className={styles.muted}>
                {d.overall.completed === 0
                  ? 'Complete a few quizzes to see where to focus.'
                  : 'Nothing to revisit — keep going!'}
              </p>
            ) : (
              <ul className={styles.review}>
                {d.topicsToReview.map((t) => (
                  <li key={`${t.kind}-${t.id}`}>
                    <span>
                      <span className={styles.kind}>{ITEM_LABEL[t.kind]}</span>
                      <Link to={itemHref(t)}>{t.title}</Link>
                    </span>
                    <span className={styles.score}>
                      {t.kind === 'task' ? 'revisit' : `${t.score}%`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
