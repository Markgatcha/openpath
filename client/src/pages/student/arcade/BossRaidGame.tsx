import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Coins, Heart, Shield, Snowflake, Sparkles, Swords, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card, Chip, ProgressBar, Spinner } from '@/components/ui'
import { FigureCanvas } from '@/components/FigureCanvas'
import { cn } from '@/lib/utils'
import { isTypingTarget } from '@/lib/a11y'
import {
  fireComboBurst,
  playBurstSound,
  playCritSound,
  playHitSound,
  playMissSound,
  playShieldBreakSound,
} from '@/lib/sound'
import { buildChoices, hashSeed, seededRng, shuffled, siegeGrade } from '@shared/arcade'
import { isComboBurst } from '@shared/economy'
import type { ArcadeRunResultDTO, SiegeCardDTO } from '@shared/types'
import {
  ArcadePayoutView,
  ArcadeTopBar,
  buildPackCards,
  matchesSubjectFilter,
  useFinishArcadeRun,
} from './arcade-common'

interface BossGuardian {
  id: string
  name: string
  title: string
  emoji: string
  subject: string
  maxHp: number
  accent: string
}

const GUARDIANS: BossGuardian[] = [
  {
    id: 'hydra',
    name: 'The Stoichiometric Hydra',
    title: 'Warden of Molecules, Forces & Reactions',
    emoji: '🐉',
    subject: 'Science',
    maxHp: 300,
    accent: 'from-emerald-500/25 to-cyan-500/15',
  },
  {
    id: 'titan',
    name: 'The Euclidean Titan',
    title: 'Keeper of Theorems, Integrals & Proofs',
    emoji: '🗿',
    subject: 'Math',
    maxHp: 300,
    accent: 'from-brand-500/25 to-violet-500/15',
  },
  {
    id: 'automaton',
    name: 'The Red–Black Automaton',
    title: 'Sentinel of Trees, Graphs & Asymptotics',
    emoji: '🤖',
    subject: 'CS',
    maxHp: 300,
    accent: 'from-cyan-500/25 to-blue-500/15',
  },
  {
    id: 'colossus',
    name: 'The Invisible Hand Colossus',
    title: 'Arbiter of Equilibrium, Surplus & Risk',
    emoji: '🏛️',
    subject: 'Economics',
    maxHp: 300,
    accent: 'from-amber-500/25 to-orange-500/15',
  },
  {
    id: 'sphinx',
    name: 'The Chronicle Sphinx',
    title: 'Oracle of Empires, Rhetoric & Tongues',
    emoji: '🦁',
    subject: 'History',
    maxHp: 300,
    accent: 'from-rose-500/25 to-fuchsia-500/15',
  },
]

type PowerUpId = 'time-freeze' | 'fifty-shield' | 'coin-bounty'

interface PowerUpDef {
  id: PowerUpId
  name: string
  description: string
  icon: typeof Snowflake
  color: string
}

const POWER_UPS: PowerUpDef[] = [
  {
    id: 'time-freeze',
    name: 'Time Freeze',
    description: 'Widens your Critical Hit window to 9.0s and freezes boss rage for the rest of the raid.',
    icon: Snowflake,
    color: 'text-cyan-400',
  },
  {
    id: 'fifty-shield',
    name: '50/50 Shield',
    description: 'Eliminates up to 2 wrong distractors on the next 3 cards AND restores +2 Player Shield!',
    icon: Shield,
    color: 'text-emerald-400',
  },
  {
    id: 'coin-bounty',
    name: '2× Coin Bounty',
    description: 'Doubles raid point payouts and awards bonus combo bursts on every Critical Hit!',
    icon: Coins,
    color: 'text-amber-400',
  },
]

type RaidStage = 'select' | 'battle' | 'draft' | 'done'

