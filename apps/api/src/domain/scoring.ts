import type { QuizItem, QuizQuestionResult } from '@devround/shared'

export class ScoringError extends Error {}

export interface QuizScore {
  correctCount: number
  totalCount: number
  /** round(correctCount / totalCount × 100) */
  score: number
  results: QuizQuestionResult[]
}

export function scoreQuiz(quiz: QuizItem[], answers: number[]): QuizScore {
  if (answers.length !== quiz.length) {
    throw new ScoringError(`Expected ${quiz.length} answers, got ${answers.length}`)
  }
  const results = quiz.map((item, index): QuizQuestionResult => {
    const selected = answers[index]!
    if (!Number.isInteger(selected) || selected < 0 || selected >= item.options.length) {
      throw new ScoringError(`Answer ${index + 1} is out of range`)
    }
    return {
      questionId: item.id,
      selected,
      correct: item.correct,
      isCorrect: selected === item.correct,
      explanation: item.explanation,
    }
  })
  const correctCount = results.filter((r) => r.isCorrect).length
  return {
    correctCount,
    totalCount: quiz.length,
    score: Math.round((correctCount / quiz.length) * 100),
    results,
  }
}
