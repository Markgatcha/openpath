/**
 * Educational Arcade — pure game rules shared by the client (which runs
 * the games) and anything that wants to reason about them (tests, the
 * server's plausibility checks). No DOM, no React, no randomness that
 * isn't seeded: every function here is deterministic for a given input.
 *
 * Two solo modes live on top of these rules:
 *
 * - **Streak Siege** — a timed survival run over the student's FSRS due
 *   and weak cards. Each first attempt at a card is graded into the real
 *   spaced-repetition schedule (shared/srs.ts), so the game *is* review.
 * - **Speed Match** — a face-up term ↔ definition grid where quick
 *   consecutive matches chain into combo bursts that pay coins
 *   (shared/economy.ts → arcadeCoinsForRun).
 */

import { comboMultiplier } from './game'
import { type Confidence } from './confidence'
import { computeAnswer, roundValue, type FigureSpec } from './figure'
import type { ContentPack } from './packs'
import type { QuestionType } from './schemas'
import type { ReviewGrade } from './srs'

// ── Seeded randomness ─────────────────────────────────────────────
export type Rng = () => number

/** mulberry32: tiny, fast, good enough for shuffling game boards. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates on a copy. */
export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const swap = out[i]
    out[i] = out[j]
    out[j] = swap
  }
  return out
}

/** Stable string → 32-bit seed (FNV-1a). */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Days since the Unix epoch for the *local* calendar day. */
export function localDayNumber(date: Date = new Date()): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
}

/** Deterministic "item of the day" — same pick all day, everyone. */
export function dailyPick<T>(items: readonly T[], date: Date = new Date()): T {
  if (items.length === 0) throw new Error('dailyPick needs at least one item')
  return items[localDayNumber(date) % items.length]
}

/** Whole days between two YYYY-MM-DD days (positive = later). */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime()
  const to = new Date(`${toIso}T00:00:00Z`).getTime()
  if (Number.isNaN(from) || Number.isNaN(to)) return 0
  return Math.round((to - from) / 86_400_000)
}

// ── Streak Siege ──────────────────────────────────────────────────
export const SIEGE = {
  /** Seconds on the clock when the run starts. */
  startSeconds: 45,
  /** The clock can never bank more than this. */
  maxSeconds: 90,
  /** Seconds lost on a wrong answer. */
  penaltySeconds: 8,
  /** Shield pips: each correct answer adds one, a miss drops them all. */
  maxShield: 3,
  basePoints: 100,
  /** Answers slower than this are graded "hard" instead of "good". */
  slowMs: 9_000,
  /** Feedback stays up this long before auto-advancing (Enter skips). */
  feedbackMs: 1_100,
} as const

/**
 * Seconds a correct answer adds. The base bonus decays as the run gets
 * deeper (so every run ends eventually), and each shield pip adds a
 * second on top — a clean streak is how you outrun the decay.
 */
export function siegeTimeBonus(correctSoFar: number, shield: number): number {
  const decayed = Math.max(2, 5 - correctSoFar * 0.12)
  return Math.round((decayed + Math.max(0, Math.min(shield, SIEGE.maxShield))) * 10) / 10
}

/** Points for a correct answer: combo × speed × shield. */
export function siegePoints(combo: number, shield: number, msTaken: number): number {
  const speed = Math.min(1.5, Math.max(1, 1.5 - msTaken / 12_000))
  const shieldBoost = 1 + 0.1 * Math.max(0, Math.min(shield, SIEGE.maxShield))
  return Math.round(SIEGE.basePoints * comboMultiplier(combo) * speed * shieldBoost)
}

/**
 * Map an arcade answer onto an FSRS grade.
 *
 * Arcade answers are *recognition* (pick from choices), which is easier
 * than the free *recall* the flashcard screen asks for, so a correct
 * answer never earns "easy" here — that would over-inflate stability.
 * Slow-but-right is "hard"; wrong is "again".
 */
export function siegeGrade(correct: boolean, msTaken: number): ReviewGrade {
  if (!correct) return 'again'
  return msTaken > SIEGE.slowMs ? 'hard' : 'good'
}

// ── Answer choices (tap-to-answer rounds) ─────────────────────────
export interface ChoiceCard {
  questionId: string
  type: QuestionType
  /** The flashcard back, as served by /api/srs (see answerBack). */
  answer: string
  options?: string[] | null
}

export interface RoundChoices {
  choices: string[]
  correctIndex: number
}

const MAX_CHOICES = 4
const DONT_KNOW = 'I don’t know yet'

/** The primary accepted answer of a fill card ("cos(x) / cosx" → "cos(x)"). */
export function primaryAnswer(card: Pick<ChoiceCard, 'type' | 'answer'>): string {
  if (card.type === 'fill') return card.answer.split(' / ')[0]?.trim() || card.answer
  return card.answer
}

function decimalsOf(text: string): number {
  const match = /\.(\d+)/.exec(text)
  return match ? Math.min(match[1].length, 3) : 0
}

function numericDistractors(answer: string, rng: Rng): string[] {
  const value = Number(answer)
  if (!Number.isFinite(value)) return []
  const digits = decimalsOf(answer)
  const fmt = (n: number) => (digits > 0 ? n.toFixed(digits) : String(Math.round(n)))
  const step = digits > 0 ? 10 ** -digits * 5 : Math.max(1, Math.round(Math.abs(value) * 0.1))
  const candidates = [
    value * 0.5,
    value * 1.5,
    value * 2,
    value + step,
    value - step,
    value + step * 2,
    Math.sqrt(Math.abs(value)),
    value * value,
  ]
  const seen = new Set([fmt(value)])
  const out: string[] = []
  for (const candidate of shuffled(candidates, rng)) {
    if (!Number.isFinite(candidate) || candidate <= 0) continue
    const label = fmt(candidate)
    if (seen.has(label)) continue
    seen.add(label)
    out.push(label)
  }
  return out
}

function orderDistractors(answer: string, rng: Rng): string[] {
  const parts = answer.split(' → ')
  if (parts.length < 2) return []
  const seen = new Set([answer])
  const out: string[] = []
  // Bounded attempts: short lists simply have fewer permutations.
  for (let tries = 0; tries < 24 && out.length < MAX_CHOICES - 1; tries += 1) {
    const candidate = shuffled(parts, rng).join(' → ')
    if (seen.has(candidate)) continue
    seen.add(candidate)
    out.push(candidate)
  }
  return out
}

function textDistractors(card: ChoiceCard, pool: readonly ChoiceCard[], rng: Rng): string[] {
  const own = primaryAnswer(card).toLowerCase()
  const usable = (other: ChoiceCard) => {
    if (other.questionId === card.questionId) return null
    if (other.type === 'truefalse' || other.type === 'order') return null
    const text = primaryAnswer(other)
    if (text.length === 0 || text.length > 60) return null
    if (text.toLowerCase() === own) return null
    return text
  }
  // Prefer same-type answers (fill vs fill reads naturally), then others.
  const sameType = pool.filter((other) => other.type === card.type)
  const otherType = pool.filter((other) => other.type !== card.type)
  const seen = new Set<string>([own])
  const out: string[] = []
  for (const group of [shuffled(sameType, rng), shuffled(otherType, rng)]) {
    for (const other of group) {
      const text = usable(other)
      if (!text || seen.has(text.toLowerCase())) continue
      seen.add(text.toLowerCase())
      out.push(text)
      if (out.length >= MAX_CHOICES - 1) return out
    }
  }
  return out
}

function finalize(correct: string, distractors: string[], rng: Rng): RoundChoices {
  const picked = distractors.slice(0, MAX_CHOICES - 1)
  if (picked.length === 0) picked.push(DONT_KNOW)
  const choices = shuffled([correct, ...picked], rng)
  return { choices, correctIndex: choices.indexOf(correct) }
}

/**
 * Build 2–4 tap-to-answer choices for any card type. MCQs keep their own
 * options (trimmed to four, original order kept); true/false is literal;
 * numeric figure answers get plausible numeric distractors; order cards
 * get shuffled permutations; fill answers borrow other cards' answers.
 */
export function buildChoices(
  card: ChoiceCard,
  pool: readonly ChoiceCard[],
  seed: number,
): RoundChoices {
  const rng = seededRng(seed)

  if (card.type === 'truefalse') {
    const choices = ['True', 'False']
    return { choices, correctIndex: card.answer === 'True' ? 0 : 1 }
  }

  if (card.type === 'mcq' && card.options && card.options.length >= 2) {
    const correctIndex = card.options.indexOf(card.answer)
    if (correctIndex >= 0) {
      if (card.options.length <= MAX_CHOICES) {
        return { choices: [...card.options], correctIndex }
      }
      const others = shuffled(
        card.options.filter((_, index) => index !== correctIndex),
        rng,
      ).slice(0, MAX_CHOICES - 1)
      const keep = new Set([card.answer, ...others])
      const choices = card.options.filter((option) => keep.has(option))
      return { choices, correctIndex: choices.indexOf(card.answer) }
    }
  }

  if (card.type === 'figure') {
    const distractors = numericDistractors(card.answer, rng)
    if (distractors.length > 0) return finalize(card.answer, distractors, rng)
  }

  if (card.type === 'order') {
    const distractors = orderDistractors(card.answer, rng)
    if (distractors.length > 0) return finalize(card.answer, distractors, rng)
  }

  const correct = primaryAnswer(card)
  return finalize(correct, textDistractors(card, pool, rng), rng)
}

// ── Speed Match ───────────────────────────────────────────────────
export const MATCH = {
  /** Seconds on the clock at the start of a run. */
  runSeconds: 60,
  /** Seconds added for clearing a whole board. */
  clearBonusSeconds: 10,
  /** Seconds lost on a mismatch. */
  missPenaltySeconds: 2,
  /** A match within this window of the previous one extends the combo. */
  comboWindowMs: 3_500,
  /** Pairs per board on wide screens (4×4) and narrow screens (4×3). */
  widePairs: 8,
  narrowPairs: 6,
} as const

/** Combo after a successful match. */
export function nextMatchCombo(combo: number, msSinceLastMatch: number | null): number {
  if (msSinceLastMatch === null || msSinceLastMatch > MATCH.comboWindowMs) return 1
  return combo + 1
}

/** Points for one match: quick chains snowball through comboMultiplier. */
export function matchPoints(combo: number): number {
  return Math.round(50 * comboMultiplier(Math.max(0, combo - 1)))
}

export interface MatchPair {
  id: string
  /** Left side: a term, formula, or (for figure decks) a caption. */
  term: string
  /** Right side: the definition / value it pairs with. */
  match: string
  /** Optional parametric figure rendered on the term tile. */
  figure?: FigureSpec
}

export interface MatchDeck {
  id: string
  name: string
  subject: string
  icon: string
  /** Content pack this deck reinforces (see shared/packs.ts). */
  packId?: string
  pairs: MatchPair[]
}

export interface MatchTile {
  tileId: string
  pairId: string
  side: 'term' | 'match'
  text: string
  figure?: FigureSpec
}

/** Deal a shuffled board of `pairCount` pairs (2 tiles each). */
export function dealBoard(deck: MatchDeck, pairCount: number, rng: Rng): MatchTile[] {
  const pairs = shuffled(deck.pairs, rng).slice(0, Math.min(pairCount, deck.pairs.length))
  const tiles: MatchTile[] = pairs.flatMap((pair) => [
    {
      tileId: `${pair.id}:t`,
      pairId: pair.id,
      side: 'term' as const,
      text: pair.term,
      ...(pair.figure ? { figure: pair.figure } : {}),
    },
    { tileId: `${pair.id}:m`, pairId: pair.id, side: 'match' as const, text: pair.match },
  ])
  return shuffled(tiles, rng)
}

const ASK_LABEL: Record<string, string> = {
  a: 'a',
  b: 'b',
  c: 'c',
  area: 'Area',
  radius: 'r',
  diameter: 'd',
  circumference: 'C',
  midsegment: 'Midsegment',
  angleA: '∠A',
  angleB: '∠B',
  angleC: '∠C',
}

/** A figure pair whose match text is COMPUTED by the geometry engine. */
function figurePair(id: string, caption: string, figure: FigureSpec): MatchPair {
  const value = roundValue(computeAnswer(figure), figure.rounding)
  const isAngle = figure.ask.startsWith('angle')
  return {
    id,
    term: caption,
    match: `${ASK_LABEL[figure.ask] ?? figure.ask} = ${value}${isAngle ? '°' : ''}`,
    figure,
  }
}

function textPairs(prefix: string, rows: [string, string][]): MatchPair[] {
  return rows.map(([term, match], index) => ({ id: `${prefix}-${index}`, term, match }))
}

