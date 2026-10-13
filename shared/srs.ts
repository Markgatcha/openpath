/**
 * SM-2-lite spaced repetition scheduling.
 *
 * Pure functions shared by the server (scheduling authority) and the
 * client (button labels, interval previews). The algorithm follows the
 * classic SuperMemo-2 shape: an ease factor per card, growing intervals,
 * and a lapse reset on "Again".
 */

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

export const GRADES: ReviewGrade[] = ['again', 'hard', 'good', 'easy']

export const GRADE_LABELS: Record<ReviewGrade, string> = {
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
}

export interface SrsState {
  /** Ease factor; lower = harder card. Clamped to [1.3, 2.8]. */
  ease: number
  intervalDays: number
  reps: number
  lapses: number
  /** ISO date (YYYY-MM-DD) when this card comes back up. */
  dueDate: string
}

export const MIN_EASE = 1.3
export const MAX_EASE = 2.8

export function initialSrsState(now: Date = new Date()): SrsState {
  return {
    ease: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    dueDate: isoDay(now),
  }
}

export function isoDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): string {
  const next = new Date(date.getTime() + days * 86_400_000)
  return isoDay(next)
}

function clampEase(ease: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, ease))
}

/**
 * Apply a review grade and return the next state.
 *
 * - **again** — forgot it: card returns today, interval resets, lapses +1
 * - **hard**  — struggled: interval × 1.2, ease down a notch
 * - **good**  — normal success: 1d → 3d → interval × ease
 * - **easy**  — effortless: 2d → 4d → interval × ease × 1.3, ease up
 */
export function schedule(
  state: SrsState,
  grade: ReviewGrade,
  now: Date = new Date(),
): SrsState {
  const ease = clampEase(state.ease)

  switch (grade) {
    case 'again':
      return {
        ease: clampEase(ease - 0.2),
        intervalDays: 0,
        reps: state.reps,
        lapses: state.lapses + 1,
        dueDate: isoDay(now),
      }
    case 'hard':
      return {
        ease: clampEase(ease - 0.15),
        intervalDays: state.reps === 0 ? 1 : Math.max(1, Math.round(state.intervalDays * 1.2)),
        reps: state.reps + 1,
        lapses: state.lapses,
        dueDate: addDays(
          now,
          state.reps === 0 ? 1 : Math.max(1, Math.round(state.intervalDays * 1.2)),
        ),
      }
    case 'good': {
      const interval = state.reps === 0 ? 1 : state.reps === 1 ? 3 : Math.round(state.intervalDays * ease)
      return {
        ease,
        intervalDays: interval,
        reps: state.reps + 1,
        lapses: state.lapses,
        dueDate: addDays(now, interval),
      }
    }
    case 'easy': {
      const interval =
        state.reps === 0 ? 2 : state.reps === 1 ? 4 : Math.round(state.intervalDays * ease * 1.3)
      return {
        ease: clampEase(ease + 0.15),
        intervalDays: interval,
        reps: state.reps + 1,
        lapses: state.lapses,
        dueDate: addDays(now, interval),
      }
    }
  }
}

/** Human-readable interval preview for grade buttons ("<10m", "1d", "2w"). */
export function intervalPreview(state: SrsState, grade: ReviewGrade): string {
  const next = schedule(state, grade)
  const days = next.intervalDays
  if (grade === 'again') return '<10m'
  if (days < 1) return '<1d'
  if (days === 1) return '1d'
  if (days < 30) return `${days}d`
  const months = Math.round(days / 30)
  return months <= 1 ? '1mo' : `${months}mo`
}
