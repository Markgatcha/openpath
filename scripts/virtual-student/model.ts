/**
 * Cognitive learner model for the virtual-student harness.
 *
 * This is NOT a brain simulation — no dataset exists that supports one.
 * It is a behavioral learner model calibrated to published statistics
 * from real student populations:
 *
 * - Knowledge tracing (Corbett & Anderson 1994, Bayesian Knowledge
 *   Tracing): fitted slip rates cluster around 0.05–0.17, guess rates
 *   0.06–0.30, per-practice learning rates 0.09–0.27 across the
 *   ASSISTments skill-builder datasets. Personas span those ranges.
 * - Forgetting: retrievability decays exponentially between practice
 *   days (R = e^(−t/S)) and stability S grows multiplicatively with
 *   each successful retrieval — the same family of memory model that
 *   FSRS (the scheduler OpenPath itself uses via ts-fsrs) fits to
 *   hundreds of millions of real Anki reviews.
 * - Response times on real platforms (EdNet, Choi et al. 2020; 131M
 *   interactions from 784K students) are heavy-tailed with medians in
 *   the tens of seconds, growing with item difficulty and shrinking
 *   with mastery — modeled here as lognormal around per-type medians.
 * - Metacognition: low-skill students systematically overestimate
 *   themselves (Kruger & Dunning 1999), so confidence is sampled from
 *   perceived mastery = true mastery + noise + a bias that shrinks as
 *   mastery grows.
 *
 * OpenPath questions carry no per-skill tags, so mastery is tracked per
 * quiz *subject* (the finest reliable grouping in the schema), with a
 * per-persona subject affinity so each virtual student has realistic
 * strengths and weaknesses.
 */

// ── Seeded RNG ─────────────────────────────────────────────────
// mulberry32: tiny deterministic PRNG so harness runs are reproducible.
export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function bernoulli(rng: Rng, p: number): boolean {
  return rng() < p
}