/** Curated decks, each mirroring a content pack's core vocabulary. */
export const MATCH_DECKS: MatchDeck[] = [
  {
    id: 'cell-biology',
    name: 'Cell Biology',
    subject: 'Biology',
    icon: '🧬',
    packId: 'cellular-molecular-biology',
    pairs: textPairs('cell', [
      ['Mitochondrion', 'Aerobic respiration → most of the cell’s ATP'],
      ['Ribosome', 'Translates mRNA into a polypeptide'],
      ['Rough ER', 'Ribosome-studded membranes that fold secretory proteins'],
      ['Golgi apparatus', 'Modifies, sorts, and ships proteins in vesicles'],
      ['Lysosome', 'Acidic sac of hydrolytic enzymes'],
      ['Nucleolus', 'Assembles ribosomal subunits'],
      ['Chloroplast', 'Site of photosynthesis'],
      ['Plasma membrane', 'Selectively permeable phospholipid bilayer'],
      ['Centrosome', 'Organizes the microtubules of the spindle'],
      ['Smooth ER', 'Lipid synthesis and detoxification'],
      ['Prophase', 'Chromosomes condense; spindle begins to form'],
      ['Anaphase', 'Sister chromatids are pulled to opposite poles'],
    ]),
  },
  {
    id: 'vsepr-chemistry',
    name: 'VSEPR & Bonding',
    subject: 'Chemistry',
    icon: '⚗️',
    packId: 'chemical-bonding-vsepr',
    pairs: textPairs('vsepr', [
      ['CH₄', 'Tetrahedral · 109.5°'],
      ['NH₃', 'Trigonal pyramidal · ≈107°'],
      ['H₂O', 'Bent · ≈104.5°'],
      ['CO₂', 'Linear · 180°'],
      ['BF₃', 'Trigonal planar · 120°'],
      ['SF₆', 'Octahedral · 90°'],
      ['PCl₅', 'Trigonal bipyramidal'],
      ['XeF₄', 'Square planar'],
      ['NaCl(s)', 'Ionic crystal lattice'],
      ['sp³', 'Four electron domains'],
      ['sp²', 'Three electron domains'],
      ['sp³d²', 'Six electron domains'],
    ]),
  },
  {
    id: 'orbital-mechanics',
    name: 'Orbital Mechanics',
    subject: 'Astrophysics',
    icon: '🪐',
    packId: 'astrophysics-orbital-mechanics',
    pairs: textPairs('orbit', [
      ['Kepler’s 1st law', 'Orbits are ellipses with the Sun at one focus'],
      ['Kepler’s 2nd law', 'Equal areas swept in equal times'],
      ['Kepler’s 3rd law', 'T² ∝ a³'],
      ['Perihelion', 'Closest approach — fastest orbital speed'],
      ['Aphelion', 'Farthest point — slowest orbital speed'],
      ['e = 0', 'A perfect circle'],
      ['F = GMm / r²', 'Newton’s law of universal gravitation'],
      ['v_esc = √(2GM / r)', 'Escape velocity'],
      ['1 AU', 'Mean Earth–Sun distance'],
      ['Semi-major axis', 'Half of the ellipse’s longest diameter'],
      ['Geostationary orbit', 'Period of one sidereal day'],
      ['Light-year', 'Distance light travels in one year'],
    ]),
  },
  {
    id: 'multivariable-calculus',
    name: 'Calculus in 3D',
    subject: 'Calculus',
    icon: '∭',
    packId: 'multivariable-calculus-3d',
    pairs: textPairs('calc3d', [
      ['Disk method', 'V = π∫ f(x)² dx'],
      ['Washer method', 'V = π∫ (R² − r²) dx'],
      ['Shell method', 'V = 2π∫ x·f(x) dx'],
      ['x² + y² + z² = r²', 'Sphere'],
      ['z = x² + y²', 'Elliptic paraboloid'],
      ['z = x² − y²', 'Hyperbolic paraboloid (saddle)'],
      ['x² + y² − z² = 1', 'Hyperboloid of one sheet'],
      ['r(t) = ⟨cos t, sin t, t⟩', 'Helix'],
      ['∇f', 'Points in the direction of steepest ascent'],
      ['∂f/∂x', 'Rate of change with y held fixed'],
      ['∫ |r′(t)| dt', 'Arc length of a space curve'],
      ['dA in polar', 'r dr dθ'],
    ]),
  },
  {
    id: 'algorithms',
    name: 'Algorithms & Big-O',
    subject: 'Computer Science',
    icon: '💻',
    packId: 'algorithms-data-structures',
    pairs: textPairs('algo', [
      ['Binary search', 'O(log n) on a sorted array'],
      ['Merge sort', 'O(n log n) in every case'],
      ['Quicksort (worst)', 'O(n²) with bad pivots'],
      ['Hash table lookup', 'O(1) on average'],
      ['Breadth-first search', 'Explores level by level with a queue'],
      ['Depth-first search', 'Dives deep with a stack or recursion'],
      ['Dijkstra’s algorithm', 'Shortest paths with non-negative weights'],
      ['Binary heap', 'Priority queue with O(log n) insert'],
      ['BST in-order traversal', 'Visits keys in sorted order'],
      ['Topological sort', 'Orders the vertices of a DAG'],
      ['Bubble sort', 'O(n²) adjacent swaps'],
      ['Balanced BST height', 'O(log n)'],
    ]),
  },
  {
    id: 'microeconomics',
    name: 'Microeconomics',
    subject: 'Economics',
    icon: '📈',
    packId: 'microeconomics-markets',
    pairs: textPairs('micro', [
      ['|Elasticity| > 1', 'Elastic demand'],
      ['|Elasticity| < 1', 'Inelastic demand'],
      ['Equilibrium', 'Quantity supplied = quantity demanded'],
      ['Binding price ceiling', 'Shortage'],
      ['Binding price floor', 'Surplus'],
      ['Negative externality', 'Market overproduces (e.g. pollution)'],
      ['Positive externality', 'Market underproduces (e.g. vaccines)'],
      ['Pigouvian tax', 'Corrects a negative externality'],
      ['Consumer surplus', 'Willingness to pay minus price paid'],
      ['Deadweight loss', 'Surplus lost to inefficiency'],
      ['Normal good', 'Demand rises as income rises'],
      ['Substitutes', 'Cross-price elasticity > 0'],
    ]),
  },
  {
    id: 'geometry-figures',
    name: 'Figure Flash',
    subject: 'Geometry',
    icon: '📐',
    packId: 'geometry-figures',
    pairs: [
      figurePair('fig-0', 'Find c', {
        template: 'right-triangle',
        givens: { a: 3, b: 4 },
        ask: 'c',
        rounding: 'tenth',
      }),
      figurePair('fig-1', 'Find c', {
        template: 'right-triangle',
        givens: { a: 5, b: 12 },
        ask: 'c',
        rounding: 'tenth',
      }),
      figurePair('fig-2', 'Find the area', {
        template: 'right-triangle',
        givens: { a: 6, b: 8 },
        ask: 'area',
        rounding: 'tenth',
      }),
      figurePair('fig-3', 'Find the area', {
        template: 'circle',
        givens: { r: 3 },
        ask: 'area',
        rounding: 'tenth',
      }),
      figurePair('fig-4', 'Find the circumference', {
        template: 'circle',
        givens: { d: 10 },
        ask: 'circumference',
        rounding: 'tenth',
      }),
      figurePair('fig-5', 'Find the area', {
        template: 'trapezoid',
        givens: { b1: 10, b2: 6, h: 4 },
        ask: 'area',
        rounding: 'tenth',
      }),
      figurePair('fig-6', 'Find the midsegment', {
        template: 'trapezoid',
        givens: { b1: 9, b2: 5, h: 3 },
        ask: 'midsegment',
        rounding: 'tenth',
      }),
      figurePair('fig-7', 'Find ∠A', {
        template: 'triangle-sss',
        givens: { a: 5, b: 5, c: 5 },
        ask: 'angleA',
        rounding: 'integer',
      }),
      figurePair('fig-8', 'Water’s H–O–H angle', {
        template: 'triangle-sss',
        givens: { a: 1.52, b: 0.96, c: 0.96 },
        ask: 'angleA',
        rounding: 'integer',
      }),
      figurePair('fig-9', 'Find ∠B', {
        template: 'triangle-asa',
        givens: { angleA: 50, b: 10, angleC: 60 },
        ask: 'angleB',
        rounding: 'integer',
      }),
    ],
  },
]

export function findMatchDeck(id: string): MatchDeck | undefined {
  return MATCH_DECKS.find((deck) => deck.id === id)
}

/**
 * A personal deck built from the student's own flashcards: only short
 * prompt/answer pairs make readable tiles, and duplicate answers are
 * dropped so every tile has exactly one partner.
 */
export function deckFromCards(
  cards: readonly { questionId: string; prompt: string; answer: string; type: QuestionType }[],
): MatchDeck | null {
  const seenAnswers = new Set<string>()
  const pairs: MatchPair[] = []
  for (const card of cards) {
    if (card.type === 'order' || card.type === 'truefalse') continue
    const answer = primaryAnswer(card)
    if (card.prompt.length > 90 || answer.length > 40 || answer.length === 0) continue
    const key = answer.toLowerCase()
    if (seenAnswers.has(key)) continue
    seenAnswers.add(key)
    pairs.push({ id: `mine-${card.questionId}`, term: card.prompt, match: answer })
  }
  if (pairs.length < MATCH.narrowPairs) return null
  return {
    id: 'my-cards',
    name: 'My Flashcards',
    subject: 'Personal',
    icon: '🧠',
    pairs,
  }
}

/**
 * Assemble a Speed Match deck dynamically from any of the 16 Content Packs,
 * blending any curated `MATCH_DECKS` entries for that pack with pairs
 * extracted from the pack's Easy/Medium/Hard quizzes so every pack supports
 * both 4×4 (8 pairs) and 5×4 (10 pairs) grids.
 */
export function deckFromPack(pack: ContentPack): MatchDeck {
  const curated = MATCH_DECKS.find((d) => d.packId === pack.id)
  const seenMatches = new Set<string>()
  const pairs: MatchPair[] = []

  if (curated) {
    for (const pair of curated.pairs) {
      seenMatches.add(pair.match.toLowerCase())
      pairs.push(pair)
    }
  }

  let idx = 0
  for (const quiz of pack.quizzes) {
    for (const q of quiz.questions) {
      let term = q.prompt
      let match = ''
      let figure: FigureSpec | undefined
      if (q.type === 'mcq') {
        match = q.options[q.correct] ?? ''
      } else if (q.type === 'fill') {
        match = q.correct
      } else if (q.type === 'figure') {
        const val = roundValue(computeAnswer(q.figure), q.figure.rounding)
        match = `${q.figure.ask} = ${val}`
        figure = q.figure
        term = q.prompt.length > 72 ? `${quiz.title}: find ${q.figure.ask}` : q.prompt
      } else if (q.type === 'order') {
        match = q.correct.map((i) => q.options[i]).join(' → ')
      } else {
        continue
      }
      if (!match || match.length > 68 || term.length > 125) continue
      const key = match.toLowerCase()
      if (seenMatches.has(key)) continue
      seenMatches.add(key)
      pairs.push({
        id: `${pack.id}-q-${idx}`,
        term,
        match,
        ...(figure ? { figure } : {}),
      })
      idx += 1
    }
  }

  return {
    id: `pack:${pack.id}`,
    name: pack.name,
    subject: pack.subject,
    icon: pack.icon,
    packId: pack.id,
    pairs,
  }
}

// ── Step Detective cases (shared by StepDetective & ClozeWorkbench) ──
export interface DetectiveCase {
  id: string
  title: string
  subject: string
  context: string
  steps: string[]
  bugLine: number
  patches: string[]
  correctPatch: number
  misconception: string
}

