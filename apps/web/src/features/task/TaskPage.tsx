import type { TaskStatus, TaskView } from '@devround/shared'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../../api/client'
import { DraftBadge } from '../../components/DraftBadge'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { Markdown } from '../../components/Markdown'
import { Spinner } from '../../components/Spinner'
import { CodeEditor } from './CodeEditor'
import {
  useResetTask,
  useRevealHint,
  useRevealSolution,
  useSaveCheckResult,
  useSaveDraft,
  useSetTaskStatus,
  useTask,
} from './hooks'
import { runInSandbox, type RunOutcome } from './runner/sandbox'
import { TestResults } from './TestResults'
import styles from './task.module.css'

const STATUS_LABEL: Record<TaskStatus, string> = {
  solved_own: 'Solved on my own',
  solved_with_hints: 'Solved with hints',
  revisit: 'Need to revisit',
}

export function TaskPage() {
  const { taskId = '' } = useParams()
  return <TaskContent key={taskId} taskId={taskId} />
}

function TaskContent({ taskId }: { taskId: string }) {
  const task = useTask(taskId)

  if (task.isPending) return <Spinner label="Loading task…" />
  if (task.isError) {
    const status = task.error instanceof ApiError ? task.error.status : 0
    if (status === 404 || status === 410) {
      return (
        <EmptyState title={status === 410 ? 'This task is no longer available' : 'Task not found'}>
          <p>It is not part of your current plan.</p>
          <Link to="/plan" className="button">
            Back to my plan
          </Link>
        </EmptyState>
      )
    }
    return <ErrorState message="We could not load this task." onRetry={() => task.refetch()} />
  }
  return <TaskWorkspace task={task.data} />
}

