import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Lock,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  Unlock,
  XCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { FigureCanvas } from '@/components/FigureCanvas'
import { Button, Card, Chip } from '@/components/ui'
import { isTypingTarget, usePrefersReducedMotion } from '@/lib/a11y'
import { fireComboBurst, playBurstSound, playHitSound, playMissSound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import {
  VAULT_WAGER_RULES,
  buildChoices,
  buildVaultDeck,
  seededRng,
  shuffled,
  vaultCalibrationQuality,
  vaultScoreDelta,
  type ChoiceCard,
  type VaultWagerTier,
} from '@shared/arcade'
import { CONFIDENCE_LABELS, summarizeConfidence } from '@shared/confidence'
import { isComboBurst } from '@shared/economy'
import { buildFigureGeometry, type FigureGeometry } from '@shared/figure'
import { CONTENT_PACKS } from '@shared/packs'
import type { ArcadeRunResultDTO } from '@shared/types'
import {
  ArcadePayoutView,
  ArcadeTopBar,
  matchesSubjectFilter,
  useArcadeSrsBridge,
  useFinishArcadeRun,
} from './arcade-common'

type Stage = 'ready' | 'play' | 'revealed' | 'done'

interface ActiveVaultCard {
  id: string
  subject: string
  packName: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
  geometry: FigureGeometry | null
  srsQuestionId?: string
}

interface VaultAttemptRecord {
  cardId: string
  subject: string
  confidence: VaultWagerTier
  correct: boolean
  delta: number
}

const VAULT_COUNT = 10
const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const
const SUBJECT_FILTERS = ['All', 'Math', 'Science', 'CS', 'Economics', 'History', 'Languages'] as const

const TIER_STYLES: Record<VaultWagerTier, { active: string; chip: 'slate' | 'brand' | 'amber' }> = {
  unsure: {
    active: 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-200',
    chip: 'slate',
  },
  'fairly-sure': {
    active: 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-200',
    chip: 'brand',
  },
  certain: {
    active: 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200',
    chip: 'amber',
  },
}

export function CertaintyVaultGame() {
  const [searchParams] = useSearchParams()
  const initialSubject = searchParams.get('subject') ?? 'All'
  const initialPack = searchParams.get('pack') ?? 'all'
  const reducedMotion = usePrefersReducedMotion()

  const finishRun = useFinishArcadeRun('certainty-vault')
  const srsBridge = useArcadeSrsBridge({ untimed: true })

  const { data: dueQuery } = useQuery({
    queryKey: ['srs-due'],
    queryFn: () => api.srs.due(),
    staleTime: 60_000,
  })

  const [subjectFilter, setSubjectFilter] = useState(initialSubject)
  const [packFilter, setPackFilter] = useState(initialPack)
  const [stage, setStage] = useState<Stage>('ready')

  const [deck, setDeck] = useState<ActiveVaultCard[]>([])
  const [index, setIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [selectedTier, setSelectedTier] = useState<VaultWagerTier>('fairly-sure')

  const [vaultCharge, setVaultCharge] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [comboBursts, setComboBursts] = useState(0)
  const [history, setHistory] = useState<VaultAttemptRecord[]>([])
  const [lastOutcome, setLastOutcome] = useState<{
    correct: boolean
    delta: number
    tier: VaultWagerTier
  } | null>(null)
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

  const buildRunDeck = useCallback(
    (runSeed: number): ActiveVaultCard[] => {
      const dueCards = (dueQuery?.cards ?? []).filter(
        (c) =>
          (packFilter === 'all' || c.packId === packFilter) &&
          matchesSubjectFilter(c.subject, subjectFilter),
      )

      const poolCards: ChoiceCard[] = dueCards.map((c) => ({
        questionId: c.questionId,
        type: c.type,
        answer: c.answer,
        options: c.options,
      }))

      const dueVaultCards: ActiveVaultCard[] = shuffled(dueCards, seededRng(runSeed))
        .slice(0, Math.min(4, dueCards.length))
        .map((c, idx) => {
          const built = buildChoices(
            {
              questionId: c.questionId,
              type: c.type,
              answer: c.answer,
              options: c.options,
            },
            poolCards,
            runSeed + idx * 31,
          )
          return {
            id: `srs-${c.questionId}`,
            subject: c.subject || c.quizTitle,
            packName: c.quizTitle,
            prompt: c.prompt,
            choices: built.choices,
            correctIndex: built.correctIndex,
            explanation: c.explanation || `Answer: ${c.answer}`,
            geometry: c.figure ?? null,
            srsQuestionId: c.questionId,
          }
        })

      const packTarget = Math.max(0, VAULT_COUNT - dueVaultCards.length)
      const packItems = buildVaultDeck(filteredPacks, runSeed + 101, packTarget).map((item) => ({
        id: item.id,
        subject: item.subject,
        packName: item.packName,
        prompt: item.prompt,
        choices: item.choices,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
        geometry: item.figure ? buildFigureGeometry(item.figure) : null,
      }))

      return [...dueVaultCards, ...packItems].slice(0, VAULT_COUNT)
    },
    [dueQuery?.cards, filteredPacks, packFilter, subjectFilter],
  )

  const current = deck[index] ?? null
  const correctCount = useMemo(() => history.filter((h) => h.correct).length, [history])
  const confidentHits = useMemo(
    () => history.filter((h) => h.correct && h.confidence === 'certain').length,
    [history],
  )
  const calibrationQuality = useMemo(
    () => vaultCalibrationQuality(history.map((h) => ({ confidence: h.confidence, correct: h.correct }))),
    [history],
  )
  const calibrationSummary = useMemo(
    () =>
      summarizeConfidence(
        history.map((h) => ({
          correct: h.correct,
          confidence: h.confidence,
        })),
      ),
    [history],
  )

  const startRun = useCallback(() => {
    const nextSeed = (Date.now() ^ (Math.random() * 0xffff)) >>> 0
    const nextDeck = buildRunDeck(nextSeed)
    setDeck(nextDeck)
    setIndex(0)
    setSelectedChoice(null)
    setSelectedTier('fairly-sure')
    setVaultCharge(0)
    setScore(0)
    setCombo(0)
    setBestCombo(0)
    setComboBursts(0)
    setHistory([])
    setLastOutcome(null)
    setPayout(null)
    finishingRef.current = false
    startedAtRef.current = Date.now()
    srsBridge.resetSession()
    setStage('play')
  }, [buildRunDeck, srsBridge])

  const completeRun = useCallback(
    async (finalHistory: VaultAttemptRecord[], finalScore: number, finalBest: number, finalBursts: number) => {
      if (finishingRef.current) return
      finishingRef.current = true
      setStage('done')
      const hits = finalHistory.filter((h) => h.correct).length
      const cHits = finalHistory.filter((h) => h.correct && h.confidence === 'certain').length
      const quality = vaultCalibrationQuality(
        finalHistory.map((h) => ({ confidence: h.confidence, correct: h.correct })),
      )
      const outcome = await finishRun({
        score: finalScore,
        correct: hits,
        attempts: finalHistory.length,
        bestCombo: finalBest,
        comboBursts: finalBursts,
        durationMs: Date.now() - startedAtRef.current,
        deckId: packFilter !== 'all' ? packFilter : undefined,
        qualityScore: quality,
        confidentHits: cHits,
      })
      setPayout(outcome)
    },
    [finishRun, packFilter],
  )

  const unlockVault = useCallback(
    (tierOverride?: VaultWagerTier) => {
      if (stage !== 'play' || !current || selectedChoice === null) return
      const tier = tierOverride ?? selectedTier
      setSelectedTier(tier)
      const isRight = selectedChoice === current.correctIndex
      const delta = vaultScoreDelta(tier, isRight)

      const nextCharge = Math.max(0, vaultCharge + delta)
      const nextCombo = isRight ? combo + 1 : 0
      const nextBest = Math.max(bestCombo, nextCombo)
      const burst = isRight && isComboBurst(nextCombo)
      const nextBursts = comboBursts + (burst ? 1 : 0)
      const pointsGained = isRight ? Math.max(25, delta * 25 + nextCombo * 15) : 0
      const nextScore = score + pointsGained

      setVaultCharge(nextCharge)
      setScore(nextScore)
      setCombo(nextCombo)
      setBestCombo(nextBest)
      setComboBursts(nextBursts)
      setLastOutcome({ correct: isRight, delta, tier })
      setHistory((prev) => [
        ...prev,
        {
          cardId: current.id,
          subject: current.subject,
          confidence: tier,
          correct: isRight,
          delta,
        },
      ])

      if (isRight) {
        if (burst) {
          playBurstSound()
          if (!reducedMotion) fireComboBurst()
        } else {
          playHitSound(nextCombo)
        }
      } else {
        playMissSound()
      }

      if (current.srsQuestionId) {
        void srsBridge.recordAnswer(current.srsQuestionId, isRight, tier)
      }
      setStage('revealed')
    },
    [
      bestCombo,
      combo,
      comboBursts,
      current,
      reducedMotion,
      score,
      selectedChoice,
      selectedTier,
      srsBridge,
      stage,
      vaultCharge,
    ],
  )

  const advanceVault = useCallback(() => {
    if (stage !== 'revealed') return
    if (index + 1 >= deck.length) {
      void completeRun(history, score, bestCombo, comboBursts)
      return
    }
    setIndex((i) => i + 1)
    setSelectedChoice(null)
    setLastOutcome(null)
    setStage('play')
  }, [bestCombo, comboBursts, completeRun, deck.length, history, index, score, stage])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (stage === 'play' && current) {
        const key = event.key.toUpperCase()
        const letterIdx = OPTION_LETTERS.indexOf(key as (typeof OPTION_LETTERS)[number])
        if (letterIdx >= 0 && letterIdx < current.choices.length) {
          event.preventDefault()
          setSelectedChoice(letterIdx)
          return
        }
        if (selectedChoice !== null) {
          if (event.key === '1') {
            event.preventDefault()
            unlockVault('unsure')
            return
          }
          if (event.key === '2') {
            event.preventDefault()
            unlockVault('fairly-sure')
            return
          }
          if (event.key === '3') {
            event.preventDefault()
            unlockVault('certain')
            return
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            unlockVault()
            return
          }
        } else if (event.key >= '1' && event.key <= '4') {
          const idx = Number(event.key) - 1
          if (idx < current.choices.length) {
            event.preventDefault()
            setSelectedChoice(idx)
          }
        }
      } else if (stage === 'revealed' && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        advanceVault()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [advanceVault, current, selectedChoice, stage, unlockVault])

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <ArcadeTopBar
        title="Certainty Vault"
        subtitle="Untimed confidence-based wagering — earn more when your certainty matches reality"
        badge={
          <Chip color="emerald">
            <Scale size={12} /> Untimed · CBM Calibration
          </Chip>
        }
        rightSlot={
          stage !== 'ready' && (
            <div className="flex items-center gap-2">
              <Chip color="amber">Charge {vaultCharge}</Chip>
              <Chip color="brand">Calibration {calibrationQuality}%</Chip>
            </div>
          )
        }
      />

      {stage === 'ready' && (
        <Card className="space-y-6 p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                How Well Do You Know What You Know?
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Take all the time you need across {VAULT_COUNT} vaults. Choose your answer first,
                then stake one of three confidence seals before unlocking the answer. Guessing blind
                with high certainty loses vault charge — honest self-assessment keeps your edge sharp.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-200">
              <div className="font-bold">Wager Matrix</div>
              <ul className="mt-1.5 space-y-1">
                {VAULT_WAGER_RULES.map((rule) => (
                  <li key={rule.confidence} className="font-mono">
                    {rule.label}: +{rule.winDelta} / {rule.lossDelta}
                  </li>
                ))}
              </ul>
            </div>
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
              htmlFor="vault-pack-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Pack Focus (optional)
            </label>
            <select
              id="vault-pack-select"
              value={packFilter}
              onChange={(e) => setPackFilter(e.target.value)}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-white/10 dark:bg-ink-900 dark:text-slate-100"
            >
              <option value="all">
                Mix across {filteredPacks.length} matching pack{filteredPacks.length === 1 ? '' : 's'}
                {dueQuery?.cards?.length ? ` + ${dueQuery.cards.length} SRS review card(s)` : ''}
              </option>
              {CONTENT_PACKS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name} ({p.subject})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/70 pt-5 dark:border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keyboard: <kbd className="rounded border px-1.5 py-0.5 font-mono">A–D</kbd> choose
              option · <kbd className="rounded border px-1.5 py-0.5 font-mono">1–3</kbd> seal wager
              · <kbd className="rounded border px-1.5 py-0.5 font-mono">Enter</kbd> continue
            </p>
            <Button onClick={startRun} className="px-6 py-3 text-base">
              <Play size={16} /> Enter Vaults
            </Button>
          </div>
        </Card>
      )}

      {(stage === 'play' || stage === 'revealed') && current && (
        <div className="space-y-4">
          {/* Progress header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Chip color="slate">
                Vault {index + 1} / {deck.length}
              </Chip>
              <Chip color="brand">{current.subject}</Chip>
              {current.srsQuestionId && (
                <Chip color="emerald">
                  <Sparkles size={11} /> FSRS Review Card
                </Chip>
              )}
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
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {current.packName}
              </div>
              <h2 className="mt-1.5 font-display text-lg font-bold leading-snug text-slate-900 dark:text-white">
                {current.prompt}
              </h2>
            </div>

            {current.geometry && (
              <div className="flex justify-center rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-ink-900/70">
                <FigureCanvas geometry={current.geometry} size={230} />
              </div>
            )}

            {/* Answer options */}
            <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Vault options">
              {current.choices.map((opt, optIdx) => {
                const isSelected = selectedChoice === optIdx
                const isCorrect = optIdx === current.correctIndex
                const revealed = stage === 'revealed'
                return (
                  <button
                    key={`${current.id}-${optIdx}`}
                    type="button"
                    disabled={revealed}
                    onClick={() => setSelectedChoice(optIdx)}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      revealed && isCorrect
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                        : revealed && isSelected && !isCorrect
                          ? 'border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-100'
                          : isSelected
                            ? 'border-brand-500 bg-brand-500/10 text-slate-900 ring-1 ring-brand-500/40 dark:text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-ink-900/60 dark:text-slate-200',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold',
                        isSelected
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
                      )}
                    >
                      {OPTION_LETTERS[optIdx] ?? optIdx + 1}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Stage 2: Wager confidence seal */}
            {stage === 'play' && (
              <div className="space-y-3 border-t border-slate-200/70 pt-4 dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {selectedChoice === null
                      ? 'Step 1: Pick your answer above'
                      : 'Step 2: Stake your confidence seal to unlock'}
                  </span>
                  <span className="text-xs text-slate-400">Key 1, 2, or 3 stakes &amp; unlocks immediately</span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  {VAULT_WAGER_RULES.map((rule) => {
                    const active = selectedTier === rule.confidence
                    return (
                      <button
                        key={rule.confidence}
                        type="button"
                        disabled={selectedChoice === null}
                        onClick={() => unlockVault(rule.confidence)}
                        className={cn(
                          'flex flex-col justify-between gap-2 rounded-xl border p-3.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-45',
                          active
                            ? TIER_STYLES[rule.confidence].active
                            : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-bold">{rule.label}</span>
                          <kbd className="rounded border border-current/25 px-1.5 py-0.5 font-mono text-[11px]">
                            {rule.keyHint}
                          </kbd>
                        </div>
                        <p className="text-xs opacity-80">{rule.subtitle}</p>
                        <div className="flex items-center justify-between font-mono text-xs font-bold">
                          <span className="text-emerald-600 dark:text-emerald-300">
                            +{rule.winDelta} right
                          </span>
                          <span
                            className={
                              rule.lossDelta === 0
                                ? 'text-slate-400'
                                : 'text-rose-600 dark:text-rose-300'
                            }
                          >
                            {rule.lossDelta === 0 ? '±0 safe' : `${rule.lossDelta} wrong`}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Revealed feedback */}
            {stage === 'revealed' && lastOutcome && (
              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'space-y-3 rounded-2xl border p-4',
                  lastOutcome.correct
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-rose-500/40 bg-rose-500/10',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-display text-base font-bold">
                    {lastOutcome.correct ? (
                      <>
                        <Unlock size={18} className="text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-200">
                          Vault Opened! ({CONFIDENCE_LABELS[lastOutcome.tier]})
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock size={18} className="text-rose-500" />
                        <span className="text-rose-700 dark:text-rose-200">
                          Seal Tripped! ({CONFIDENCE_LABELS[lastOutcome.tier]})
                        </span>
                      </>
                    )}
                  </div>
                  <Chip color={lastOutcome.delta >= 0 ? 'emerald' : 'rose'}>
                    {lastOutcome.delta >= 0 ? `+${lastOutcome.delta}` : lastOutcome.delta} Charge
                  </Chip>
                </div>

                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {current.explanation}
                </p>

                <div className="flex justify-end">
                  <Button onClick={advanceVault}>
                    {index + 1 >= deck.length ? 'Finish Calibration Report' : 'Next Vault'}
                    <ArrowRight size={15} />
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        </div>
      )}

      {stage === 'done' && (
        <div className="space-y-5">
          <Card className="mx-auto max-w-2xl space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Metacognitive Calibration Profile
                </div>
                <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  Honest Certainty vs. Overconfidence Report
                </h3>
              </div>
              <Chip color={calibrationQuality >= 75 ? 'emerald' : 'amber'}>
                <ShieldCheck size={13} /> Calibration Score {calibrationQuality}%
              </Chip>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-[11px] font-bold uppercase text-slate-400">Knew It</div>
                <div className="mt-1 font-display text-xl font-extrabold text-emerald-500">
                  {calibrationSummary.knewIt.correct}
                </div>
                <div className="text-[11px] text-slate-500">
                  {calibrationSummary.knewIt.seen > 0
                    ? `${Math.round(calibrationSummary.knewIt.accuracy * 100)}% of confident hits`
                    : 'Steady/Master right'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-[11px] font-bold uppercase text-slate-400">Overconfident</div>
                <div className="mt-1 font-display text-xl font-extrabold text-rose-500">
                  {calibrationSummary.overconfident}
                </div>
                <div className="text-[11px] text-slate-500">Master seal, wrong</div>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-[11px] font-bold uppercase text-slate-400">Underconfident</div>
                <div className="mt-1 font-display text-xl font-extrabold text-sky-500">
                  {calibrationSummary.lucky}
                </div>
                <div className="text-[11px] text-slate-500">Cautious &amp; right</div>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-[11px] font-bold uppercase text-slate-400">Honest Gaps</div>
                <div className="mt-1 font-display text-xl font-extrabold text-amber-500">
                  {calibrationSummary.guessed.seen - calibrationSummary.guessed.correct}
                </div>
                <div className="text-[11px] text-slate-500">Hedged before miss</div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {VAULT_WAGER_RULES.map((rule) => {
                const rows = history.filter((h) => h.confidence === rule.confidence)
                const hits = rows.filter((h) => h.correct).length
                return (
                  <div
                    key={rule.confidence}
                    className="flex items-center justify-between rounded-xl border border-slate-200/70 px-3 py-2 text-xs dark:border-white/10"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {rule.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {hits}
                      <span className="text-slate-400">/</span>
                      <XCircle size={12} className="text-rose-500" />
                      {rows.length - hits}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          <ArcadePayoutView
            mode="certainty-vault"
            title="Vaults Calibrated!"
            score={score}
            correct={correctCount}
            attempts={history.length}
            bestCombo={bestCombo}
            comboBursts={comboBursts}
            qualityScore={calibrationQuality}
            confidentHits={confidentHits}
            extraStats={[
              { label: 'Final Vault Charge', value: String(vaultCharge) },
              { label: 'Master Seal Hits', value: String(confidentHits) },
              { label: 'Calibration Score', value: `${calibrationQuality}%` },
            ]}
            result={payout?.result ?? null}
            isNewHigh={payout?.isNewHigh ?? false}
            onPlayAgain={startRun}
          />
        </div>
      )}
    </div>
  )
}

export default CertaintyVaultGame
