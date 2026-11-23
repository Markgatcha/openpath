/**
 * FSRS spaced repetition scheduling (v2).
 *
 * Pure functions shared by the server (scheduling authority) and the
 * client (button labels, interval previews). Backed by ts-fsrs — the
 * open-source Free Spaced Repetition Scheduler whose weights Anki has
 * shipped as default since v24.11 — so cards get a per-card memory model
 * (stability + difficulty, retrievability-based intervals) instead of the
 * old SM-2-lite ease heuristic.
 *
 * Engine configuration notes:
 * - `enable_short_term: false` selects ts-fsrs's LongTermScheduler: every
 *   grade goes straight through the memory model with no (re)learning
 *   steps. OpenPath schedules at DAY granularity (due_date is a
 *   YYYY-MM-DD day), and a 10-minute learning step would only re-surface
 *   the card inside today's queue.
 * - `enable_fuzz: false` keeps intervals deterministic — previews shown
 *   on the grade buttons match what the server will actually schedule,
 *   and the unit tests stay reproducible.
 */

import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

export const GRADES: ReviewGrade[] = ['again', 'hard', 'good', 'easy']

export const GRADE_LABELS: Record<ReviewGrade, string> = {
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
}

/** Map our grade names onto ts-fsrs rating values (1=Again … 4=Easy). */
const RATING: Record<ReviewGrade, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

export interface SrsState {
  /** Memory stability in days (interval at 90% recall); 0 = never reviewed. */
  stability: number
  /** Card difficulty 1–10 (higher = harder); 0 = not yet estimated. */
  difficulty: number
  reps: number
  lapses: number
  /** ISO date (YYYY-MM-DD) when this card comes back up. */
  dueDate: string
  /** ISO timestamp of the last review; drives the retrievability curve. */
  lastReviewedAt: string | null
}

/** The scheduling engine (ts-fsrs default weights = FSRS-6, 90% target retention). */
const engine = fsrs({
  enable_short_term: false,
  learning_steps: [],
  relearning_steps: [],
  enable_fuzz: false,
})

export function initialSrsState(now: Date = new Date()): SrsState {
  return {
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    dueDate: isoDay(now),
    lastReviewedAt: null,
  }
}

export function isoDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/** Parse a YYYY-MM-DD day as UTC midnight (keeps day math timezone-stable). */
function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`)
}

/** Parse an ISO timestamp, falling back to `daysAgo` days before now. */
function parseMoment(iso: string | null, now: Date, daysAgo: number): Date {
  if (iso) {
    const parsed = new Date(iso)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return new Date(now.getTime() - daysAgo * 86_400_000)
}

function clampDifficulty(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(10, Math.max(1, value))
}

function roundStability(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.round(value * 1000) / 1000
}

/**
 * Rebuild a ts-fsrs card from persisted state. `elapsed_days` comes from
 * lastReviewedAt, so the interval you get depends on how late you review
 * — exactly like Anki. A lastReviewedAt in the future (clock skew, edited
 * rows) is clamped to 0 rather than crashing the engine.
 */
function toCard(state: SrsState, now: Date): Card {
  const isNew = state.reps === 0 || state.stability === 0
  const lastReview = parseMoment(state.lastReviewedAt, now, 0)
  if (isNew) return createEmptyCard(lastReview)
  return {
    due: parseDay(state.dueDate),
    stability: state.stability,
    difficulty: clampDifficulty(state.difficulty) || 5,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: state.reps,
    lapses: state.lapses,
    state: 2, // State.Review — cards without a learning-step history
    last_review: lastReview > now ? now : lastReview,
  }
}

/**
 * Apply a review grade and return the next state.
 *
 * - **again** — forgot it: stability resets low, lapses +1
 * - **hard**  — struggled: smaller interval than "good"
 * - **good**  — normal success
 * - **easy**  — effortless: biggest interval bump, difficulty drops
 */
export function schedule(
  state: SrsState,
  grade: ReviewGrade,
  now: Date = new Date(),
): SrsState {
  const item = engine.next(toCard(state, now), now, RATING[grade])
  const next = item.card

  return {
    stability: roundStability(next.stability),
    difficulty: clampDifficulty(next.difficulty),
    reps: state.reps + 1,
    lapses: grade === 'again' ? state.lapses + 1 : state.lapses,
    dueDate: isoDay(next.due),
    lastReviewedAt: now.toISOString(),
  }
}

/** Human-readable interval preview for grade buttons ("<1d", "1d", "2w"). */
export function intervalPreview(
  state: SrsState,
  grade: ReviewGrade,
  now: Date = new Date(),
): string {
  const next = schedule(state, grade, now)
  const days = daysUntil(next.dueDate, now)
  if (grade === 'again') return '<1d'
  if (days < 1) return '<1d'
  if (days === 1) return '1d'
  if (days < 30) return `${days}d`
  const months = Math.round(days / 30)
  return months <= 1 ? '1mo' : `${months}mo`
}

/** Whole days from today until the given ISO day (0 = today). */
function daysUntil(isoDate: string, now: Date = new Date()): number {
  const from = parseDay(isoDay(now)).getTime()
  const to = parseDay(isoDate).getTime()
  return Math.round((to - from) / 86_400_000)
}

// ── Queue interleaving ────────────────────────────────────────────

/**
 * Interleave the review queue so same-topic cards don't clump together.
 *
 * Round-robins across categories (quiz ids — the finest topic grouping
 * the data model has today). The evidence (Brunmair & Richter 2019):
 * interleaving similar problem categories helps (g ≈ 0.42) but *hurts*
 * vocabulary lists (g ≈ −0.39). Blocking true vocabulary decks needs
 * per-deck category metadata, so that refinement is tracked separately.
 */
export function interleaveQueue<T extends { category: string }>(items: T[]): T[] {
  const buckets = new Map<string, T[]>()
  for (const item of items) {
    const bucket = buckets.get(item.category)
    if (bucket) bucket.push(item)
    else buckets.set(item.category, [item])
  }

  const out: T[] = []
  const ordered = [...buckets.values()] // Map keeps insertion (due-date) order
  for (let round = 0; out.length < items.length; round += 1) {
    let placed = 0
    for (const bucket of ordered) {
      const item = bucket[round]
      if (item) {
        out.push(item)
        placed += 1
      }
    }
    if (placed === 0) break // every bucket drained
  }
  return out
}