export const DETECTIVE_CASES: DetectiveCase[] = [
  {
    id: 'alg-square-binomial',
    title: 'Expanding a Squared Binomial',
    subject: 'Algebra',
    context: 'Solve (x + 3)² = 25 for positive x:',
    steps: [
      'Given equation: (x + 3)² = 25',
      'Expand left-hand side: x² + 9 = 25',
      'Subtract 9 from both sides: x² = 16',
      'Extract positive root: x = 4',
    ],
    bugLine: 1,
    patches: [
      'Expand left-hand side: x² + 6x + 9 = 25',
      'Expand left-hand side: x² + 3x + 9 = 25',
      'Expand left-hand side: 2x + 6 = 25',
    ],
    correctPatch: 0,
    misconception:
      'Freshman’s Dream Trap: (a + b)² = a² + 2ab + b², never a² + b²! Missing the middle cross-term 6x shifts the positive root from x = 2 to x = 4.',
  },
  {
    id: 'alg-inequality-flip',
    title: 'Solving a Linear Inequality',
    subject: 'Algebra',
    context: 'Isolate x in the inequality −4x + 7 > 19:',
    steps: [
      'Start with: −4x + 7 > 19',
      'Subtract 7 from both sides: −4x > 12',
      'Divide both sides by −4: x > −3',
      'Express solution interval: (−3, ∞)',
    ],
    bugLine: 2,
    patches: [
      'Divide both sides by −4 and reverse sign: x < −3',
      'Add 4 to both sides: x > 16',
      'Divide both sides by 4: −x < 3',
    ],
    correctPatch: 0,
    misconception:
      'Multiplying or dividing an inequality by a negative number reverses order on the number line (> becomes <), yielding (−∞, −3).',
  },
  {
    id: 'calc-chain-rule',
    title: 'Derivative of a Composite Function',
    subject: 'Calculus',
    context: 'Find f′(x) for f(x) = sin(3x² + 1):',
    steps: [
      'Identify outer function g(u) = sin(u) and inner u(x) = 3x² + 1',
      'Differentiate outer function: g′(u) = cos(u)',
      'Differentiate inner function: u′(x) = 6x',
      'Combine derivatives: f′(x) = cos(6x)',
    ],
    bugLine: 3,
    patches: [
      'Apply Chain Rule g′(u(x))·u′(x): f′(x) = 6x · cos(3x² + 1)',
      'Multiply functions: f′(x) = sin(3x² + 1) · 6x',
      'Substitute zero: f′(x) = −6x · sin(3x² + 1)',
    ],
    correctPatch: 0,
    misconception:
      'Chain Rule evaluates g′ AT the original inner expression u(x) = 3x² + 1 and multiplies outside by u′(x) = 6x — never plug u′(x) inside cos(...)!',
  },
  {
    id: 'calc-washer-volume',
    title: 'Washer Volume of Revolution',
    subject: 'Calculus',
    context: 'Find volume rotating region between y = 2x and y = x² on [0, 2] about the x-axis:',
    steps: [
      'On [0, 2], outer radius R(x) = 2x and inner radius r(x) = x²',
      'Write washer area A(x) = π (2x − x²)²',
      'Expand integrand: π ∫₀² (4x² − 4x³ + x⁴) dx',
      'Evaluate definite integral over [0, 2]',
    ],
    bugLine: 1,
    patches: [
      'Write washer area as outer disk minus inner disk: A(x) = π ((2x)² − (x²)²)',
      'Write washer area as circumference: A(x) = 2π (2x − x²)',
      'Swap inner and outer radii: A(x) = π (x² − 2x)²',
    ],
    correctPatch: 0,
    misconception:
      'A washer is a perforated disk: subtract areas πR² − πr² = π(R² − r²), NOT the squared radius difference π(R − r)².',
  },
  {
    id: 'phys-parallel-resistors',
    title: 'Parallel Resistor Equivalence',
    subject: 'Physics',
    context: 'Compute total current from a 12 V battery into parallel resistors R₁ = 6 Ω and R₂ = 3 Ω:',
    steps: [
      'Sum reciprocal conductances: 1/R_eq = 1/6 + 1/3',
      'Add fractions with LCD 6: 1/R_eq = 1/6 + 2/6 = 3/6 = 0.5 Ω⁻¹',
      'Read off equivalent resistance: R_eq = 0.5 Ω',
      'Apply Ohm’s Law: I = V / R_eq = 24 A',
    ],
    bugLine: 2,
    patches: [
      'Invert 1/R_eq = 0.5 Ω⁻¹ to get R_eq = 2.0 Ω (so I = 12 / 2 = 6 A)',
      'Multiply reciprocals: R_eq = 6 × 3 = 18 Ω',
      'Average the branches: R_eq = 4.5 Ω',
    ],
    correctPatch: 0,
    misconception:
      'Forgetting the final reciprocal flip! 1/R_eq = 0.5 Ω⁻¹ means R_eq = 1 / 0.5 = 2 Ω, which is always smaller than the smallest parallel branch (3 Ω).',
  },
  {
    id: 'phys-ramp-components',
    title: 'Inclined Plane Force Decomposition',
    subject: 'Physics',
    context: 'A 10 kg block slides down a frictionless 30° incline (g = 9.8 m/s²):',
    steps: [
      'Weight vector straight down: W = mg = 10 × 9.8 = 98 N',
      'Component pulling block down the incline: F_∥ = mg cos(30°) = 84.9 N',
      'Normal force perpendicular to ramp: F_N = mg sin(30°) = 49.0 N',
      'Downslope acceleration: a = F_∥ / m',
    ],
    bugLine: 1,
    patches: [
      'Downslope component uses sin(θ): F_∥ = mg sin(30°) = 49.0 N (and F_N = mg cos 30°)',
      'Downslope component uses tan(θ): F_∥ = mg tan(30°)',
      'Normal force equals full weight mg = 98 N',
    ],
    correctPatch: 0,
    misconception:
      'Sanity-check θ → 0° (flat table): at 0°, downslope pull must vanish (sin 0° = 0) and normal force must equal mg (cos 0° = 1)!',
  },
  {
    id: 'chem-limiting-reagent',
    title: 'Limiting Reactant Stoichiometry',
    subject: 'Chemistry',
    context: 'Reaction: 2H₂ + O₂ → 2H₂O. Mix 4.0 g H₂ (M = 2 g/mol) with 16.0 g O₂ (M = 32 g/mol):',
    steps: [
      'Convert masses to moles: n(H₂) = 4.0 / 2 = 2.0 mol; n(O₂) = 16.0 / 32 = 0.50 mol',
      'Compare starting masses: since 4.0 g < 16.0 g, H₂ is the limiting reactant',
      'Use 2:2 mole ratio from H₂ to predict 2.0 mol H₂O',
      'Convert 2.0 mol H₂O × 18 g/mol = 36.0 g H₂O',
    ],
    bugLine: 1,
    patches: [
      'Divide moles by stoichiometric coefficients: O₂ (0.50/1 = 0.50) < H₂ (2.0/2 = 1.0), so O₂ is limiting!',
      'Compare molar masses: O₂ is heavier so H₂ is always limiting',
      'Add both masses directly: 4.0 g + 16.0 g = 20.0 g H₂O',
    ],
    correctPatch: 0,
    misconception:
      'Never determine limiting reactants by gram mass! Only 0.50 mol O₂ is present, consuming 1.0 mol H₂ to form 1.0 mol (18.0 g) H₂O.',
  },
  {
    id: 'cs-binary-search-bug',
    title: 'Binary Search Midpoint & Loop Update',
    subject: 'Computer Science',
    context: 'Inspect this TypeScript binary search on a sorted array:',
    steps: [
      'let lo = 0, hi = arr.length - 1;',
      'while (lo <= hi) {',
      '  const mid = Math.floor((lo + hi) / 2);',
      '  if (arr[mid] === target) return mid;',
      '  if (arr[mid] < target) lo = mid; else hi = mid - 1;',
      '}',
    ],
    bugLine: 4,
    patches: [
      'if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;',
      'if (arr[mid] < target) hi = mid + 1; else lo = mid - 1;',
      'if (arr[mid] < target) lo = mid - 1; else hi = mid + 1;',
    ],
    correctPatch: 0,
    misconception:
      'Setting `lo = mid` instead of `mid + 1` causes an infinite loop whenever `lo === mid` (e.g., two elements left and target > arr[lo]) because `mid` was already checked and excluded!',
  },
  {
    id: 'cs-recursion-base-case',
    title: 'Recursive Factorial Function',
    subject: 'Computer Science',
    context: 'Spot the runtime defect in this recursive factorial implementation for n >= 0:',
    steps: [
      'function factorial(n: number): number {',
      '  if (n === 1) return 1;',
      '  return n * factorial(n - 1);',
      '}',
    ],
    bugLine: 1,
    patches: [
      'if (n <= 1) return 1; // handles 0! = 1 without infinite recursion',
      'if (n === 0) return 0;',
      'if (n >= 1) return n;',
    ],
    correctPatch: 0,
    misconception:
      'Calling `factorial(0)` bypasses `n === 1`, recursing through −1, −2, … until `RangeError: Maximum call stack size exceeded`. Remember 0! = 1.',
  },
  {
    id: 'econ-dwl-scaling',
    title: 'Deadweight Loss of a Doubled Tax',
    subject: 'Economics',
    context: 'Demand P = 100 − 2Q, Supply P = 20 + 2Q (Q* = 20). Compare $8 tax vs $16 tax:',
    steps: [
      'Under $8 tax: Q_tax = (100 − 20 − 8) / 4 = 18 units (ΔQ = 2)',
      'DWL($8) = ½ × 8 × 2 = $8',
      'Doubling the tax to $16 doubles the deadweight loss to $16',
      'Post-tax quantity at $16 tax is Q_tax = 16 units (ΔQ = 4)',
    ],
    bugLine: 2,
    patches: [
      'Doubling the tax to $16 QUADRUPLES deadweight loss: ½ × 16 × 4 = $32',
      'Doubling the tax leaves deadweight loss unchanged at $8',
      'Doubling the tax cuts deadweight loss in half to $4',
    ],
    correctPatch: 0,
    misconception:
      'Deadweight loss is a triangle ½ · t · ΔQ where ΔQ itself is proportional to t, so DWL grows with the SQUARE of the tax rate (2² = 4×)!',
  },
  {
    id: 'stats-indep-variance',
    title: 'Standard Deviation of a Difference',
    subject: 'Statistics',
    context: 'Independent variables X and Y have SD(X) = 6 and SD(Y) = 8. Find SD(X − Y):',
    steps: [
      'Compute individual variances: Var(X) = 36 and Var(Y) = 64',
      'Because we subtract Y, subtract variances: Var(X − Y) = 36 − 64 = −28',
      'Take square root of magnitude: SD(X − Y) = √28 ≈ 5.29',
      'Report spread of X − Y',
    ],
    bugLine: 1,
    patches: [
      'Variances of independent variables ALWAYS ADD: Var(X − Y) = 36 + 64 = 100 ⇒ SD = 10',
      'Subtract standard deviations directly: SD(X − Y) = 8 − 6 = 2',
      'Multiply variances: Var(X − Y) = 36 × 64',
    ],
    correctPatch: 0,
    misconception:
      'Subtracting two uncertain independent quantities INCREASES total uncertainty: Var(aX − bY) = a²Var(X) + (−b)²Var(Y) = a²Var(X) + b²Var(Y)!',
  },
  {
    id: 'span-gustar-subjunctive',
    title: 'Spanish Grammar Proofread',
    subject: 'Spanish',
    context: 'Inspect each clause of this conversational Spanish paragraph:',
    steps: [
      '1. ¡Hola amigos! Hoy la cafetería está muy llena.',
      '2. A nosotros nos gusta mucho los tacos de pescado.',
      '3. Mientras hablábamos ayer, llegó la profesora.',
      '4. Espero que todos tengan un excelente fin de semana.',
    ],
    bugLine: 1,
    patches: [
      '2. A nosotros nos GUSTAN mucho los tacos de pescado. (plural subject agreement)',
      '2. Nosotros gustamos mucho los tacos de pescado.',
      '2. A nosotros nos gusta muchos el tacos.',
    ],
    correctPatch: 0,
    misconception:
      'With `gustar`, the grammatical subject is the thing liked (`los tacos`, plural), so the verb must be plural `gustan`, regardless of `nos`!',
  },
]

// ── Untimed / metacognitive FSRS grade mapper ─────────────────────
/**
 * Map an untimed arcade / reasoning check to an FSRS review grade without
 * penalizing slow careful thinking as `'hard'`. Low self-confidence flags
 * fragile retrieval even when the answer happened to be right.
 */
export function arcadeDeliberateGrade(
  correct: boolean,
  confidence?: Confidence | null,
): ReviewGrade {
  if (!correct) return 'again'
  if (confidence === 'guessed' || confidence === 'unsure') return 'hard'
  return 'good'
}

// ── Shared ContentPack -> ChoiceCard converter ────────────────────
export interface PackQuestionChoiceItem {
  id: string
  subject: string
  packId: string
  packName: string
  prompt: string
  card: ChoiceCard
  explanation: string
  figure?: FigureSpec
}

function packQuestionAnswerText(q: ContentPack['quizzes'][number]['questions'][number]): string {
  if (q.type === 'mcq') return q.options[q.correct] ?? ''
  if (q.type === 'truefalse') return q.correct ? 'True' : 'False'
  if (q.type === 'fill') return q.correct
  if (q.type === 'figure') {
    const val = roundValue(computeAnswer(q.figure), q.figure.rounding)
    return String(val)
  }
  return q.correct.map((i) => q.options[i]).join(' → ')
}

