/**
 * Confidence self-ratings ("did you *know* it or guess it?").
 *
 * Students may tag an answer with a confidence level before seeing
 * whether it was right. This module owns the vocabulary and the
 * aggregation math so the student results view, the attempt review,
 * and the teacher analytics card all report identical numbers — no
 * divergent reimplementations per surface.
 *
 * Aggregation is deliberately pure and cheap: one pass over the
 * answers, at most four buckets, no dependencies.
 */
import { CONFIDENCE_LEVELS, type Confidence } from './schemas'

export { CONFIDENCE_LEVELS }
export type { Confidence }

/** Display labels for the four self-rating levels. */
export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  guessed: 'Guessed',
  unsure: 'Unsure',
  'fairly-sure': 'Fairly sure',
  certain: 'Certain',
}

/** Levels that count as "knew it" in the headline calibration stat. */
const KNEW_IT_LEVELS: readonly Confidence[] = ['fairly-sure', 'certain']

/** Defensive parse of a stored confidence value (DB text → enum). */
export function parseConfidence(value: unknown): Confidence | null {
  return typeof value === 'string' &&
    (CONFIDENCE_LEVELS as readonly string[]).includes(value)
    ? (value as Confidence)
    : null
}

/** One tagged (or untagged) answer, as fed into summarizeConfidence. */
export interface ConfidenceAnswer {
  confidence: Confidence | null
  correct: boolean
}

export interface CalibrationBucket {
  level: Confidence
  label: string
  seen: number
  correct: number
  /** correct / seen; 0 when the level was never used. */
  accuracy: number
}

export interface ConfidenceGroup {
  seen: number
  correct: number
  /** correct / seen; 0 when the group is empty. */
  accuracy: number
}

export interface ConfidenceSummary {
  /** Answers that carried a tag; untagged answers are invisible here. */
  tagged: number
  /** Per-level breakdown, in ascending-confidence order. */
  buckets: CalibrationBucket[]
  /** "Knew it" — answers marked fairly-sure or certain. */
  knewIt: ConfidenceGroup
  /** "Guessed it" — answers marked guessed or unsure. */
  guessed: ConfidenceGroup
  /** Correct answers the student had explicitly marked as a guess. */
  lucky: number
  /** Wrong answers the student was certain about. */
  overconfident: number
}

/**
 * Fold confidence tags into calibration stats. Untagged answers
 * (confidence === null) are skipped entirely — they say nothing
 * about metacognition and never inflate a bucket.
 */
export function summarizeConfidence(
  answers: readonly ConfidenceAnswer[],
): ConfidenceSummary {
  const buckets: CalibrationBucket[] = CONFIDENCE_LEVELS.map((level) => ({
    level,
    label: CONFIDENCE_LABELS[level],
    seen: 0,
    correct: 0,
    accuracy: 0,
  }))
  const knewIt: ConfidenceGroup = { seen: 0, correct: 0, accuracy: 0 }
  const guessed: ConfidenceGroup = { seen: 0, correct: 0, accuracy: 0 }
  let lucky = 0
  let overconfident = 0
  let tagged = 0

  for (const answer of answers) {
    if (!answer.confidence) continue
    tagged += 1

    const bucket = buckets[CONFIDENCE_LEVELS.indexOf(answer.confidence)]
    bucket.seen += 1
    if (answer.correct) bucket.correct += 1

    const group = KNEW_IT_LEVELS.includes(answer.confidence) ? knewIt : guessed
    group.seen += 1
    if (answer.correct) group.correct += 1

    // The two pedagogically interesting cases: a miss the student
    // was sure about, and a hit they admit to guessing.
    if (answer.confidence === 'certain' && !answer.correct) overconfident += 1
    if (answer.confidence === 'guessed' && answer.correct) lucky += 1
  }

  for (const bucket of buckets) {
    if (bucket.seen > 0) bucket.accuracy = bucket.correct / bucket.seen
  }
  if (knewIt.seen > 0) knewIt.accuracy = knewIt.correct / knewIt.seen
  if (guessed.seen > 0) guessed.accuracy = guessed.correct / guessed.seen

  return { tagged, buckets, knewIt, guessed, lucky, overconfident }
}
