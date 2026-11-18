import { lazy, Suspense } from 'react'
import styles from './task.module.css'

const CodeMirrorEditor = lazy(() => import('./CodeMirrorEditor'))

interface Props {
  value: string
  onChange: (value: string) => void
  label: string
}

export function CodeEditor(props: Props) {
  return (
    <Suspense
      fallback={
        <pre className={styles.editorFallback} aria-busy="true">
          <code>{props.value}</code>
        </pre>
      }
    >
      <CodeMirrorEditor {...props} />
    </Suspense>
  )
}
