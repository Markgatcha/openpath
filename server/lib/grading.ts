import {
  computeAnswer,
  roundValue,
  toleranceFor,
  type FigureSpec,
  type Rounding,
} from '../../shared/figure'
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
 * Compute the exact numerical answer for any of the 14 parametric figure templates
 * (classic geometry + coordinate-line, parabola-vertex, unit-circle, vector-2d,
 * inclined-plane, series-parallel-circuit, supply-demand, normal-curve).
 */
export function solveFigureSpec(spec: FigureSpec, rounded = false): number {
  const raw = computeAnswer(spec)
  return rounded ? roundValue(raw, spec.rounding) : raw
}

/**
 * Numerical tolerance check for figure questions, accepting answers within
 * either the unrounded analytical key or the rounded display key tolerance.
 */
export function gradeFigureResponse(
  rounding: Rounding,
  key: number,
  response: number,
  customTolerance?: number,
): boolean {
  if (!Number.isFinite(response) || !Number.isFinite(key)) return false
  const tolerance = customTolerance ?? toleranceFor(rounding)
  if (Math.abs(response - key) <= tolerance) return true
  const roundedKey = roundValue(key, rounding)
  return Math.abs(response - roundedKey) <= tolerance
}

/**
 * Grade a student response against a question row.
 * Correct answers live only on the server — clients never see them
 * until the answer is submitted.
 *
 * `figureAnswer` is the per-attempt key for parameterized figure
 * questions (see server/lib/variants.ts); it overrides the stored
 * prototype key when present.
 */
export function gradeAnswer(
  question: QuestionRow,
  response: unknown,
  figureAnswer?: number | null,
): boolean {
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
      const parsedSpec = question.options_json
        ? parseJson<Partial<FigureSpec> & { rounding?: Rounding }>(question.options_json)
        : null
      const rounding: Rounding = parsedSpec?.rounding ?? 'tenth'
      const key =
        figureAnswer ??
        (parsedSpec?.template && parsedSpec.givens && parsedSpec.ask
          ? solveFigureSpec(parsedSpec as FigureSpec)
          : parseJson<number>(question.correct_json))
      return gradeFigureResponse(rounding, key, response)
    }
  }
}
