import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Flame, Play, RotateCcw, Sliders, Target, XCircle, Zap } from 'lucide-react'
import { Button, Card, Chip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { createFrameLimiter, useGraphicsQuality } from '@/lib/graphics'
import { fireComboBurst, playBurstSound, playHitSound, playMissSound } from '@/lib/sound'
import { isComboBurst } from '@shared/economy'
import type { ArcadeRunResultDTO } from '@shared/types'
import {
  ArcadePayoutView,
  ArcadeTopBar,
  matchesSubjectFilter,
  useFinishArcadeRun,
} from './arcade-common'

type ScenarioKind = 'projectile' | 'dual-gate' | 'circuit' | 'tax-dwl'

interface SliderSpec {
  id: string
  label: string
  min: number
  max: number
  step: number
  initial: number
  unit: string
}

interface SandboxChallenge {
  id: string
  kind: ScenarioKind
  subject: string
  title: string
  prompt: string
  formulaHint: string
  targetMetricLabel: string
  targetMin: number
  targetMax: number
  unit: string
  sliders: SliderSpec[]
  extra: Record<string, number>
}

const SANDBOX_CHALLENGES: SandboxChallenge[] = [
  {
    id: 'proj-canyon',
    kind: 'projectile',
    subject: 'Physics',
    title: 'Ballistic Landing Pad',
    prompt:
      'Launch the rover capsule across level ground (g = 9.8 m/s²) so it touches down inside the landing pad at 88 m ± 6 m.',
    formulaHint: 'Range R = (v₀² · sin(2θ)) / g',
    targetMetricLabel: 'Landing Range',
    targetMin: 82,
    targetMax: 94,
    unit: 'm',
    sliders: [
      { id: 'angle', label: 'Launch Angle θ', min: 15, max: 75, step: 1, initial: 35, unit: '°' },
      { id: 'velocity', label: 'Muzzle Speed v₀', min: 15, max: 40, step: 0.5, initial: 24, unit: ' m/s' },
    ],
    extra: { g: 9.8 },
  },
  {
    id: 'math-dual-gates',
    kind: 'dual-gate',
    subject: 'Algebra',
    title: 'Dual-Gate Laser Threading',
    prompt:
      'Tune slope m and y-intercept b of y = mx + b so the laser beam passes cleanly through BOTH Gate A at x = 2 (y ∈ [6.2, 7.8]) and Gate B at x = 6 (y ∈ [14.2, 15.8]).',
    formulaHint: 'Solve m = (15 − 7)/(6 − 2) = 2, then b = 7 − 2(2) = 3',
    targetMetricLabel: 'Max Gate Error',
    targetMin: 0,
    targetMax: 0.8,
    unit: 'units',
    sliders: [
      { id: 'm', label: 'Slope m', min: -1, max: 4, step: 0.1, initial: 1.0, unit: '' },
      { id: 'b', label: 'Y-Intercept b', min: -4, max: 10, step: 0.2, initial: 1.0, unit: '' },
    ],
    extra: { gx1: 2, gy1: 7, gx2: 6, gy2: 15 },
  },
  {
    id: 'phys-circuit-current',
    kind: 'circuit',
    subject: 'Physics',
    title: 'Precision DC Current Regulator',
    prompt:
      'Tune battery voltage V and series resistor R₁ (in series with parallel R₂ = 12 Ω || R₃ = 6 Ω = 4 Ω) to deliver a steady 2.50 A ± 0.15 A total current!',
    formulaHint: 'R_eq = R₁ + (12×6)/(12+6) = R₁ + 4 Ω;  I = V / R_eq',
    targetMetricLabel: 'Source Current I',
    targetMin: 2.35,
    targetMax: 2.65,
    unit: 'A',
    sliders: [
      { id: 'voltage', label: 'Source Voltage V', min: 6, max: 36, step: 1, initial: 18, unit: ' V' },
      { id: 'r1', label: 'Series Resistor R₁', min: 1, max: 16, step: 0.5, initial: 8, unit: ' Ω' },
    ],
    extra: { rParallel: 4 },
  },
  {
    id: 'econ-tax-dwl',
    kind: 'tax-dwl',
    subject: 'Economics',
    title: 'Excise Tax & Deadweight Loss Target',
    prompt:
      'In a market with Demand P = 100 − 2Q and Supply P = 20 + d·Q, adjust per-unit tax t and supply slope d so Deadweight Loss lands inside $22 – $28!',
    formulaHint: 'Q* = 80/(2+d),  Q_tax = (80−t)/(2+d),  DWL = ½ · t · (Q* − Q_tax)',
    targetMetricLabel: 'Deadweight Loss',
    targetMin: 22,
    targetMax: 28,
    unit: '$',
    sliders: [
      { id: 'tax', label: 'Per-Unit Tax t', min: 0, max: 32, step: 1, initial: 8, unit: ' $' },
      { id: 'supplySlope', label: 'Supply Slope d', min: 1, max: 4, step: 0.5, initial: 2, unit: '' },
    ],
    extra: { a: 100, b: 2, c: 20 },
  },
  {
    id: 'proj-low-grav',
    kind: 'projectile',
    subject: 'Physics',
    title: 'Lunar Crater Hop (g = 3.7 m/s²)',
    prompt:
      'On Mars-gravity terrain (g = 3.7 m/s²), land your sample pod inside the target crater at 130 m ± 8 m!',
    formulaHint: 'Range R = (v₀² · sin(2θ)) / 3.7',
    targetMetricLabel: 'Landing Range',
    targetMin: 122,
    targetMax: 138,
    unit: 'm',
    sliders: [
      { id: 'angle', label: 'Launch Angle θ', min: 15, max: 75, step: 1, initial: 45, unit: '°' },
      { id: 'velocity', label: 'Muzzle Speed v₀', min: 10, max: 32, step: 0.5, initial: 16, unit: ' m/s' },
    ],
    extra: { g: 3.7 },
  },
]

function evaluateChallenge(ch: SandboxChallenge, vals: Record<string, number>): number {
  if (ch.kind === 'projectile') {
    const rad = (vals.angle * Math.PI) / 180
    return (vals.velocity * vals.velocity * Math.sin(2 * rad)) / ch.extra.g
  }
  if (ch.kind === 'dual-gate') {
    const y1 = vals.m * ch.extra.gx1 + vals.b
    const y2 = vals.m * ch.extra.gx2 + vals.b
    return Math.max(Math.abs(y1 - ch.extra.gy1), Math.abs(y2 - ch.extra.gy2))
  }
  if (ch.kind === 'circuit') {
    const rEq = vals.r1 + ch.extra.rParallel
    return vals.voltage / rEq
  }
  // tax-dwl
  const denom = ch.extra.b + vals.supplySlope
  const eqQ = (ch.extra.a - ch.extra.c) / denom
  const taxQ = Math.max(0, (ch.extra.a - ch.extra.c - vals.tax) / denom)
  return 0.5 * vals.tax * (eqQ - taxQ)
}

export function SimulationSandboxGame() {
  const [searchParams] = useSearchParams()
  const subjectFilter = searchParams.get('subject') ?? 'All'
  const finishRun = useFinishArcadeRun('sim-sandbox')

  const challenges = useMemo(() => {
    const filtered = SANDBOX_CHALLENGES.filter((c) => matchesSubjectFilter(c.subject, subjectFilter))
    return filtered.length >= 2 ? filtered : SANDBOX_CHALLENGES
  }, [subjectFilter])

  const [roundIdx, setRoundIdx] = useState(0)
  const challenge = challenges[roundIdx] ?? challenges[0]

  const [sliderVals, setSliderVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(challenge.sliders.map((s) => [s.id, s.initial])),
  )
  const [simProgress, setSimProgress] = useState<number>(0)
  const [simRunning, setSimRunning] = useState(false)
  const [simOutcome, setSimOutcome] = useState<{ hit: boolean; value: number } | null>(null)
  const [finished, setFinished] = useState(false)

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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runStartRef = useRef<number>(0)

  useEffect(() => {
    runStartRef.current = performance.now()
  }, [])

  const resetSlidersFor = useCallback((ch: SandboxChallenge) => {
    setSliderVals(Object.fromEntries(ch.sliders.map((s) => [s.id, s.initial])))
    setSimProgress(0)
    setSimRunning(false)
    setSimOutcome(null)
  }, [])

  // 60fps Canvas Renderer for all 4 physics/math/circuit/econ scenarios
  const drawFrame = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Subtle dark slate grid background
      ctx.fillStyle = '#0c1020'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      ctx.lineWidth = 1
      for (let gx = 40; gx < w; gx += 40) {
        ctx.beginPath()
        ctx.moveTo(gx, 0)
        ctx.lineTo(gx, h)
        ctx.stroke()
      }
      for (let gy = 35; gy < h; gy += 35) {
        ctx.beginPath()
        ctx.moveTo(0, gy)
        ctx.lineTo(w, gy)
        ctx.stroke()
      }

      if (challenge.kind === 'projectile') {
        const groundY = h - 38
        const padL = 44
        const maxRange = 175
        const sx = (x: number) => padL + (x / maxRange) * (w - padL - 28)
        const sy = (y: number) => groundY - (y / 75) * (groundY - 24)

        // Ground
        ctx.strokeStyle = '#64748b'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(20, groundY)
        ctx.lineTo(w - 16, groundY)
        ctx.stroke()

        // Target zone band
        const tx1 = sx(challenge.targetMin)
        const tx2 = sx(challenge.targetMax)
        ctx.fillStyle = 'rgba(52, 211, 153, 0.25)'
        ctx.fillRect(tx1, groundY - 12, tx2 - tx1, 12)
        ctx.strokeStyle = '#34d399'
        ctx.strokeRect(tx1, groundY - 12, tx2 - tx1, 12)
        ctx.fillStyle = '#34d399'
        ctx.font = 'bold 11px monospace'
        ctx.fillText(`TARGET [${challenge.targetMin}–${challenge.targetMax}m]`, tx1 - 14, groundY + 18)

        // Launch angle preview vector
        const rad = (sliderVals.angle * Math.PI) / 180
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(sx(0), groundY)
        ctx.lineTo(sx(0) + Math.cos(rad) * 46, groundY - Math.sin(rad) * 46)
        ctx.stroke()

        // Trajectory up to progress (0..1)
        if (progress > 0) {
          const g = challenge.extra.g
          const v0 = sliderVals.velocity
          const tFlight = (2 * v0 * Math.sin(rad)) / g
          ctx.strokeStyle = '#38bdf8'
          ctx.lineWidth = 2.6
          ctx.beginPath()
          const steps = 60
          let px = sx(0)
          let py = groundY
          for (let i = 0; i <= steps; i += 1) {
            const t = tFlight * progress * (i / steps)
            const x = v0 * Math.cos(rad) * t
            const y = Math.max(0, v0 * Math.sin(rad) * t - 0.5 * g * t * t)
            px = sx(x)
            py = sy(y)
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.stroke()

          ctx.fillStyle = '#f8fafc'
          ctx.beginPath()
          ctx.arc(px, py, 6, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (challenge.kind === 'dual-gate') {
        const sx = (x: number) => 48 + ((x + 1) / 9) * (w - 76)
        const sy = (y: number) => h - 34 - ((y + 4) / 24) * (h - 60)

        // Axes
        ctx.strokeStyle = '#475569'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(sx(0), 16)
        ctx.lineTo(sx(0), h - 20)
        ctx.moveTo(30, sy(0))
        ctx.lineTo(w - 20, sy(0))
        ctx.stroke()

        // Two vertical tolerance gates
        const gates = [
          { x: challenge.extra.gx1, y: challenge.extra.gy1, label: 'Gate A (2, 7)' },
          { x: challenge.extra.gx2, y: challenge.extra.gy2, label: 'Gate B (6, 15)' },
        ]
        gates.forEach((gt) => {
          const gx = sx(gt.x)
          const topY = sy(gt.y + 0.8)
          const botY = sy(gt.y - 0.8)
          ctx.strokeStyle = '#34d399'
          ctx.lineWidth = 5
          ctx.beginPath()
          ctx.moveTo(gx, topY)
          ctx.lineTo(gx, botY)
          ctx.stroke()
          ctx.fillStyle = '#34d399'
          ctx.font = 'bold 11px monospace'
          ctx.fillText(gt.label, gx - 34, topY - 8)
        })

        // Faint preview dashed line + animated laser beam
        const xEnd = progress > 0 ? -1 + 9 * progress : 8
        ctx.strokeStyle = progress > 0 ? '#22d3ee' : 'rgba(129,140,248,0.45)'
        ctx.lineWidth = progress > 0 ? 3 : 1.5
        ctx.beginPath()
        ctx.moveTo(sx(-1), sy(sliderVals.m * -1 + sliderVals.b))
        ctx.lineTo(sx(xEnd), sy(sliderVals.m * xEnd + sliderVals.b))
        ctx.stroke()
      } else if (challenge.kind === 'circuit') {
        const current = sliderVals.voltage / (sliderVals.r1 + challenge.extra.rParallel)
        // Draw loop
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2.5
        ctx.strokeRect(70, 52, w - 160, h - 104)

        // Labels
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 13px monospace'
        ctx.fillText(`Battery V = ${sliderVals.voltage} V`, 84, h / 2 + 4)
        ctx.fillStyle = '#818cf8'
        ctx.fillText(`Series R₁ = ${sliderVals.r1} Ω`, w / 2 - 64, 42)
        ctx.fillStyle = '#38bdf8'
        ctx.fillText('Parallel Load (12Ω || 6Ω = 4Ω)', w / 2 - 95, h - 28)

        // Animated electron drift beads when running
        const beadCount = 16
        const loopW = w - 160
        const loopH = h - 104
        const perim = 2 * (loopW + loopH)
        for (let i = 0; i < beadCount; i += 1) {
          const d = (((i / beadCount + progress * current * 0.35) % 1) + 1) % 1 * perim
          let bx = 70
          let by = 52
          if (d < loopW) {
            bx = 70 + d
            by = 52
          } else if (d < loopW + loopH) {
            bx = 70 + loopW
            by = 52 + (d - loopW)
          } else if (d < 2 * loopW + loopH) {
            bx = 70 + loopW - (d - loopW - loopH)
            by = 52 + loopH
          } else {
            bx = 70
            by = 52 + loopH - (d - 2 * loopW - loopH)
          }
          ctx.fillStyle = progress > 0 ? '#22d3ee' : 'rgba(34,211,238,0.4)'
          ctx.beginPath()
          ctx.arc(bx, by, 4.5, 0, Math.PI * 2)
          ctx.fill()
        }

        if (progress > 0.2) {
          ctx.fillStyle = '#34d399'
          ctx.font = 'bold 15px monospace'
          ctx.fillText(`Ammeter: ${current.toFixed(2)} A  (Target 2.35–2.65 A)`, 88, h / 2 + 32)
        }
      } else {
        // Supply-demand + tax wedge DWL triangle
        const padL = 56
        const padB = 34
        const plotW = w - 90
        const plotH = h - 64
        const sx = (q: number) => padL + (q / 52) * plotW
        const sy = (p: number) => h - padB - (p / 120) * plotH

        ctx.strokeStyle = '#64748b'
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(padL, 20)
        ctx.lineTo(padL, h - padB)
        ctx.lineTo(padL + plotW, h - padB)
        ctx.stroke()

        const a = challenge.extra.a
        const b = challenge.extra.b
        const c = challenge.extra.c
        const d = sliderVals.supplySlope
        const tax = sliderVals.tax * (progress > 0 ? progress : 1)
        const eqQ = (a - c) / (b + d)
        const eqP = a - b * eqQ
        const taxQ = Math.max(0, (a - c - tax) / (b + d))
        const pBuyer = a - b * taxQ
        const pSeller = c + d * taxQ

        // DWL Triangle
        ctx.fillStyle = 'rgba(244, 63, 94, 0.35)'
        ctx.beginPath()
        ctx.moveTo(sx(taxQ), sy(pBuyer))
        ctx.lineTo(sx(eqQ), sy(eqP))
        ctx.lineTo(sx(taxQ), sy(pSeller))
        ctx.closePath()
        ctx.fill()

        // Demand
        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(sx(0), sy(a))
        ctx.lineTo(sx(50), sy(0))
        ctx.stroke()

        // Supply
        ctx.strokeStyle = '#34d399'
        ctx.beginPath()
        ctx.moveTo(sx(0), sy(c))
        ctx.lineTo(sx(Math.min(50, (115 - c) / d)), sy(c + d * Math.min(50, (115 - c) / d)))
        ctx.stroke()

        // Shifted Tax Supply
        ctx.strokeStyle = '#fbbf24'
        ctx.setLineDash([5, 4])
        ctx.beginPath()
        ctx.moveTo(sx(0), sy(c + tax))
        ctx.lineTo(
          sx(Math.min(50, (115 - c - tax) / d)),
          sy(c + tax + d * Math.min(50, (115 - c - tax) / d)),
        )
        ctx.stroke()
        ctx.setLineDash([])
      }
    },
    [challenge, sliderVals],
  )

  useEffect(() => {
    drawFrame(simProgress)
  }, [drawFrame, simProgress])

  const maxFps = useGraphicsQuality().profile.maxFps
  const runSimulation = () => {
    if (simRunning) return
    setSimRunning(true)
    setSimOutcome(null)
    setAttempts((a) => a + 1)

    const start = performance.now()
    const duration = 950
    const shouldDraw = createFrameLimiter(maxFps)

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      if (p < 1 && !shouldDraw(now)) {
        requestAnimationFrame(tick)
        return
      }
      setSimProgress(p)
      if (p < 1) {
        requestAnimationFrame(tick)
      } else {
        setSimRunning(false)
        const val = evaluateChallenge(challenge, sliderVals)
        const hit = val >= challenge.targetMin && val <= challenge.targetMax
        setSimOutcome({ hit, value: val })
        if (hit) {
          const nextCombo = combo + 1
          const nextBest = Math.max(bestCombo, nextCombo)
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
          setScore((s) => s + 300 + nextCombo * 60)
        } else {
          playMissSound()
          setCombo(0)
        }
      }
    }
    requestAnimationFrame(tick)
  }

  const nextChallenge = async () => {
    if (roundIdx + 1 >= challenges.length) {
      setFinished(true)
      const durationMs = Math.max(1500, Math.round(performance.now() - runStartRef.current))
      const banked = await finishRun({
        score,
        correct,
        attempts,
        bestCombo,
        comboBursts,
        durationMs,
      })
      setPayout(banked)
      return
    }
    const next = challenges[roundIdx + 1]
    setRoundIdx((i) => i + 1)
    resetSlidersFor(next)
  }

  const restartAll = () => {
    setRoundIdx(0)
    resetSlidersFor(challenges[0])
    setFinished(false)
    setCombo(0)
    setBestCombo(0)
    setComboBursts(0)
    setCorrect(0)
    setAttempts(0)
    setScore(0)
    setPayout(null)
    runStartRef.current = performance.now()
  }

  return (
    <div className="flex flex-col gap-5">
      <ArcadeTopBar
        title="Simulation Sandbox Challenge"
        subtitle="Tune live mathematical & physical parameters, then trigger the 60fps simulator to hit the target window"
        badge={
          <Chip color="brand">
            Challenge {Math.min(roundIdx + 1, challenges.length)} / {challenges.length}
          </Chip>
        }
      />

      {!finished ? (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          {/* 60fps Canvas Viewport */}
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Chip color="emerald">{challenge.subject}</Chip>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  {challenge.title}
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Flame size={14} /> {combo}×
                </span>
                <span className="inline-flex items-center gap-1 text-brand-500">
                  <Zap size={14} /> {score.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {challenge.prompt}
            </p>

            <canvas
              ref={canvasRef}
              width={620}
              height={300}
              className="w-full rounded-xl border border-slate-800 bg-ink-950 shadow-inner"
            />

            {simOutcome && (
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-semibold',
                  simOutcome.hit
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                    : 'border-rose-500/50 bg-rose-500/15 text-rose-800 dark:text-rose-200',
                )}
              >
                <span className="inline-flex items-center gap-2">
                  {simOutcome.hit ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {challenge.targetMetricLabel}:{' '}
                  <strong className="font-mono">
                    {simOutcome.value.toFixed(2)} {challenge.unit}
                  </strong>{' '}
                  (Target: {challenge.targetMin} – {challenge.targetMax} {challenge.unit})
                </span>
                {simOutcome.hit && (
                  <Button onClick={() => void nextChallenge()} className="px-3 py-1.5 text-xs">
                    {roundIdx + 1 >= challenges.length ? 'Finish & Collect Coins' : 'Next Simulation'}{' '}
                    <ArrowRight size={14} />
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Live Parameter Sliders */}
          <Card className="flex flex-col justify-between gap-5 p-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  <Sliders size={14} /> Parameter Controls
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-500">
                  <Target size={13} /> [{challenge.targetMin}, {challenge.targetMax}] {challenge.unit}
                </span>
              </div>

              {challenge.sliders.map((s) => {
                const val = sliderVals[s.id] ?? s.initial
                return (
                  <label key={s.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-200">{s.label}</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-300">
                        {val}
                        {s.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={val}
                      disabled={simRunning}
                      onChange={(e) => {
                        setSimProgress(0)
                        setSimOutcome(null)
                        setSliderVals((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                      }}
                      className="accent-brand-500"
                    />
                  </label>
                )
              })}

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <strong className="block text-[11px] uppercase tracking-wider text-slate-400">
                  Governing Law
                </strong>
                <span className="mt-1 block font-mono">{challenge.formulaHint}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={runSimulation}
                disabled={simRunning || simOutcome?.hit === true}
                className="w-full"
              >
                <Play size={16} /> {simRunning ? 'Simulating 60fps…' : 'Run Simulation'}
              </Button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => resetSlidersFor(challenge)}
                  className="btn-ghost flex-1 text-xs"
                >
                  <RotateCcw size={13} /> Reset Sliders
                </button>
                {!simOutcome?.hit && attempts > 0 && (
                  <button
                    type="button"
                    onClick={() => void nextChallenge()}
                    className="btn-ghost flex-1 text-xs"
                  >
                    Skip Round →
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <ArcadePayoutView
          mode="sim-sandbox"
          title="Sandbox Calibration Complete!"
          score={score}
          correct={correct}
          attempts={attempts}
          bestCombo={bestCombo}
          comboBursts={comboBursts}
          extraStats={[
            { label: 'Targets Hit', value: `${correct} / ${challenges.length}` },
            { label: 'Simulation Runs', value: String(attempts) },
          ]}
          result={payout?.result ?? null}
          isNewHigh={payout?.isNewHigh ?? false}
          onPlayAgain={restartAll}
        />
      )}
    </div>
  )
}

export default SimulationSandboxGame
