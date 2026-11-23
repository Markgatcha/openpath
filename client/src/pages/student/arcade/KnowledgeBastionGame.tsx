import { createFrameLimiter, useGraphicsQuality } from '@/lib/graphics'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Castle,
  FastForward,
  Flame,
  Hammer,
  HeartHandshake,
  Pause,
  Play,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { FigureCanvas } from '@/components/FigureCanvas'
import { Button, Card, Chip } from '@/components/ui'
import { isTypingTarget, usePrefersReducedMotion } from '@/lib/a11y'
import { fireComboBurst, playBurstSound, playHitSound, playMissSound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import {
  BASTION_COLS,
  BASTION_MAPS,
  BASTION_ROWS,
  BASTION_START_ENERGY,
  BASTION_START_HP,
  BASTION_TOTAL_WAVES,
  BASTION_TOWERS,
  bastionWaveSpec,
  buildChoices,
  isBastionPathTile,
  seededRng,
  shuffled,
  type BastionMapPreset,
  type BastionTowerId,
  type ChoiceCard,
} from '@shared/arcade'
import { isComboBurst } from '@shared/economy'
import { buildFigureGeometry, computeAnswer, roundValue, type FigureGeometry } from '@shared/figure'
import { CONTENT_PACKS } from '@shared/packs'
import type { ArcadeRunResultDTO } from '@shared/types'
import {
  ArcadePayoutView,
  ArcadeTopBar,
  matchesSubjectFilter,
  useArcadeSrsBridge,
  useFinishArcadeRun,
} from './arcade-common'

type Stage = 'ready' | 'charge' | 'build' | 'wave' | 'done'
type SimSpeed = 1 | 2

interface PlacedTower {
  id: string
  col: number
  row: number
  type: BastionTowerId
  level: 1 | 2 | 3
  cooldownLeftMs: number
}

interface ChargeQuestion {
  id: string
  prompt: string
  subject: string
  choices: string[]
  correctIndex: number
  explanation: string
  geometry: FigureGeometry | null
  srsQuestionId?: string
}

interface SimEnemy {
  id: number
  hp: number
  maxHp: number
  pathDist: number
  speed: number
  slowLeftMs: number
  isBoss: boolean
}

interface SimTracer {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  lifeMs: number
}

interface SavedBastionState {
  mapId: string
  subjectFilter: string
  wave: number
  hp: number
  energy: number
  towers: PlacedTower[]
  score: number
  correct: number
  attempts: number
  combo: number
  bestCombo: number
  comboBursts: number
  wavesCleared: number
  waveDmgMult: number
  usedRepair: boolean
  usedReroll: boolean
  seed: number
}

const CHARGE_PER_WAVE = 4
const TOWER_JAM_MS = 3000
const FAST_MISS_MS = 2500
const TILE_PX = 64
const CANVAS_W = BASTION_COLS * TILE_PX
const CANVAS_H = BASTION_ROWS * TILE_PX
const SUBJECT_FILTERS = ['All', 'Math', 'Science', 'CS', 'Economics', 'History', 'Languages'] as const

function bastionSaveKey(userId: string | undefined): string {
  return `openpath:arcade:bastion:v1:${userId ?? 'anon'}`
}

function readBastionSave(userId: string | undefined): SavedBastionState | null {
  try {
    const raw = localStorage.getItem(bastionSaveKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedBastionState
    if (!parsed || typeof parsed.wave !== 'number' || parsed.hp <= 0) return null
    return parsed
  } catch {
    return null
  }
}

function writeBastionSave(userId: string | undefined, state: SavedBastionState | null) {
  try {
    if (!state) localStorage.removeItem(bastionSaveKey(userId))
    else localStorage.setItem(bastionSaveKey(userId), JSON.stringify(state))
  } catch {
    // Storage quota or private mode; safe to ignore.
  }
}

function enemyWorldPos(map: BastionMapPreset, pathDist: number): { x: number; y: number } {
  const maxIdx = map.path.length - 1
  const clamped = Math.max(0, Math.min(maxIdx, pathDist))
  const i0 = Math.floor(clamped)
  const i1 = Math.min(maxIdx, i0 + 1)
  const frac = clamped - i0
  const p0 = map.path[i0]
  const p1 = map.path[i1]
  return {
    x: p0.col + (p1.col - p0.col) * frac + 0.5,
    y: p0.row + (p1.row - p0.row) * frac + 0.5,
  }
}

export function KnowledgeBastionGame() {
  const [searchParams] = useSearchParams()
  const initialSubject = searchParams.get('subject') ?? 'All'
  const { user } = useAuth()
  const reducedMotion = usePrefersReducedMotion()
  const maxFps = useGraphicsQuality().profile.maxFps

  const finishRun = useFinishArcadeRun('knowledge-bastion')
  const srsBridge = useArcadeSrsBridge({ untimed: true })

  const { data: dueQuery } = useQuery({
    queryKey: ['srs-due'],
    queryFn: () => api.srs.due(),
    staleTime: 60_000,
  })

  const [savedRun, setSavedRun] = useState<SavedBastionState | null>(() =>
    readBastionSave(user?.id),
  )

  const [subjectFilter, setSubjectFilter] = useState(initialSubject)
  const [mapId, setMapId] = useState<string>(BASTION_MAPS[0].id)
  const [stage, setStage] = useState<Stage>('ready')
  const [runSeed, setRunSeed] = useState<number>(1)

  const [wave, setWave] = useState(1)
  const [hp, setHp] = useState(BASTION_START_HP)
  const [energy, setEnergy] = useState(BASTION_START_ENERGY)
  const [towers, setTowers] = useState<PlacedTower[]>([])
  const [selectedTowerType, setSelectedTowerType] = useState<BastionTowerId>('pulse-turret')
  const [cursor, setCursor] = useState<{ col: number; row: number }>({ col: 3, row: 2 })
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1)

  const [chargeDeck, setChargeDeck] = useState<ChargeQuestion[]>([])
  const [chargeIdx, setChargeIdx] = useState(0)
  const [chargeCorrectInWave, setChargeCorrectInWave] = useState(0)
  const [chargePicked, setChargePicked] = useState<number | null>(null)
  const [waveDmgMult, setWaveDmgMult] = useState(1)
  const [rapidMissStreak, setRapidMissStreak] = useState(0)
  const [jamUntilMs, setJamUntilMs] = useState(0)
  const [jamNowMs, setJamNowMs] = useState(() => Date.now())
  const jamSecondsLeft =
    jamUntilMs > jamNowMs ? Math.min(3, Math.ceil((jamUntilMs - jamNowMs) / 1000)) : 0

  const [usedRepair, setUsedRepair] = useState(false)
  const [usedReroll, setUsedReroll] = useState(false)

  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [comboBursts, setComboBursts] = useState(0)
  const [wavesCleared, setWavesCleared] = useState(0)

  const [payout, setPayout] = useState<{
    result: ArcadeRunResultDTO | null
    isNewHigh: boolean
  } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gridContainerRef = useRef<HTMLDivElement | null>(null)
  const questionOpenedAtRef = useRef<number>(0)
  const runStartedAtRef = useRef<number>(0)
  const finishingRef = useRef(false)
  const simPausedRef = useRef(false)
  const [simPaused, setSimPaused] = useState(false)

  // Live wave simulation refs so RAF loop runs smoothly without React re-render churn
  const enemiesRef = useRef<SimEnemy[]>([])
  const spawnedCountRef = useRef(0)
  const spawnTimerMsRef = useRef(0)
  const tracersRef = useRef<SimTracer[]>([])
  const waveHpRef = useRef(BASTION_START_HP)
  const towersSimRef = useRef<PlacedTower[]>([])

  const activeMap = useMemo(
    () => BASTION_MAPS.find((m) => m.id === mapId) ?? BASTION_MAPS[0],
    [mapId],
  )

  const buildChargeQuestions = useCallback(
    (seed: number, subFilter: string): ChargeQuestion[] => {
      const dueCards = (dueQuery?.cards ?? []).filter((c) =>
        matchesSubjectFilter(c.subject, subFilter),
      )
      const packs = CONTENT_PACKS.filter(
        (p) =>
          subFilter === 'All' ||
          p.category.toLowerCase() === subFilter.toLowerCase() ||
          matchesSubjectFilter(p.subject, subFilter),
      )
      const sourcePacks = packs.length > 0 ? packs : CONTENT_PACKS
      const packCards: Array<{
        id: string
        prompt: string
        subject: string
        explanation: string
        card: ChoiceCard
        geometry: FigureGeometry | null
      }> = []

      sourcePacks.forEach((pack) => {
        pack.quizzes.forEach((quiz, qzIdx) => {
          quiz.questions.forEach((q, qIdx) => {
            let answer = ''
            let options: string[] | null = null
            let geometry: FigureGeometry | null = null
            if (q.type === 'mcq') {
              options = q.options
              answer = q.options[q.correct] ?? ''
            } else if (q.type === 'truefalse') {
              answer = q.correct ? 'True' : 'False'
            } else if (q.type === 'fill') {
              answer = q.correct
            } else if (q.type === 'figure') {
              answer = String(roundValue(computeAnswer(q.figure), q.figure.rounding))
              geometry = buildFigureGeometry(q.figure)
            } else if (q.type === 'order') {
              answer = q.correct.map((i) => q.options[i]).join(' → ')
            }
            if (!answer) return
            const id = `${pack.id}-b-${qzIdx}-${qIdx}`
            packCards.push({
              id,
              prompt: q.prompt,
              subject: quiz.subject || pack.subject,
              explanation: q.explanation || `Correct answer: ${answer}`,
              card: { questionId: id, type: q.type, answer, options },
              geometry,
            })
          })
        })
      })

      const pool: ChoiceCard[] = [
        ...dueCards.map((c) => ({
          questionId: c.questionId,
          type: c.type,
          answer: c.answer,
          options: c.options,
        })),
        ...packCards.map((p) => p.card),
      ]

      const rng = seededRng(seed)
      const fromDue: ChargeQuestion[] = shuffled(dueCards, rng)
        .slice(0, 2)
        .map((c, idx) => {
          const built = buildChoices(
            {
              questionId: c.questionId,
              type: c.type,
              answer: c.answer,
              options: c.options,
            },
            pool,
            seed + idx * 19,
          )
          return {
            id: `due-${c.questionId}-${seed}`,
            prompt: c.prompt,
            subject: c.subject || c.quizTitle,
            choices: built.choices,
            correctIndex: built.correctIndex,
            explanation: c.explanation || `Correct answer: ${c.answer}`,
            geometry: c.figure ?? null,
            srsQuestionId: c.questionId,
          }
        })

      const needed = Math.max(0, CHARGE_PER_WAVE - fromDue.length)
      const fromPacks: ChargeQuestion[] = shuffled(packCards, rng)
        .slice(0, needed)
        .map((p, idx) => {
          const built = buildChoices(p.card, pool, seed + 101 + idx * 23)
          return {
            id: p.id,
            prompt: p.prompt,
            subject: p.subject,
            choices: built.choices,
            correctIndex: built.correctIndex,
            explanation: p.explanation,
            geometry: p.geometry,
          }
        })

      return [...fromDue, ...fromPacks]
    },
    [dueQuery?.cards],
  )

  const persistProgress = useCallback(
    (overrides?: Partial<SavedBastionState>) => {
      const payload: SavedBastionState = {
        mapId,
        subjectFilter,
        wave,
        hp,
        energy,
        towers,
        score,
        correct,
        attempts,
        combo,
        bestCombo,
        comboBursts,
        wavesCleared,
        waveDmgMult,
        usedRepair,
        usedReroll,
        seed: runSeed,
        ...overrides,
      }
      writeBastionSave(user?.id, payload)
      setSavedRun(payload)
    },
    [
      attempts,
      bestCombo,
      combo,
      comboBursts,
      correct,
      energy,
      hp,
      mapId,
      runSeed,
      score,
      subjectFilter,
      towers,
      usedRepair,
      usedReroll,
      user?.id,
      wave,
      waveDmgMult,
      wavesCleared,
    ],
  )

  // Countdown tick while Tower Jam anti-guess lockout is active
  useEffect(() => {
    if (jamUntilMs === 0) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setJamNowMs(t)
      if (t >= jamUntilMs) window.clearInterval(id)
    }, 200)
    return () => window.clearInterval(id)
  }, [jamUntilMs])

  const completeRun = useCallback(
    async (
      victory: boolean,
      finalHp: number,
      finalWavesCleared: number,
      finalScore: number,
      finalCorrect: number,
      finalAttempts: number,
      finalBestCombo: number,
      finalBursts: number,
    ) => {
      if (finishingRef.current) return
      finishingRef.current = true
      writeBastionSave(user?.id, null)
      setSavedRun(null)
      setHp(finalHp)
      setWavesCleared(finalWavesCleared)
      setScore(finalScore)
      setStage('done')

      const integrityPct = Math.round((Math.max(0, finalHp) / BASTION_START_HP) * 100)
      const accPct = finalAttempts > 0 ? Math.round((finalCorrect / finalAttempts) * 100) : 0
      const quality = Math.round((integrityPct * 0.6 + accPct * 0.4) * (victory ? 1 : 0.7))

      const outcome = await finishRun({
        score: finalScore,
        correct: finalCorrect,
        attempts: finalAttempts,
        bestCombo: finalBestCombo,
        comboBursts: finalBursts,
        durationMs: Date.now() - runStartedAtRef.current,
        deckId: mapId,
        qualityScore: Math.max(0, Math.min(100, quality)),
        deepUnits: finalWavesCleared,
      })
      setPayout(outcome)
    },
    [finishRun, mapId, user?.id],
  )

  const beginNewCampaign = useCallback(() => {
    const nextSeed = (Date.now() ^ (Math.random() * 0xffff)) >>> 0
    setRunSeed(nextSeed)
    setWave(1)
    setHp(BASTION_START_HP)
    setEnergy(BASTION_START_ENERGY)
    setTowers([])
    setCursor({ col: 3, row: 2 })
    setWaveDmgMult(1)
    setUsedRepair(false)
    setUsedReroll(false)
    setScore(0)
    setCorrect(0)
    setAttempts(0)
    setCombo(0)
    setBestCombo(0)
    setComboBursts(0)
    setWavesCleared(0)
    setPayout(null)
    setRapidMissStreak(0)
    setJamUntilMs(0)
    finishingRef.current = false
    srsBridge.resetSession()
    runStartedAtRef.current = Date.now()

    const qList = buildChargeQuestions(nextSeed + 17, subjectFilter)
    setChargeDeck(qList)
    setChargeIdx(0)
    setChargeCorrectInWave(0)
    setChargePicked(null)
    questionOpenedAtRef.current = Date.now()
    setStage('charge')
  }, [buildChargeQuestions, srsBridge, subjectFilter])

  const resumeSavedCampaign = useCallback(() => {
    if (!savedRun) return
    setMapId(savedRun.mapId)
    setSubjectFilter(savedRun.subjectFilter)
    setWave(savedRun.wave)
    setHp(savedRun.hp)
    setEnergy(savedRun.energy)
    setTowers(savedRun.towers)
    setScore(savedRun.score)
    setCorrect(savedRun.correct)
    setAttempts(savedRun.attempts)
    setCombo(savedRun.combo)
    setBestCombo(savedRun.bestCombo)
    setComboBursts(savedRun.comboBursts)
    setWavesCleared(savedRun.wavesCleared)
    setWaveDmgMult(savedRun.waveDmgMult)
    setUsedRepair(savedRun.usedRepair)
    setUsedReroll(savedRun.usedReroll)
    setRunSeed(savedRun.seed)
    setPayout(null)
    finishingRef.current = false
    runStartedAtRef.current = Date.now()
    setStage('build')
  }, [savedRun])

  const answerChargeQuestion = useCallback(
    (optIdx: number) => {
      if (stage !== 'charge' || chargePicked !== null || jamSecondsLeft > 0) return
      const q = chargeDeck[chargeIdx]
      if (!q) return

      const msTaken = Date.now() - questionOpenedAtRef.current
      const isRight = optIdx === q.correctIndex
      setChargePicked(optIdx)
      setAttempts((a) => a + 1)

      if (isRight) {
        const nextCorrect = correct + 1
        const nextCombo = combo + 1
        const nextBest = Math.max(bestCombo, nextCombo)
        const burst = isComboBurst(nextCombo)
        const nextBursts = comboBursts + (burst ? 1 : 0)
        const nextWaveCorrect = chargeCorrectInWave + 1
        const gainedEnergy = 2 + (nextWaveCorrect === CHARGE_PER_WAVE ? 1 : 0)

        setCorrect(nextCorrect)
        setCombo(nextCombo)
        setBestCombo(nextBest)
        setComboBursts(nextBursts)
        setChargeCorrectInWave(nextWaveCorrect)
        setEnergy((e) => e + gainedEnergy)
        setScore((s) => s + 110 + nextCombo * 20)
        setRapidMissStreak(0)

        if (burst) {
          playBurstSound()
          if (!reducedMotion) fireComboBurst()
        } else {
          playHitSound(nextCombo)
        }
      } else {
        playMissSound()
        setCombo(0)
        const nextFastMisses = msTaken < FAST_MISS_MS ? rapidMissStreak + 1 : 0
        setRapidMissStreak(nextFastMisses)
        if (nextFastMisses >= 2) {
          setJamUntilMs(Date.now() + TOWER_JAM_MS)
          setRapidMissStreak(0)
        }
      }

      if (q.srsQuestionId) {
        void srsBridge.recordAnswer(q.srsQuestionId, isRight)
      }
    },
    [
      bestCombo,
      chargeCorrectInWave,
      chargeDeck,
      chargeIdx,
      chargePicked,
      combo,
      comboBursts,
      correct,
      jamSecondsLeft,
      rapidMissStreak,
      reducedMotion,
      srsBridge,
      stage,
    ],
  )

  const nextChargeStep = useCallback(() => {
    if (stage !== 'charge' || chargePicked === null || jamSecondsLeft > 0) return
    if (chargeIdx + 1 >= chargeDeck.length) {
      const dmgMult = 0.85 + chargeCorrectInWave * 0.1
      setWaveDmgMult(dmgMult)
      persistProgress({ energy, waveDmgMult: dmgMult })
      setStage('build')
      return
    }
    setChargeIdx((i) => i + 1)
    setChargePicked(null)
    questionOpenedAtRef.current = Date.now()
  }, [
    chargeCorrectInWave,
    chargeDeck.length,
    chargeIdx,
    chargePicked,
    energy,
    jamSecondsLeft,
    persistProgress,
    stage,
  ])

  const rerollBlueprint = useCallback(() => {
    if (stage !== 'build' || usedReroll || energy < 1) return
    const qList = buildChargeQuestions(runSeed + wave * 313, subjectFilter)
    setUsedReroll(true)
    setChargeDeck(qList)
    setChargeIdx(0)
    setChargeCorrectInWave(0)
    setChargePicked(null)
    questionOpenedAtRef.current = Date.now()
    persistProgress({ usedReroll: true })
    setStage('charge')
  }, [
    buildChargeQuestions,
    energy,
    persistProgress,
    runSeed,
    stage,
    subjectFilter,
    usedReroll,
    wave,
  ])

  const fortifyWalls = useCallback(() => {
    if (stage !== 'build' || usedRepair || energy < 3 || hp >= BASTION_START_HP) return
    const nextHp = Math.min(BASTION_START_HP, hp + 4)
    const nextEnergy = energy - 3
    setHp(nextHp)
    setEnergy(nextEnergy)
    setUsedRepair(true)
    playHitSound(2)
    persistProgress({ hp: nextHp, energy: nextEnergy, usedRepair: true })
  }, [energy, hp, persistProgress, stage, usedRepair])

  const selectedTowerDef = useMemo(
    () => BASTION_TOWERS.find((t) => t.id === selectedTowerType) ?? BASTION_TOWERS[0],
    [selectedTowerType],
  )

  const towerAtCursor = useMemo(
    () => towers.find((t) => t.col === cursor.col && t.row === cursor.row) ?? null,
    [cursor.col, cursor.row, towers],
  )

  const actOnTile = useCallback(
    (col: number, row: number) => {
      if (stage !== 'build') return
      setCursor({ col, row })
      if (isBastionPathTile(activeMap, col, row)) return
      const existing = towers.find((t) => t.col === col && t.row === row)
      if (existing) {
        if (existing.level >= 3) return
        const def = BASTION_TOWERS.find((d) => d.id === existing.type) ?? BASTION_TOWERS[0]
        const upCost = def.upgradeCost + (existing.level - 1) * 2
        if (energy < upCost) return
        const nextTowers = towers.map((t) =>
          t.id === existing.id ? { ...t, level: (existing.level + 1) as 1 | 2 | 3 } : t,
        )
        const nextEnergy = energy - upCost
        setTowers(nextTowers)
        setEnergy(nextEnergy)
        playHitSound(existing.level + 1)
        persistProgress({ towers: nextTowers, energy: nextEnergy })
        return
      }
      if (energy < selectedTowerDef.cost) return
      const newTower: PlacedTower = {
        id: `${col}-${row}-${Date.now()}`,
        col,
        row,
        type: selectedTowerDef.id,
        level: 1,
        cooldownLeftMs: 0,
      }
      const nextTowers = [...towers, newTower]
      const nextEnergy = energy - selectedTowerDef.cost
      setTowers(nextTowers)
      setEnergy(nextEnergy)
      playHitSound(1)
      persistProgress({ towers: nextTowers, energy: nextEnergy })
    },
    [activeMap, energy, persistProgress, selectedTowerDef, stage, towers],
  )

  const sellTowerAt = useCallback(
    (col: number, row: number) => {
      if (stage !== 'build') return
      const existing = towers.find((t) => t.col === col && t.row === row)
      if (!existing) return
      const def = BASTION_TOWERS.find((d) => d.id === existing.type) ?? BASTION_TOWERS[0]
      const refund = Math.max(1, Math.floor((def.cost + (existing.level - 1) * def.upgradeCost) * 0.5))
      const nextTowers = towers.filter((t) => t.id !== existing.id)
      const nextEnergy = energy + refund
      setTowers(nextTowers)
      setEnergy(nextEnergy)
      persistProgress({ towers: nextTowers, energy: nextEnergy })
    },
    [energy, persistProgress, stage, towers],
  )

  // Step 1 fixed dt millisecond simulation shared cleanly by both RAF & Instant Resolve
  const stepWaveSimulation = useCallback(
    (dtMs: number): 'running' | 'won' | 'lost' => {
      const spec = bastionWaveSpec(wave)
      const totalEnemies = spec.count + (spec.hasBoss ? 1 : 0)
      const maxPathDist = activeMap.path.length - 1

      spawnTimerMsRef.current -= dtMs
      while (spawnedCountRef.current < totalEnemies && spawnTimerMsRef.current <= 0) {
        const isBoss = spec.hasBoss && spawnedCountRef.current === totalEnemies - 1
        const maxHp = isBoss ? spec.bossHp : spec.hp
        enemiesRef.current.push({
          id: spawnedCountRef.current + 1,
          hp: maxHp,
          maxHp,
          pathDist: 0,
          speed: isBoss ? spec.speedTilesPerSec * 0.72 : spec.speedTilesPerSec,
          slowLeftMs: 0,
          isBoss,
        })
        spawnedCountRef.current += 1
        spawnTimerMsRef.current += 900
      }

      // Advance enemies along path
      const survived: SimEnemy[] = []
      for (const enemy of enemiesRef.current) {
        enemy.slowLeftMs = Math.max(0, enemy.slowLeftMs - dtMs)
        const slowMul = enemy.slowLeftMs > 0 ? 0.55 : 1
        enemy.pathDist += (enemy.speed * slowMul * dtMs) / 1000
        if (enemy.pathDist >= maxPathDist) {
          waveHpRef.current = Math.max(0, waveHpRef.current - (enemy.isBoss ? 5 : 2))
          if (waveHpRef.current <= 0) {
            enemiesRef.current = []
            return 'lost'
          }
        } else {
          survived.push(enemy)
        }
      }
      enemiesRef.current = survived

      // Fire towers
      for (const tower of towersSimRef.current) {
        tower.cooldownLeftMs = Math.max(0, tower.cooldownLeftMs - dtMs)
        if (tower.cooldownLeftMs > 0 || enemiesRef.current.length === 0) continue
        const def = BASTION_TOWERS.find((d) => d.id === tower.type) ?? BASTION_TOWERS[0]
        const tx = tower.col + 0.5
        const ty = tower.row + 0.5
        const range = def.range + (tower.level - 1) * 0.2

        const inRange = enemiesRef.current
          .map((e) => {
            const pos = enemyWorldPos(activeMap, e.pathDist)
            const dist = Math.hypot(pos.x - tx, pos.y - ty)
            return { e, pos, dist }
          })
          .filter((entry) => entry.dist <= range)
          .sort((a, b) => b.e.pathDist - a.e.pathDist)

        if (inRange.length === 0) continue
        tower.cooldownLeftMs = def.cooldownMs

        const baseDmg = def.damage + (tower.level - 1) * Math.round(def.damage * 0.55)
        const dmg = Math.round(baseDmg * waveDmgMult)
        const targets = inRange.slice(0, def.chainCount)

        for (const t of targets) {
          t.e.hp -= dmg
          if (def.slowFactor < 1) {
            t.e.slowLeftMs = Math.max(t.e.slowLeftMs, 1800)
          }
          tracersRef.current.push({
            x1: tx,
            y1: ty,
            x2: t.pos.x,
            y2: t.pos.y,
            color: def.color,
            lifeMs: 140,
          })
        }
      }

      enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0)
      tracersRef.current = tracersRef.current
        .map((tr) => ({ ...tr, lifeMs: tr.lifeMs - dtMs }))
        .filter((tr) => tr.lifeMs > 0)

      if (spawnedCountRef.current >= totalEnemies && enemiesRef.current.length === 0) {
        return 'won'
      }
      return 'running'
    },
    [activeMap, wave, waveDmgMult],
  )

  const finishWaveOutcome = useCallback(
    (won: boolean) => {
      const nextHp = waveHpRef.current
      if (!won || nextHp <= 0) {
        playMissSound()
        void completeRun(
          false,
          0,
          wavesCleared,
          score,
          correct,
          attempts,
          bestCombo,
          comboBursts,
        )
        return
      }

      const clearedCount = wave
      const waveBonus = 180 + wave * 60 + nextHp * 5
      const nextScore = score + waveBonus
      playHitSound(Math.min(5, wave + 1))

      if (wave >= BASTION_TOTAL_WAVES) {
        void completeRun(
          true,
          nextHp,
          clearedCount,
          nextScore,
          correct,
          attempts,
          bestCombo,
          comboBursts,
        )
        return
      }

      const nextWave = wave + 1
      const qList = buildChargeQuestions(runSeed + nextWave * 97, subjectFilter)
      setHp(nextHp)
      setWavesCleared(clearedCount)
      setScore(nextScore)
      setEnergy((e) => e + 2)
      setWave(nextWave)
      setChargeDeck(qList)
      setChargeIdx(0)
      setChargeCorrectInWave(0)
      setChargePicked(null)
      questionOpenedAtRef.current = Date.now()
      persistProgress({
        hp: nextHp,
        wavesCleared: clearedCount,
        score: nextScore,
        energy: energy + 2,
        wave: nextWave,
      })
      setStage('charge')
    },
    [
      attempts,
      bestCombo,
      buildChargeQuestions,
      comboBursts,
      completeRun,
      correct,
      energy,
      persistProgress,
      runSeed,
      score,
      subjectFilter,
      wave,
      wavesCleared,
    ],
  )

  const launchWave = useCallback(() => {
    if (stage !== 'build') return
    enemiesRef.current = []
    tracersRef.current = []
    spawnedCountRef.current = 0
    spawnTimerMsRef.current = 0
    waveHpRef.current = hp
    towersSimRef.current = towers.map((t) => ({ ...t, cooldownLeftMs: 0 }))
    simPausedRef.current = false
    setSimPaused(false)
    setStage('wave')
  }, [hp, stage, towers])

  const instantResolveWave = useCallback(() => {
    if (stage !== 'wave') return
    for (let tick = 0; tick < 3600; tick += 1) {
      const res = stepWaveSimulation(50)
      if (res !== 'running') {
        finishWaveOutcome(res === 'won')
        return
      }
    }
    finishWaveOutcome(waveHpRef.current > 0)
  }, [finishWaveOutcome, stage, stepWaveSimulation])

  // Render canvas (both in build mode for clear placement + during wave combat)
  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // Grid tiles
    for (let r = 0; r < BASTION_ROWS; r += 1) {
      for (let c = 0; c < BASTION_COLS; c += 1) {
        const isPath = isBastionPathTile(activeMap, c, r)
        const isCursor = stage === 'build' && cursor.col === c && cursor.row === r
        ctx.fillStyle = isPath ? '#1e293b' : (r + c) % 2 === 0 ? '#0f172a' : '#131d33'
        ctx.fillRect(c * TILE_PX, r * TILE_PX, TILE_PX, TILE_PX)

        ctx.strokeStyle = isCursor ? '#38bdf8' : 'rgba(148,163,184,0.16)'
        ctx.lineWidth = isCursor ? 3 : 1
        ctx.strokeRect(c * TILE_PX + 1, r * TILE_PX + 1, TILE_PX - 2, TILE_PX - 2)
      }
    }

    // Winding road centerline & entrance/keep badges
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    activeMap.path.forEach((pt, idx) => {
      const px = (pt.col + 0.5) * TILE_PX
      const py = (pt.row + 0.5) * TILE_PX
      if (idx === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.stroke()

    const keepPt = activeMap.path[activeMap.path.length - 1]
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc((keepPt.col + 0.5) * TILE_PX, (keepPt.row + 0.5) * TILE_PX, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('KEEP', (keepPt.col + 0.5) * TILE_PX, (keepPt.row + 0.5) * TILE_PX)

    // Focused tile range preview while building
    if (stage === 'build' && !isBastionPathTile(activeMap, cursor.col, cursor.row)) {
      const existing = towers.find((t) => t.col === cursor.col && t.row === cursor.row)
      const def = existing
        ? BASTION_TOWERS.find((d) => d.id === existing.type) ?? selectedTowerDef
        : selectedTowerDef
      const lvl = existing ? existing.level : 1
      const rangePx = (def.range + (lvl - 1) * 0.2) * TILE_PX
      ctx.beginPath()
      ctx.arc((cursor.col + 0.5) * TILE_PX, (cursor.row + 0.5) * TILE_PX, rangePx, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Towers
    for (const tower of stage === 'wave' ? towersSimRef.current : towers) {
      const def = BASTION_TOWERS.find((d) => d.id === tower.type) ?? BASTION_TOWERS[0]
      const cx = (tower.col + 0.5) * TILE_PX
      const cy = (tower.row + 0.5) * TILE_PX

      ctx.fillStyle = '#020617'
      ctx.beginPath()
      ctx.arc(cx, cy, 20, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = def.color
      ctx.lineWidth = 3.5
      ctx.stroke()

      ctx.fillStyle = def.color
      ctx.beginPath()
      ctx.arc(cx, cy, 9 + tower.level * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#f8fafc'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`L${tower.level}`, cx, cy)
    }

    // Tracers & enemies during wave
    if (stage === 'wave') {
      if (!reducedMotion) {
        for (const tr of tracersRef.current) {
          ctx.strokeStyle = tr.color
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(tr.x1 * TILE_PX, tr.y1 * TILE_PX)
          ctx.lineTo(tr.x2 * TILE_PX, tr.y2 * TILE_PX)
          ctx.stroke()
        }
      }
      for (const e of enemiesRef.current) {
        const pos = enemyWorldPos(activeMap, e.pathDist)
        const ex = pos.x * TILE_PX
        const ey = pos.y * TILE_PX
        const r = e.isBoss ? 17 : 11
        ctx.fillStyle = e.slowLeftMs > 0 ? '#38bdf8' : e.isBoss ? '#f43f5e' : '#fb7185'
        ctx.beginPath()
        ctx.arc(ex, ey, r, 0, Math.PI * 2)
        ctx.fill()

        const barW = e.isBoss ? 38 : 26
        const ratio = Math.max(0, e.hp / e.maxHp)
        ctx.fillStyle = '#020617'
        ctx.fillRect(ex - barW / 2, ey - r - 9, barW, 4)
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(ex - barW / 2, ey - r - 9, barW * ratio, 4)
      }
    }
  }, [activeMap, cursor.col, cursor.row, reducedMotion, selectedTowerDef, stage, towers])

  useEffect(() => {
    if (stage !== 'build' && stage !== 'wave') return
    if (stage === 'build') {
      drawBoard()
      return
    }
    let rafId = 0
    let lastTs = performance.now()
    const shouldDraw = createFrameLimiter(maxFps)
    const loop = (now: number) => {
      if (!shouldDraw(now)) {
        rafId = window.requestAnimationFrame(loop)
        return
      }
      const rawDt = Math.min(80, Math.max(0, now - lastTs))
      lastTs = now
      if (!simPausedRef.current) {
        const res = stepWaveSimulation(rawDt * simSpeed)
        setHp(waveHpRef.current)
        if (res !== 'running') {
          finishWaveOutcome(res === 'won')
          return
        }
      }
      drawBoard()
      rafId = window.requestAnimationFrame(loop)
    }
    rafId = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(rafId)
  }, [drawBoard, finishWaveOutcome, maxFps, simSpeed, stage, stepWaveSimulation])

  // Full keyboard navigation across charge questions and build grid
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (stage === 'charge') {
        const q = chargeDeck[chargeIdx]
        if (!q) return
        if (chargePicked === null && event.key >= '1' && event.key <= '4') {
          const idx = Number(event.key) - 1
          if (idx < q.choices.length) {
            event.preventDefault()
            answerChargeQuestion(idx)
          }
        } else if (chargePicked !== null && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          nextChargeStep()
        }
        return
      }

      if (stage === 'build') {
        if (event.key === '1') {
          setSelectedTowerType('pulse-turret')
          return
        }
        if (event.key === '2') {
          setSelectedTowerType('arc-prism')
          return
        }
        if (event.key === '3') {
          setSelectedTowerType('chrono-pylon')
          return
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          setCursor((p) => ({ ...p, col: Math.max(0, p.col - 1) }))
          return
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          setCursor((p) => ({ ...p, col: Math.min(BASTION_COLS - 1, p.col + 1) }))
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setCursor((p) => ({ ...p, row: Math.max(0, p.row - 1) }))
          return
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setCursor((p) => ({ ...p, row: Math.min(BASTION_ROWS - 1, p.row + 1) }))
          return
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          actOnTile(cursor.col, cursor.row)
          return
        }
        if (event.key === 'Backspace' || event.key === 'Delete') {
          event.preventDefault()
          sellTowerAt(cursor.col, cursor.row)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    actOnTile,
    answerChargeQuestion,
    chargeDeck,
    chargeIdx,
    chargePicked,
    cursor.col,
    cursor.row,
    nextChargeStep,
    sellTowerAt,
    stage,
  ])

  const currentCharge = chargeDeck[chargeIdx] ?? null
  const waveSpec = bastionWaveSpec(wave)

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <ArcadeTopBar
        title="Knowledge Bastion"
        subtitle="Untimed Mastery Charge + tactical tower defense across winding maps"
        badge={
          <Chip color="emerald">
            <Castle size={12} /> Flagship Strategy · Untimed Charge
          </Chip>
        }
        rightSlot={
          stage !== 'ready' && (
            <div className="flex flex-wrap items-center gap-2">
              <Chip color="rose">Wall HP {hp}/{BASTION_START_HP}</Chip>
              <Chip color="amber">
                <Zap size={12} /> {energy} Energy
              </Chip>
              <Chip color="brand">
                Wave {wave}/{BASTION_TOTAL_WAVES}
              </Chip>
            </div>
          )
        }
      />

      {stage === 'ready' && (
        <div className="space-y-4">
          {savedRun && (
            <Card className="flex flex-wrap items-center justify-between gap-4 border-brand-500/40 bg-brand-500/10 p-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">
                  Saved Defense Found
                </div>
                <div className="mt-1 font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Wave {savedRun.wave} / {BASTION_TOTAL_WAVES} · {savedRun.hp} Wall HP ·{' '}
                  {savedRun.energy} Energy · {savedRun.towers.length} Towers
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={resumeSavedCampaign}>
                  <Play size={15} /> Resume Campaign
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    writeBastionSave(user?.id, null)
                    setSavedRun(null)
                  }}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  Discard
                </button>
              </div>
            </Card>
          )}

          <Card className="space-y-6 p-7">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                Earn Tower Energy Through Careful Reasoning, Then Hold the Keep
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Before each of {BASTION_TOTAL_WAVES} enemy waves, answer {CHARGE_PER_WAVE} untimed
                Mastery Charge checks cleanly. Rapid blind guessing jams charge relays for 3 seconds,
                while high-accuracy streaks boost tower damage across your bastion grid.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Citadel Map
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {BASTION_MAPS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMapId(m.id)}
                    className={cn(
                      'rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      mapId === m.id
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-ink-900',
                    )}
                  >
                    <div className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      {m.name}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{m.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question Deck Subject
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

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/70 pt-5 dark:border-white/10">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Keyboard: <kbd className="rounded border px-1.5 py-0.5 font-mono">1–4</kbd> charge
                answers · <kbd className="rounded border px-1.5 py-0.5 font-mono">Arrows+Enter</kbd>{' '}
                place/upgrade towers · <kbd className="rounded border px-1.5 py-0.5 font-mono">Del</kbd>{' '}
                sell
              </p>
              <Button onClick={beginNewCampaign} className="px-6 py-3 text-base">
                <Play size={16} /> Start Defense Campaign
              </Button>
            </div>
          </Card>
        </div>
      )}

      {stage === 'charge' && currentCharge && (
        <Card className="space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Chip color="brand">
                Wave {wave} Charge {chargeIdx + 1} / {chargeDeck.length}
              </Chip>
              <Chip color="emerald">{currentCharge.subject}</Chip>
              {currentCharge.srsQuestionId && <Chip color="slate">SRS Card</Chip>}
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Flame size={14} className="text-amber-500" /> {combo} streak
              </span>
              <span>Wave Accuracy Bonus: {chargeCorrectInWave}/{CHARGE_PER_WAVE}</span>
            </div>
          </div>

          {jamSecondsLeft > 0 && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-sm font-semibold text-rose-700 dark:text-rose-200"
            >
              Tower Jam ({jamSecondsLeft}s): slow down and read the question before firing rapid guesses!
            </div>
          )}

          <h2 className="font-display text-lg font-bold leading-snug text-slate-900 dark:text-white">
            {currentCharge.prompt}
          </h2>

          {currentCharge.geometry && (
            <div className="flex justify-center rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-ink-900/70">
              <FigureCanvas geometry={currentCharge.geometry} size={220} />
            </div>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2">
            {currentCharge.choices.map((opt, idx) => {
              const revealed = chargePicked !== null
              const isCorrect = idx === currentCharge.correctIndex
              const isPicked = chargePicked === idx
              return (
                <button
                  key={`${currentCharge.id}-${idx}`}
                  type="button"
                  disabled={revealed || jamSecondsLeft > 0}
                  onClick={() => answerChargeQuestion(idx)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    revealed && isCorrect
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                      : revealed && isPicked && !isCorrect
                        ? 'border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400 dark:border-white/10 dark:bg-ink-900 dark:text-slate-200',
                  )}
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 font-mono text-xs font-bold dark:bg-white/10">
                    {idx + 1}
                  </span>
                  <span>{opt}</span>
                </button>
              )
            })}
          </div>

          {chargePicked !== null && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="max-w-xl text-sm text-slate-700 dark:text-slate-200">
                {currentCharge.explanation}
              </p>
              <Button onClick={nextChargeStep} disabled={jamSecondsLeft > 0}>
                {chargeIdx + 1 >= chargeDeck.length ? 'Deploy Towers on Grid' : 'Next Charge'}
                <ArrowRight size={15} />
              </Button>
            </div>
          )}
        </Card>
      )}

      {(stage === 'build' || stage === 'wave') && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {activeMap.name}
                </div>
                <div className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                  {waveSpec.label} · {waveSpec.count + (waveSpec.hasBoss ? 1 : 0)} targets
                </div>
              </div>
              <Chip color={waveDmgMult >= 1.15 ? 'emerald' : 'brand'}>
                Tower Potency {Math.round(waveDmgMult * 100)}%
              </Chip>
            </div>

            <div ref={gridContainerRef} className="overflow-x-auto">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                tabIndex={0}
                aria-label="Knowledge Bastion 8 by 6 defense grid. Use arrow keys and Enter to place or upgrade towers."
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  const col = Math.floor(((event.clientX - rect.left) / rect.width) * BASTION_COLS)
                  const row = Math.floor(((event.clientY - rect.top) / rect.height) * BASTION_ROWS)
                  if (col >= 0 && col < BASTION_COLS && row >= 0 && row < BASTION_ROWS) {
                    actOnTile(col, row)
                  }
                }}
                className="w-full max-w-[512px] cursor-pointer rounded-xl border border-slate-700 bg-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
            </div>

            {stage === 'wave' && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !simPaused
                      simPausedRef.current = next
                      setSimPaused(next)
                    }}
                    className="btn-ghost px-3 py-1.5 text-xs"
                  >
                    {simPaused ? <Play size={14} /> : <Pause size={14} />}{' '}
                    {simPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimSpeed((s) => (s === 1 ? 2 : 1))}
                    className="btn-ghost px-3 py-1.5 text-xs"
                  >
                    <FastForward size={14} /> {simSpeed}× Speed
                  </button>
                </div>
                <Button onClick={instantResolveWave} variant="ghost" className="px-3 py-1.5 text-xs">
                  <Sparkles size={14} /> Instant Resolve Wave
                </Button>
              </div>
            )}
          </Card>

          <Card className="flex flex-col justify-between gap-4 p-5">
            {stage === 'build' ? (
              <>
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Arsenal (Keys 1–3)
                  </div>
                  <div className="space-y-2">
                    {BASTION_TOWERS.map((t) => {
                      const active = selectedTowerType === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTowerType(t.id)}
                          className={cn(
                            'w-full rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                            active
                              ? 'border-brand-500 bg-brand-500/10'
                              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-ink-900',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                              [{t.keyHint}] {t.name}
                            </span>
                            <Chip color={energy >= t.cost ? 'amber' : 'slate'}>
                              {t.cost} Energy
                            </Chip>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Focused tile actions */}
                <div className="space-y-2 rounded-xl border border-slate-200/70 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                  <div className="font-bold text-slate-700 dark:text-slate-200">
                    Tile ({cursor.col + 1}, {cursor.row + 1}){' '}
                    {isBastionPathTile(activeMap, cursor.col, cursor.row) ? '· Enemy Path' : ''}
                  </div>
                  {towerAtCursor ? (
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        className="px-3 py-1.5 text-xs"
                        disabled={towerAtCursor.level >= 3}
                        onClick={() => actOnTile(cursor.col, cursor.row)}
                      >
                        <Hammer size={13} />
                        {towerAtCursor.level >= 3 ? 'Max Level' : `Upgrade (L${towerAtCursor.level + 1})`}
                      </Button>
                      <button
                        type="button"
                        onClick={() => sellTowerAt(cursor.col, cursor.row)}
                        className="btn-ghost px-2.5 py-1.5 text-xs text-rose-500"
                      >
                        <Trash2 size={13} /> Sell
                      </button>
                    </div>
                  ) : (
                    <Button
                      className="px-3 py-1.5 text-xs"
                      disabled={
                        isBastionPathTile(activeMap, cursor.col, cursor.row) ||
                        energy < selectedTowerDef.cost
                      }
                      onClick={() => actOnTile(cursor.col, cursor.row)}
                    >
                      Place {selectedTowerDef.shortLabel} ({selectedTowerDef.cost} Energy)
                    </Button>
                  )}
                </div>

                {/* 1-per-run tactical salvage utilities */}
                <div className="space-y-2 border-t border-slate-200/70 pt-3 dark:border-white/10">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Once-Per-Run Tactical Salvage
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={usedRepair || energy < 3 || hp >= BASTION_START_HP}
                      onClick={fortifyWalls}
                      className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-200"
                    >
                      <HeartHandshake size={13} className="text-emerald-500" /> +4 HP (3⚡)
                    </button>
                    <button
                      type="button"
                      disabled={usedReroll || energy < 1}
                      onClick={rerollBlueprint}
                      className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-200"
                    >
                      <RefreshCw size={13} className="text-brand-500" /> Reroll Charge
                    </button>
                  </div>
                </div>

                <Button onClick={launchWave} className="px-6 py-3 text-base">
                  <Shield size={16} /> Launch Wave {wave}
                </Button>
              </>
            ) : (
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Wave {wave} Engaged!
                </div>
                <p>
                  Towers fire automatically at {Math.round(waveDmgMult * 100)}% Mastery Charge
                  potency. Prefer zero-motion resolution? Click <strong>Instant Resolve Wave</strong>.
                </p>
                <div className="rounded-xl border border-slate-200/70 p-3 text-xs dark:border-white/10">
                  <div>Active Towers: {towers.length}</div>
                  <div>Score so far: {score.toLocaleString()}</div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {stage === 'done' && (
        <ArcadePayoutView
          mode="knowledge-bastion"
          title={hp > 0 ? 'Bastion Held All Waves!' : 'Bastion Walls Breached'}
          score={score}
          correct={correct}
          attempts={attempts}
          bestCombo={bestCombo}
          comboBursts={comboBursts}
          qualityScore={Math.round((Math.max(0, hp) / BASTION_START_HP) * 100)}
          deepUnits={wavesCleared}
          extraStats={[
            { label: 'Waves Cleared', value: `${wavesCleared} / ${BASTION_TOTAL_WAVES}` },
            { label: 'Remaining Wall HP', value: `${hp} / ${BASTION_START_HP}` },
            { label: 'Towers Deployed', value: String(towers.length) },
          ]}
          result={payout?.result ?? null}
          isNewHigh={payout?.isNewHigh ?? false}
          onPlayAgain={() => {
            writeBastionSave(user?.id, null)
            setSavedRun(null)
            beginNewCampaign()
          }}
        />
      )}
    </div>
  )
}

export default KnowledgeBastionGame
