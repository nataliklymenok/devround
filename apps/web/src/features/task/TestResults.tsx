import type { RunOutcome } from './runner/sandbox'
import { RUN_TIMEOUT_MS } from './runner/sandbox'
import styles from './task.module.css'

export function TestResults({ outcome }: { outcome: RunOutcome }) {
  if (outcome.kind === 'timeout') {
    return (
      <p className={styles.runError} role="alert">
        Timed out after {RUN_TIMEOUT_MS / 1000} s — check for infinite loops or promises that never
        settle.
      </p>
    )
  }
  if (outcome.kind === 'unavailable') {
    return (
      <p className={styles.runError} role="alert">
        Checks can&apos;t run in this browser (the code runner could not start). You can still use
        the hints and the solution.
      </p>
    )
  }
  if (outcome.kind === 'fatal') {
    return (
      <p className={styles.runError} role="alert">
        {outcome.message}
      </p>
    )
  }

  const { cases, console: lines } = outcome.result
  const passed = cases.filter((c) => c.status === 'passed').length
  return (
    <div className={styles.results}>
      <p
        className={styles.summary}
        role="status"
        data-all-passed={passed === cases.length || undefined}
      >
        {passed === cases.length ? '✓ ' : ''}
        {passed}/{cases.length} tests passed
      </p>
      <ul className={styles.cases}>
        {cases.map((c) => (
          <li key={c.name} data-status={c.status}>
            <span className={styles.caseName}>
              {c.status === 'passed' ? '✓' : '✗'} {c.name}
            </span>
            {c.status !== 'passed' && (
              <div className={styles.caseDetails}>
                {c.message && <p>{c.message}</p>}
                {c.expected !== undefined && (
                  <dl>
                    <dt>Expected</dt>
                    <dd>
                      <code>{c.expected}</code>
                    </dd>
                    <dt>Actual</dt>
                    <dd>
                      <code>{c.actual}</code>
                    </dd>
                  </dl>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {lines.length > 0 && (
        <details className={styles.console}>
          <summary>Console output ({lines.length})</summary>
          <pre>{lines.join('\n')}</pre>
        </details>
      )}
    </div>
  )
}
