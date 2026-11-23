import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Bug, CheckCircle2, Flame, Play, Timer, Wrench, Zap } from 'lucide-react'
import { Button, Card, Chip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { isTypingTarget } from '@/lib/a11y'
import { fireComboBurst, playBurstSound, playHitSound, playMissSound } from '@/lib/sound'
import { DETECTIVE_CASES, type DetectiveCase, seededRng, shuffled } from '@shared/arcade'
import { isComboBurst } from '@shared/economy'
import type { ArcadeRunResultDTO } from '@shared/types'
import {
  ArcadePayoutView,
  ArcadeTopBar,
  matchesSubjectFilter,
  useFinishArcadeRun,
} from './arcade-common'

type Stage = 'ready' | 'find-bug' | 'pick-patch' | 'explained' | 'done'
const ROUND_SECONDS = 90

export function StepDetectiveGame() {
  const [searchParams] = useSearchParams()
  const subjectFilter = searchParams.get('subject') ?? 'All'
  const finishRun = useFinishArcadeRun('step-detective')

  const filteredPool = useMemo(() => {
    const sub = DETECTIVE_CASES.filter((c) => matchesSubjectFilter(c.subject, subjectFilter))
    return sub.length >= 3 ? sub : DETECTIVE_CASES
  }, [subjectFilter])

  const [stage, setStage] = useState<Stage>('ready')
  const [cases, setCases] = useState<DetectiveCase[]>([])
  const [caseIdx, setCaseIdx] = useState(0)
  const [wrongLines, setWrongLines] = useState<Set<number>>(new Set())
  const [wrongPatches, setWrongPatches] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [comboBursts, setComboBursts] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [score, setScore] = useState(0)
  const [payout, setPayout] = useState<{
    result: ArcadeRunResultDTO | null
    isNewHigh: boolean
  } | null>(null)

  const runStartRef = useRef(0)
  const finishingRef = useRef(false)

  const currentCase = cases[caseIdx % Math.max(1, cases.length)] ?? null

  const startRun = () => {
    const rng = seededRng(Date.now())
    setCases(shuffled(filteredPool, rng))
    setCaseIdx(0)
    setWrongLines(new Set())
    setWrongPatches(new Set())
    setTimeLeft(ROUND_SECONDS)
    setCombo(0)
    setBestCombo(0)
    setComboBursts(0)
    setCorrect(0)
    setAttempts(0)
    setScore(0)
    setPayout(null)
    finishingRef.current = false
    runStartRef.current = performance.now()
    setStage('find-bug')
  }

  const endRun = useCallback(
    async (vals: {
      score: number
      correct: number
      attempts: number
      bestCombo: number
      comboBursts: number
    }) => {
      if (finishingRef.current) return
      finishingRef.current = true
      setStage('done')
      const durationMs = Math.max(1000, Math.round(performance.now() - runStartRef.current))
      const banked = await finishRun({ ...vals, durationMs })
      setPayout(banked)
    },
    [finishRun],
  )

  useEffect(() => {
    if (stage !== 'find-bug' && stage !== 'pick-patch') return
    const id = window.setInterval(() => {
      setTimeLeft((prev) => (prev <= 0.2 ? 0 : Math.round((prev - 0.2) * 10) / 10))
    }, 200)
    return () => window.clearInterval(id)
  }, [stage])

  useEffect(() => {
    if ((stage === 'find-bug' || stage === 'pick-patch') && timeLeft <= 0) {
      void endRun({ score, correct, attempts, bestCombo, comboBursts })
    }
  }, [stage, timeLeft, score, correct, attempts, bestCombo, comboBursts, endRun])

  const inspectLine = useCallback(
    (lineIdx: number) => {
      if (stage !== 'find-bug' || !currentCase || wrongLines.has(lineIdx)) return
      setAttempts((a) => a + 1)
      if (lineIdx === currentCase.bugLine) {
        playHitSound(combo + 1)
        setStage('pick-patch')
      } else {
        playMissSound()
        setCombo(0)
        setTimeLeft((t) => Math.max(0, Math.round((t - 5) * 10) / 10))
        setWrongLines((prev) => new Set(prev).add(lineIdx))
      }
    },
    [stage, currentCase, wrongLines, combo],
  )

  const selectPatch = useCallback(
    (patchIdx: number) => {
      if (stage !== 'pick-patch' || !currentCase || wrongPatches.has(patchIdx)) return
      setAttempts((a) => a + 1)
      if (patchIdx === currentCase.correctPatch) {
        const cleanFirstTry = wrongLines.size === 0 && wrongPatches.size === 0
        const nextCombo = cleanFirstTry ? combo + 1 : 1
        const nextBest = Math.max(bestCombo, nextCombo)
        const burst = isComboBurst(nextCombo)
        const nextBursts = burst ? comboBursts + 1 : comboBursts
        const pts = (cleanFirstTry ? 250 : 140) + nextCombo * 45

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
        setScore((s) => s + pts)
        setStage('explained')
      } else {
        playMissSound()
        setCombo(0)
        setTimeLeft((t) => Math.max(0, Math.round((t - 4) * 10) / 10))
        setWrongPatches((prev) => new Set(prev).add(patchIdx))
      }
    },
    [stage, currentCase, wrongPatches, wrongLines.size, combo, bestCombo, comboBursts],
  )

  const nextCase = useCallback(() => {
    if (caseIdx + 1 >= cases.length || timeLeft <= 0) {
      void endRun({ score, correct, attempts, bestCombo, comboBursts })
      return
    }
    setCaseIdx((i) => i + 1)
    setWrongLines(new Set())
    setWrongPatches(new Set())
    setStage('find-bug')
  }, [caseIdx, cases.length, timeLeft, score, correct, attempts, bestCombo, comboBursts, endRun])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (stage === 'find-bug' && currentCase) {
        const idx = Number(e.key) - 1
        if (idx >= 0 && idx < currentCase.steps.length) {
          e.preventDefault()
          inspectLine(idx)
        }
      } else if (stage === 'pick-patch' && currentCase) {
        const idx = Number(e.key) - 1
        if (idx >= 0 && idx < currentCase.patches.length) {
          e.preventDefault()
          selectPatch(idx)
        }
      } else if (stage === 'explained' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        nextCase()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage, currentCase, inspectLine, selectPatch, nextCase])

  return (
    <div className="flex flex-col gap-5">
      <ArcadeTopBar
        title="Step Detective / Bug Hunter"
        subtitle="Click the faulty derivation line or code bug, then apply the exact conceptual patch"
        badge={<Chip color="amber">{subjectFilter}</Chip>}
      />

      {stage === 'ready' && (
        <Card className="mx-auto flex max-w-2xl flex-col gap-5 p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-3xl">
              🕵️
            </span>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                {filteredPool.length} Conceptual Cases Loaded
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Every derivation has <strong>one subtle conceptual error</strong>. Spot the broken
                step first, then select the valid repair patch before the 90s clock expires!
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Keyboard shortcuts: <code>1–6</code> inspects lines &amp; patches · <code>Enter</code> advances.
            </span>
            <Button onClick={startRun}>
              <Play size={16} /> Open Case File #1
            </Button>
          </div>
        </Card>
      )}

      {(stage === 'find-bug' || stage === 'pick-patch' || stage === 'explained') && currentCase && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="flex items-center gap-2.5 p-3.5">
              <Timer size={20} className={timeLeft <= 12 ? 'animate-pulse text-rose-500' : 'text-amber-500'} />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Clock</div>
                <div className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
                  {timeLeft.toFixed(1)}s
                </div>
              </div>
            </Card>
            <Card className="flex items-center gap-2.5 p-3.5">
              <Flame size={20} className="text-emerald-500" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Clean Streak</div>
                <div className="font-mono text-xl font-extrabold text-emerald-500">{combo}×</div>
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

          <Card className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Chip color="brand">{currentCase.subject}</Chip>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  Case #{caseIdx + 1}: {currentCase.title}
                </h2>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
                {stage === 'find-bug'
                  ? 'Step 1: Click the faulty line'
                  : stage === 'pick-patch'
                    ? 'Step 2: Choose the correct patch'
                    : 'Case Patched!'}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {currentCase.context}
            </p>

            {/* Derivation / Code Lines */}
            <div className="flex flex-col gap-2">
              {currentCase.steps.map((line, idx) => {
                const isBugIdentified = stage !== 'find-bug' && idx === currentCase.bugLine
                const isCheckedValid = wrongLines.has(idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={stage !== 'find-bug' || isCheckedValid}
                    onClick={() => inspectLine(idx)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left font-mono text-xs transition sm:text-sm',
                      isBugIdentified
                        ? stage === 'explained'
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                          : 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                        : isCheckedValid
                          ? 'border-slate-200 bg-slate-100/60 text-slate-400 opacity-65 dark:border-white/5 dark:bg-white/5'
                          : 'border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-500/5 dark:border-white/10 dark:bg-ink-900 dark:text-slate-100',
                    )}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-200/80 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="flex-1">
                      {stage === 'explained' && idx === currentCase.bugLine
                        ? currentCase.patches[currentCase.correctPatch]
                        : line}
                    </span>
                    {isCheckedValid && (
                      <span className="text-[11px] font-sans font-semibold text-emerald-500">
                        ✓ Valid step (−5s)
                      </span>
                    )}
                    {stage === 'pick-patch' && idx === currentCase.bugLine && (
                      <Chip color="amber">
                        <Bug size={12} /> Bug Found!
                      </Chip>
                    )}
                    {stage === 'explained' && idx === currentCase.bugLine && (
                      <Chip color="emerald">
                        <CheckCircle2 size={12} /> Patched
                      </Chip>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Patch Selector */}
            {stage === 'pick-patch' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4"
              >
                <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                  <Wrench size={14} /> Select Patch to Repair Line #{currentCase.bugLine + 1}
                </div>
                <div className="flex flex-col gap-2">
                  {currentCase.patches.map((patch, pIdx) => {
                    const rejected = wrongPatches.has(pIdx)
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        disabled={rejected}
                        onClick={() => selectPatch(pIdx)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left font-mono text-xs font-semibold transition',
                          rejected
                            ? 'border-rose-400/50 bg-rose-500/10 text-rose-400 line-through'
                            : 'border-slate-200 bg-white hover:border-brand-500 dark:border-white/10 dark:bg-ink-800 dark:text-white',
                        )}
                      >
                        <span className="rounded bg-brand-500/15 px-2 py-0.5 text-[11px] text-brand-600 dark:text-brand-300">
                          {pIdx + 1}
                        </span>
                        <span>{patch}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Misconception Explanation Card */}
            {stage === 'explained' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4"
              >
                <div className="text-xs font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  🔍 Common Misconception Debrief
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                  {currentCase.misconception}
                </p>
                <div className="flex justify-end">
                  <Button onClick={nextCase}>
                    Next Case <ArrowRight size={15} />
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        </div>
      )}

      {stage === 'done' && (
        <ArcadePayoutView
          mode="step-detective"
          title="Investigation Complete!"
          score={score}
          correct={correct}
          attempts={attempts}
          bestCombo={bestCombo}
          comboBursts={comboBursts}
          extraStats={[
            { label: 'Cases Patched', value: String(correct) },
            { label: 'Total Inspections', value: String(attempts) },
          ]}
          result={payout?.result ?? null}
          isNewHigh={payout?.isNewHigh ?? false}
          onPlayAgain={startRun}
        />
      )}
    </div>
  )
}

export default StepDetectiveGame
