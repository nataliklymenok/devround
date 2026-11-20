import type { QuizItem } from '@devround/shared'
import { describe, expect, it } from 'vitest'
import { ScoringError, scoreQuiz } from '../../src/domain/scoring.js'

const quiz: QuizItem[] = [
  { id: 'q1', question: 'A?', options: ['x', 'y'], correct: 0, explanation: 'e1' },
  { id: 'q2', question: 'B?', options: ['x', 'y', 'z'], correct: 2, explanation: 'e2' },
  { id: 'q3', question: 'C?', options: ['x', 'y'], correct: 1, explanation: 'e3' },
]

describe('scoreQuiz', () => {
  it('scores all correct as 100', () => {
    expect(scoreQuiz(quiz, [0, 2, 1])).toMatchObject({ correctCount: 3, totalCount: 3, score: 100 })
  })

  it('rounds the percentage', () => {
    expect(scoreQuiz(quiz, [0, 0, 0]).score).toBe(33) // 1/3
    expect(scoreQuiz(quiz, [0, 2, 0]).score).toBe(67) // 2/3
  })

  it('returns per-question results with explanations', () => {
    expect(scoreQuiz(quiz, [1, 2, 1]).results).toEqual([
      { questionId: 'q1', selected: 1, correct: 0, isCorrect: false, explanation: 'e1' },
      { questionId: 'q2', selected: 2, correct: 2, isCorrect: true, explanation: 'e2' },
      { questionId: 'q3', selected: 1, correct: 1, isCorrect: true, explanation: 'e3' },
    ])
  })

  it('rejects answers with the wrong length', () => {
    expect(() => scoreQuiz(quiz, [0, 1])).toThrow(ScoringError)
    expect(() => scoreQuiz(quiz, [0, 1, 1, 0])).toThrow(ScoringError)
  })

  it('rejects an option index out of range', () => {
    expect(() => scoreQuiz(quiz, [0, 3, 1])).toThrow(/out of range/)
    expect(() => scoreQuiz(quiz, [-1, 0, 1])).toThrow(ScoringError)
  })
})