function TaskWorkspace({ task }: { task: TaskView }) {
  const revealHint = useRevealHint(task.id)
  const revealSolution = useRevealSolution(task.id)
  const setStatus = useSetTaskStatus(task.id)
  const reset = useResetTask(task.id)
  const saveDraft = useSaveDraft(task.id)
  const saveCheck = useSaveCheckResult(task.id)

  const [code, setCode] = useState(task.progress.draftCode ?? task.starterCode)
  const [outcome, setOutcome] = useState<RunOutcome | null>(null)
  const [running, setRunning] = useState(false)
  const draftTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const usedHelp = task.progress.hintsRevealed > 0 || task.progress.solutionRevealed
  const allPassed =
    outcome?.kind === 'result' && outcome.result.cases.every((c) => c.status === 'passed')

  useEffect(() => () => clearTimeout(draftTimer.current), [])

  const onCodeChange = (next: string) => {
    setCode(next)
    clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => saveDraft.mutate(next), 1000) // autosave (FR-015b)
  }

  const runChecks = async () => {
    if (!task.tests || !task.entry) return
    setRunning(true)
    setOutcome(null)
    const result = await runInSandbox({
      code,
      entry: task.entry,
      tests: task.tests,
      perCaseTimeoutMs: 1000,
    })
    setOutcome(result)
    setRunning(false)
    if (result.kind === 'result') {
      const passed = result.result.cases.filter((c) => c.status === 'passed').length
      saveCheck.mutate({ passed, total: result.result.cases.length })
    }
  }

  const resetTask = () =>
    reset.mutate(undefined, {
      onSuccess: () => {
        setCode(task.starterCode)
        setOutcome(null)
      },
    })

  const confirmReveal = () => {
    if (
      window.confirm(
        'Reveal the reference solution? "Solved on my own" will no longer be available for this attempt.',
      )
    ) {
      revealSolution.mutate()
    }
  }

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          {task.technology} · Live coding · {task.difficulty} · {task.estimatedMinutes} min
        </p>
        <h1 className={styles.title}>{task.title}</h1>
        <div className={styles.badges}>
          {task.isDraft && <DraftBadge long />}
          {task.progress.status && (
            <span className={styles.statusBadge}>{STATUS_LABEL[task.progress.status]}</span>
          )}
        </div>
      </header>

      {task.taskUpdated && (
        <div className={styles.notice} role="status">
          This task was updated since you saved your draft.
          <button type="button" className="button button-secondary" onClick={resetTask}>
            Reset to the new starter code
          </button>
        </div>
      )}

      <Markdown>{task.statement}</Markdown>

      {task.mode === 'tests' ? (
        <section aria-labelledby="solve" className={styles.section}>
          <h2 id="solve">Your solution</h2>
          <p className={styles.muted}>
            Implement <code>{task.entry}</code>. Your code runs only in your browser, isolated from
            this site.
          </p>
          <CodeEditor value={code} onChange={onCodeChange} label={`Solution for ${task.title}`} />
          <div className={styles.actions}>
            <button type="button" className="button" onClick={runChecks} disabled={running}>
              {running ? 'Running…' : 'Run checks'}
            </button>
            {saveDraft.isPending && <span className={styles.muted}>Saving draft…</span>}
          </div>
          {outcome && <TestResults outcome={outcome} />}
          <details className={styles.tests}>
            <summary>Test cases ({task.tests?.length ?? 0})</summary>
            {task.tests?.map((t) => (
              <div key={t.name}>
                <p className={styles.caseName}>{t.name}</p>
                <Markdown>{'```js\n' + t.code + '\n```'}</Markdown>
              </div>
            ))}
          </details>
        </section>
      ) : (
        <section aria-labelledby="solve" className={styles.section}>
          <h2 id="solve">Solve it in your own editor</h2>
          <p className={styles.muted}>
            Copy the starter code into a React project, build the component, then check it against
            the criteria.
          </p>
          <Markdown>{'```jsx\n' + task.starterCode + '\n```'}</Markdown>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => navigator.clipboard?.writeText(task.starterCode)}
          >
            Copy starter code
          </button>
          <h3>Acceptance criteria</h3>
          <ul className={styles.criteria}>
            {task.acceptanceCriteria?.map((c) => (
              <li key={c}>
                <label>
                  <input type="checkbox" /> {c}
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="hints" className={styles.section}>
        <h2 id="hints">Hints</h2>
        {task.hints.length > 0 && (
          <ol className={styles.hints}>
            {task.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
        )}
        {task.hints.length < task.hintsTotal ? (
          <button
            type="button"
            className="button button-secondary"
            onClick={() => revealHint.mutate()}
            disabled={revealHint.isPending}
          >
            Show hint {task.hints.length + 1} of {task.hintsTotal}
          </button>
        ) : (
          <p className={styles.muted}>No more hints.</p>
        )}
      </section>

      <section aria-labelledby="solution" className={styles.section}>
        <h2 id="solution">Reference solution</h2>
        {task.solution ? (
          <Markdown>{task.solution}</Markdown>
        ) : (
          <button
            type="button"
            className="button button-secondary"
            onClick={confirmReveal}
            disabled={revealSolution.isPending}
          >
            Reveal solution
          </button>
        )}
      </section>

      <section aria-labelledby="mark" className={styles.section}>
        <h2 id="mark">How did it go?</h2>
        {allPassed && !usedHelp && (
          <p className={styles.success}>
            All checks passed without help — mark it as solved on your own!
          </p>
        )}
        <div className={styles.actions}>
          {(['solved_own', 'solved_with_hints', 'revisit'] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={task.progress.status === status ? 'button' : 'button button-secondary'}
              aria-pressed={task.progress.status === status}
              disabled={setStatus.isPending || (status === 'solved_own' && usedHelp)}
              title={
                status === 'solved_own' && usedHelp
                  ? 'Not available after revealing hints or the solution'
                  : undefined
              }
              onClick={() => setStatus.mutate(status)}
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
          <button
            type="button"
            className="button button-secondary"
            onClick={resetTask}
            disabled={reset.isPending}
          >
            Start over
          </button>
        </div>
      </section>

      <nav className={styles.pager} aria-label="Task navigation">
        {task.prevTaskId ? (
          <Link to={`/tasks/${task.prevTaskId}`} className="button button-secondary">
            ← Previous task
          </Link>
        ) : (
          <span />
        )}
        {task.nextTaskId ? (
          <Link to={`/tasks/${task.nextTaskId}`} className="button button-secondary">
            Next task →
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
