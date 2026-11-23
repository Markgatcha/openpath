/**
 * Per-attempt figure variants.
 *
 * A figure question may carry per-given `ranges` in its spec, making it
 * parameterized: every attempt then sees its own concrete numbers, drawn
 * deterministically from hash(questionId, attemptId). A resumed attempt
 * keeps the numbers it started with; a fresh retake gets new ones.
 *
 * The sampled givens and the answer key computed from them are stored on
 * the attempt row (attempts.variants_json) so that grading, the answer
 * reveal, and the post-run breakdown all agree on exactly what the
 * student saw. Questions without ranges are never stored here — they
 * always grade against questions.correct_json.
 */
import { computeAnswer, figureSeed, sampleFigure } from '../../shared/figure'
import type { FigureSpec } from '../../shared/schemas'
import type { AttemptRow, QuestionRow } from '../../shared/types'
import { db } from '../db'

export interface FigureVariant {
  /** Concrete givens exactly as drawn on the student's figure. */
  givens: Record<string, number>
  /** Answer key computed from those givens (raw, pre-rounding). */
  answer: number
}

/** questionId → variant, containing only questions that actually vary. */
export type VariantMap = Record<string, FigureVariant>

/** Parse the stored variant map, discarding anything malformed. */
export function parseVariants(raw: string | null): VariantMap {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as VariantMap
    const clean: VariantMap = {}
    for (const [questionId, variant] of Object.entries(parsed ?? {})) {
      if (variant && variant.givens && typeof variant.answer === 'number') {
        clean[questionId] = variant
      }
    }
    return clean
  } catch {
    return {}
  }
}

/** The figure spec stored on a question, or null for non-figure rows. */
export function figureSpecOf(question: QuestionRow): FigureSpec | null {
  if (question.type !== 'figure' || !question.options_json) return null
  try {
    return JSON.parse(question.options_json) as FigureSpec
  } catch {
    return null
  }
}

/** True when the spec carries at least one parameter range. */
export function specVaries(spec: FigureSpec | null): boolean {
  return Boolean(spec?.ranges && Object.keys(spec.ranges).length > 0)
}

/** Sample one question's variant; null if the math somehow fails. */
export function makeVariant(spec: FigureSpec, seed: number): FigureVariant | null {
  const concrete = sampleFigure(spec, seed)
  try {
    return { givens: concrete.givens, answer: computeAnswer(concrete) }
  } catch {
    // Unreachable for well-formed data (the prototype is validated at
    // save time); the question then grades on its stored key.
    return null
  }
}

/**
 * Read-or-create the attempt's variant map. Only writes to the database
 * when something new had to be sampled — the first time an attempt sees
 * a varying question, or when a question gained ranges after the attempt
 * began. The attempt row is updated in memory to match what was
 * persisted so callers see a consistent view.
 */
export function ensureAttemptVariants(attempt: AttemptRow): VariantMap {
  const variants = parseVariants(attempt.variants_json)
  const questions = db
    .prepare('SELECT * FROM questions WHERE quiz_id = ?')
    .all(attempt.quiz_id) as QuestionRow[]

  let changed = false
  for (const question of questions) {
    if (variants[question.id]) continue
    const spec = figureSpecOf(question)
    if (!specVaries(spec)) continue
    const variant = makeVariant(spec!, figureSeed(question.id, attempt.id))
    if (!variant) continue
    variants[question.id] = variant
    changed = true
  }

  if (changed) {
    attempt.variants_json = JSON.stringify(variants)
    db.prepare('UPDATE attempts SET variants_json = ? WHERE id = ?').run(
      attempt.variants_json,
      attempt.id,
    )
  }
  return variants
}
