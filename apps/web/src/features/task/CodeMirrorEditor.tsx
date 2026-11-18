import { indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { EditorView, basicSetup } from 'codemirror'
import { keymap } from '@codemirror/view'
import { useEffect, useRef } from 'react'
import styles from './task.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
  label: string
}

const theme = EditorView.theme({
  '&': { backgroundColor: 'var(--color-code-bg)', color: 'var(--color-text)', fontSize: '14px' },
  '.cm-content': { fontFamily: 'var(--font-mono)', caretColor: 'var(--color-text)' },
  '.cm-gutters': {
    backgroundColor: 'var(--color-surface-sunken)',
    color: 'var(--color-text-muted)',
    border: 'none',
  },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'transparent' },
  '&.cm-focused': { outline: '3px solid var(--color-accent)', outlineOffset: '2px' },
})

/** Syntax colors from CSS variables so both themes meet WCAG AA contrast (the default style is light-only). */
const highlight = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.operatorKeyword, tags.controlKeyword, tags.definitionKeyword],
    color: 'var(--code-keyword)',
  },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: 'var(--code-string)' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: 'var(--code-number)' },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: 'var(--code-comment)',
    fontStyle: 'italic',
  },
  {
    tag: [tags.propertyName, tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: 'var(--code-property)',
  },
])

/** CodeMirror 6 (lazy-loaded). Tab indents; Escape then Tab moves focus out (CodeMirror tab-focus mode). */
export default function CodeMirrorEditor({ value, onChange, label }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    view.current = new EditorView({
      doc: value,
      parent: host.current!,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        javascript(),
        syntaxHighlighting(highlight),
        theme,
        EditorView.contentAttributes.of({ 'aria-label': label }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString())
        }),
      ],
    })
    return () => view.current?.destroy()
    // The editor owns its document after mount; external resets go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const current = view.current
    if (current && current.state.doc.toString() !== value) {
      current.dispatch({ changes: { from: 0, to: current.state.doc.length, insert: value } })
    }
  }, [value])

  return <div ref={host} className={styles.editor} />
}
