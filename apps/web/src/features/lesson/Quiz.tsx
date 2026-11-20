import type { PublicQuizItem, QuizAttemptResult } from '@devround/shared'
import { useId, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { useSubmitAttempt } from './hooks'
import { clearDraft, loadDraft, saveDraft, type Draft } from './quizDraft'
import styles from './lesson.module.css'

interface Props {
  lessonId: string
  quiz: PublicQuizItem[]
  onResult?: (result: QuizAttemptResult) => void
}

export function Quiz({ lessonId, quiz, onResult }: Props) {
  const submit = useSubmitAttempt(lessonId)
  const [answers, setAnswers] = useState<Draft>(() => loadDraft(lessonId, quiz.length))
  const [result, setResult] = useState<QuizAttemptResult | null>(null)
  const baseId = useId()
  const unanswered = answers.filter((a) => a === null).length

  const choose = (index: number, option: number) => {
    const next = answers.map((a, i) => (i === index ? option : a))
    setAnswers(next)
    saveDraft(lessonId, next)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (unanswered > 0 || submit.isPending) return
    submit.mutate(answers as number[], {
      onSuccess: (r) => {
        clearDraft(lessonId)
        setResult(r)
        onResult?.(r)
      },
    })
  }

  const retake = () => {
    setResult(null)
    setAnswers(quiz.map(() => null))
    submit.reset()
  }

  if (result) {
    return (
      <div className={styles.quiz}>
        <p className={styles.score} role="status">
          You scored <strong>{result.score}%</strong> — {result.correctCount} of {result.totalCount}{' '}
          correct.
        </p>
        <ol className={styles.questions}>
          {quiz.map((item, i) => {
            const r = result.results[i]!
            return (
              <li key={item.id} className={styles.question}>
                <p className={styles.questionText}>{item.question}</p>
                <ul className={styles.resultOptions}>
                  {item.options.map((option, o) => (
                    <li
                      key={o}
                      data-correct={o === r.correct || undefined}
                      data-wrong={(o === r.selected && !r.isCorrect) || undefined}
                    >
                      {option}
                      {o === r.correct && <span className={styles.mark}> ✓ correct</span>}
                      {o === r.selected && !r.isCorrect && (
                        <span className={styles.mark}> ✗ your answer</span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className={styles.explanation}>{r.explanation}</p>
              </li>
            )
          })}
        </ol>
        <button type="button" className="button button-secondary" onClick={retake}>
          Retake quiz
        </button>
      </div>
    )
  }

  return (
    <form className={styles.quiz} onSubmit={onSubmit}>
      <ol className={styles.questions}>
        {quiz.map((item, i) => (
          <li key={item.id} className={styles.question}>
            <fieldset>
              <legend className={styles.questionText}>{item.question}</legend>
              {item.options.map((option, o) => {
                const id = `${baseId}-${i}-${o}`
                return (
                  <label key={o} htmlFor={id} className={styles.option}>
                    <input
                      id={id}
                      type="radio"
                      name={`${baseId}-${i}`}
                      checked={answers[i] === o}
                      onChange={() => choose(i, o)}
                    />
                    {option}
                  </label>
                )
              })}
            </fieldset>
          </li>
        ))}
      </ol>
      <div className={styles.quizActions}>
        <button type="submit" className="button" disabled={unanswered > 0 || submit.isPending}>
          {submit.isPending ? 'Checking…' : 'Check answers'}
        </button>
        {unanswered > 0 && (
          <span className={styles.muted}>
            {unanswered} question{unanswered === 1 ? '' : 's'} left
          </span>
        )}
        {submit.isError && (
          <p className={styles.error} role="alert">
            {submit.error instanceof ApiError && submit.error.status !== 401
              ? submit.error.message
              : 'We could not check your answers. Please try again.'}
          </p>
        )}
      </div>
    </form>
  )
}