export function extractPackChoiceItems(packs: readonly ContentPack[]): PackQuestionChoiceItem[] {
  const out: PackQuestionChoiceItem[] = []
  for (const pack of packs) {
    let idx = 0
    for (const quiz of pack.quizzes) {
      for (const q of quiz.questions) {
        const answer = packQuestionAnswerText(q)
        if (!answer) continue
        const id = `${pack.id}-v-${idx}`
        idx += 1
        out.push({
          id,
          subject: quiz.subject || pack.subject,
          packId: pack.id,
          packName: pack.name,
          prompt: q.prompt,
          card: {
            questionId: id,
            type: q.type,
            answer,
            options: 'options' in q ? q.options : undefined,
          },
          explanation: q.explanation || `Correct answer: ${answer}`,
          figure: q.type === 'figure' ? q.figure : undefined,
        })
      }
    }
  }
  return out
}

// ── Certainty Vault (CBM metacognition wager rules) ───────────────
export type VaultWagerTier = 'unsure' | 'fairly-sure' | 'certain'

export interface VaultWagerRule {
  confidence: VaultWagerTier
  label: string
  subtitle: string
  keyHint: string
  winDelta: number
  lossDelta: number
  targetAccuracy: number
}

export const VAULT_WAGER_RULES: readonly VaultWagerRule[] = [
  {
    confidence: 'unsure',
    label: 'Cautious Seal',
    subtitle: 'Learning hedge — zero charge lost on a miss',
    keyHint: '1',
    winDelta: 2,
    lossDelta: 0,
    targetAccuracy: 0.45,
  },
  {
    confidence: 'fairly-sure',
    label: 'Steady Seal',
    subtitle: 'Standard wager for working recall',
    keyHint: '2',
    winDelta: 4,
    lossDelta: -2,
    targetAccuracy: 0.72,
  },
  {
    confidence: 'certain',
    label: 'Master Seal',
    subtitle: 'High conviction — big reward, strict penalty if wrong',
    keyHint: '3',
    winDelta: 6,
    lossDelta: -4,
    targetAccuracy: 0.92,
  },
]

export function vaultScoreDelta(tier: VaultWagerTier, correct: boolean): number {
  const rule = VAULT_WAGER_RULES.find((r) => r.confidence === tier) ?? VAULT_WAGER_RULES[0]
  return correct ? rule.winDelta : rule.lossDelta
}

/**
 * Return 0–100 calibration quality score balancing raw accuracy against
 * confidence-betting alignment (penalizing high-certainty misses cleanly).
 */
export function vaultCalibrationQuality(
  records: readonly { confidence: VaultWagerTier; correct: boolean }[],
): number {
  if (records.length === 0) return 0
  let totalWeight = 0
  for (const r of records) {
    if (r.confidence === 'certain') {
      totalWeight += r.correct ? 1 : 0
    } else if (r.confidence === 'fairly-sure') {
      totalWeight += r.correct ? 0.85 : 0.25
    } else {
      totalWeight += r.correct ? 0.65 : 0.55
    }
  }
  return Math.round((totalWeight / records.length) * 100)
}

export interface VaultChallengeItem {
  id: string
  subject: string
  packId: string
  packName: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
  figure?: FigureSpec
  srsQuestionId?: string
}

export function buildVaultDeck(
  packs: readonly ContentPack[],
  seed: number,
  count = 10,
): VaultChallengeItem[] {
  const items = extractPackChoiceItems(packs)
  const pool = items.map((item) => item.card)
  const rng = seededRng(seed)
  const chosen = shuffled(items, rng).slice(0, count)
  return chosen.map((item, idx) => {
    const built = buildChoices(item.card, pool, seed + idx * 17)
    return {
      id: item.id,
      subject: item.subject,
      packId: item.packId,
      packName: item.packName,
      prompt: item.prompt,
      choices: built.choices,
      correctIndex: built.correctIndex,
      explanation: item.explanation,
      figure: item.figure,
    }
  })
}

// ── Cloze Workbench (multi-blank proofs, derivations & syntax) ───
export interface ClozeBlank {
  id: string
  label: string
  answer: string
  options: string[]
  hint: string
}

export type ClozeSegment =
  | { kind: 'text'; text: string }
  | { kind: 'blank'; blankId: string }

export interface ClozeProblem {
  id: string
  title: string
  subject: string
  prompt: string
  segments: ClozeSegment[]
  blanks: ClozeBlank[]
  explanation: string
  misconception: string
}

