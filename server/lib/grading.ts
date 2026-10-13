import { toleranceFor } from '../../shared/figure'
import type { QuestionRow } from '../../shared/types'

/** Loose text comparison for fill-in-the-blank answers. */
export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:'"]/g, '')
}

function parseJson<T>(raw: string): T {
  return JSON.parse(raw) as T
}

/**
 * Grade a student response against a question row.
 * Correct answers live only on the server — clients never see them
 * until the answer is submitted.
 */
export function gradeAnswer(question: QuestionRow, response: unknown): boolean {
  switch (question.type) {
    case 'mcq':
      return (
        typeof response === 'number' &&
        response === parseJson<number>(question.correct_json)
      )
    case 'truefalse':
      return (
        typeof response === 'boolean' &&
        response === parseJson<boolean>(question.correct_json)
      )
    case 'fill': {
      if (typeof response !== 'string') return false
      const accepted: string[] = [
        parseJson<string>(question.correct_json),
        ...(question.alternatives_json
          ? parseJson<string[]>(question.alternatives_json)
          : []),
      ]
      const normalized = normalizeText(response)
      return accepted.some((answer) => normalizeText(answer) === normalized)
    }
    case 'order': {
      if (
        !Array.isArray(response) ||
        !response.every((item): item is number => typeof item === 'number')
      ) {
        return false
      }
      const correct = parseJson<number[]>(question.correct_json)
      return (
        response.length === correct.length &&
        response.every((value, index) => value === correct[index])
      )
    }
    case 'figure': {
      if (typeof response !== 'number') return false
      const key = parseJson<number>(question.correct_json)
      const figure = question.options_json
        ? parseJson<{ rounding: Parameters<typeof toleranceFor>[0] }>(
            question.options_json,
          )
        : { rounding: 'tenth' as const }
      const tolerance = toleranceFor(figure.rounding)
      return Math.abs(response - key) <= tolerance
    }
  }
}
