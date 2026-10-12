/**
 * Pure gamification math shared by the server (source of truth for XP)
 * and the client (for previews and animated progress bars).
 */

export type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.25,
  hard: 1.5,
}

/** XP required to *reach* a level. Level 1 starts at 0 XP. */
export function xpForLevel(level: number): number {
  return 25 * level * (level - 1)
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level += 1
  return level
}

export interface XpProgress {
  level: number
  /** XP at which the current level started */
  floor: number
  /** XP needed for the next level */
  ceil: number
  /** XP earned in the current level */
  into: number
  /** XP still needed for the next level */
  need: number
  /** 0..1 progress toward the next level */
  pct: number
}

export function xpProgress(xp: number): XpProgress {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  const into = xp - floor
  const need = ceil - floor
  return { level, floor, ceil, into, need, pct: need === 0 ? 0 : into / need }
}

/** Streak bonus multiplier: +10% per consecutive correct answer, capped at +100% */
export function comboMultiplier(combo: number): number {
  return 1 + Math.min(Math.max(combo, 0), 10) * 0.1
}

export interface AttemptStats {
  correct: number
  total: number
  comboBest: number
  avgMs: number
  difficulty: Difficulty
  timeUsedSec: number
  timeLimitSec: number | null
}

/**
 * XP for a finished attempt: correctness is king, but combos, speed,
 * difficulty, and perfection all pay dividends.
 */
export function computeXp(stats: AttemptStats): number {
  const multiplier = DIFFICULTY_MULTIPLIER[stats.difficulty] ?? 1
  const accuracy = stats.total > 0 ? stats.correct / stats.total : 0
  const base = stats.correct * 20 * multiplier
  const comboBonus = stats.comboBest * 5
  const timeBonus =
    stats.timeLimitSec !== null && stats.timeUsedSec < stats.timeLimitSec * 0.5
      ? 15
      : 0
  const perfectBonus = stats.total > 0 && stats.correct === stats.total ? 25 : 0
  const accuracyFactor = 0.5 + 0.5 * accuracy
  return Math.round(
    (base + comboBonus + timeBonus + perfectBonus) * accuracyFactor,
  )
}

export function todayStr(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** A streak survives if the last active day was yesterday; it resets otherwise. */
export function nextStreak(
  lastActive: string | null,
  current: number,
  now: Date = new Date(),
): number {
  const today = todayStr(now)
  if (!lastActive) return 1
  if (lastActive === today) return current
  const yesterday = new Date(now.getTime() - 86_400_000)
  return lastActive === todayStr(yesterday) ? current + 1 : 1
}

export const AVATAR_COLORS = [
  '#8b5cf6',
  '#06b6d4',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#ec4899',
  '#3b82f6',
  '#f97316',
] as const
