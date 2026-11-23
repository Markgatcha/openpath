/**
 * Classroom economy — pure rules shared by the server (the authority) and
 * the client (previews, shop rendering, cosmetics).
 *
 * Coins are earned from points on graded work and spent in the shop on
 * cosmetics. Teachers own the economy: the currency name, the rate, the
 * per-level rewards, and the shop catalog.
 */

import type { CSSProperties } from 'react'
import type { ArcadeMode } from './schemas'

// ── Graded-work kinds ─────────────────────────────────────────
export const QUIZ_KINDS = ['homework', 'classwork', 'quiz', 'test'] as const
export type QuizKind = (typeof QUIZ_KINDS)[number]

export const KIND_LABELS: Record<QuizKind, string> = {
  homework: 'Homework',
  classwork: 'Classwork',
  quiz: 'Quiz',
  test: 'Test',
}

/** Stakes scale with weight: tests pay double homework. */
export const KIND_MULTIPLIER: Record<QuizKind, number> = {
  homework: 1,
  classwork: 1,
  quiz: 1.5,
  test: 2,
}

/** Points → coins for one finished run, floored so rates stay tidy. */
export function coinsForPoints(
  points: number,
  kind: QuizKind,
  pointsPerCoin: number,
): number {
  if (pointsPerCoin <= 0 || points <= 0) return 0
  return Math.floor((points * (KIND_MULTIPLIER[kind] ?? 1)) / pointsPerCoin)
}

// ── Cosmetics ─────────────────────────────────────────────────
export const GRADIENT_DIRECTIONS = [
  'south-north',
  'north-south',
  'west-east',
  'east-west',
  'diagonal',
] as const
export type GradientDirection = (typeof GRADIENT_DIRECTIONS)[number]

export const DIRECTION_LABELS: Record<GradientDirection, string> = {
  'south-north': 'South → North',
  'north-south': 'North → South',
  'west-east': 'West → East',
  'east-west': 'East → West',
  diagonal: 'Diagonal',
}

/** CSS angle for each named flow direction. */
const DIRECTION_ANGLE: Record<GradientDirection, string> = {
  'south-north': '0deg',
  'north-south': '180deg',
  'west-east': '90deg',
  'east-west': '270deg',
  diagonal: '135deg',
}

const HEX = /^#[0-9a-fA-F]{6}$/

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value)
}

export interface SolidPaint {
  type: 'solid'
  color: string
}

export interface GradientPaint {
  type: 'gradient'
  from: string
  to: string
  direction: GradientDirection
}

export type Paint = SolidPaint | GradientPaint

export type Nameplate =
  | SolidPaint
  | GradientPaint
  | { type: 'image'; image: string }

export interface Cosmetics {
  background: Paint
  nameStyle: Paint
  font: string | null
  nameplate: Nameplate | null
}

export const DEFAULT_COSMETICS: Cosmetics = {
  background: { type: 'solid', color: '#8b5cf6' },
  nameStyle: { type: 'solid', color: '#8b5cf6' },
  font: null,
  nameplate: null,
}

/** CSS background value for a paint (empty string = leave the theme alone). */
export function paintToCss(paint: Paint | null): string {
  if (!paint) return ''
  if (paint.type === 'solid') return paint.color
  return `linear-gradient(${DIRECTION_ANGLE[paint.direction] ?? '180deg'}, ${paint.from}, ${paint.to})`
}

/** Inline style for painting text with a solid color or a gradient. */
export function paintToTextStyle(paint: Paint | null): CSSProperties {
  if (!paint) return {}
  if (paint.type === 'solid') return { color: paint.color }
  return {
    backgroundImage: paintToCss(paint),
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  }
}