export const CURATED_CLOZE_PROBLEMS: readonly ClozeProblem[] = [
  {
    id: 'cloze-alg-complete-square',
    title: 'Completing the Square',
    subject: 'Algebra',
    prompt: 'Reconstruct every step to solve x² − 8x + 7 = 0 by completing the square:',
    segments: [
      { kind: 'text', text: '1. Isolate x-terms:  x² − 8x = ' },
      { kind: 'blank', blankId: 'b1' },
      { kind: 'text', text: '\n2. Add (b/2)² to both sides:  add ' },
      { kind: 'blank', blankId: 'b2' },
      { kind: 'text', text: '\n3. Factor trinomial:  (x − ' },
      { kind: 'blank', blankId: 'b3' },
      { kind: 'text', text: ')² = 9\n4. Extract roots:  x = 4 ± ' },
      { kind: 'blank', blankId: 'b4' },
      { kind: 'text', text: '  ⇒  x ∈ {1, 7}' },
    ],
    blanks: [
      {
        id: 'b1',
        label: 'Right side constant',
        answer: '−7',
        options: ['−7', '7', '−8', '16'],
        hint: 'Subtract 7 from both sides of x² − 8x + 7 = 0.',
      },
      {
        id: 'b2',
        label: 'Square-completion term',
        answer: '16',
        options: ['16', '8', '64', '−16'],
        hint: 'Half of −8 is −4; (−4)² = 16.',
      },
      {
        id: 'b3',
        label: 'Binomial offset',
        answer: '4',
        options: ['4', '8', '2', '16'],
        hint: 'x² − 8x + 16 = (x − 4)² because 2 × 4 = 8.',
      },
      {
        id: 'b4',
        label: 'Root radius',
        answer: '3',
        options: ['3', '9', '−3', '4'],
        hint: 'Take √9 = 3 before isolating x = 4 ± 3.',
      },
    ],
    explanation:
      'Completing the square adds (−8/2)² = 16 to both sides, transforming x² − 8x = −7 into (x − 4)² = 9, which yields x = 4 ± 3.',
    misconception:
      'Remember to add 16 to the RIGHT side too (−7 + 16 = 9) and divide −8 by 2 before squaring.',
  },
  {
    id: 'cloze-calc-usub',
    title: 'Definite u-Substitution',
    subject: 'Calculus',
    prompt: 'Complete the substitution workflow for ∫₀² 3x² · e^(x³) dx:',
    segments: [
      { kind: 'text', text: '1. Choose inner expression:  u = ' },
      { kind: 'blank', blankId: 'b1' },
      { kind: 'text', text: '\n2. Differentiate:  du = ' },
      { kind: 'blank', blankId: 'b2' },
      { kind: 'text', text: ' dx\n3. New upper bound (x = 2):  u = ' },
      { kind: 'blank', blankId: 'b3' },
      { kind: 'text', text: '\n4. Evaluate [eᵘ]₀⁸ = ' },
      { kind: 'blank', blankId: 'b4' },
    ],
    blanks: [
      {
        id: 'b1',
        label: 'Substitution u',
        answer: 'x³',
        options: ['x³', '3x²', 'eˣ', 'x²'],
        hint: 'Pick the exponent whose derivative appears as a factor in the integrand.',
      },
      {
        id: 'b2',
        label: 'Differential factor',
        answer: '3x²',
        options: ['3x²', 'x³', '6x', '3x'],
        hint: 'd/dx(x³) = 3x², which matches the front factor cleanly.',
      },
      {
        id: 'b3',
        label: 'Upper u-limit',
        answer: '8',
        options: ['8', '2', '6', '4'],
        hint: 'Plug x = 2 into u = x³ ⇒ 2³ = 8.',
      },
      {
        id: 'b4',
        label: 'Exact value',
        answer: 'e⁸ − 1',
        options: ['e⁸ − 1', 'e⁸', 'e² − 1', '3e⁸ − 3'],
        hint: 'Don’t drop the lower bound: e⁰ = 1, so e⁸ − e⁰ = e⁸ − 1.',
      },
    ],
    explanation:
      'Letting u = x³ turns 3x² dx into du and shifts limits [0, 2] to [0, 8], giving ∫₀⁸ eᵘ du = e⁸ − e⁰ = e⁸ − 1.',
    misconception:
      'Never evaluate an exponential at lower limit 0 as 0: e⁰ equals 1, not 0!',
  },
  {
    id: 'cloze-phys-energy',
    title: 'Mechanical Energy Conservation',
    subject: 'Physics',
    prompt: 'Track a 4 kg cart released from rest at h = 5 m on a frictionless ramp (g = 10 m/s²):',
    segments: [
      { kind: 'text', text: '1. Initial potential energy:  U₀ = mgh = ' },
      { kind: 'blank', blankId: 'b1' },
      { kind: 'text', text: ' J\n2. At h = 0, potential converts into ' },
      { kind: 'blank', blankId: 'b2' },
      { kind: 'text', text: ' energy\n3. Solve ½mv² = U₀  ⇒  v² = ' },
      { kind: 'blank', blankId: 'b3' },
      { kind: 'text', text: ' m²/s²\n4. Bottom speed:  v = ' },
      { kind: 'blank', blankId: 'b4' },
      { kind: 'text', text: ' m/s' },
    ],
    blanks: [
      {
        id: 'b1',
        label: 'Initial U₀',
        answer: '200',
        options: ['200', '100', '40', '400'],
        hint: 'Multiply m × g × h = 4 × 10 × 5.',
      },
      {
        id: 'b2',
        label: 'Energy form',
        answer: 'kinetic',
        options: ['kinetic', 'thermal', 'elastic', 'nuclear'],
        hint: 'Frictionless tracks lose no energy to heat; motion stores kinetic energy.',
      },
      {
        id: 'b3',
        label: 'Squared velocity',
        answer: '100',
        options: ['100', '200', '50', '25'],
        hint: '½(4 kg)v² = 200 ⇒ 2v² = 200 ⇒ v² = 100.',
      },
      {
        id: 'b4',
        label: 'Speed v',
        answer: '10',
        options: ['10', '5', '20', '50'],
        hint: 'Notice mass cancels (v = √(2gh) = √100 = 10 m/s)!',
      },
    ],
    explanation:
      'Setting ½mv² = mgh gives U₀ = 200 J, v² = 2gh = 100 m²/s², and v = 10 m/s regardless of track curvature.',
    misconception:
      'Watch the ½ factor in ½mv²: dividing by 4 instead of ½(4) = 2 cuts v² in half erroneously.',
  },
  {
    id: 'cloze-chem-ideal-gas',
    title: 'Ideal Gas Law Rearrangement',
    subject: 'Chemistry',
    prompt: 'Find volume V of 0.50 mol O₂ at 300 K and 2.0 atm (R = 0.082 L·atm/(mol·K)):',
    segments: [
      { kind: 'text', text: '1. Ideal Gas Law:  PV = ' },
      { kind: 'blank', blankId: 'b1' },
      { kind: 'text', text: '\n2. Isolate volume:  V = nRT / ' },
      { kind: 'blank', blankId: 'b2' },
      { kind: 'text', text: '\n3. Numerator:  0.50 × 0.082 × 300 = ' },
      { kind: 'blank', blankId: 'b3' },
      { kind: 'text', text: ' L·atm\n4. Divide by P = 2.0 atm:  V = ' },
      { kind: 'blank', blankId: 'b4' },
      { kind: 'text', text: ' L' },
    ],
    blanks: [
      {
        id: 'b1',
        label: 'Gas law product',
        answer: 'nRT',
        options: ['nRT', 'nR/T', 'RT/n', 'mRT'],
        hint: 'Pressure times volume equals moles × gas constant × Kelvin temperature.',
      },
      {
        id: 'b2',
        label: 'Denominator',
        answer: 'P',
        options: ['P', 'n', 'T', 'V'],
        hint: 'Divide both sides of PV = nRT by pressure P.',
      },
      {
        id: 'b3',
        label: 'nRT product',
        answer: '12.3',
        options: ['12.3', '24.6', '4.10', '6.15'],
        hint: '0.50 × 300 = 150; 150 × 0.082 = 12.3.',
      },
      {
        id: 'b4',
        label: 'Final volume',
        answer: '6.15',
        options: ['6.15', '12.3', '24.6', '3.08'],
        hint: 'Divide 12.3 by P = 2.0 atm.',
      },
    ],
    explanation:
      'V = nRT/P = (0.50 × 0.082 × 300) / 2.0 = 12.3 / 2.0 = 6.15 L.',
    misconception:
      'Higher pressure compresses a gas inversely (V ∝ 1/P): doubling P halves V rather than doubling it.',
  },
  {
    id: 'cloze-bio-atp-synthase',
    title: 'Oxidative Phosphorylation Trace',
    subject: 'Biology',
    prompt: 'Reconstruct the final stage of aerobic cellular respiration:',
    segments: [
      { kind: 'text', text: '1. Electrons travel along the chain to terminal acceptor ' },
      { kind: 'blank', blankId: 'b1' },
      { kind: 'text', text: '.\n2. Released energy pumps ' },
      { kind: 'blank', blankId: 'b2' },
      { kind: 'text', text: ' into the intermembrane space.\n3. This gradient drives the rotary turbine ' },
      { kind: 'blank', blankId: 'b3' },
      { kind: 'text', text: '.\n4. Synthesizing ATP via ion flow is called ' },
      { kind: 'blank', blankId: 'b4' },
      { kind: 'text', text: '.' },
    ],
    blanks: [
      {
        id: 'b1',
        label: 'Terminal acceptor',
        answer: 'O₂',
        options: ['O₂', 'CO₂', 'pyruvate', 'glucose'],
        hint: 'Oxygen accepts electrons and H⁺ to form water H₂O.',
      },
      {
        id: 'b2',
        label: 'Pumped ion',
        answer: 'protons (H⁺)',
        options: ['protons (H⁺)', 'Na⁺ ions', 'ATP molecules', 'electrons'],
        hint: 'Proton-motive force across the cristae depends on H⁺ concentration.',
      },
      {
        id: 'b3',
        label: 'Enzyme turbine',
        answer: 'ATP synthase',
        options: ['ATP synthase', 'helicase', 'RuBisCO', 'amylase'],
        hint: 'Which transmembrane protein phosphorylates ADP + Pᵢ as H⁺ flows back?',
      },
      {
        id: 'b4',
        label: 'Coupling mechanism',
        answer: 'chemiosmosis',
        options: ['chemiosmosis', 'glycolysis', 'fermentation', 'transcription'],
        hint: 'Diffusion of ions across a selectively permeable membrane driving ATP synthesis.',
      },
    ],
    explanation:
      'O₂ pulls electrons down the ETC, creating an H⁺ gradient across the inner membrane that powers ATP synthase via chemiosmosis.',
    misconception:
      'CO₂ is released earlier during pyruvate oxidation and the citric acid cycle — O₂, not CO₂, accepts electrons at the end of the chain.',
  },
  {
    id: 'cloze-cs-merge-invariant',
    title: 'Stable Two-Pointer Merge',
    subject: 'Computer Science',
    prompt: 'Fill in the loop condition, comparator, slice, and Big-O complexity of Merge Sort:',
    segments: [
      { kind: 'text', text: 'while (i < left.length ' },
      { kind: 'blank', blankId: 'b1' },
      { kind: 'text', text: ' j < right.length) {\n  if (left[i] ' },
      { kind: 'blank', blankId: 'b2' },
      { kind: 'text', text: ' right[j]) out.push(left[i++]);\n  else out.push(right[j++]);\n}\nreturn [...out, ...left.slice(i), ...' },
      { kind: 'blank', blankId: 'b3' },
      { kind: 'text', text: '];\n// Worst-case total runtime: ' },
      { kind: 'blank', blankId: 'b4' },
    ],
    blanks: [
      {
        id: 'b1',
        label: 'Loop operator',
        answer: '&&',
        options: ['&&', '||', '^', '!='],
        hint: 'Only compare left[i] and right[j] while BOTH arrays still have unread elements.',
      },
      {
        id: 'b2',
        label: 'Stability comparator',
        answer: '<=',
        options: ['<=', '>', '>=', '!=='],
        hint: 'Choosing left on ties (<=) keeps equal elements in their original relative order.',
      },
      {
        id: 'b3',
        label: 'Remainder spread',
        answer: 'right.slice(j)',
        options: ['right.slice(j)', 'right.slice(0, j)', 'left.slice(j)', 'right[j]'],
        hint: 'Append any remaining unread suffix of right starting at index j.',
      },
      {
        id: 'b4',
        label: 'Worst-case complexity',
        answer: 'O(n log n)',
        options: ['O(n log n)', 'O(n²)', 'O(log n)', 'O(n)'],
        hint: 'Each of the log₂ n tree levels performs O(n) total work.',
      },
    ],
    explanation:
      'Looping while both indices are in bounds with <= preserves stability, spreading leftovers finishes in O(n), and log₂ n levels yield O(n log n).',
    misconception:
      'Using `||` instead of `&&` reads `undefined` past the shorter array’s end; using strict `<` breaks sort stability on duplicate keys.',
  },
  {
    id: 'cloze-hist-checks',
    title: 'Constitutional Checks & Balances',
    subject: 'History',
    prompt: 'Trace how legislative, executive, and judicial powers constrain each other:',
    segments: [
      { kind: 'text', text: '1. The President can block a congressional bill with a ' },
      { kind: 'blank', blankId: 'b1' },
      { kind: 'text', text: '.\n2. Congress overrides that block by a ' },
      { kind: 'blank', blankId: 'b2' },
      { kind: 'text', text: ' vote in both houses.\n3. Federal courts strike down unconstitutional statutes via ' },
      { kind: 'blank', blankId: 'b3' },
      { kind: 'text', text: ',\n4. a doctrine firmly established in ' },
      { kind: 'blank', blankId: 'b4' },
      { kind: 'text', text: ' (1803).' },
    ],
    blanks: [
      {
        id: 'b1',
        label: 'Executive check',
        answer: 'veto',
        options: ['veto', 'pardon', 'filibuster', 'treaty'],
        hint: 'Constitutional power to reject legislation passed by Congress.',
      },
      {
        id: 'b2',
        label: 'Override threshold',
        answer: 'two-thirds',
        options: ['two-thirds', 'simple majority', 'three-fifths', 'unanimous'],
        hint: 'Article I, Section 7 requires a supermajority in both the House and Senate.',
      },
      {
        id: 'b3',
        label: 'Court power',
        answer: 'judicial review',
        options: ['judicial review', 'executive order', 'cloture', 'impeachment'],
        hint: 'Power of courts to test acts against the Constitution.',
      },
      {
        id: 'b4',
        label: 'Landmark ruling',
        answer: 'Marbury v. Madison',
        options: [
          'Marbury v. Madison',
          'McCulloch v. Maryland',
          'Gibbons v. Ogden',
          'Worcester v. Georgia',
        ],
        hint: 'Chief Justice John Marshall articulated judicial review in this 1803 decision.',
      },
    ],
    explanation:
      'Presidential vetoes require a two-thirds override in both chambers, while judicial review (Marbury v. Madison, 1803) voids unconstitutional acts.',
    misconception:
      'Three-fifths (60 votes) is the Senate cloture threshold for filibusters, NOT the two-thirds supermajority needed for a veto override.',
  },
  {
    id: 'cloze-econ-shock',
    title: 'Supply Shock Comparative Statics',
    subject: 'Economics',
    prompt: 'Analyze the EV market after battery manufacturing costs fall by 40%:',
    segments: [
      { kind: 'text', text: '1. Lower production cost shifts the EV ' },
      { kind: 'blank', blankId: 'b1' },
      { kind: 'text', text: ' curve rightward.\n2. At the initial price, excess quantity creates a temporary ' },
      { kind: 'blank', blankId: 'b2' },
      { kind: 'text', text: '.\n3. As competition bids prices down, equilibrium price ' },
      { kind: 'blank', blankId: 'b3' },
      { kind: 'text', text: ',\n4. and total consumer surplus ' },
      { kind: 'blank', blankId: 'b4' },
      { kind: 'text', text: '.' },
    ],
    blanks: [
      {
        id: 'b1',
        label: 'Shifting curve',
        answer: 'supply',
        options: ['supply', 'demand', 'indifference', 'Phillips'],
        hint: 'Input costs directly affect producers’ marginal cost of production.',
      },
      {
        id: 'b2',
        label: 'Disequilibrium gap',
        answer: 'surplus',
        options: ['surplus', 'shortage', 'deadweight loss', 'price ceiling'],
        hint: 'Quantity supplied exceeds quantity demanded at the old price.',
      },
      {
        id: 'b3',
        label: 'Price adjustment',
        answer: 'falls',
        options: ['falls', 'rises', 'stays fixed', 'doubles'],
        hint: 'Sellers lower prices to clear excess inventory until Qs = Qd.',
      },
      {
        id: 'b4',
        label: 'Consumer welfare',
        answer: 'increases',
        options: ['increases', 'decreases', 'becomes zero', 'cannot be signed'],
        hint: 'More buyers purchase EVs and pay a lower market price.',
      },
    ],
    explanation:
      'Rightward supply shifts create a temporary surplus at the old price, pushing equilibrium price down, raising quantity, and expanding consumer surplus.',
    misconception:
      'Lower input cost moves buyers ALONG the demand curve to a higher quantity demanded — it does not shift the demand curve itself.',
  },
  {
    id: 'cloze-stats-ci',
    title: 'Confidence Interval Architecture',
    subject: 'Statistics',
    prompt: 'Construct a 95% z-interval for μ from n = 100 observations (x̄ = 52, σ = 15):',
    segments: [
      { kind: 'text', text: '1. Standard error formula:  SE = σ / ' },
      { kind: 'blank', blankId: 'b1' },
      { kind: 'text', text: ' = 1.5\n2. 95% critical multiplier:  z* ≈ ' },
      { kind: 'blank', blankId: 'b2' },
      { kind: 'text', text: '\n3. Margin of error:  ME = z* · SE = ' },
      { kind: 'blank', blankId: 'b3' },
      { kind: 'text', text: '\n4. Quadrupling n from 100 to 400 cuts ME in ' },
      { kind: 'blank', blankId: 'b4' },
      { kind: 'text', text: '.' },
    ],
    blanks: [
      {
        id: 'b1',
        label: 'Denominator',
        answer: '√n',
        options: ['√n', 'n', 'n − 1', 'n²'],
        hint: 'Standard error shrinks with the square root of sample size.',
      },
      {
        id: 'b2',
        label: 'Critical z*',
        answer: '1.96',
        options: ['1.96', '1.645', '2.576', '1.00'],
        hint: 'Middle 95% of N(0,1) leaves 2.5% in each tail.',
      },
      {
        id: 'b3',
        label: 'Margin of error',
        answer: '2.94',
        options: ['2.94', '1.50', '3.92', '0.98'],
        hint: 'Compute 1.96 × 1.5.',
      },
      {
        id: 'b4',
        label: 'Scaling effect',
        answer: 'half',
        options: ['half', 'quarter', 'double', 'eighth'],
        hint: 'Since √400 = 20 is twice √100 = 10, ME scales by 1/2.',
      },
    ],
    explanation:
      'With SE = 15/√100 = 1.5 and z* = 1.96, ME = 2.94; quadrupling n only halves the margin of error because of the square root.',
    misconception:
      'Doubling sample size does NOT halve margin of error — you need 4× the sample size for 2× precision!',
  },
  {
    id: 'cloze-span-subjunctive',
    title: 'Subjunctive vs Indicative Clauses',
    subject: 'Spanish',
    prompt: 'Select the mood and conjugation each Spanish clause triggers:',
    segments: [
      { kind: 'text', text: '1. Quiero que tú ' },
      { kind: 'blank', blankId: 'b1' },
      { kind: 'text', text: ' la verdad antes de salir. (decir)\n2. Ojalá que nosotros ' },
      { kind: 'blank', blankId: 'b2' },
      { kind: 'text', text: ' tiempo hoy. (tener)\n3. Es importante que ellos ' },
      { kind: 'blank', blankId: 'b3' },
      { kind: 'text', text: ' puntuales. (ser)\n4. Sé que ella ' },
      { kind: 'blank', blankId: 'b4' },
      { kind: 'text', text: ' aquí ahora. (estar)' },
    ],
    blanks: [
      {
        id: 'b1',
        label: 'Desire + que (tú)',
        answer: 'digas',
        options: ['digas', 'dices', 'dijiste', 'decir'],
        hint: 'Yo-form digo → stem dig- + opposite ending -as.',
      },
      {
        id: 'b2',
        label: 'Wish (nosotros)',
        answer: 'tengamos',
        options: ['tengamos', 'tenemos', 'tuvimos', 'tener'],
        hint: 'Yo-form tengo → teng- + -amos after Ojalá.',
      },
      {
        id: 'b3',
        label: 'Impersonal value (ellos)',
        answer: 'sean',
        options: ['sean', 'son', 'están', 'eran'],
        hint: 'Irregular subjunctive stem of ser: sea, seas, sea, seamos, sean.',
      },
      {
        id: 'b4',
        label: 'Certainty clause (ella)',
        answer: 'está',
        options: ['está', 'esté', 'estuviera', 'estar'],
        hint: '“Sé que…” expresses factual certainty, which stays indicative!',
      },
    ],
    explanation:
      'Wishes and value judgments take present subjunctive (digas, tengamos, sean), whereas expressions of certainty like “Sé que” stay indicative (está).',
    misconception:
      'Do not overuse subjunctive after `que`: only uncertainty, emotion, desire, or denial triggers it — certainty takes indicative.',
  },
]