/** Standard normal via Box–Muller. */
export function normal(rng: Rng): number {
  const u = Math.max(rng(), 1e-12)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Heavy-tailed positive sample centered on `median`. */
export function lognormal(rng: Rng, median: number, sigma: number): number {
  return median * Math.exp(sigma * normal(rng))
}

export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

// ── Calibration constants ──────────────────────────────────────

/** Quiz-difficulty midpoint: the mastery at which a student answers ~50%. */
export const DIFFICULTY_MIDPOINT: Record<string, number> = {
  easy: 0.25,
  medium: 0.45,
  hard: 0.62,
}

/** Steepness of the mastery→performance curve (item discrimination). */
export const ITEM_DISCRIMINATION = 6

/**
 * Probability of stumbling into the right answer without knowing it,
 * by question type. MCQ/true-false guessing is well documented; open
 * formats (fill, order, figure) are nearly impossible to blind-guess.
 */
export function guessRate(type: string, optionCount: number): number {
  switch (type) {
    case 'mcq':
      return 1 / Math.max(2, optionCount)
    case 'truefalse':
      return 0.5
    case 'order': {
      // 1/n! chance of a random permutation being exactly right.
      let perms = 1
      for (let i = 2; i <= optionCount; i += 1) perms *= i
      return Math.max(0.02, 1 / perms)
    }
    default:
      // fill / figure
      return 0.02
  }
}

/** Median solve time per type (ms), loosely matching EdNet-scale data. */
export const BASE_TIME_MS: Record<string, number> = {
  mcq: 9_000,
  truefalse: 6_000,
  fill: 16_000,
  order: 22_000,
  figure: 45_000,
}

const DIFFICULTY_TIME_MULT: Record<string, number> = {
  easy: 0.85,
  medium: 1,
  hard: 1.3,
}

// ── Personas ───────────────────────────────────────────────────

export interface Persona {
  key: string
  label: string
  /** Initial mastery P(learned) before any practice in a neutral subject. */
  initialMastery: number
  /** Per-practice learning rate (BKT transition probability). */
  learnRate: number
  /** Slip: knows it but still gets it wrong (careless errors). */
  slip: number
  /** Initial memory stability in days (forgetting resistance). */
  stability0: number
  /** Stability multiplier per successful retrieval. */
  stabilityGrowth: number
  /** Probability of actually reading the explanation after a miss. */
  engagement: number
  /** Overconfidence bias strength (Kruger–Dunning flavor). */
  overconfidence: number
  /** Probability of skipping the confidence self-rating prompt. */
  confidenceSkipRate: number
  /** Quizzes attempted per simulated day. */
  quizzesPerDay: number
  /** Short description handed to the LLM texture prompt. */
  llmProfile: string
}

export const PERSONAS: Persona[] = [
  {
    key: 'strong',
    label: 'Strong student',
    initialMastery: 0.55,
    learnRate: 0.3,
    slip: 0.05,
    stability0: 4,
    stabilityGrowth: 2.4,
    engagement: 0.95,
    overconfidence: 0.05,
    confidenceSkipRate: 0.2,
    quizzesPerDay: 3,
    llmProfile:
      'a strong, well-prepared middle/high-school student who rarely makes careless mistakes',
  },
  {
    key: 'average',
    label: 'Average student',
    initialMastery: 0.3,
    learnRate: 0.18,
    slip: 0.1,
    stability0: 2.5,
    stabilityGrowth: 2.1,
    engagement: 0.85,
    overconfidence: 0.12,
    confidenceSkipRate: 0.25,
    quizzesPerDay: 3,
    llmProfile:
      'an average middle/high-school student with partial understanding and common misconceptions',
  },
  {
    key: 'struggling',
    label: 'Struggling student',
    initialMastery: 0.12,
    learnRate: 0.1,
    slip: 0.18,
    stability0: 1.2,
    stabilityGrowth: 1.8,
    engagement: 0.65,
    overconfidence: 0.25,
    confidenceSkipRate: 0.35,
    quizzesPerDay: 2,
    llmProfile:
      'a struggling middle/high-school student with shaky foundations who guesses often and falls for tempting wrong answers',
  },
]

// ── Skill state ────────────────────────────────────────────────

export interface SkillState {
  /** BKT-style mastery P(learned), 0..1. */
  mastery: number
  /** Memory stability in days; higher = slower forgetting. */
  stability: number
  exposures: number
  lapses: number
  /** Last simulated day this skill was practiced. */
  lastDay: number
}

export type ConfidenceLevel = 'guessed' | 'unsure' | 'fairly-sure' | 'certain'

export interface AnswerDecision {
  correct: boolean
  msTaken: number
  confidence: ConfidenceLevel | null
  /** Effective (post-forgetting) mastery at decision time, for reporting. */
  effectiveMastery: number
  pCorrect: number
}

/**
 * One virtual learner: a set of per-subject skill states plus the
 * persona parameters. All randomness flows through the seeded RNG.
 */
export class VirtualLearner {
  private readonly persona: Persona
  private readonly rng: Rng
  private readonly affinity: Map<string, number>
  private readonly skills = new Map<string, SkillState>()

  constructor(persona: Persona, rng: Rng, subjects: string[]) {
    this.persona = persona
    this.rng = rng
    // Subject affinities: seeded jitter so personas have realistic
    // strengths/weaknesses (e.g. strong at Math, weak at Chemistry).
    this.affinity = new Map(
      subjects.map((subject) => [subject, (rng() - 0.5) * 0.24]),
    )
  }

  private stateFor(subject: string, day: number): SkillState {
    let state = this.skills.get(subject)
    if (!state) {
      state = {
        mastery: clamp01(
          this.persona.initialMastery + (this.affinity.get(subject) ?? 0),
        ),
        stability: this.persona.stability0,
        exposures: 0,
        lapses: 0,
        // No forgetting before the first practice: the clock starts
        // when the student first touches the subject, not on day 0.
        lastDay: day,
      }
      this.skills.set(subject, state)
    }
    return state
  }

  /** Retrievability decay since last practice (exponential forgetting). */
  private effectiveMastery(state: SkillState, day: number): number {
    const elapsed = Math.max(0, day - state.lastDay)
    return state.mastery * Math.exp(-elapsed / Math.max(0.25, state.stability))
  }

  /**
   * Decide whether the student answers this question correctly.
   * Mastery (decayed) is mapped through a logistic item-response curve
   * centered on the quiz difficulty, then adjusted for slips (know it
   * but err) and lucky guesses (don't know it but hit the key).
   */
  decide(
    subject: string,
    difficulty: string,
    type: string,
    optionCount: number,
    day: number,
  ): AnswerDecision {
    const state = this.stateFor(subject, day)
    const effective = this.effectiveMastery(state, day)
    const midpoint = DIFFICULTY_MIDPOINT[difficulty] ?? 0.5
    const pSkilled = logistic(
      ITEM_DISCRIMINATION * (effective - midpoint),
    )
    const pCorrect =
      pSkilled * (1 - this.persona.slip) +
      (1 - pSkilled) * guessRate(type, optionCount)
    const correct = bernoulli(this.rng, pCorrect)

    const timeMult = DIFFICULTY_TIME_MULT[difficulty] ?? 1
    const median = (BASE_TIME_MS[type] ?? 12_000) * timeMult * (1.7 - effective)
    const msTaken = Math.round(
      Math.min(240_000, Math.max(1_200, lognormal(this.rng, median, 0.4))),
    )

    const confidence = bernoulli(this.rng, this.persona.confidenceSkipRate)
      ? null
      : this.sampleConfidence(state.mastery)

    return { correct, msTaken, confidence, effectiveMastery: effective, pCorrect }
  }

  /**
   * Confidence is sampled from *perceived* mastery, which for weak
   * students is biased upward — the classic calibration gap.
   */
  private sampleConfidence(trueMastery: number): ConfidenceLevel {
    const perceived = clamp01(
      trueMastery +
        normal(this.rng) * 0.15 +
        this.persona.overconfidence * (0.5 - trueMastery),
    )
    if (perceived < 0.25) return 'guessed'
    if (perceived < 0.5) return 'unsure'
    if (perceived < 0.75) return 'fairly-sure'
    return 'certain'
  }

  /** Whether the student bothers reading the explanation after a miss. */
  readsExplanation(wasCorrect: boolean): boolean {
    // Correct answers rarely send students to the explanation.
    const p = wasCorrect ? this.persona.engagement * 0.25 : this.persona.engagement
    return bernoulli(this.rng, p)
  }

  /**
   * Update the skill after graded feedback. Both success and
   * failure-plus-feedback teach (feedback is the whole point of
   * formative assessment), but failure teaches less — and costs a
   * lapse that weakens memory stability.
   */
  learnFromFeedback(
    subject: string,
    wasCorrect: boolean,
    readExplanation: boolean,
    day: number,
  ): void {
    const state = this.stateFor(subject, day)
    // Apply forgetting up to this moment before consolidating.
    state.mastery = this.effectiveMastery(state, day)

    const boost = readExplanation ? 2.2 : 1
    const gain = this.persona.learnRate * boost * (wasCorrect ? 1 : 0.6)
    state.mastery = clamp01(state.mastery + gain * (1 - state.mastery))

    if (wasCorrect) {
      state.stability = Math.min(
        60,
        state.stability * this.persona.stabilityGrowth,
      )
    } else {
      state.lapses += 1
      // A lapse damages stability — but studying the explanation is
      // still practice, so the damage is partially offset.
      const shrink = readExplanation ? 0.85 : 0.6
      state.stability = Math.max(0.3, state.stability * shrink)
    }
    state.exposures += 1
    state.lastDay = day
  }

  /** Snapshot for reporting: subject → current state. */
  skillSnapshot(): Record<string, SkillState> {
    return Object.fromEntries(this.skills)
  }
}