/** System-safe font catalog — no web downloads, privacy intact. */
export const FONT_CATALOG = [
  { id: 'georgia', label: 'Georgia (serif)', stack: 'Georgia, "Times New Roman", serif' },
  { id: 'courier', label: 'Courier (mono)', stack: '"Courier New", monospace' },
  { id: 'trebuchet', label: 'Trebuchet (sans)', stack: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { id: 'verdana', label: 'Verdana (sans)', stack: 'Verdana, Geneva, sans-serif' },
  { id: 'impact', label: 'Impact (display)', stack: 'Impact, "Arial Black", sans-serif' },
  { id: 'palatino', label: 'Palatino (serif)', stack: '"Palatino Linotype", "Book Antiqua", serif' },
] as const

export type FontId = (typeof FONT_CATALOG)[number]['id']

export function fontStack(fontId: string | null | undefined): string | undefined {
  if (!fontId) return undefined
  return FONT_CATALOG.find((font) => font.id === fontId)?.stack
}

// ── Shop categories ───────────────────────────────────────────
export const SHOP_CATEGORIES = [
  'background',
  'nameplate',
  'name-style',
  'font',
] as const
export type ShopCategory = (typeof SHOP_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  background: 'App background',
  nameplate: 'Leaderboard nameplate',
  'name-style': 'Name colour',
  font: 'Name font',
}

/** Default seeded price ladder for the starter catalog. */
export const DEFAULT_SHOP_PRICES: Record<ShopCategory, number> = {
  background: 60,
  nameplate: 50,
  'name-style': 30,
  font: 120,
}

// ── Arcade payouts ────────────────────────────────────────────
// Solo arcade games pay a small, capped allowance so they reward
// practice without out-earning graded work: one run tops out at
// ARCADE_RUN_COIN_CAP and a student can bank at most
// ARCADE_DAILY_COIN_CAP per day across every arcade mode. The server
// is the authority (it clamps to the remaining daily allowance); the
// client uses the same function to preview a run's payout.

export const ARCADE_RUN_COIN_CAP = 25
export const ARCADE_DAILY_COIN_CAP = 120

/** Every third consecutive hit is a "burst" (confetti + bonus coins). */
export const COMBO_BURST_EVERY = 3

export function isComboBurst(combo: number): boolean {
  return combo > 0 && combo % COMBO_BURST_EVERY === 0
}

export interface ArcadeRunTally {
  mode: ArcadeMode
  correct: number
  bestCombo: number
  comboBursts: number
  qualityScore?: number
  deepUnits?: number
  confidentHits?: number
}

/** Coins one arcade run is worth before the daily cap is applied. */
export function arcadeCoinsForRun(run: ArcadeRunTally): number {
  const rawQuality = run.qualityScore ?? 0
  const quality = Math.max(0, Math.min(1, rawQuality > 1 ? rawQuality / 100 : rawQuality))
  const deep = Math.max(0, run.deepUnits ?? 0)
  const confident = Math.max(0, run.confidentHits ?? 0)
  if (run.correct <= 0 && deep <= 0) return 0
  const bursts = Math.max(0, Math.min(run.comboBursts, Math.floor(run.correct / COMBO_BURST_EVERY)))
  let raw = 0
  switch (run.mode) {
    case 'speed-match':
      raw = Math.floor(run.correct / 3) + bursts * 2 + (run.bestCombo >= 8 ? 4 : 0)
      break
    case 'step-detective':
      raw = run.correct * 2 + bursts * 2 + (run.bestCombo >= 4 ? 3 : 0)
      break
    case 'sim-sandbox':
    case 'orbit-pilot':
      raw = run.correct * 3 + bursts * 2 + (run.bestCombo >= 3 ? 3 : 0)
      break
    case 'sequence-architect':
      raw = run.correct * 2 + bursts * 2 + (run.bestCombo >= 4 ? 3 : 0)
      break
    case 'boss-raid':
      raw = Math.ceil(run.correct * 0.75) + bursts * 2 + (run.bestCombo >= 6 ? 4 : 0)
      break
    case 'certainty-vault':
      raw = Math.round(run.correct * 1.2 + confident * 0.8 + quality * 6 + bursts)
      break
    case 'diagram-scout':
      raw = Math.round(run.correct * 2 + quality * 5 + bursts * 2)
      break
    case 'cloze-workbench':
      raw = Math.round(run.correct * 1.4 + deep * 2.5 + quality * 5 + bursts)
      break
    case 'knowledge-bastion':
      raw = Math.round(run.correct * 0.8 + deep * 3 + quality * 6 + bursts)
      break
    case 'streak-siege':
    default:
      raw = Math.floor(run.correct / 3) + Math.floor(run.bestCombo / 4) * 2 + bursts
      break
  }
  return Math.max(0, Math.min(ARCADE_RUN_COIN_CAP, raw))
}
