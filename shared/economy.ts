/**
 * Classroom economy — pure rules shared by the server (the authority) and
 * the client (previews, shop rendering, cosmetics).
 *
 * Coins are earned from points on graded work and spent in the shop on
 * cosmetics. Teachers own the economy: the currency name, the rate, the
 * per-level rewards, and the shop catalog.
 */

import type { CSSProperties } from 'react'

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
