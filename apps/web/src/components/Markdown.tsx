import { useEffect, useState } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './Markdown.module.css'

/** Code block rendered as plain text first, then highlighted once shiki has loaded (lazy chunk). */
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    import('shiki')
      .then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
        }),
      )
      .then((result) => !cancelled && setHtml(result))
      .catch(() => {
        // Unknown language or chunk failed to load: keep the plain block.
      })
    return () => {
      cancelled = true
    }
  }, [code, lang])

  if (html) {
    // shiki escapes the source; the content itself is reviewed library content.
    return <div className={styles.code} dangerouslySetInnerHTML={{ __html: html }} />
  }
  return (
    <pre className={styles.code}>
      <code>{code}</code>
    </pre>
  )
}

const components: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const lang = /language-([\w-]+)/.exec(className ?? '')?.[1]
    const text = String(children).replace(/\n$/, '')
    return lang ? (
      <CodeBlock code={text} lang={lang} />
    ) : (
      <code className={styles.inline}>{children}</code>
    )
  },
  // Lesson bodies use ## for sections; render them one level below the page title.
  h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className={styles.markdown}>
      {/* Raw HTML is not rendered (react-markdown default; also rejected by content:validate). */}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