export function BossRaidGame() {
  const [searchParams] = useSearchParams()
  const initialSubject = searchParams.get('subject') ?? 'All'
  const packFilter = searchParams.get('pack') ?? ''
  const queryClient = useQueryClient()
  const finishRun = useFinishArcadeRun('boss-raid')

  const { data: siegeData, isLoading } = useQuery({
    queryKey: ['srs-boss'],
    queryFn: api.srs.siege,
  })

  const [guardian, setGuardian] = useState<BossGuardian>(() => {
    return (
      GUARDIANS.find((g) => g.subject.toLowerCase() === initialSubject.toLowerCase()) ??
      GUARDIANS[0]
    )
  })
  const [stage, setStage] = useState<RaidStage>('select')

  const deck = useMemo<SiegeCardDTO[]>(() => {
    if (packFilter) return buildPackCards(guardian.subject, packFilter)
    const serverMatched = (siegeData?.cards ?? []).filter((c) =>
      matchesSubjectFilter(c.subject ?? c.quizTitle, guardian.subject),
    )
    return [...serverMatched, ...buildPackCards(guardian.subject)]
  }, [siegeData?.cards, guardian.subject, packFilter])

  const [queue, setQueue] = useState<SiegeCardDTO[]>([])
  const [cursor, setCursor] = useState(0)
  const [runSeed, setRunSeed] = useState(() => Date.now())

  const [bossHp, setBossHp] = useState(300)
  const [phaseGate, setPhaseGate] = useState<number>(2) // drafts at <=200 HP (gate 2) and <=100 HP (gate 1)
  const [playerHp, setPlayerHp] = useState(4)
  const [playerShield, setPlayerShield] = useState(2)

  // Active roguelite buffs
  const [timeFreezeActive, setTimeFreezeActive] = useState(false)
  const [fiftyCharges, setFiftyCharges] = useState(0)
  const [coinBountyActive, setCoinBountyActive] = useState(false)

  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [comboBursts, setComboBursts] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [crits, setCrits] = useState(0)
  const [score, setScore] = useState(0)
  const [combatLog, setCombatLog] = useState<string>('Choose an answer quickly (<4.5s) for a Critical Hit!')
  const [bossAnim, setBossAnim] = useState<'idle' | 'hit' | 'attack'>('idle')
  const [victory, setVictory] = useState(false)
  const [payout, setPayout] = useState<{
    result: ArcadeRunResultDTO | null
    isNewHigh: boolean
  } | null>(null)

  const runStartRef = useRef(0)
  const turnStartRef = useRef(0)
  const gradedIdsRef = useRef<Set<string>>(new Set())

  const currentCard = queue[cursor % Math.max(1, queue.length)] ?? null

  const roundChoices = useMemo(() => {
    if (!currentCard) return { choices: [], correctIndex: 0, hiddenIndices: new Set<number>() }
    const built = buildChoices(
      currentCard,
      deck,
      hashSeed(`${runSeed}:${cursor}:${currentCard.questionId}`),
    )
    const hiddenIndices = new Set<number>()
    if (fiftyCharges > 0 && built.choices.length > 2) {
      for (let i = 0; i < built.choices.length && hiddenIndices.size < 2; i += 1) {
        if (i !== built.correctIndex) hiddenIndices.add(i)
      }
    }
    return { ...built, hiddenIndices }
  }, [currentCard, deck, runSeed, cursor, fiftyCharges])

  const startRaid = () => {
    const seed = Date.now()
    const rng = seededRng(seed)
    setRunSeed(seed)
    setQueue(shuffled(deck, rng))
    setCursor(0)
    setBossHp(guardian.maxHp)
    setPhaseGate(2)
    setPlayerHp(4)
    setPlayerShield(2)
    setTimeFreezeActive(false)
    setFiftyCharges(0)
    setCoinBountyActive(false)
    setCombo(0)
    setBestCombo(0)
    setComboBursts(0)
    setCorrect(0)
    setAttempts(0)
    setCrits(0)
    setScore(0)
    setVictory(false)
    setPayout(null)
    setBossAnim('idle')
    setCombatLog(`${guardian.name} emerges! Land answers under 4.5s for 1.6× Critical Strikes.`)
    gradedIdsRef.current = new Set()
    const now = performance.now()
    runStartRef.current = now
    turnStartRef.current = now
    setStage('battle')
  }

  const concludeRaid = useCallback(
    async (won: boolean, finalVals: {
      score: number
      correct: number
      attempts: number
      bestCombo: number
      comboBursts: number
    }) => {
      setVictory(won)
      setStage('done')
      const durationMs = Math.max(1200, Math.round(performance.now() - runStartRef.current))
      const banked = await finishRun({ ...finalVals, durationMs })
      setPayout(banked)
      void queryClient.invalidateQueries({ queryKey: ['srs-stats'] })
    },
    [finishRun, queryClient],
  )

  const handleAnswer = useCallback(
    (idx: number) => {
      if (stage !== 'battle' || !currentCard || roundChoices.hiddenIndices.has(idx)) return
      const msTaken = Math.max(250, Math.round(performance.now() - turnStartRef.current))
      const isRight = idx === roundChoices.correctIndex
      const grade = siegeGrade(isRight, msTaken)

      if (!currentCard.questionId.startsWith('pack:') && !gradedIdsRef.current.has(currentCard.questionId)) {
        gradedIdsRef.current.add(currentCard.questionId)
        void api.srs.review({ questionId: currentCard.questionId, grade }).catch(() => {})
      }

      if (fiftyCharges > 0) setFiftyCharges((c) => Math.max(0, c - 1))

      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)

      if (isRight) {
        const critWindow = timeFreezeActive ? 9_000 : 4_500
        const isCrit = msTaken <= critWindow
        const nextCombo = combo + 1
        const nextBest = Math.max(bestCombo, nextCombo)
        const dmg = Math.round((isCrit ? 62 : 38) + Math.min(28, nextCombo * 4))
        const remainingBoss = Math.max(0, bossHp - dmg)
        const nextCorrect = correct + 1
        const burst = isComboBurst(nextCombo) || (coinBountyActive && isCrit)
        const nextBursts = Math.min(
          Math.floor(nextCorrect / 3),
          burst ? comboBursts + 1 : comboBursts,
        )
        const ptsGain = (isCrit ? 220 : 130) * (coinBountyActive ? 2 : 1) + nextCombo * 30
        const nextScore = score + ptsGain

        if (isCrit) {
          playCritSound()
          setCrits((c) => c + 1)
        } else if (burst) {
          playBurstSound()
          fireComboBurst()
        } else {
          playHitSound(nextCombo)
        }

        setBossAnim('hit')
        window.setTimeout(() => setBossAnim('idle'), 360)

        setBossHp(remainingBoss)
        setCorrect(nextCorrect)
        setCombo(nextCombo)
        setBestCombo(nextBest)
        setComboBursts(nextBursts)
        setScore(nextScore)
        setCombatLog(
          isCrit
            ? `⚡ CRITICAL HIT (${(msTaken / 1000).toFixed(1)}s)! Dealt ${dmg} DMG to ${guardian.name}!`
            : `⚔️ Direct Hit! Dealt ${dmg} DMG (${nextCombo}× combo).`,
        )

        if (remainingBoss <= 0) {
          fireComboBurst()
          void concludeRaid(true, {
            score: nextScore + (coinBountyActive ? 600 : 350),
            correct: nextCorrect,
            attempts: nextAttempts,
            bestCombo: nextBest,
            comboBursts: nextBursts,
          })
          return
        }

        // Trigger Phase Power-Up Draft at 2/3 and 1/3 HP thresholds
        const threshold = (guardian.maxHp / 3) * phaseGate
        if (phaseGate > 0 && remainingBoss <= threshold) {
          setPhaseGate((g) => g - 1)
          setStage('draft')
          return
        }

        setCursor((c) => c + 1)
        turnStartRef.current = performance.now()
      } else {
        setBossAnim('attack')
        window.setTimeout(() => setBossAnim('idle'), 420)
        setCombo(0)

        if (playerShield > 0) {
          playShieldBreakSound()
          setPlayerShield((s) => s - 1)
          setCombatLog(
            `🛡️ ${guardian.name} counter-attacks! Your Shield absorbed the blow (Answer: ${currentCard.answer}).`,
          )
          setCursor((c) => c + 1)
          turnStartRef.current = performance.now()
        } else {
          playMissSound()
          const nextHp = playerHp - 1
          setPlayerHp(nextHp)
          setCombatLog(
            `💥 ${guardian.name} strikes for 1 Hull HP! Correct answer was: ${currentCard.answer}.`,
          )
          if (nextHp <= 0) {
            void concludeRaid(false, {
              score,
              correct,
              attempts: nextAttempts,
              bestCombo,
              comboBursts,
            })
            return
          }
          setCursor((c) => c + 1)
          turnStartRef.current = performance.now()
        }
      }
    },
    [
      stage,
      currentCard,
      roundChoices,
      fiftyCharges,
      attempts,
      timeFreezeActive,
      combo,
      bestCombo,
      bossHp,
      correct,
      coinBountyActive,
      comboBursts,
      score,
      guardian.name,
      guardian.maxHp,
      phaseGate,
      concludeRaid,
      playerShield,
      playerHp,
    ],
  )

  useEffect(() => {
    if (stage === 'battle') {
      turnStartRef.current = performance.now()
    }
  }, [stage, cursor])

  const pickBuff = (id: PowerUpId) => {
    if (id === 'time-freeze') {
      setTimeFreezeActive(true)
      setCombatLog('❄️ Time Freeze active! Critical Hit window expanded to 9.0 seconds.')
    } else if (id === 'fifty-shield') {
      setFiftyCharges((c) => c + 3)
      setPlayerShield((s) => Math.min(4, s + 2))
      setCombatLog('🛡️ 50/50 Shield armed! +2 Shield Pips & 2 wrong choices pruned for 3 turns.')
    } else {
      setCoinBountyActive(true)
      setCombatLog('🪙 2× Coin Bounty active! Raid point & burst rewards doubled!')
    }
    setCursor((c) => c + 1)
    setStage('battle')
  }

  useEffect(() => {
    if (stage !== 'battle') return
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      const idx = Number(e.key) - 1
      if (idx >= 0 && idx < roundChoices.choices.length) {
        e.preventDefault()
        handleAnswer(idx)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage, roundChoices.choices.length, handleAnswer])

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
        title="Boss Raid — SRS Roguelite"
        subtitle="Defeat Subject Guardians with fast Critical Hits and between-phase power-up drafts"
        badge={<Chip color="rose">{guardian.subject}</Chip>}
      />

      {stage === 'select' && (
        <Card className="mx-auto flex max-w-3xl flex-col gap-5 p-7">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
              Choose Your Subject Guardian
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Each boss commands a 300 HP 3-phase raid powered by your real FSRS review queue.
              Answers under <strong>4.5s</strong> land devastating <strong>Critical Hits</strong>!
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {GUARDIANS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGuardian(g)}
                className={cn(
                  'flex items-center gap-3.5 rounded-2xl border p-4 text-left transition',
                  guardian.id === g.id
                    ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-400/60'
                    : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20',
                )}
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${g.accent} text-2xl`}
                >
                  {g.emoji}
                </span>
                <div className="min-w-0">
                  <div className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                    {g.name}
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {g.subject} · {g.title}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {deck.length} raid cards prepared · Draft 1 of 3 buffs between boss phases!
            </span>
            <Button onClick={startRaid}>
              <Swords size={16} /> Enter Boss Arena
            </Button>
          </div>
        </Card>
      )}

      {(stage === 'battle' || stage === 'draft') && currentCard && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {/* Boss Arena Banner */}
          <Card className={`bg-gradient-to-r ${guardian.accent} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <motion.div
                  animate={
                    bossAnim === 'hit'
                      ? { x: [0, -10, 10, -6, 6, 0], scale: [1, 0.9, 1] }
                      : bossAnim === 'attack'
                        ? { y: [0, 14, 0], scale: [1, 1.18, 1] }
                        : { y: [0, -3, 0] }
                  }
                  transition={{ duration: 0.35 }}
                  className="grid h-16 w-16 place-items-center rounded-2xl bg-ink-950/60 text-4xl shadow-lg"
                >
                  {guardian.emoji}
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                      {guardian.name}
                    </h2>
                    <Chip color="rose">Phase {3 - phaseGate} / 3</Chip>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{combatLog}</p>
                </div>
              </div>

              <div className="min-w-48 flex-1 sm:max-w-64">
                <div className="mb-1 flex justify-between font-mono text-xs font-extrabold">
                  <span className="text-rose-600 dark:text-rose-300">BOSS HP</span>
                  <span>
                    {bossHp} / {guardian.maxHp}
                  </span>
                </div>
                <ProgressBar value={bossHp / guardian.maxHp} />
              </div>
            </div>

            {/* Player Vitals + Active Buffs */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-300/40 pt-3 text-xs font-bold dark:border-white/10">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1 text-rose-500">
                  <Heart size={15} /> HP: {playerHp}/4
                </span>
                <span className="inline-flex items-center gap-1 text-cyan-500">
                  <Shield size={15} /> Shield: {playerShield}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Zap size={15} /> Combo: {combo}× ({crits} Crits)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {timeFreezeActive && <Chip color="brand">❄️ Time Freeze</Chip>}
                {fiftyCharges > 0 && <Chip color="emerald">🛡️ 50/50 ({fiftyCharges})</Chip>}
                {coinBountyActive && <Chip color="amber">🪙 2× Bounty</Chip>}
              </div>
            </div>
          </Card>

          {/* Between-Phase Power-Up Draft */}
          {stage === 'draft' ? (
            <Card className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-2 text-amber-500">
                <Sparkles size={18} />
                <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  Phase Cleared! Draft 1 Roguelite Relic
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {POWER_UPS.map((buff) => {
                  const Icon = buff.icon
                  return (
                    <button
                      key={buff.id}
                      type="button"
                      onClick={() => pickBuff(buff.id)}
                      className="card card-hover flex flex-col gap-2.5 p-4 text-left"
                    >
                      <Icon size={24} className={buff.color} />
                      <div className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                        {buff.name}
                      </div>
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {buff.description}
                      </p>
                      <span className="mt-auto pt-2 text-xs font-bold text-brand-500">
                        Equip Relic →
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>
          ) : (
            /* Active Combat Card */
            <Card className="flex flex-col gap-5 p-6">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{currentCard.quizTitle}</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                  Score: {score.toLocaleString()}
                </span>
              </div>

              <h3 className="font-display text-lg font-bold leading-relaxed text-slate-900 dark:text-white">
                {currentCard.prompt}
              </h3>

              {currentCard.figure && (
                <div className="flex justify-center">
                  <FigureCanvas geometry={currentCard.figure} size={210} />
                </div>
              )}

              <div className="grid gap-2.5 sm:grid-cols-2">
                {roundChoices.choices.map((choice, idx) => {
                  const pruned = roundChoices.hiddenIndices.has(idx)
                  return (
                    <button
                      key={`${currentCard.questionId}-${idx}`}
                      type="button"
                      disabled={pruned}
                      onClick={() => handleAnswer(idx)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-semibold transition',
                        pruned
                          ? 'border-dashed border-slate-200 opacity-30 line-through dark:border-white/5'
                          : 'border-slate-200 bg-white hover:border-rose-400 hover:bg-rose-500/5 dark:border-white/10 dark:bg-white/5 dark:text-slate-100',
                      )}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{choice}</span>
                    </button>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {stage === 'done' && (
        <ArcadePayoutView
          mode="boss-raid"
          title={
            victory
              ? `Victory! ${guardian.name} Vanquished!`
              : `Raid Ended — ${guardian.name} Stands (${bossHp} HP left)`
          }
          score={score}
          correct={correct}
          attempts={attempts}
          bestCombo={bestCombo}
          comboBursts={comboBursts}
          extraStats={[
            { label: 'Critical Hits', value: String(crits) },
            { label: 'Boss Remaining HP', value: `${bossHp} / ${guardian.maxHp}` },
            { label: 'Guardian', value: guardian.name },
          ]}
          result={payout?.result ?? null}
          isNewHigh={payout?.isNewHigh ?? false}
          onPlayAgain={() => setStage('select')}
        />
      )}
    </div>
  )
}

export default BossRaidGame
