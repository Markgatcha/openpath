import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Coins, RotateCcw, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Button, Card, Chip } from '@/components/ui'
import { fireConfetti } from '@/lib/confetti'
import { isSoundMuted, playVictorySound, setSoundMuted } from '@/lib/sound'
import { arcadeDeliberateGrade, SIEGE } from '@shared/arcade'
import type { Confidence } from '@shared/confidence'
import { arcadeCoinsForRun } from '@shared/economy'
import { buildFigureGeometry, computeAnswer, roundValue } from '@shared/figure'
import { CONTENT_PACKS, type SubjectGroup } from '@shared/packs'
import type { ArcadeMode } from '@shared/schemas'
import type { ReviewGrade } from '@shared/srs'
import type { ArcadeRunResultDTO, SiegeCardDTO } from '@shared/types'

export interface LocalModeStat {
  highScore: number
  bestCombo: number
  runs: number
}

export type LocalArcadeStats = Partial<Record<ArcadeMode, LocalModeStat>>

function storageKey(userId: string | undefined): string {
  return `openpath:arcade:stats:${userId ?? 'anon'}`
}

export function readLocalArcadeStats(userId: string | undefined): LocalArcadeStats {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? (JSON.parse(raw) as LocalArcadeStats) : {}
  } catch {
    return {}
  }
}

export function recordLocalArcadeRun(
  userId: string | undefined,
  mode: ArcadeMode,
  score: number,
  bestCombo: number,
): { isNewHigh: boolean; highScore: number } {
  const all = readLocalArcadeStats(userId)
  const prev = all[mode] ?? { highScore: 0, bestCombo: 0, runs: 0 }
  const isNewHigh = score > prev.highScore && score > 0
  const next: LocalModeStat = {
    highScore: Math.max(prev.highScore, score),
    bestCombo: Math.max(prev.bestCombo, bestCombo),
    runs: prev.runs + 1,
  }
  all[mode] = next
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(all))
  } catch {
    // Ignore storage errors
  }
  return { isNewHigh, highScore: next.highScore }
}

/**
 * Submit an arcade run safely, guaranteeing schema invariants and updating
 * React Query caches + auth store coin balance.
 */
export async function bankArcadeRun(
  input: {
    mode: ArcadeMode
    correct: number
    attempts: number
    bestCombo: number
    comboBursts: number
    score: number
    durationMs: number
    deckId?: string
    qualityScore?: number
    deepUnits?: number
    confidentHits?: number
  },
  onBalance?: (coins: number) => void,
): Promise<ArcadeRunResultDTO | null> {
  const safeCorrect = Math.max(0, Math.round(input.correct))
  const safeAttempts = Math.max(safeCorrect, Math.round(input.attempts))
  const safeCombo = Math.min(safeCorrect, Math.max(0, Math.round(input.bestCombo)))
  const safeBursts = Math.min(Math.floor(safeCorrect / 3), Math.max(0, Math.round(input.comboBursts)))
  const safeDuration = Math.max(Math.round(input.durationMs), safeAttempts * 650, 1000)
  const safeQuality =
    input.qualityScore !== undefined
      ? Math.max(0, Math.min(100, Math.round(input.qualityScore)))
      : undefined
  const safeDeepUnits =
    input.deepUnits !== undefined
      ? Math.max(0, Math.min(500, Math.round(input.deepUnits)))
      : undefined
  const safeConfident =
    input.confidentHits !== undefined
      ? Math.max(0, Math.min(500, Math.round(input.confidentHits)))
      : undefined

  try {
    const res = await api.arcade.submitRun({
      mode: input.mode,
      correct: safeCorrect,
      attempts: safeAttempts,
      bestCombo: safeCombo,
      comboBursts: safeBursts,
      score: Math.max(0, Math.round(input.score)),
      durationMs: safeDuration,
      ...(input.deckId ? { deckId: input.deckId } : {}),
      ...(safeQuality !== undefined ? { qualityScore: safeQuality } : {}),
      ...(safeDeepUnits !== undefined ? { deepUnits: safeDeepUnits } : {}),
      ...(safeConfident !== undefined ? { confidentHits: safeConfident } : {}),
    })
    onBalance?.(res.balance)
    return res
  } catch {
    return null
  }
}