function detectiveToCloze(c: DetectiveCase, seed: number): ClozeProblem {
  const rng = seededRng(seed)
  const correctStep = c.patches[c.correctPatch] ?? c.steps[c.bugLine] ?? ''
  const otherIdx = c.bugLine > 0 ? 0 : Math.min(c.steps.length - 1, 1)
  const otherStep = c.steps[otherIdx] ?? ''
  const blankOther =
    otherIdx !== c.bugLine && otherStep.length > 0 && otherStep.length <= 120
  const otherDistractors = c.steps
    .filter((_, idx) => idx !== otherIdx && idx !== c.bugLine)
    .slice(0, 2)
  const otherOptions = shuffled(
    [otherStep, ...otherDistractors, 'Skip verification step'],
    rng,
  ).slice(0, 4)

  const segments: ClozeSegment[] = []
  const blanks: ClozeBlank[] = []
  c.steps.forEach((step, idx) => {
    if (idx > 0) segments.push({ kind: 'text', text: '\n' })
    if (idx === c.bugLine) {
      segments.push({ kind: 'blank', blankId: 'patch' })
      blanks.push({
        id: 'patch',
        label: `Line ${idx + 1} (repaired step)`,
        answer: correctStep,
        options: shuffled([...c.patches], rng),
        hint: `Inspect why line ${idx + 1} failed: ${c.misconception.slice(0, 95)}…`,
      })
    } else if (blankOther && idx === otherIdx) {
      segments.push({ kind: 'blank', blankId: 'step-a' })
      blanks.push({
        id: 'step-a',
        label: `Line ${idx + 1} (anchor step)`,
        answer: otherStep,
        options: otherOptions.includes(otherStep)
          ? otherOptions
          : shuffled([otherStep, ...otherOptions.slice(0, 3)], rng),
        hint: 'Select the mathematically sound anchor step for this position.',
      })
    } else {
      segments.push({ kind: 'text', text: step })
    }
  })

  return {
    id: `cloze-case-${c.id}`,
    title: c.title,
    subject: c.subject,
    prompt: c.context,
    segments,
    blanks,
    explanation: c.misconception,
    misconception: c.misconception,
  }
}

export function buildClozeProblems(
  packs: readonly ContentPack[],
  cases: readonly DetectiveCase[] = DETECTIVE_CASES,
  seed = 1,
): ClozeProblem[] {
  const list: ClozeProblem[] = [...CURATED_CLOZE_PROBLEMS]
  const rng = seededRng(seed)

  for (const c of cases) {
    list.push(detectiveToCloze(c, seed + hashSeed(c.id)))
  }

  const fillPoolBySubject = new Map<string, string[]>()
  for (const pack of packs) {
    const arr = fillPoolBySubject.get(pack.subject) ?? []
    for (const quiz of pack.quizzes) {
      for (const q of quiz.questions) {
        if (q.type === 'fill' && q.correct.length <= 45) arr.push(q.correct)
      }
    }
    fillPoolBySubject.set(pack.subject, arr)
  }

  let packIdx = 0
  for (const pack of packs) {
    for (const quiz of pack.quizzes) {
      for (const q of quiz.questions) {
        if (q.type === 'order' && q.correct.length >= 3 && q.options.length >= 3) {
          const ordered = q.correct.slice(0, 4).map((idx) => q.options[idx] ?? '')
          if (ordered.some((s) => !s)) continue
          const pool = shuffled([...q.options], rng)
          const segments: ClozeSegment[] = []
          const blanks: ClozeBlank[] = []
          ordered.forEach((ans, stepNum) => {
            if (stepNum > 0) segments.push({ kind: 'text', text: '\n→ ' })
            segments.push({ kind: 'text', text: `Step ${stepNum + 1}: ` })
            segments.push({ kind: 'blank', blankId: `o-${stepNum}` })
            blanks.push({
              id: `o-${stepNum}`,
              label: `Step ${stepNum + 1}`,
              answer: ans,
              options: pool,
              hint: `Identify which stage belongs at Step ${stepNum + 1} of the sequence.`,
            })
          })
          list.push({
            id: `cloze-${pack.id}-order-${packIdx}`,
            title: `${quiz.title}: Ordered Reconstruction`,
            subject: quiz.subject || pack.subject,
            prompt: q.prompt,
            segments,
            blanks,
            explanation: q.explanation || `Exact order: ${ordered.join(' → ')}`,
            misconception: 'Check causal dependencies — each stage must follow its prerequisite.',
          })
          packIdx += 1
        } else if (q.type === 'fill') {
          const subjectTerms = fillPoolBySubject.get(pack.subject) ?? []
          const distractors = shuffled(
            subjectTerms.filter((t) => t.toLowerCase() !== q.correct.toLowerCase()),
            rng,
          ).slice(0, 3)
          if (distractors.length < 2) continue
          const options = shuffled([q.correct, ...distractors], rng)
          const hasBlankToken = /_{2,}/.test(q.prompt)
          const segments: ClozeSegment[] = hasBlankToken
            ? (() => {
                const parts = q.prompt.split(/_{2,}/)
                const segs: ClozeSegment[] = [{ kind: 'text', text: parts[0] ?? '' }]
                segs.push({ kind: 'blank', blankId: 'f0' })
                segs.push({ kind: 'text', text: parts.slice(1).join('___') })
                return segs
              })()
            : [
                { kind: 'text', text: `${q.prompt}\nKey concept / term: ` },
                { kind: 'blank', blankId: 'f0' },
              ]
          list.push({
            id: `cloze-${pack.id}-fill-${packIdx}`,
            title: `${quiz.title}: Term Synthesis`,
            subject: quiz.subject || pack.subject,
            prompt: hasBlankToken ? 'Complete the highlighted blank accurately:' : quiz.description || q.prompt,
            segments,
            blanks: [
              {
                id: 'f0',
                label: 'Target expression',
                answer: q.correct,
                options,
                hint: 'Re-read the surrounding context and check units/terms.',
              },
            ],
            explanation: q.explanation || `Exact term: ${q.correct}`,
            misconception: 'Verify both definition and syntax/units before locking in.',
          })
          packIdx += 1
        }
      }
    }
  }

  return list
}

// ── Knowledge Bastion (Tower Defense pure maps, towers & waves) ──
export const BASTION_COLS = 8
export const BASTION_ROWS = 6
export const BASTION_START_HP = 20
export const BASTION_START_ENERGY = 6
export const BASTION_TOTAL_WAVES = 5

export type BastionTowerId = 'pulse-turret' | 'arc-prism' | 'chrono-pylon'

export interface BastionTowerDef {
  id: BastionTowerId
  name: string
  shortLabel: string
  keyHint: string
  cost: number
  upgradeCost: number
  range: number
  cooldownMs: number
  damage: number
  chainCount: number
  slowFactor: number
  color: string
  description: string
}

export const BASTION_TOWERS: readonly BastionTowerDef[] = [
  {
    id: 'pulse-turret',
    name: 'Pulse Turret',
    shortLabel: 'Pulse',
    keyHint: '1',
    cost: 3,
    upgradeCost: 3,
    range: 2.2,
    cooldownMs: 700,
    damage: 18,
    chainCount: 1,
    slowFactor: 1,
    color: '#0d9488',
    description: 'Rapid precision beam against single targets (+10 dmg per upgrade).',
  },
  {
    id: 'arc-prism',
    name: 'Arc Prism',
    shortLabel: 'Prism',
    keyHint: '2',
    cost: 5,
    upgradeCost: 4,
    range: 2.5,
    cooldownMs: 1150,
    damage: 14,
    chainCount: 3,
    slowFactor: 1,
    color: '#6366f1',
    description: 'Refracted lightning chains across up to 3 clustered enemies.',
  },
  {
    id: 'chrono-pylon',
    name: 'Chrono Pylon',
    shortLabel: 'Chrono',
    keyHint: '3',
    cost: 4,
    upgradeCost: 3,
    range: 2.25,
    cooldownMs: 950,
    damage: 9,
    chainCount: 2,
    slowFactor: 0.55,
    color: '#f59e0b',
    description: 'Slows targets by 45% for 1.8s so turrets can finish them cleanly.',
  },
]

export interface GridCoord {
  col: number
  row: number
}

export interface BastionMapPreset {
  id: string
  name: string
  subtitle: string
  path: readonly GridCoord[]
}

export const BASTION_MAPS: readonly BastionMapPreset[] = [
  {
    id: 'verdant-switchback',
    name: 'Verdant Switchback',
    subtitle: 'Wide double-bend choke points ideal for crossfire towers',
    path: [
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 2, row: 2 },
      { col: 2, row: 3 },
      { col: 2, row: 4 },
      { col: 3, row: 4 },
      { col: 4, row: 4 },
      { col: 4, row: 3 },
      { col: 4, row: 2 },
      { col: 4, row: 1 },
      { col: 5, row: 1 },
      { col: 6, row: 1 },
      { col: 6, row: 2 },
      { col: 6, row: 3 },
      { col: 6, row: 4 },
      { col: 7, row: 4 },
    ],
  },
  {
    id: 'circuit-busline',
    name: 'Circuit Busline',
    subtitle: 'Central islands surrounded by loops for Arc Prism defense',
    path: [
      { col: 0, row: 2 },
      { col: 1, row: 2 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 3, row: 1 },
      { col: 3, row: 2 },
      { col: 3, row: 3 },
      { col: 3, row: 4 },
      { col: 4, row: 4 },
      { col: 5, row: 4 },
      { col: 5, row: 3 },
      { col: 5, row: 2 },
      { col: 6, row: 2 },
      { col: 7, row: 2 },
    ],
  },
  {
    id: 'citadel-spiral',
    name: 'Citadel Spiral',
    subtitle: 'Long inward spiral protecting the central Bastion Keep',
    path: [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
      { col: 5, row: 0 },
      { col: 6, row: 0 },
      { col: 6, row: 1 },
      { col: 6, row: 2 },
      { col: 6, row: 3 },
      { col: 6, row: 4 },
      { col: 5, row: 4 },
      { col: 4, row: 4 },
      { col: 3, row: 4 },
      { col: 2, row: 4 },
      { col: 2, row: 3 },
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
      { col: 4, row: 3 },
    ],
  },
]

export function isBastionPathTile(
  map: BastionMapPreset,
  col: number,
  row: number,
): boolean {
  return map.path.some((p) => p.col === col && p.row === row)
}

export interface BastionWaveSpec {
  wave: number
  label: string
  count: number
  hp: number
  speedTilesPerSec: number
  hasBoss: boolean
  bossHp: number
}

export function bastionWaveSpec(wave: number): BastionWaveSpec {
  const clamped = Math.max(1, Math.min(BASTION_TOTAL_WAVES, wave))
  const labels = [
    'Wave 1 · Blind Guess Scouts',
    'Wave 2 · Sign-Error Sprites',
    'Wave 3 · Unit-Mismatch Bruisers',
    'Wave 4 · Fallacy Phantoms',
    'Wave 5 · Final Exam Titan',
  ]
  return {
    wave: clamped,
    label: labels[clamped - 1] ?? `Wave ${clamped}`,
    count: 5 + clamped * 2,
    hp: 36 + (clamped - 1) * 24,
    speedTilesPerSec: 1.0 + (clamped - 1) * 0.06,
    hasBoss: clamped === BASTION_TOTAL_WAVES,
    bossHp: 460,
  }
}

// ── Diagram Scout (3D Model hotspots across all 12 LAB_MODELS) ───
export interface Scout3dPrompt {
  id: string
  modelId: string
  modelName: string
  subject: string
  hotspotId: string
  prompt: string
  explanation: string
}

