import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Flame, Play, Shield, Timer, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card, Chip, Spinner } from '@/components/ui'
import { FigureCanvas } from '@/components/FigureCanvas'
import { cn } from '@/lib/utils'
import { isTypingTarget } from '@/lib/a11y'
import {
  fireComboBurst,
  playBurstSound,
  playHitSound,
  playMissSound,
  playShieldBreakSound,
} from '@/lib/sound'
import {
  SIEGE,
  buildChoices,
  hashSeed,
  seededRng,
  shuffled,
  siegeGrade,
  siegePoints,
  siegeTimeBonus,
} from '@shared/arcade'
import { isComboBurst } from '@shared/economy'
import type { ArcadeRunResultDTO, SiegeCardDTO } from '@shared/types'
import {
  ArcadePayoutView,
  ArcadeTopBar,
  buildPackCards,
  matchesSubjectFilter,
  useFinishArcadeRun,
} from './arcade-common'

type Phase = 'ready' | 'playing' | 'feedback' | 'done'

export function StreakSiegeGame() {
  const [searchParams] = useSearchParams()
  const subjectFilter = searchParams.get('subject') ?? 'All'
  const packFilter = searchParams.get('pack') ?? ''
  const queryClient = useQueryClient()
  const finishRun = useFinishArcadeRun('streak-siege')

  const { data: siegeData, isLoading } = useQuery({
    queryKey: ['srs-siege'],
    queryFn: api.srs.siege,
  })

  // Combine server FSRS cards (filtered by subject if chosen) with pack fallback if empty
  const deck = useMemo<SiegeCardDTO[]>(() => {
    if (packFilter) {
      return buildPackCards(subjectFilter, packFilter)
    }
    const serverCards = (siegeData?.cards ?? []).filter((c) =>
      matchesSubjectFilter(c.subject ?? c.quizTitle, subjectFilter),
    )
    if (serverCards.length >= 4) return serverCards
    return [...serverCards, ...buildPackCards(subjectFilter)]
  }, [siegeData?.cards, subjectFilter, packFilter])

  const [phase, setPhase] = useState<Phase>('ready')
  const [runSeed, setRunSeed] = useState(() => Date.now())
  const [queue, setQueue] = useState<SiegeCardDTO[]>([])
  const [cursor, setCursor] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number>(SIEGE.startSeconds)
  const [shield, setShield] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [comboBursts, setComboBursts] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [score, setScore] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [feedback, setFeedback] = useState<{
    picked: number
    correctIndex: number
    wasCorrect: boolean
    deltaSec: number
    gradeLabel: string
  } | null>(null)
  const [payout, setPayout] = useState<{
    result: ArcadeRunResultDTO | null
    isNewHigh: boolean
  } | null>(null)

  const runStartRef = useRef<number>(0)
  const cardStartRef = useRef<number>(0)
  const gradedIdsRef = useRef<Set<string>>(new Set())
  const finishingRef = useRef(false)

  const currentCard = queue[cursor % Math.max(1, queue.length)] ?? null

  const roundChoices = useMemo(() => {
    if (!currentCard) return { choices: [], correctIndex: 0 }
    return buildChoices(
      currentCard,
      deck,
      hashSeed(`${runSeed}:${cursor}:${currentCard.questionId}`),
    )
  }, [currentCard, deck, runSeed, cursor])

  const startRun = () => {
    const seed = Date.now()
    const rng = seededRng(seed)
    const dueFirst = [
      ...deck.filter((c) => c.pool === 'due'),
      ...deck.filter((c) => c.pool === 'weak'),
      ...shuffled(
        deck.filter((c) => c.pool === 'new'),
        rng,
      ),
    ]
    setRunSeed(seed)
    setQueue(dueFirst.length > 0 ? dueFirst : buildPackCards(subjectFilter))
    setCursor(0)
    setTimeLeft(SIEGE.startSeconds)
    setShield(0)
    setCombo(0)
    setBestCombo(0)
    setComboBursts(0)
    setCorrect(0)
    setAttempts(0)
    setScore(0)
    setReviewedCount(0)
    setFeedback(null)
    setPayout(null)
    gradedIdsRef.current = new Set()
    finishingRef.current = false
    const now = performance.now()
    runStartRef.current = now
    cardStartRef.current = now
    setPhase('playing')
  }

  const endRun = useCallback(
    async (finalVals: {
      score: number
      correct: number
      attempts: number
      bestCombo: number
      comboBursts: number
    }) => {
      if (finishingRef.current) return
      finishingRef.current = true
      setPhase('done')
      const durationMs = Math.max(1000, Math.round(performance.now() - runStartRef.current))
      const banked = await finishRun({ ...finalVals, durationMs })
      setPayout(banked)
      void queryClient.invalidateQueries({ queryKey: ['srs-stats'] })
      void queryClient.invalidateQueries({ queryKey: ['srs-siege'] })
    },
    [finishRun, queryClient],
  )

  // Countdown tick while playing
  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) return 0
        return Math.round((prev - 0.1) * 10) / 10
      })
    }, 100)
    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      void endRun({ score, correct, attempts, bestCombo, comboBursts })
    }
  }, [phase, timeLeft, score, correct, attempts, bestCombo, comboBursts, endRun])

  const advanceCard = useCallback(() => {
    setFeedback(null)
    if (timeLeft <= 0) {
      void endRun({ score, correct, attempts, bestCombo, comboBursts })
      return
    }
    setCursor((c) => c + 1)
    cardStartRef.current = performance.now()
    setPhase('playing')
  }, [timeLeft, score, correct, attempts, bestCombo, comboBursts, endRun])

  // Auto-advance after feedbackMs
  useEffect(() => {
    if (phase !== 'feedback') return
    const t = window.setTimeout(advanceCard, SIEGE.feedbackMs)
    return () => window.clearTimeout(t)
  }, [phase, advanceCard])

  const handlePick = useCallback(
    (choiceIdx: number) => {
      if (phase !== 'playing' || !currentCard) return
      const msTaken = Math.max(250, Math.round(performance.now() - cardStartRef.current))
      const isRight = choiceIdx === roundChoices.correctIndex
      const grade = siegeGrade(isRight, msTaken)

      // Update FSRS stability in SQLite on the first encounter of any real DB question
      if (!currentCard.questionId.startsWith('pack:') && !gradedIdsRef.current.has(currentCard.questionId)) {
        gradedIdsRef.current.add(currentCard.questionId)
        setReviewedCount((n) => n + 1)
        void api.srs.review({ questionId: currentCard.questionId, grade }).catch(() => {})
      }

      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)

      if (isRight) {
        const nextCombo = combo + 1
        const nextBest = Math.max(bestCombo, nextCombo)
        const nextShield = Math.min(SIEGE.maxShield, shield + 1)
        const bonusSec = siegeTimeBonus(correct, shield)
        const pts = siegePoints(nextCombo, nextShield, msTaken)
        const burst = isComboBurst(nextCombo)
        const nextBursts = burst ? comboBursts + 1 : comboBursts

        if (burst) {
          playBurstSound()
          fireComboBurst()
        } else {
          playHitSound(nextCombo)
        }

        setCorrect((c) => c + 1)
        setCombo(nextCombo)
        setBestCombo(nextBest)
        setComboBursts(nextBursts)
        setShield(nextShield)
        setScore((s) => s + pts)
        setTimeLeft((t) => Math.min(SIEGE.maxSeconds, Math.round((t + bonusSec) * 10) / 10))
        setFeedback({
          picked: choiceIdx,
          correctIndex: roundChoices.correctIndex,
          wasCorrect: true,
          deltaSec: bonusSec,
          gradeLabel: grade === 'hard' ? 'Slow (>9s) → FSRS Hard' : 'Clean → FSRS Good',
        })
        setPhase('feedback')
      } else {
        if (shield > 0) playShieldBreakSound()
        else playMissSound()

        const nextTime = Math.max(0, Math.round((timeLeft - SIEGE.penaltySeconds) * 10) / 10)
        setCombo(0)
        setShield(0)
        setTimeLeft(nextTime)
        setFeedback({
          picked: choiceIdx,
          correctIndex: roundChoices.correctIndex,
          wasCorrect: false,
          deltaSec: -SIEGE.penaltySeconds,
          gradeLabel: 'Miss → FSRS Again & Shield Broken',
        })
        setPhase('feedback')
      }
    },
    [
      phase,
      currentCard,
      roundChoices.correctIndex,
      attempts,
      combo,
      bestCombo,
      shield,
      correct,
      comboBursts,
      timeLeft,
    ],
  )

  // Keyboard 1–4 & Enter/Space skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (phase === 'playing') {
        const idx = Number(e.key) - 1
        if (idx >= 0 && idx < roundChoices.choices.length) {
          e.preventDefault()
          handlePick(idx)
        }
      } else if (phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        advanceCard()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, roundChoices.choices.length, handlePick, advanceCard])

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <ArcadeTopBar
        title="Streak Siege"
        subtitle="45s FSRS survival blitz — fast hits bank shield pips & time; >9s drops grade to Hard"
        badge={<Chip color="emerald">{subjectFilter}</Chip>}
      />

      {phase === 'ready' && (
        <Card className="mx-auto flex max-w-2xl flex-col gap-5 p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-3xl">
              🛡️
            </span>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                Hold the Line: {deck.length} Cards Armed
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Starts at <strong>45.0s</strong> (cap 90s). Every right answer fills up to{' '}
                <strong>3 Shield Pips</strong> and adds time via <code>siegeTimeBonus()</code>.
              </p>
            </div>
          </div>

          <ul className="grid gap-2.5 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
            <li className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
              <strong className="block text-emerald-600 dark:text-emerald-300">
                ⚡ Fast Hit (&le;9s)
              </strong>
              Grades card as <code>good</code> in FSRS, builds combo &amp; adds +1 shield pip.
            </li>
            <li className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
              <strong className="block text-amber-600 dark:text-amber-300">
                🐢 Slow Hit (&gt;9s)
              </strong>
              Still banks time, but drops FSRS grade to <code>hard</code> so you review sooner.
            </li>
            <li className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
              <strong className="block text-rose-600 dark:text-rose-300">💥 Wrong Answer</strong>
              Deducts <strong>−8s</strong>, shatters all shield pips, and resets combo.
            </li>
          </ul>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Tip: Press keys <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono dark:bg-white/10">1</kbd>–
              <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono dark:bg-white/10">4</kbd> for instant selection.
            </span>
            <Button onClick={startRun}>
              <Play size={16} /> Start 45s Siege
            </Button>
          </div>
        </Card>
      )}

      {(phase === 'playing' || phase === 'feedback') && currentCard && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {/* HUD Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="flex items-center gap-2.5 p-3.5">
              <Timer
                size={20}
                className={cn(
                  timeLeft <= 10 ? 'animate-pulse text-rose-500' : 'text-emerald-500',
                )}
              />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Clock</div>
                <div
                  className={cn(
                    'font-mono text-xl font-extrabold',
                    timeLeft <= 10
                      ? 'text-rose-500'
                      : 'text-slate-900 dark:text-white',
                  )}
                >
                  {timeLeft.toFixed(1)}s
                </div>
              </div>
            </Card>

            <Card className="flex items-center gap-2.5 p-3.5">
              <Shield size={20} className="text-cyan-500" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Shield ({shield}/3)
                </div>
                <div className="mt-1 flex gap-1.5">
                  {[0, 1, 2].map((pip) => (
                    <span
                      key={pip}
                      className={cn(
                        'h-3 w-6 rounded-full transition-all',
                        pip < shield
                          ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]'
                          : 'bg-slate-200 dark:bg-white/10',
                      )}
                    />
                  ))}
                </div>
              </div>
            </Card>

            <Card className="flex items-center gap-2.5 p-3.5">
              <Flame size={20} className="text-amber-500" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Combo</div>
                <div className="font-mono text-xl font-extrabold text-amber-500">{combo}×</div>
              </div>
            </Card>

            <Card className="flex items-center gap-2.5 p-3.5">
              <Zap size={20} className="text-brand-500" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Score</div>
                <div className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
                  {score.toLocaleString()}
                </div>
              </div>
            </Card>
          </div>

          {/* Active Card */}
          <Card className="flex flex-col gap-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Chip color={currentCard.pool === 'due' ? 'amber' : currentCard.pool === 'weak' ? 'rose' : 'brand'}>
                  {currentCard.pool} card
                </Chip>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {currentCard.quizTitle}
                </span>
              </div>
              {feedback && (
                <span
                  className={cn(
                    'font-mono text-xs font-bold',
                    feedback.wasCorrect ? 'text-emerald-500' : 'text-rose-500',
                  )}
                >
                  {feedback.deltaSec > 0 ? `+${feedback.deltaSec}s` : `${feedback.deltaSec}s`} ·{' '}
                  {feedback.gradeLabel}
                </span>
              )}
            </div>

            <h2 className="font-display text-lg font-bold leading-relaxed text-slate-900 dark:text-white">
              {currentCard.prompt}
            </h2>

            {currentCard.figure && (
              <div className="flex justify-center">
                <FigureCanvas geometry={currentCard.figure} size={220} />
              </div>
            )}

            <div className="grid gap-2.5 sm:grid-cols-2">
              {roundChoices.choices.map((choice, idx) => {
                const isCorrectChoice = feedback && idx === feedback.correctIndex
                const isWrongPick = feedback && !feedback.wasCorrect && idx === feedback.picked
                return (
                  <motion.button
                    key={`${currentCard.questionId}-${idx}`}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    disabled={phase !== 'playing'}
                    onClick={() => handlePick(idx)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-semibold transition',
                      isCorrectChoice
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                        : isWrongPick
                          ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200'
                          : 'border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-500/5 dark:border-white/10 dark:bg-white/5 dark:text-slate-100',
                    )}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1 break-words">{choice}</span>
                  </motion.button>
                )
              })}
            </div>

            {feedback && currentCard.explanation && (
              <p className="rounded-xl bg-slate-100/80 p-3 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
                💡 {currentCard.explanation}{' '}
                <span className="ml-2 text-slate-400">(Press Enter to continue)</span>
              </p>
            )}
          </Card>
        </div>
      )}

      {phase === 'done' && (
        <ArcadePayoutView
          mode="streak-siege"
          title="Siege Over — Defenses Held!"
          score={score}
          correct={correct}
          attempts={attempts}
          bestCombo={bestCombo}
          comboBursts={comboBursts}
          extraStats={[
            { label: 'FSRS Cards Graded', value: String(reviewedCount) },
            { label: 'Combo Bursts', value: String(comboBursts) },
            { label: 'Correct Hits', value: `${correct} / ${attempts}` },
          ]}
          result={payout?.result ?? null}
          isNewHigh={payout?.isNewHigh ?? false}
          onPlayAgain={startRun}
        />
      )}
    </div>
  )
}

export default StreakSiegeGame
