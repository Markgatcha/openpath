import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Flame,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Button, Card, Chip } from '@/components/ui'
import { isTypingTarget, usePrefersReducedMotion } from '@/lib/a11y'
import { fireComboBurst, playBurstSound, playHitSound, playMissSound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import {
  CURATED_CLOZE_PROBLEMS,
  DETECTIVE_CASES,
  buildClozeProblems,
  seededRng,
  shuffled,
  type ClozeProblem,
} from '@shared/arcade'
import { isComboBurst } from '@shared/economy'
import { CONTENT_PACKS } from '@shared/packs'
import type { ArcadeRunResultDTO } from '@shared/types'
import {
  ArcadePayoutView,
  ArcadeTopBar,
  matchesSubjectFilter,
  useFinishArcadeRun,
} from './arcade-common'

type Stage = 'ready' | 'play' | 'explained' | 'done'

const PROBLEMS_PER_RUN = 6
const SUBJECT_FILTERS = ['All', 'Math', 'Science', 'CS', 'Economics', 'History', 'Languages'] as const

export function ClozeWorkbenchGame() {
  const [searchParams] = useSearchParams()
  const initialSubject = searchParams.get('subject') ?? 'All'
  const initialPack = searchParams.get('pack') ?? 'all'
  const reducedMotion = usePrefersReducedMotion()

  const finishRun = useFinishArcadeRun('cloze-workbench')

  const [subjectFilter, setSubjectFilter] = useState(initialSubject)
  const [packFilter, setPackFilter] = useState(initialPack)
  const [stage, setStage] = useState<Stage>('ready')
  const [deck, setDeck] = useState<ClozeProblem[]>([])
  const [index, setIndex] = useState(0)

  const [activeBlankId, setActiveBlankId] = useState<string>('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [problemTries, setProblemTries] = useState(0)
  const [feedbackHint, setFeedbackHint] = useState<string | null>(null)
  const [wrongBlankIds, setWrongBlankIds] = useState<Set<string>>(new Set())
  const [revealedSolution, setRevealedSolution] = useState(false)

  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [comboBursts, setComboBursts] = useState(0)
  const [cleanSolves, setCleanSolves] = useState(0)
  const [payout, setPayout] = useState<{
    result: ArcadeRunResultDTO | null
    isNewHigh: boolean
  } | null>(null)

  const startedAtRef = useRef<number>(0)
  const finishingRef = useRef(false)

  const filteredPacks = useMemo(() => {
    if (packFilter !== 'all') {
      const exact = CONTENT_PACKS.filter((p) => p.id === packFilter)
      if (exact.length > 0) return exact
    }
    const bySub = CONTENT_PACKS.filter(
      (p) =>
        subjectFilter === 'All' ||
        p.category.toLowerCase() === subjectFilter.toLowerCase() ||
        matchesSubjectFilter(p.subject, subjectFilter),
    )
    return bySub.length > 0 ? bySub : CONTENT_PACKS
  }, [packFilter, subjectFilter])

  const buildDeck = useCallback(
    (seed: number): ClozeProblem[] => {
      const rng = seededRng(seed)
      const all = buildClozeProblems(filteredPacks, DETECTIVE_CASES, seed)
      const matching = all.filter(
        (p) =>
          (packFilter !== 'all' && p.id.startsWith(`cloze-${packFilter}-`)) ||
          (packFilter === 'all' && matchesSubjectFilter(p.subject, subjectFilter)),
      )
      const pool = matching.length >= 3 ? matching : all
      const multiBlank = shuffled(
        pool.filter((p) => p.blanks.length >= 2),
        rng,
      )
      const singleBlank = shuffled(
        pool.filter((p) => p.blanks.length < 2),
        rng,
      )
      const combined = [...multiBlank, ...singleBlank]
      if (combined.length >= PROBLEMS_PER_RUN) return combined.slice(0, PROBLEMS_PER_RUN)
      const fallback = shuffled(CURATED_CLOZE_PROBLEMS, rng)
      const ids = new Set(combined.map((c) => c.id))
      return [...combined, ...fallback.filter((f) => !ids.has(f.id))].slice(0, PROBLEMS_PER_RUN)
    },
    [filteredPacks, packFilter, subjectFilter],
  )

  const current = deck[index] ?? null
  const activeBlank = useMemo(
    () => current?.blanks.find((b) => b.id === activeBlankId) ?? current?.blanks[0] ?? null,
    [activeBlankId, current],
  )
  const allFilled = useMemo(
    () => Boolean(current && current.blanks.every((b) => Boolean(answers[b.id]))),
    [answers, current],
  )

  const initProblemState = useCallback((prob: ClozeProblem | null) => {
    setActiveBlankId(prob?.blanks[0]?.id ?? '')
    setAnswers({})
    setProblemTries(0)
    setFeedbackHint(null)
    setWrongBlankIds(new Set())
    setRevealedSolution(false)
  }, [])

  const startRun = useCallback(() => {
    const seed = (Date.now() ^ (Math.random() * 0xffff)) >>> 0
    const nextDeck = buildDeck(seed)
    setDeck(nextDeck)
    setIndex(0)
    initProblemState(nextDeck[0] ?? null)
    setScore(0)
    setCorrect(0)
    setAttempts(0)
    setCombo(0)
    setBestCombo(0)
    setComboBursts(0)
    setCleanSolves(0)
    setPayout(null)
    finishingRef.current = false
    startedAtRef.current = Date.now()
    setStage('play')
  }, [buildDeck, initProblemState])

  const completeRun = useCallback(
    async (
      finalScore: number,
      finalCorrect: number,
      finalAttempts: number,
      finalBest: number,
      finalBursts: number,
      finalClean: number,
    ) => {
      if (finishingRef.current) return
      finishingRef.current = true
      setStage('done')
      const quality = deck.length > 0 ? Math.round((finalClean / deck.length) * 100) : 0
      const outcome = await finishRun({
        score: finalScore,
        correct: finalCorrect,
        attempts: finalAttempts,
        bestCombo: finalBest,
        comboBursts: finalBursts,
        durationMs: Date.now() - startedAtRef.current,
        deckId: packFilter !== 'all' ? packFilter : undefined,
        qualityScore: quality,
        deepUnits: finalClean,
      })
      setPayout(outcome)
    },
    [deck.length, finishRun, packFilter],
  )

  const pickOption = useCallback(
    (value: string) => {
      if (stage !== 'play' || !current || !activeBlank) return
      const nextAnswers = { ...answers, [activeBlank.id]: value }
      setAnswers(nextAnswers)
      setFeedbackHint(null)
      setWrongBlankIds((prev) => {
        if (!prev.has(activeBlank.id)) return prev
        const next = new Set(prev)
        next.delete(activeBlank.id)
        return next
      })
      // Automatically focus next empty blank for fluid keyboard / click entry
      const nextEmpty = current.blanks.find(
        (b) => b.id !== activeBlank.id && !nextAnswers[b.id],
      )
      if (nextEmpty) {
        setActiveBlankId(nextEmpty.id)
      }
    },
    [activeBlank, answers, current, stage],
  )

  const verifyJointSolution = useCallback(() => {
    if (stage !== 'play' || !current || !allFilled) return
    const missed = current.blanks.filter((b) => answers[b.id] !== b.answer)
    const triesAfter = problemTries + 1
    setProblemTries(triesAfter)

    if (missed.length === 0) {
      const nextCorrect = correct + current.blanks.length
      const nextAttempts = attempts + current.blanks.length
      const firstPass = triesAfter === 1
      const nextClean = cleanSolves + (firstPass ? 1 : 0)
      const nextCombo = firstPass ? combo + 1 : 1
      const nextBest = Math.max(bestCombo, nextCombo)
      const burst = isComboBurst(nextCombo)
      const nextBursts = comboBursts + (burst ? 1 : 0)
      const gained = (firstPass ? 160 : 90) * current.blanks.length + nextCombo * 20
      const nextScore = score + gained

      setCorrect(nextCorrect)
      setAttempts(nextAttempts)
      setCleanSolves(nextClean)
      setCombo(nextCombo)
      setBestCombo(nextBest)
      setComboBursts(nextBursts)
      setScore(nextScore)
      setWrongBlankIds(new Set())
      setFeedbackHint(null)

      if (burst) {
        playBurstSound()
        if (!reducedMotion) fireComboBurst()
      } else {
        playHitSound(nextCombo)
      }
      setStage('explained')
      return
    }

    playMissSound()
    setCombo(0)
    setAttempts((a) => a + 1)
    if (triesAfter >= 2) {
      setWrongBlankIds(new Set(missed.map((m) => m.id)))
      setActiveBlankId(missed[0].id)
    }
    setFeedbackHint(
      `${missed.length} of ${current.blanks.length} blank${missed.length === 1 ? '' : 's'} need revision. Hint: ${missed[0].hint}`,
    )
  }, [
    allFilled,
    answers,
    attempts,
    bestCombo,
    cleanSolves,
    combo,
    comboBursts,
    correct,
    current,
    problemTries,
    reducedMotion,
    score,
    stage,
  ])

  const revealProof = useCallback(() => {
    if (stage !== 'play' || !current) return
    const filled: Record<string, string> = {}
    for (const b of current.blanks) filled[b.id] = b.answer
    setAnswers(filled)
    setRevealedSolution(true)
    setAttempts((a) => a + current.blanks.length)
    setCombo(0)
    setWrongBlankIds(new Set())
    setFeedbackHint(null)
    setStage('explained')
  }, [current, stage])

  const advanceProblem = useCallback(() => {
    if (stage !== 'explained') return
    if (index + 1 >= deck.length) {
      void completeRun(score, correct, attempts, bestCombo, comboBursts, cleanSolves)
      return
    }
    const nextIdx = index + 1
    setIndex(nextIdx)
    initProblemState(deck[nextIdx] ?? null)
    setStage('play')
  }, [
    attempts,
    bestCombo,
    cleanSolves,
    comboBursts,
    completeRun,
    correct,
    deck,
    index,
    initProblemState,
    score,
    stage,
  ])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (stage === 'play' && current && activeBlank) {
        if (event.key >= '1' && event.key <= '4') {
          const picked = activeBlank.options[Number(event.key) - 1]
          if (picked) {
            event.preventDefault()
            pickOption(picked)
          }
          return
        }
        if (event.key === 'ArrowLeft' || event.key === '[') {
          event.preventDefault()
          const curIdx = current.blanks.findIndex((b) => b.id === activeBlank.id)
          const prev = current.blanks[(curIdx - 1 + current.blanks.length) % current.blanks.length]
          if (prev) setActiveBlankId(prev.id)
          return
        }
        if (event.key === 'ArrowRight' || event.key === ']') {
          event.preventDefault()
          const curIdx = current.blanks.findIndex((b) => b.id === activeBlank.id)
          const next = current.blanks[(curIdx + 1) % current.blanks.length]
          if (next) setActiveBlankId(next.id)
          return
        }
        if (event.key === 'Enter' && allFilled) {
          event.preventDefault()
          verifyJointSolution()
        }
      } else if (stage === 'explained' && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        advanceProblem()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    activeBlank,
    advanceProblem,
    allFilled,
    current,
    pickOption,
    stage,
    verifyJointSolution,
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <ArcadeTopBar
        title="Cloze Workbench"
        subtitle="Reconstruct multi-step proofs, code invariants & grammar before verifying jointly"
        badge={
          <Chip color="emerald">
            <BookOpenCheck size={12} /> Untimed · Joint Verification
          </Chip>
        }
        rightSlot={
          stage !== 'ready' && (
            <div className="flex items-center gap-2">
              <Chip color="amber">Clean Solves {cleanSolves}</Chip>
              <Chip color="brand">Score {score.toLocaleString()}</Chip>
            </div>
          )
        }
      />

      {stage === 'ready' && (
        <Card className="space-y-6 p-7">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
              Reason Through Every Blank Together
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Fill all blanks inside a derivation, algorithm, or argument before clicking{' '}
              <strong>Verify Derivation</strong>. Because answers are evaluated jointly, you cannot
              guess one blank at a time — clean first-pass reconstructions earn deep mastery bonuses.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Filter by Subject
            </div>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_FILTERS.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => {
                    setSubjectFilter(subj)
                    setPackFilter('all')
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    subjectFilter === subj
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-ink-900 dark:text-slate-300',
                  )}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="cloze-pack-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Content Pack Filter (optional)
            </label>
            <select
              id="cloze-pack-select"
              value={packFilter}
              onChange={(e) => setPackFilter(e.target.value)}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-white/10 dark:bg-ink-900 dark:text-slate-100"
            >
              <option value="all">Curated Proofs + {filteredPacks.length} Pack Decks</option>
              {CONTENT_PACKS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name} ({p.subject})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/70 pt-5 dark:border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keyboard: <kbd className="rounded border px-1.5 py-0.5 font-mono">1–4</kbd> pick token
              · <kbd className="rounded border px-1.5 py-0.5 font-mono">←/→</kbd> switch blank ·{' '}
              <kbd className="rounded border px-1.5 py-0.5 font-mono">Enter</kbd> verify
            </p>
            <Button onClick={startRun} className="px-6 py-3 text-base">
              <Play size={16} /> Open Workbench ({PROBLEMS_PER_RUN} Problems)
            </Button>
          </div>
        </Card>
      )}

      {(stage === 'play' || stage === 'explained') && current && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Chip color="slate">
                Workbench {index + 1} / {deck.length}
              </Chip>
              <Chip color="brand">{current.subject}</Chip>
              <Chip color="slate">
                {current.blanks.length} joint blank{current.blanks.length === 1 ? '' : 's'}
              </Chip>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Flame size={14} className="text-amber-500" /> {combo} streak
              </span>
              <span>Score {score.toLocaleString()}</span>
            </div>
          </div>

          <Card className="space-y-5 p-6">
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                {current.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{current.prompt}</p>
            </div>

            {/* Interactive derivation / code / prose canvas */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-5 font-mono text-sm leading-loose text-slate-800 whitespace-pre-wrap dark:border-white/10 dark:bg-ink-950/80 dark:text-slate-100">
              {current.segments.map((seg, sIdx) => {
                if (seg.kind === 'text') {
                  return <span key={`t-${sIdx}`}>{seg.text}</span>
                }
                const blankIndex = current.blanks.findIndex((b) => b.id === seg.blankId)
                const blankObj = current.blanks[blankIndex]
                const filledVal = answers[seg.blankId]
                const isActive = stage === 'play' && activeBlank?.id === seg.blankId
                const isVerified = stage === 'explained'
                const isFlaggedWrong = wrongBlankIds.has(seg.blankId)

                return (
                  <button
                    key={`b-${seg.blankId}-${sIdx}`}
                    type="button"
                    disabled={stage !== 'play'}
                    onClick={() => setActiveBlankId(seg.blankId)}
                    aria-label={`Blank ${blankIndex + 1}: ${blankObj?.label ?? 'Select token'}${filledVal ? `, current choice ${filledVal}` : ''}`}
                    className={cn(
                      'mx-1 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 align-baseline font-mono text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      isVerified
                        ? revealedSolution
                          ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                          : 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                        : isFlaggedWrong
                          ? 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-200'
                          : isActive
                            ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                            : filledVal
                              ? 'border-slate-300 bg-white text-slate-900 dark:border-white/25 dark:bg-ink-800 dark:text-white'
                              : 'border-dashed border-brand-400 bg-brand-500/10 text-brand-700 dark:text-brand-300',
                    )}
                  >
                    <span className="opacity-70">[{blankIndex + 1}]</span>
                    <span>{filledVal ?? '_____'}</span>
                  </button>
                )
              })}
            </div>

            {stage === 'play' && activeBlank && (
              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-ink-900/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Editing Blank [{current.blanks.findIndex((b) => b.id === activeBlank.id) + 1}]:{' '}
                    <span className="text-slate-800 dark:text-white">{activeBlank.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {current.blanks.map((b, bIdx) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setActiveBlankId(b.id)}
                        className={cn(
                          'rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold',
                          b.id === activeBlank.id
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : answers[b.id]
                              ? 'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200'
                              : 'border-slate-200 text-slate-400 dark:border-white/10',
                        )}
                      >
                        [{bIdx + 1}]
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {activeBlank.options.map((opt, optIdx) => {
                    const selected = answers[activeBlank.id] === opt
                    return (
                      <button
                        key={`${activeBlank.id}-${optIdx}`}
                        type="button"
                        onClick={() => pickOption(opt)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left font-mono text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                          selected
                            ? 'border-brand-500 bg-brand-500/15 text-brand-700 dark:text-brand-200'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400 dark:border-white/10 dark:bg-ink-900 dark:text-slate-200',
                        )}
                      >
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[11px] dark:bg-white/10">
                          {optIdx + 1}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    )
                  })}
                </div>

                {feedbackHint && (
                  <div
                    role="status"
                    className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200"
                  >
                    <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-500" />
                    <div className="space-y-1">
                      <div className="font-bold">{feedbackHint}</div>
                      <div className="opacity-90">{current.misconception}</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAnswers({})}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      <RotateCcw size={13} /> Clear Blanks
                    </button>
                    {problemTries >= 2 && (
                      <button
                        type="button"
                        onClick={revealProof}
                        className="rounded-xl border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                      >
                        Reveal Completed Proof
                      </button>
                    )}
                  </div>
                  <Button onClick={verifyJointSolution} disabled={!allFilled}>
                    <CheckCircle2 size={15} /> Verify Derivation
                  </Button>
                </div>
              </div>
            )}

            {stage === 'explained' && (
              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'space-y-3 rounded-2xl border p-4',
                  revealedSolution
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-emerald-500/40 bg-emerald-500/10',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-display text-base font-bold">
                    {revealedSolution ? (
                      <>
                        <AlertTriangle size={17} className="text-amber-500" />
                        <span className="text-amber-800 dark:text-amber-200">
                          Reference Solution Studied
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={17} className="text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-200">
                          {problemTries === 1
                            ? 'Verified Cleanly on First Pass!'
                            : 'Derivation Verified!'}
                        </span>
                      </>
                    )}
                  </div>
                  {problemTries === 1 && !revealedSolution && (
                    <Chip color="emerald">Deep Mastery +1</Chip>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {current.explanation}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Watch out for: {current.misconception}
                </p>

                <div className="flex justify-end">
                  <Button onClick={advanceProblem}>
                    {index + 1 >= deck.length ? 'Complete Workbench Run' : 'Next Problem'}
                    <ArrowRight size={15} />
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        </div>
      )}

      {stage === 'done' && (
        <ArcadePayoutView
          mode="cloze-workbench"
          title="Workbench Complete!"
          score={score}
          correct={correct}
          attempts={attempts}
          bestCombo={bestCombo}
          comboBursts={comboBursts}
          qualityScore={deck.length > 0 ? Math.round((cleanSolves / deck.length) * 100) : 0}
          deepUnits={cleanSolves}
          extraStats={[
            { label: 'First-Pass Proofs', value: `${cleanSolves} / ${deck.length}` },
            { label: 'Blanks Verified', value: String(correct) },
          ]}
          result={payout?.result ?? null}
          isNewHigh={payout?.isNewHigh ?? false}
          onPlayAgain={startRun}
        />
      )}
    </div>
  )
}

export default ClozeWorkbenchGame