export const SCOUT_3D_PROMPTS: readonly Scout3dPrompt[] = [
  // 1. Cell (8 hotspots)
  {
    id: 's3d-cell-membrane',
    modelId: 'cell',
    modelName: 'Eukaryotic Cell',
    subject: 'Biology',
    hotspotId: 'membrane',
    prompt: 'Select the selectively permeable phospholipid boundary regulating what enters and leaves the cell.',
    explanation: 'The plasma membrane uses a fluid lipid bilayer and transport proteins to maintain cellular homeostasis.',
  },
  {
    id: 's3d-cell-nucleus',
    modelId: 'cell',
    modelName: 'Eukaryotic Cell',
    subject: 'Biology',
    hotspotId: 'nucleus',
    prompt: 'Pinpoint the membrane-enclosed command organelle that safeguards chromosomal DNA and transcription.',
    explanation: 'The nucleus houses chromatin inside a double nuclear envelope perforated by nuclear pores.',
  },
  {
    id: 's3d-cell-nucleolus',
    modelId: 'cell',
    modelName: 'Eukaryotic Cell',
    subject: 'Biology',
    hotspotId: 'nucleolus',
    prompt: 'Locate the dense inner nuclear core dedicated to synthesizing ribosomal RNA (rRNA).',
    explanation: 'The nucleolus assembles ribosomal subunits before exporting them to the cytoplasm.',
  },
  {
    id: 's3d-cell-er',
    modelId: 'cell',
    modelName: 'Eukaryotic Cell',
    subject: 'Biology',
    hotspotId: 'er',
    prompt: 'Identify the folded membrane network wrapping the nucleus that folds secretory proteins and lipids.',
    explanation: 'Rough and smooth endoplasmic reticulum synthesize membranes, lipids, and polypeptide chains.',
  },
  {
    id: 's3d-cell-golgi',
    modelId: 'cell',
    modelName: 'Eukaryotic Cell',
    subject: 'Biology',
    hotspotId: 'golgi',
    prompt: 'Find the stacked cis-to-trans cisternae that modify, sort, and ship vesicles toward secretion.',
    explanation: 'The Golgi apparatus adds carbohydrate tags and routes proteins to membranes or lysosomes.',
  },
  {
    id: 's3d-cell-mito',
    modelId: 'cell',
    modelName: 'Eukaryotic Cell',
    subject: 'Biology',
    hotspotId: 'mitochondrion',
    prompt: 'Locate the double-membraned powerhouse carrying cristae folds for oxidative ATP generation.',
    explanation: 'Mitochondria harvest energy from pyruvate and fatty acids via the citric acid cycle and ETC.',
  },
  {
    id: 's3d-cell-lyso',
    modelId: 'cell',
    modelName: 'Eukaryotic Cell',
    subject: 'Biology',
    hotspotId: 'lysosome',
    prompt: 'Pinpoint the acidic digestive organelle packed with hydrolytic enzymes for macromolecule recycling.',
    explanation: 'Lysosomes maintain a low pH (~4.5–5.0) to safely break down worn organelles and macromolecules.',
  },
  {
    id: 's3d-cell-ribo',
    modelId: 'cell',
    modelName: 'Eukaryotic Cell',
    subject: 'Biology',
    hotspotId: 'ribosome',
    prompt: 'Locate the non-membranous ribonucleoprotein complex translating mRNA codons into polypeptide chains.',
    explanation: 'Ribosomes pair tRNA anticodons with mRNA triplets to catalyze peptide bond formation.',
  },
  // 2. DNA Replication Fork (4 hotspots)
  {
    id: 's3d-dna-helicase',
    modelId: 'dna-fork',
    modelName: 'DNA Replication Fork',
    subject: 'Biology',
    hotspotId: 'helicase',
    prompt: 'Select the ATP-driven ring enzyme unzipping hydrogen bonds between complementary DNA bases.',
    explanation: 'DNA helicase separates the parental double helix to expose single-stranded templates.',
  },
  {
    id: 's3d-dna-leading',
    modelId: 'dna-fork',
    modelName: 'DNA Replication Fork',
    subject: 'Biology',
    hotspotId: 'leading',
    prompt: 'Locate the strand polymerized continuously toward the advancing replication fork.',
    explanation: 'Because DNA polymerase reads 3′→5′ template to build 5′→3′, one strand grows uninterrupted.',
  },
  {
    id: 's3d-dna-okazaki',
    modelId: 'dna-fork',
    modelName: 'DNA Replication Fork',
    subject: 'Biology',
    hotspotId: 'okazaki',
    prompt: 'Identify the short discontinuous DNA fragments synthesized away from the opening fork.',
    explanation: 'Okazaki fragments let DNA polymerase maintain 5′→3′ synthesis on the lagging template.',
  },
  {
    id: 's3d-dna-polarity',
    modelId: 'dna-fork',
    modelName: 'DNA Replication Fork',
    subject: 'Biology',
    hotspotId: '5prime-3prime',
    prompt: 'Pinpoint the marker showing why both antiparallel strands obey strict 5′→3′ elongation chemistry.',
    explanation: 'Incoming dNTPs attach only at a free 3′-OH group, dictating opposite fork travel directions.',
  },
  // 3. Neural Synapse (4 hotspots)
  {
    id: 's3d-syn-vesicles',
    modelId: 'synapse-neuro',
    modelName: 'Chemical Synapse',
    subject: 'Biology',
    hotspotId: 'vesicles',
    prompt: 'Select the presynaptic spheres storing neurotransmitter packets before exocytosis.',
    explanation: 'Synaptic vesicles dock at the active zone and fuse with the membrane upon depolarization.',
  },
  {
    id: 's3d-syn-ca',
    modelId: 'synapse-neuro',
    modelName: 'Chemical Synapse',
    subject: 'Biology',
    hotspotId: 'calcium',
    prompt: 'Locate the voltage-gated ion influx trigger that initiates SNARE-mediated vesicle fusion.',
    explanation: 'Ca²⁺ entry converts an electrical action potential into chemical neurotransmitter release.',
  },
  {
    id: 's3d-syn-rec',
    modelId: 'synapse-neuro',
    modelName: 'Chemical Synapse',
    subject: 'Biology',
    hotspotId: 'receptors',
    prompt: 'Identify the postsynaptic ligand-gated proteins opening ion channels when transmitter binds.',
    explanation: 'Receptor binding depolarizes or hyperpolarizes the receiving dendrite.',
  },
  {
    id: 's3d-syn-reuptake',
    modelId: 'synapse-neuro',
    modelName: 'Chemical Synapse',
    subject: 'Biology',
    hotspotId: 'reuptake',
    prompt: 'Find the clearance transporters terminating the signal by reclaiming transmitter from the cleft.',
    explanation: 'Reuptake pumps reset the synapse rapidly so subsequent neural spikes stay distinct.',
  },
  // 4. VSEPR (4 hotspots)
  {
    id: 's3d-vsepr-central',
    modelId: 'vsepr',
    modelName: 'VSEPR Geometry',
    subject: 'Chemistry',
    hotspotId: 'central',
    prompt: 'Select the hub atom whose valence electron domains repel to define overall 3D molecular shape.',
    explanation: 'Electron domains around the central atom minimize mutual electrostatic repulsion.',
  },
  {
    id: 's3d-vsepr-ligand',
    modelId: 'vsepr',
    modelName: 'VSEPR Geometry',
    subject: 'Chemistry',
    hotspotId: 'ligand',
    prompt: 'Locate a bonded outer atom pulled into symmetrical electron-pair separation.',
    explanation: 'Terminal atoms occupy vertices of linear, trigonal, tetrahedral, or octahedral shells.',
  },
  {
    id: 's3d-vsepr-lonepair',
    modelId: 'vsepr',
    modelName: 'VSEPR Geometry',
    subject: 'Chemistry',
    hotspotId: 'lonepair',
    prompt: 'Identify the non-bonding electron cloud exerting stronger repulsion that compresses bond angles.',
    explanation: 'Lone pairs occupy wider angular volume than shared bonding pairs (e.g. squeezing NH₃ to 107°).',
  },
  {
    id: 's3d-vsepr-angle',
    modelId: 'vsepr',
    modelName: 'VSEPR Geometry',
    subject: 'Chemistry',
    hotspotId: 'angle',
    prompt: 'Pinpoint the arc indicating equilibrium separation between two covalent bond axes.',
    explanation: 'Ideal tetrahedral geometry spaces four electron domains at 109.5°.',
  },
  // 5. Carnot Engine (4 hotspots)
  {
    id: 's3d-carnot-piston',
    modelId: 'carnot-cycle',
    modelName: 'Carnot Heat Engine',
    subject: 'Physics',
    hotspotId: 'piston',
    prompt: 'Select the moving mechanical boundary converting gas expansion pressure into useful work.',
    explanation: 'Integral of P dV over piston stroke equals mechanical work extracted per cycle.',
  },
  {
    id: 's3d-carnot-hot',
    modelId: 'carnot-cycle',
    modelName: 'Carnot Heat Engine',
    subject: 'Physics',
    hotspotId: 'hot-res',
    prompt: 'Locate the high-temperature thermal bath supplying isothermal heat Q_H.',
    explanation: 'Carnot efficiency η = 1 − T_C/T_H rises as T_H increases relative to T_C.',
  },
  {
    id: 's3d-carnot-cold',
    modelId: 'carnot-cycle',
    modelName: 'Carnot Heat Engine',
    subject: 'Physics',
    hotspotId: 'cold-res',
    prompt: 'Identify the low-temperature sink accepting unavoidable waste exhaust heat Q_C.',
    explanation: 'The Second Law prohibits 100% heat-to-work conversion without an absolute-zero sink.',
  },
  {
    id: 's3d-carnot-pv',
    modelId: 'carnot-cycle',
    modelName: 'Carnot Heat Engine',
    subject: 'Physics',
    hotspotId: 'pv-loop',
    prompt: 'Pinpoint the closed Pressure-Volume indicator diagram whose enclosed area equals net work.',
    explanation: 'Four reversible legs—two isotherms and two adiabats—maximize efficiency between T_H and T_C.',
  },
  // 6. Kepler (5 hotspots)
  {
    id: 's3d-kep-sun',
    modelId: 'kepler',
    modelName: 'Keplerian Orbit',
    subject: 'Physics',
    hotspotId: 'sun',
    prompt: 'Locate the gravitational star positioned at ONE focus of the elliptical orbit (not the geometric center).',
    explanation: 'Kepler’s First Law places the Sun at a focal point offset by distance c = a·e.',
  },
  {
    id: 's3d-kep-planet',
    modelId: 'kepler',
    modelName: 'Keplerian Orbit',
    subject: 'Physics',
    hotspotId: 'planet',
    prompt: 'Select the orbiting body trading kinetic speed for gravitational potential energy along its ellipse.',
    explanation: 'Angular momentum L = r × mv stays conserved continuously around the orbit.',
  },
  {
    id: 's3d-kep-peri',
    modelId: 'kepler',
    modelName: 'Keplerian Orbit',
    subject: 'Physics',
    hotspotId: 'perihelion',
    prompt: 'Pinpoint the closest orbital approach where speed and gravitational pull reach their maximum.',
    explanation: 'At distance a(1 − e), smaller radius r forces higher orbital velocity v.',
  },
  {
    id: 's3d-kep-aph',
    modelId: 'kepler',
    modelName: 'Keplerian Orbit',
    subject: 'Physics',
    hotspotId: 'aphelion',
    prompt: 'Locate the farthest orbital turning point where the body moves most slowly.',
    explanation: 'At r = a(1 + e), kinetic energy is lowest while gravitational potential peaks.',
  },
  {
    id: 's3d-kep-sectors',
    modelId: 'kepler',
    modelName: 'Keplerian Orbit',
    subject: 'Physics',
    hotspotId: 'sectors',
    prompt: 'Find the equal-time swept triangles demonstrating Kepler’s Second Law.',
    explanation: 'The radius vector sweeps equal areas dA/dt = L/(2m) in equal time intervals.',
  },
  // 7. Lorentz Force (3 hotspots)
  {
    id: 's3d-lor-part',
    modelId: 'lorentz-force',
    modelName: 'Lorentz Helical Motion',
    subject: 'Physics',
    hotspotId: 'particle',
    prompt: 'Select the moving electric charge experiencing force F = q(v × B) perpendicular to velocity.',
    explanation: 'Because magnetic force is always normal to v, magnetic fields do zero work and preserve |v|.',
  },
  {
    id: 's3d-lor-bfield',
    modelId: 'lorentz-force',
    modelName: 'Lorentz Helical Motion',
    subject: 'Physics',
    hotspotId: 'bfield',
    prompt: 'Locate the uniform external vector field acting as the axis around which charges gyrate.',
    explanation: 'Motion parallel to B goes undeflected while perpendicular velocity executes circular cyclotron orbits.',
  },
  {
    id: 's3d-lor-helix',
    modelId: 'lorentz-force',
    modelName: 'Lorentz Helical Motion',
    subject: 'Physics',
    hotspotId: 'helix',
    prompt: 'Identify the corkscrew trajectory produced when velocity has both parallel and perpendicular components.',
    explanation: 'Cyclotron radius r = mv_⊥ / (|q|B) tightens as magnetic field strength B increases.',
  },
  // 8. Wave Optics (3 hotspots)
  {
    id: 's3d-wave-slits',
    modelId: 'wave-optics',
    modelName: 'Double-Slit Interference',
    subject: 'Physics',
    hotspotId: 'slits',
    prompt: 'Select the paired coherent apertures splitting incident wavefronts into interfering beams.',
    explanation: 'Path length difference ΔL = d sin θ determines phase alignment at the far screen.',
  },
  {
    id: 's3d-wave-max',
    modelId: 'wave-optics',
    modelName: 'Double-Slit Interference',
    subject: 'Physics',
    hotspotId: 'central-max',
    prompt: 'Locate the m = 0 bright peak where path difference is zero and waves interfere constructively.',
    explanation: 'Equal distances from both slits guarantee identical phase regardless of wavelength.',
  },
  {
    id: 's3d-wave-env',
    modelId: 'wave-optics',
    modelName: 'Double-Slit Interference',
    subject: 'Physics',
    hotspotId: 'envelope',
    prompt: 'Identify the broad intensity curve set by finite slit width modulating interference fringes.',
    explanation: 'Real double-slit intensity multiplies two-slit cos² interference by a single-slit sinc² diffraction envelope.',
  },
  // 9. Plate Tectonics (4 hotspots)
  {
    id: 's3d-plate-trench',
    modelId: 'plate-tectonics',
    modelName: 'Subduction Zone',
    subject: 'Earth Science',
    hotspotId: 'trench',
    prompt: 'Select the deep seafloor depression formed where dense oceanic lithosphere bends downward.',
    explanation: 'Oceanic trenches mark the surface line where cold basaltic crust dives beneath a lighter plate.',
  },
  {
    id: 's3d-plate-arc',
    modelId: 'plate-tectonics',
    modelName: 'Subduction Zone',
    subject: 'Earth Science',
    hotspotId: 'arc',
    prompt: 'Locate the chain of explosive composite volcanoes fed by flux melting above the descending slab.',
    explanation: 'Water released from subducting crust lowers mantle wedge melting points to feed volcanic arcs.',
  },
  {
    id: 's3d-plate-benioff',
    modelId: 'plate-tectonics',
    modelName: 'Subduction Zone',
    subject: 'Earth Science',
    hotspotId: 'benioff',
    prompt: 'Identify the dipping seismic plane tracing shallow-to-deep earthquakes down the sinking plate.',
    explanation: 'The Wadati-Benioff zone directly maps the geometry of cold subducting lithosphere inside the mantle.',
  },
  {
    id: 's3d-plate-conv',
    modelId: 'plate-tectonics',
    modelName: 'Subduction Zone',
    subject: 'Earth Science',
    hotspotId: 'convection',
    prompt: 'Find the slow solid-state thermal circulation in the asthenosphere driving plate motion.',
    explanation: 'Slab pull, ridge push, and mantle convection recycle crust over tens of millions of years.',
  },
  // 10. Solids of Revolution (3 hotspots)
  {
    id: 's3d-sol-curve',
    modelId: 'solids',
    modelName: 'Solid of Revolution',
    subject: 'Calculus',
    hotspotId: 'curve',
    prompt: 'Select the profile function f(x) whose rotation sweeps out the outer surface of the solid.',
    explanation: 'Each point on y = f(x) defines radial distance from the axis of rotation.',
  },
  {
    id: 's3d-sol-axis',
    modelId: 'solids',
    modelName: 'Solid of Revolution',
    subject: 'Calculus',
    hotspotId: 'axis',
    prompt: 'Locate the centerline symmetry axis around which the bounded planar region is revolved.',
    explanation: 'Distance from the curve to this axis gives cross-sectional radius R(x).',
  },
  {
    id: 's3d-sol-slice',
    modelId: 'solids',
    modelName: 'Solid of Revolution',
    subject: 'Calculus',
    hotspotId: 'slice',
    prompt: 'Identify the thin circular disk cross-section with differential volume πR(x)² dx.',
    explanation: 'Integrating disk areas π[R(x)]² across [a, b] sums every cylindrical wafer into exact volume.',
  },
  // 11. Geodesic Truss (3 hotspots)
  {
    id: 's3d-truss-apex',
    modelId: 'geodesic-truss',
    modelName: '3D Structural Space Frame',
    subject: 'Engineering',
    hotspotId: 'apex',
    prompt: 'Select the upper convergence node distributing vertical roof load purely into axial strut forces.',
    explanation: 'Triangulated nodes turn bending moments into pure tension and compression along struts.',
  },
  {
    id: 's3d-truss-hoop',
    modelId: 'geodesic-truss',
    modelName: '3D Structural Space Frame',
    subject: 'Engineering',
    hotspotId: 'hoop',
    prompt: 'Locate the horizontal ring member resisting outward thrust around the dome perimeter.',
    explanation: 'Base tension rings prevent arched struts from spreading apart under downward load.',
  },
  {
    id: 's3d-truss-coords',
    modelId: 'geodesic-truss',
    modelName: '3D Structural Space Frame',
    subject: 'Engineering',
    hotspotId: 'coords',
    prompt: 'Identify the orthogonal reference vectors establishing equilibrium equations ΣFₓ = ΣF_y = ΣF_z = 0.',
    explanation: '3D static equilibrium resolves every strut force vector into x, y, and z components.',
  },
  // 12. 3D Binary Search Tree (3 hotspots)
  {
    id: 's3d-bst-root',
    modelId: 'bst-3d',
    modelName: 'Binary Search Tree',
    subject: 'Computer Science',
    hotspotId: 'root',
    prompt: 'Select the entry node at depth 0 where every search, insert, and lookup traversal begins.',
    explanation: 'Every key in the left subtree is smaller than the root, and every key on the right is larger.',
  },
  {
    id: 's3d-bst-probe',
    modelId: 'bst-3d',
    modelName: 'Binary Search Tree',
    subject: 'Computer Science',
    hotspotId: 'probe',
    prompt: 'Locate the active search path descending O(h) levels toward the target comparison.',
    explanation: 'Each branch eliminates roughly half of a balanced tree, yielding logarithmic search depth.',
  },
  {
    id: 's3d-bst-avl',
    modelId: 'bst-3d',
    modelName: 'Binary Search Tree',
    subject: 'Computer Science',
    hotspotId: 'avl',
    prompt: 'Identify the height-balance gauge ensuring subtree heights differ by at most 1 via rotations.',
    explanation: 'AVL balance factors in {-1, 0, +1} prevent sorted insertions from degenerating into O(n) chains.',
  },
]

