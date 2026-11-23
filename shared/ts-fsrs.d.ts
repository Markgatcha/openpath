/**
 * Ambient typings for ts-fsrs — the FSRS scheduling engine shared/srs.ts
 * runs on.
 *
 * Why this shim exists: the server compiles to CommonJS
 * (`module: node16`), and ts-fsrs ships one shared ESM-flavored `index.d.ts`
 * with no `dist/index.d.cts`. TypeScript therefore refuses the
 * `require`-style import (TS1479) even though the package's `"require"`
 * export resolves and works at runtime. This declaration types exactly the
 * surface we consume; the real dependency does the actual work.
 *
 * Keep in sync with `shared/srs.ts` — if that file starts using more of
 * the library, extend this shim (or upstream the missing .d.cts).
 */

declare module 'ts-fsrs' {
  /** Rating values: Manual = 0, Again = 1, Hard = 2, Good = 3, Easy = 4. */
  export const Rating: {
    readonly Manual: 0
    readonly Again: 1
    readonly Hard: 2
    readonly Good: 3
    readonly Easy: 4
  }

  /** Grades a student can press (Manual is not a student action). */
  export type Grade = 1 | 2 | 3 | 4

  /** Card states: New = 0, Learning = 1, Review = 2, Relearning = 3. */
  export type CardState = 0 | 1 | 2 | 3

  export interface Card {
    due: Date
    /** Interval in days at 90% recall probability. */
    stability: number
    /** 1–10, higher = harder. */
    difficulty: number
    elapsed_days: number
    scheduled_days: number
    learning_steps: number
    reps: number
    lapses: number
    state: CardState
    last_review?: Date
  }

  export interface FSRSParameters {
    /** Target recall probability for scheduled intervals (default 0.9). */
    request_retention?: number
    maximum_interval?: number
    /** Interval fuzzing; we keep it off so previews match reality. */
    enable_fuzz?: boolean
    /**
     * false selects the long-term scheduler: no (re)learning steps, every
     * grade goes straight through the memory model. We rely on this
     * because OpenPath schedules at day granularity.
     */
    enable_short_term?: boolean
    learning_steps?: readonly string[]
    relearning_steps?: readonly string[]
    w?: readonly number[]
  }

  export interface RecordLogItem {
    card: Card
    log: unknown
  }

  export interface FSRSInstance {
    /** Schedule `card` as if it were reviewed with `grade` right now. */
    next(card: Card, now: Date | string | number, grade: Grade): RecordLogItem
  }

  export function fsrs(parameters?: FSRSParameters): FSRSInstance

  /** A never-reviewed card, due now. */
  export function createEmptyCard(now?: Date | string | number): Card
}
