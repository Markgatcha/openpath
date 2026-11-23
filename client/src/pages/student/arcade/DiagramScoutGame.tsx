import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Compass,
  Crosshair,
  Flame,
  Heart,
  Layers,
  Play,
  Sparkles,
} from 'lucide-react'
import { FigureCanvas, getFigureInteractiveRegions } from '@/components/FigureCanvas'
import { ModelEmbed, type ModelHotspotInfo } from '@/components/models/ModelEmbed'
import { Button, Card, Chip } from '@/components/ui'
import { isTypingTarget, usePrefersReducedMotion } from '@/lib/a11y'
import { fireComboBurst, playBurstSound, playHitSound, playMissSound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import {
  SCOUT_2D_PROMPTS,
  SCOUT_3D_PROMPTS,
  seededRng,
  shuffled,
} from '@shared/arcade'
import { isComboBurst } from '@shared/economy'
import { buildFigureGeometry, type FigureGeometry } from '@shared/figure'
import type { ArcadeRunResultDTO } from '@shared/types'
import {
  ArcadePayoutView,
  ArcadeTopBar,
  matchesSubjectFilter,
  useFinishArcadeRun,
} from './arcade-common'

type Stage = 'ready' | 'play' | 'feedback' | 'done'
type MediaScope = 'mixed' | '3d' | '2d'

interface ScoutRoundItem {
  id: string
  kind: '3d' | '2d'
  title: string
  subject: string
  prompt: string
  explanation: string
  modelId?: string
  targetId: string
  geometry?: FigureGeometry
  fallbackHotspotIds?: string[]
}

const ROUNDS_PER_RUN = 8
const MAX_HEARTS = 3
const EXPLANATION_LOCKOUT_MS = 1500
const SUBJECT_FILTERS = ['All', 'Math', 'Science', 'CS', 'Economics'] as const

export function DiagramScoutGame() {
  const [searchParams] = useSearchParams()
  const initialSubject = searchParams.get('subject') ?? 'All'
  const initialModel = searchParams.get('model') ?? ''
  const reducedMotion = usePrefersReducedMotion()

  const finishRun = useFinishArcadeRun('diagram-scout')

  const [subjectFilter, setSubjectFilter] = useState(initialSubject)
  const [mediaScope, setMediaScope] = useState<MediaScope>(initialModel ? '3d' : 'mixed')
  const [stage, setStage] = useState<Stage>('ready')
  const [rounds, setRounds] = useState<ScoutRoundItem[]>([])
  const [index, setIndex] = useState(0)

  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [comboBursts, setComboBursts] = useState(0)
  const [roundMissedOnce, setRoundMissedOnce] = useState(false)
  const [firstTryHits, setFirstTryHits] = useState(0)

  const [pickedId, setPickedId] = useState<string | null>(null)
  const [lastOutcome, setLastOutcome] = useState<{ hit: boolean; label: string } | null>(null)
  const [cooldownReady, setCooldownReady] = useState(false)
  const [payout, setPayout] = useState<{
    result: ArcadeRunResultDTO | null
    isNewHigh: boolean
  } | null>(null)

  const embedContainerRef = useRef<HTMLDivElement | null>(null)
  const startedAtRef = useRef<number>(0)
  const finishingRef = useRef(false)
  const cooldownTimerRef = useRef<number | null>(null)

  const allRoundsPool = useMemo<ScoutRoundItem[]>(() => {
    const items3d: ScoutRoundItem[] = SCOUT_3D_PROMPTS.map((item) => ({
      id: item.id,
      kind: '3d',
      title: item.modelName,
      subject: item.subject,
      prompt: item.prompt,
      explanation: item.explanation,
      modelId: item.modelId,
      targetId: item.hotspotId,
      fallbackHotspotIds: SCOUT_3D_PROMPTS.filter((p) => p.modelId === item.modelId).map(
        (p) => p.hotspotId,
      ),
    }))

    const items2d: ScoutRoundItem[] = SCOUT_2D_PROMPTS.map((item) => ({
      id: item.id,
      kind: '2d',
      title: item.title,
      subject: item.subject,
      prompt: item.prompt,
      explanation: item.explanation,
      targetId: item.regionId,
      geometry: buildFigureGeometry(item.spec),
    }))

    return [...items3d, ...items2d]
  }, [])

  const buildDeck = useCallback(
    (seed: number): ScoutRoundItem[] => {
      const rng = seededRng(seed)
      const byMedia = allRoundsPool.filter((r) => {
        if (mediaScope === '3d') return r.kind === '3d'
        if (mediaScope === '2d') return r.kind === '2d'
        return true
      })
      const byModel = initialModel
        ? byMedia.filter((r) => r.modelId === initialModel)
        : byMedia
      const subPool = (byModel.length > 0 ? byModel : byMedia).filter((r) =>
        matchesSubjectFilter(r.subject, subjectFilter),
      )
      const activePool = subPool.length >= 3 ? subPool : byMedia

      if (mediaScope === 'mixed' && !initialModel) {
        const list3d = shuffled(
          activePool.filter((r) => r.kind === '3d'),
          rng,
        ).slice(0, 4)
        const list2d = shuffled(
          activePool.filter((r) => r.kind === '2d'),
          rng,
        ).slice(0, 4)
        const merged = shuffled([...list3d, ...list2d], rng)
        return merged.slice(0, Math.min(ROUNDS_PER_RUN, merged.length))
      }

      return shuffled(activePool, rng).slice(0, Math.min(ROUNDS_PER_RUN, activePool.length))
    },
    [allRoundsPool, initialModel, mediaScope, subjectFilter],
  )

  const current = rounds[index] ?? null

  const current2dRegions = useMemo(() => {
    if (!current?.geometry) return []
    return getFigureInteractiveRegions(current.geometry)
  }, [current])

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current !== null) {
        window.clearTimeout(cooldownTimerRef.current)
      }
    }
  }, [])

  const startCooldown = useCallback(() => {
    if (cooldownTimerRef.current !== null) window.clearTimeout(cooldownTimerRef.current)
    setCooldownReady(false)
    cooldownTimerRef.current = window.setTimeout(() => {
      setCooldownReady(true)
    }, EXPLANATION_LOCKOUT_MS)
  }, [])

  const completeRun = useCallback(
    async (
      finalScore: number,
      finalCorrect: number,
      finalAttempts: number,
      finalBestCombo: number,
      finalBursts: number,
      finalFirstTryHits: number,
      finalRoundsCount: number,
    ) => {
      if (finishingRef.current) return
      finishingRef.current = true
      setStage('done')
      const precisionQuality =
        finalRoundsCount > 0 ? Math.round((finalFirstTryHits / finalRoundsCount) * 100) : 0
      const outcome = await finishRun({
        score: finalScore,
        correct: finalCorrect,
        attempts: finalAttempts,
        bestCombo: finalBestCombo,
        comboBursts: finalBursts,
        durationMs: Date.now() - startedAtRef.current,
        qualityScore: precisionQuality,
      })
      setPayout(outcome)
    },
    [finishRun],
  )

  const startRun = useCallback(() => {
    const seed = (Date.now() ^ (Math.random() * 0xffff)) >>> 0
    const nextRounds = buildDeck(seed)
    setRounds(nextRounds)
    setIndex(0)
    setHearts(MAX_HEARTS)
    setScore(0)
    setCorrect(0)
    setAttempts(0)
    setCombo(0)
    setBestCombo(0)
    setComboBursts(0)
    setRoundMissedOnce(false)
    setFirstTryHits(0)
    setPickedId(null)
    setLastOutcome(null)
    setCooldownReady(false)
    setPayout(null)
    finishingRef.current = false
    startedAtRef.current = Date.now()
    setStage('play')
  }, [buildDeck])

  const submitPin = useCallback(
    (selectedId: string, selectedLabel: string) => {
      if (stage !== 'play' || !current) return
      const isHit = selectedId === current.targetId
      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)
      setPickedId(selectedId)

      if (isHit) {
        const nextCorrect = correct + 1
        const nextCombo = combo + 1
        const nextBest = Math.max(bestCombo, nextCombo)
        const burst = isComboBurst(nextCombo)
        const nextBursts = comboBursts + (burst ? 1 : 0)
        const nextFirstTry = firstTryHits + (roundMissedOnce ? 0 : 1)
        const gained = roundMissedOnce ? 90 : 160 + nextCombo * 25
        const nextScore = score + gained

        setCorrect(nextCorrect)
        setCombo(nextCombo)
        setBestCombo(nextBest)
        setComboBursts(nextBursts)
        setFirstTryHits(nextFirstTry)
        setScore(nextScore)
        setLastOutcome({ hit: true, label: selectedLabel })

        if (burst) {
          playBurstSound()
          if (!reducedMotion) fireComboBurst()
        } else {
          playHitSound(nextCombo)
        }

        startCooldown()
        setStage('feedback')
        return
      }

      playMissSound()
      const nextHearts = Math.max(0, hearts - 1)
      setHearts(nextHearts)
      setCombo(0)
      setRoundMissedOnce(true)
      setLastOutcome({ hit: false, label: selectedLabel })

      if (nextHearts <= 0) {
        startCooldown()
        setStage('feedback')
      }
    },
    [
      attempts,
      bestCombo,
      combo,
      comboBursts,
      correct,
      current,
      firstTryHits,
      hearts,
      reducedMotion,
      roundMissedOnce,
      score,
      stage,
      startCooldown,
    ],
  )

  const handle3dHotspot = useCallback(
    (spot: ModelHotspotInfo) => {
      submitPin(spot.id, spot.title)
    },
    [submitPin],
  )

  const handleAdvance = useCallback(() => {
    if (stage !== 'feedback' || !cooldownReady) return
    if (hearts <= 0 || index + 1 >= rounds.length) {
      void completeRun(
        score,
        correct,
        attempts,
        bestCombo,
        comboBursts,
        firstTryHits,
        Math.min(rounds.length, index + 1),
      )
      return
    }
    setIndex((i) => i + 1)
    setRoundMissedOnce(false)
    setPickedId(null)
    setLastOutcome(null)
    setCooldownReady(false)
    setStage('play')
  }, [
    attempts,
    bestCombo,
    comboBursts,
    completeRun,
    cooldownReady,
    correct,
    firstTryHits,
    hearts,
    index,
    rounds.length,
    score,
    stage,
  ])

  // Trigger pin 1..N across both 3D rendered pins and 2D regions using keyboard
  const triggerPinByNumber = useCallback(
    (pinIndex: number) => {
      if (stage !== 'play' || !current) return
      if (current.kind === '2d') {
        const region = current2dRegions[pinIndex]
        if (region) submitPin(region.id, region.label)
        return
      }

      const buttons = embedContainerRef.current?.querySelectorAll<HTMLButtonElement>(
        'button[aria-label^="Inspect region "]',
      )
      const btn = buttons?.[pinIndex]
      if (btn) {
        btn.click()
        return
      }
      const fallbackId = current.fallbackHotspotIds?.[pinIndex]
      if (fallbackId) {
        submitPin(fallbackId, `Region ${pinIndex + 1}`)
      }
    },
    [current, current2dRegions, stage, submitPin],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (stage === 'play' && event.key >= '1' && event.key <= '9') {
        event.preventDefault()
        triggerPinByNumber(Number(event.key) - 1)
      } else if (stage === 'feedback' && cooldownReady && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        handleAdvance()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cooldownReady, handleAdvance, stage, triggerPinByNumber])

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <ArcadeTopBar
        title="Diagram Scout"
        subtitle="Locate functional structures on unlabelled 3D models & 2D STEM diagrams"
        badge={
          <Chip color="emerald">
            <Crosshair size={12} /> Untimed · Spatial Precision
          </Chip>
        }
        rightSlot={
          stage !== 'ready' && (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-500"
                aria-label={`${hearts} of ${MAX_HEARTS} precision hearts remaining`}
              >
                {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                  <Heart
                    key={i}
                    size={13}
                    className={i < hearts ? 'fill-rose-500 text-rose-500' : 'text-rose-500/25'}
                  />
                ))}
              </div>
              <Chip color="brand">Score {score.toLocaleString()}</Chip>
            </div>
          )
        }
      />

      {stage === 'ready' && (
        <Card className="space-y-6 p-7">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
              Pinpoint Structures by Function, Not Memorized Labels
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Inspect rotating 3D science models and interactive 2D parametric diagrams with
              labels hidden. Read the functional clue, select the numbered pin by click or keys{' '}
              <kbd className="rounded border px-1 py-0.5 font-mono text-xs">1–8</kbd>, and study
              each 1.5s spatial explanation before moving on. You hold 3 precision hearts per run.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Visual Mode
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'mixed', label: '3D Models + 2D Diagrams' },
                    { id: '3d', label: '3D Models Only' },
                    { id: '2d', label: '2D Diagrams Only' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMediaScope(opt.id)}
                    className={cn(
                      'rounded-xl border px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      mediaScope === opt.id
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-ink-900 dark:text-slate-300',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Subject Filter
              </div>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_FILTERS.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSubjectFilter(subj)}
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
          </div>

          <div className="flex justify-end border-t border-slate-200/70 pt-5 dark:border-white/10">
            <Button onClick={startRun} className="px-6 py-3 text-base">
              <Play size={16} /> Start Scouting ({ROUNDS_PER_RUN} Targets)
            </Button>
          </div>
        </Card>
      )}

      {(stage === 'play' || stage === 'feedback') && current && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Chip color="slate">
                Target {index + 1} / {rounds.length}
              </Chip>
              <Chip color="brand">
                <Layers size={11} /> {current.kind === '3d' ? '3D Model' : '2D Diagram'}
              </Chip>
              <Chip color="emerald">{current.subject}</Chip>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Flame size={14} className="text-amber-500" /> {combo} streak
              </span>
              <span>First-try: {firstTryHits}</span>
            </div>
          </div>

          <Card className="space-y-5 p-6">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {current.title}
              </div>
              <h2 className="font-display text-lg font-bold leading-snug text-slate-900 dark:text-white">
                {current.prompt}
              </h2>
            </div>

            {current.kind === '3d' && current.modelId && (
              <div ref={embedContainerRef} className="space-y-3">
                <ModelEmbed
                  modelId={current.modelId}
                  hideLabels
                  compact
                  highlightHotspots={
                    stage === 'feedback'
                      ? [current.targetId]
                      : pickedId
                        ? [pickedId]
                        : undefined
                  }
                  onHotspotSelect={stage === 'play' ? handle3dHotspot : undefined}
                />
                {stage === 'play' && current.fallbackHotspotIds && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Compass size={13} className="mr-1 inline" />
                      Keyboard pin selector:
                    </span>
                    {current.fallbackHotspotIds.map((hid, pinIdx) => (
                      <button
                        key={hid}
                        type="button"
                        onClick={() => triggerPinByNumber(pinIdx)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-700 hover:border-brand-500 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/15 dark:bg-ink-900 dark:text-slate-200"
                      >
                        [{pinIdx + 1}] Pin {pinIdx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {current.kind === '2d' && current.geometry && (
              <div className="space-y-3">
                <div className="flex justify-center rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-ink-900/70">
                  <FigureCanvas
                    geometry={current.geometry}
                    size={280}
                    interactiveRegions={current2dRegions}
                    hideLabels={stage === 'play'}
                    selectedRegionId={stage === 'feedback' ? current.targetId : pickedId}
                    onRegionSelect={(region) => {
                      if (stage === 'play') submitPin(region.id, region.label)
                    }}
                  />
                </div>
                {stage === 'play' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Click a pin on the figure or press keys 1–{current2dRegions.length}:
                    </span>
                    {current2dRegions.map((region, rIdx) => (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => submitPin(region.id, region.label)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-700 hover:border-brand-500 dark:border-white/10 dark:bg-ink-900 dark:text-slate-200"
                      >
                        [{rIdx + 1}]
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {stage === 'play' && lastOutcome && !lastOutcome.hit && (
              <div
                role="status"
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-700 dark:text-rose-200"
              >
                That pin isn’t it — try inspecting the spatial clue carefully ({hearts}{' '}
                heart{hearts === 1 ? '' : 's'} left).
              </div>
            )}

            {stage === 'feedback' && (
              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'space-y-3 rounded-2xl border p-4',
                  lastOutcome?.hit
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-rose-500/40 bg-rose-500/10',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-display text-base font-bold">
                    <Sparkles
                      size={16}
                      className={lastOutcome?.hit ? 'text-emerald-500' : 'text-rose-500'}
                    />
                    <span
                      className={
                        lastOutcome?.hit
                          ? 'text-emerald-700 dark:text-emerald-200'
                          : 'text-rose-700 dark:text-rose-200'
                      }
                    >
                      {lastOutcome?.hit
                        ? `Target Pinpointed! (${lastOutcome.label})`
                        : 'Out of precision hearts — study the target region highlighted above'}
                    </span>
                  </div>
                  <Chip color="slate">1.5s Conceptual Review</Chip>
                </div>

                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {current.explanation}
                </p>

                <div className="flex justify-end">
                  <Button onClick={handleAdvance} disabled={!cooldownReady}>
                    {cooldownReady
                      ? hearts <= 0 || index + 1 >= rounds.length
                        ? 'See Scouting Summary'
                        : 'Next Diagram'
                      : 'Reading clue…'}
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
          mode="diagram-scout"
          title={hearts > 0 ? 'Expedition Complete!' : 'Precision Hearts Depleted'}
          score={score}
          correct={correct}
          attempts={attempts}
          bestCombo={bestCombo}
          comboBursts={comboBursts}
          qualityScore={rounds.length > 0 ? Math.round((firstTryHits / rounds.length) * 100) : 0}
          extraStats={[
            { label: 'Targets Pinpointed', value: `${correct} / ${rounds.length}` },
            { label: 'First-Try Precision', value: String(firstTryHits) },
            { label: 'Hearts Remaining', value: `${hearts} / ${MAX_HEARTS}` },
          ]}
          result={payout?.result ?? null}
          isNewHigh={payout?.isNewHigh ?? false}
          onPlayAgain={startRun}
        />
      )}
    </div>
  )
}

export default DiagramScoutGame