export function ArcadeTopBar({
  title,
  subtitle,
  badge,
  rightSlot,
}: {
  title: string
  subtitle?: string
  badge?: ReactNode
  rightSlot?: ReactNode
}) {
  const [muted, setMuted] = useState(() => isSoundMuted())

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    setSoundMuted(next)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link to="/student/arcade" className="btn-ghost px-3 py-1.5 text-xs">
          <ChevronLeft size={15} /> Arcade Hub
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {rightSlot}
        <button
          type="button"
          onClick={toggleMute}
          className="btn-ghost px-2.5 py-1.5 text-xs"
          aria-label={muted ? 'Unmute arcade sound effects' : 'Mute arcade sound effects'}
          title={muted ? 'Sound muted' : 'Sound on'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  )
}

export function ArcadePayoutView({
  mode,
  title,
  score,
  correct,
  attempts,
  bestCombo,
  comboBursts,
  qualityScore,
  deepUnits,
  confidentHits,
  extraStats,
  result,
  isNewHigh,
  onPlayAgain,
}: {
  mode: ArcadeMode
  title: string
  score: number
  correct: number
  attempts: number
  bestCombo: number
  comboBursts: number
  qualityScore?: number
  deepUnits?: number
  confidentHits?: number
  extraStats?: { label: string; value: string }[]
  result: ArcadeRunResultDTO | null
  isNewHigh: boolean
  onPlayAgain: () => void
}) {
  const previewWorth = arcadeCoinsForRun({
    mode,
    correct,
    bestCombo,
    comboBursts,
    qualityScore: qualityScore !== undefined ? qualityScore / 100 : undefined,
    deepUnits,
    confidentHits,
  })
  const earned = result ? result.coinsEarned : previewWorth
  const icon = result?.currencyIcon ?? '🪙'
  const currency = result?.currencyName ?? 'Coins'
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0

  return (
    <Card className="mx-auto flex max-w-2xl flex-col gap-5 p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="chip bg-brand-500/15 text-brand-600 dark:text-brand-300">
            Run Complete
          </span>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {title}
          </h2>
        </div>
        {isNewHigh && (
          <Chip color="amber">
            <Sparkles size={13} /> New Personal Best!
          </Chip>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Score
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {score.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Accuracy
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold text-emerald-500">
            {accuracy}%
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Best Combo
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold text-brand-500">
            {bestCombo}×
          </div>
        </div>
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
            Payout
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold text-amber-600 dark:text-amber-300">
            +{earned} {icon}
          </div>
        </div>
      </div>

      {extraStats && extraStats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {extraStats.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg border border-slate-200/60 px-3 py-2 text-xs dark:border-white/10"
            >
              <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs dark:border-white/10 dark:bg-ink-900">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
            <Coins size={14} className="text-amber-500" />
            Wallet: {result.balance} {currency} {result.currencyIcon}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Daily Arcade Allowance: {result.earnedToday} / {result.dailyCap} {result.currencyIcon}
            {result.capped ? ' (daily cap reached!)' : ''}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={onPlayAgain}>
          <RotateCcw size={16} /> Play Again
        </Button>
        <Link to="/student/arcade" className="btn-ghost">
          <Trophy size={16} /> Back to Arcade Hub
        </Link>
      </div>
    </Card>
  )
}

export function useFinishArcadeRun(mode: ArcadeMode) {
  const { user, setUser } = useAuth()
  const queryClient = useQueryClient()

  return async (payload: {
    score: number
    correct: number
    attempts: number
    bestCombo: number
    comboBursts: number
    durationMs: number
    deckId?: string
    qualityScore?: number
    deepUnits?: number
    confidentHits?: number
  }) => {
    const local = recordLocalArcadeRun(user?.id, mode, payload.score, payload.bestCombo)
    if (payload.correct > 0) {
      playVictorySound()
      if (local.isNewHigh) fireConfetti()
    }
    const res = await bankArcadeRun(
      { mode, ...payload },
      (balance) => {
        if (user) setUser({ ...user, coins: balance })
      },
    )
    void queryClient.invalidateQueries({ queryKey: ['arcade-summary'] })
    void queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
    return { result: res, isNewHigh: local.isNewHigh }
  }
}

/**
 * Shared FSRS bridge for untimed & deliberate arcade modes so answers against
 * real curriculum/flashcard `questionId`s update spaced-repetition stability
 * cleanly (skipping synthetic `pack:` IDs and never penalizing think time).
 */
export function useArcadeSrsBridge(options?: { untimed?: boolean }) {
  const queryClient = useQueryClient()
  const untimed = options?.untimed ?? true
  const reviewedRef = useRef<Set<string>>(new Set())

  const recordAnswer = useCallback(
    async (
      questionId: string | undefined | null,
      correct: boolean,
      confidence?: Confidence | null,
      msTaken?: number,
    ) => {
      if (!questionId || questionId.startsWith('pack:') || reviewedRef.current.has(questionId)) {
        return
      }
      reviewedRef.current.add(questionId)
      const grade: ReviewGrade = untimed
        ? arcadeDeliberateGrade(correct, confidence)
        : !correct
          ? 'again'
          : (msTaken ?? 0) > SIEGE.slowMs
            ? 'hard'
            : 'good'
      try {
        await api.srs.review({ questionId, grade })
        void queryClient.invalidateQueries({ queryKey: ['srs-due'] })
        void queryClient.invalidateQueries({ queryKey: ['srs-stats'] })
      } catch {
        // Non-blocking: arcade sessions continue cleanly if offline.
      }
    },
    [queryClient, untimed],
  )

  const resetSession = useCallback(() => {
    reviewedRef.current.clear()
  }, [])

  return { recordAnswer, resetSession }
}

/**
 * Matches subject/category strings loosely against a SubjectGroup filter.
 */
export function matchesSubjectFilter(subject: string | undefined, filter: string): boolean {
  if (!filter || filter === 'All') return true
  if (!subject) return true
  const s = subject.toLowerCase()
  const f = filter.toLowerCase()
  if (s.includes(f)) return true
  if (f === 'math') return ['algebra', 'geometry', 'calculus', 'statistics', 'math', 'quant'].some((k) => s.includes(k))
  if (f === 'science') return ['physics', 'chemistry', 'biology', 'earth', 'neuro', 'astro', 'thermo', 'science', 'ecology', 'climate'].some((k) => s.includes(k))
  if (f === 'cs') return ['computer', 'algorithm', 'data', 'security'].some((k) => s.includes(k))
  if (f === 'economics') return ['econ', 'finance'].some((k) => s.includes(k))
  if (f === 'history') return ['history', 'civics', 'social', 'geography', 'government'].some((k) => s.includes(k))
  if (f === 'languages') return ['spanish', 'english', 'rhetoric', 'language', 'literature'].some((k) => s.includes(k))
  if (f === 'humanities') return ['philosophy', 'ethics', 'logic', 'history', 'literature'].some((k) => s.includes(k))
  if (f === 'health' || f === 'health & medicine') return ['health', 'medicine', 'anatomy', 'physiology', 'medical'].some((k) => s.includes(k))
  if (f === 'engineering') return ['engineering', 'statics', 'circuit', 'mechanics'].some((k) => s.includes(k))
  return false
}

/**
 * Builds local SiegeCardDTO cards from CONTENT_PACKS when a student wants a
 * specific subject pack or has an empty SRS queue.
 */
export function buildPackCards(subjectFilter = 'All', packId?: string): SiegeCardDTO[] {
  const packs = packId
    ? CONTENT_PACKS.filter((p) => p.id === packId)
    : CONTENT_PACKS.filter((p) =>
        subjectFilter === 'All'
          ? true
          : p.category.toLowerCase() === subjectFilter.toLowerCase() ||
            matchesSubjectFilter(p.subject, subjectFilter),
      )
  const sourcePacks = packs.length > 0 ? packs : CONTENT_PACKS
  const out: SiegeCardDTO[] = []

  sourcePacks.forEach((pack) => {
    pack.quizzes.forEach((quiz, qzIdx) => {
      quiz.questions.forEach((q, qIdx) => {
        let answer = ''
        let options: string[] | null = null
        let figure = null
        if (q.type === 'mcq') {
          options = q.options
          answer = q.options[q.correct] ?? ''
        } else if (q.type === 'truefalse') {
          answer = q.correct ? 'True' : 'False'
        } else if (q.type === 'fill') {
          answer = q.correct
        } else if (q.type === 'order') {
          answer = q.correct.map((i) => q.options[i]).join(' → ')
        } else if (q.type === 'figure') {
          answer = String(roundValue(computeAnswer(q.figure), q.figure.rounding))
          figure = buildFigureGeometry(q.figure)
        }
        out.push({
          questionId: `pack:${pack.id}:${qzIdx}:${qIdx}`,
          quizId: `pack:${pack.id}`,
          quizTitle: quiz.title,
          subject: quiz.subject,
          prompt: q.prompt,
          type: q.type,
          isNew: true,
          answer,
          explanation: q.explanation ?? '',
          category: pack.id,
          state: null,
          options,
          figure,
          pool: 'new',
        })
      })
    })
  })
  return out
}

export type { SubjectGroup }