export interface Scout2dPrompt {
  id: string
  title: string
  subject: string
  spec: FigureSpec
  regionId: string
  prompt: string
  explanation: string
}

export const SCOUT_2D_PROMPTS: readonly Scout2dPrompt[] = [
  {
    id: 's2d-unit-cos',
    title: 'Unit Circle Trig Projection',
    subject: 'Algebra',
    spec: {
      template: 'unit-circle',
      givens: { angleDeg: 35 },
      ask: 'cos',
      rounding: 'hundredth',
    },
    regionId: 'cos-leg',
    prompt: 'Pinpoint the horizontal triangle leg representing cos(θ) on the unit circle.',
    explanation: 'On a radius-1 circle centered at the origin, horizontal displacement from the origin equals cos(θ).',
  },
  {
    id: 's2d-unit-sin',
    title: 'Unit Circle Trig Height',
    subject: 'Algebra',
    spec: {
      template: 'unit-circle',
      givens: { angleDeg: 55 },
      ask: 'sin',
      rounding: 'hundredth',
    },
    regionId: 'sin-leg',
    prompt: 'Select the vertical altitude segment measuring sin(θ) for this first-quadrant angle.',
    explanation: 'Vertical displacement from the x-axis to the terminal point equals r·sin(θ) = sin(θ).',
  },
  {
    id: 's2d-parabola-vertex',
    title: 'Quadratic Extremum',
    subject: 'Algebra',
    spec: {
      template: 'parabola-vertex',
      givens: { a: 1, b: -6, c: 5 },
      ask: 'vertexY',
      rounding: 'integer',
    },
    regionId: 'vertex',
    prompt: 'Locate the global minimum point (h, k) where dy/dx = 0 on this upward parabola.',
    explanation: 'For y = x² − 6x + 5, the vertex sits at x = −b/(2a) = 3 and y = −4.',
  },
  {
    id: 's2d-incline-normal',
    title: 'Inclined Plane Reaction Force',
    subject: 'Physics',
    spec: {
      template: 'inclined-plane',
      givens: { mass: 10, angle: 30, mu: 0.15 },
      ask: 'normalForce',
      rounding: 'tenth',
    },
    regionId: 'normal',
    prompt: 'Pinpoint the contact support vector acting perpendicular to the sloped ramp surface.',
    explanation: 'The normal force balances the perpendicular gravity component: N = mg cos(θ).',
  },
  {
    id: 's2d-incline-gravity',
    title: 'Downward Weight Vector',
    subject: 'Physics',
    spec: {
      template: 'inclined-plane',
      givens: { mass: 12, angle: 25, mu: 0.2 },
      ask: 'gravityParallel',
      rounding: 'tenth',
    },
    regionId: 'gravity',
    prompt: 'Select the vertical gravitational weight vector mg pulling straight toward Earth’s center.',
    explanation: 'Total gravitational weight always points straight down; trig splits it into ramp-parallel and normal axes.',
  },
  {
    id: 's2d-circuit-branch',
    title: 'Series–Parallel Network',
    subject: 'Physics',
    spec: {
      template: 'series-parallel-circuit',
      givens: { voltage: 12, r1: 4, r2: 6, r3: 6 },
      ask: 'equivR',
      rounding: 'tenth',
    },
    regionId: 'r2',
    prompt: 'Identify the parallel divider branch splitting current downstream of series resistor R₁.',
    explanation: 'After flowing through R₁ = 4 Ω, current divides across the parallel 6 Ω || 6 Ω pair (R_parallel = 3 Ω).',
  },
  {
    id: 's2d-circuit-source',
    title: 'Circuit EMF Supply',
    subject: 'Physics',
    spec: {
      template: 'series-parallel-circuit',
      givens: { voltage: 24, r1: 3, r2: 12, r3: 4 },
      ask: 'totalCurrent',
      rounding: 'tenth',
    },
    regionId: 'source',
    prompt: 'Pinpoint the DC electromotive battery driving total current I_tot into the network.',
    explanation: 'Total source current satisfies Ohm’s Law I_tot = V / R_eq for the reduced network.',
  },
  {
    id: 's2d-econ-wedge',
    title: 'Tax Deadweight Loss Triangle',
    subject: 'Economics',
    spec: {
      template: 'supply-demand',
      givens: {
        demandIntercept: 100,
        demandSlope: 2,
        supplyIntercept: 20,
        supplySlope: 2,
        tax: 16,
      },
      ask: 'deadweightLoss',
      rounding: 'integer',
    },
    regionId: 'wedge',
    prompt: 'Locate the shaded deadweight loss triangle representing unrealized mutually beneficial trades.',
    explanation: 'An excise tax shrinks traded quantity from Q* to Q_tax, destroying surplus ½ · tax · (Q* − Q_tax).',
  },
  {
    id: 's2d-econ-eq',
    title: 'Market Clearing Point',
    subject: 'Economics',
    spec: {
      template: 'supply-demand',
      givens: {
        demandIntercept: 90,
        demandSlope: 2,
        supplyIntercept: 10,
        supplySlope: 2,
        tax: 0,
      },
      ask: 'eqPrice',
      rounding: 'integer',
    },
    regionId: 'equilibrium',
    prompt: 'Pinpoint the market-clearing intersection where quantity demanded equals quantity supplied.',
    explanation: 'At E*, neither shortage nor surplus persists because marginal willingness to pay matches marginal cost.',
  },
  {
    id: 's2d-stats-mean',
    title: 'Normal Distribution Symmetry',
    subject: 'Statistics',
    spec: {
      template: 'normal-curve',
      givens: { mean: 100, sd: 15, x: 130 },
      ask: 'upperTail',
      rounding: 'thousandth',
    },
    regionId: 'mean',
    prompt: 'Select the center axis where mean, median, and mode coincide on this bell curve.',
    explanation: 'Half of a symmetric Normal distribution lies above μ and half below (z = 0).',
  },
  {
    id: 's2d-stats-tail',
    title: 'Extreme Upper Z-Tail',
    subject: 'Statistics',
    spec: {
      template: 'normal-curve',
      givens: { mean: 50, sd: 10, x: 70 },
      ask: 'upperTail',
      rounding: 'thousandth',
    },
    regionId: 'tail',
    prompt: 'Pinpoint the extreme right tail representing outcomes beyond z = +2 standard deviations.',
    explanation: 'By the empirical rule, only ~2.5% of outcomes exceed μ + 2σ in the upper tail.',
  },
  {
    id: 's2d-vector-tip',
    title: '2D Vector Resultant',
    subject: 'Physics',
    spec: {
      template: 'vector-2d',
      givens: { ux: 4, uy: 1, vx: 2, vy: 5 },
      ask: 'resultantMag',
      rounding: 'hundredth',
    },
    regionId: 'tip',
    prompt: 'Locate the combined tip-to-tail resultant endpoint (ux + vx, uy + vy).',
    explanation: 'Adding component-wise yields R = (6, 6), whose magnitude is √(6² + 6²) ≈ 8.49.',
  },
]


