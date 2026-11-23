import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronsDown, ChevronsUp, Fuel, Gauge, Rocket, Target, XCircle } from 'lucide-react'
import { Button, Card, Chip } from '@/components/ui'
import { GraphicsQualitySelect } from '@/components/GraphicsQualitySelect'
import { cn } from '@/lib/utils'
import { createFrameLimiter, createFrameMonitor, lowerAutoTier, useGraphicsQuality } from '@/lib/graphics'
import {
  BAND_TOLERANCE,
  LOCK_SECONDS,
  MISSION_TIME_LIMIT,
  ORBIT_MISSIONS,
  advanceProbe,
  altitudeKm,
  deltaVMs,
  initialProbeState,
  isInBand,
  missionFuel,
  missionIdealDeltaV,
  orbitElements,
  speedKms,
  type MissionEnd,
  type OrbitMission,
  type ProbeState,
} from '@/lib/orbit-pilot'
import { fireComboBurst, playBurstSound, playHitSound, playMissSound } from '@/lib/sound'
import { isComboBurst } from '@shared/economy'
import type { ArcadeRunResultDTO } from '@shared/types'
import { ArcadePayoutView, ArcadeTopBar, useFinishArcadeRun } from './arcade-common'
import { createOrbitPilotView } from './orbitPilotScene'

type Phase = 'brief' | 'flying' | 'result'
type Thrust = -1 | 0 | 1

interface Hud {
  altitude: number
  speed: number
  apoapsis: number | null
  periapsis: number
  fuelFraction: number
  fuelMs: number
  lock: number
  inBand: boolean
  timeLeft: number
}

interface Tally {
  score: number
  correct: number
  attempts: number
  combo: number
  bestCombo: number
  comboBursts: number
}

interface MissionResult {
  end: MissionEnd
  usedMs: number
  idealMs: number
  points: number
}

const ZERO_TALLY: Tally = { score: 0, correct: 0, attempts: 0, combo: 0, bestCombo: 0, comboBursts: 0 }

const END_TEXT: Record<MissionEnd, { title: string; body: string }> = {
  success: { title: 'Orbit locked in', body: 'Both ends of the orbit are inside the target band.' },
  crash: {
    title: 'Burned up in the atmosphere',
    body: 'The low point of the orbit dropped into the atmosphere. Watch the Pe readout when you burn retrograde.',
  },
  escape: {
    title: 'Lost to deep space',
    body: 'The probe went so fast that the planet’s gravity could not hold it. Shorter prograde burns keep the orbit closed.',
  },
  fuel: {
    title: 'Out of fuel',
    body: 'The tank ran dry before the orbit fitted the band. Burns cost least when they are made at the high or low point.',
  },
  timeout: { title: 'Out of time', body: 'The mission window closed before the orbit was locked in.' },
  abort: { title: 'Mission skipped', body: 'No score for this one. The next mission is ready.' },
}

function readHud(state: ProbeState, mission: OrbitMission): Hud {
  const el = orbitElements(state)
  return {
    altitude: altitudeKm(el.radius),
    speed: speedKms(el.speed),
    apoapsis: el.bound ? altitudeKm(el.apoapsis) : null,
    periapsis: altitudeKm(el.periapsis),
    fuelFraction: state.fuel / missionFuel(mission),
    fuelMs: deltaVMs(state.fuel),
    lock: Math.min(1, state.lockTime / LOCK_SECONDS),
    inBand: isInBand(el, mission.targetRadius),
    timeLeft: Math.max(0, MISSION_TIME_LIMIT - state.time),
  }
}

const km = (value: number): string => `${Math.round(value / 10) * 10} km`

export function OrbitPilotGame() {
  const finishRun = useFinishArcadeRun('orbit-pilot')
  const { profile } = useGraphicsQuality()
  const hostRef = useRef<HTMLDivElement>(null)

  const [missionIdx, setMissionIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('brief')
  const [result, setResult] = useState<MissionResult | null>(null)
  const [tally, setTally] = useState<Tally>(ZERO_TALLY)
  const [hud, setHud] = useState<Hud>(() => readHud(initialProbeState(ORBIT_MISSIONS[0]), ORBIT_MISSIONS[0]))
  const [thrustUi, setThrustUi] = useState<Thrust>(0)
  const [webglError, setWebglError] = useState(false)
  const [finished, setFinished] = useState(false)
  const [payout, setPayout] = useState<{ result: ArcadeRunResultDTO | null; isNewHigh: boolean } | null>(null)

  const mission = ORBIT_MISSIONS[missionIdx]

  // The flight itself lives in refs so a graphics-quality change, which
  // rebuilds the 3D view, does not restart the mission in progress.
  const simRef = useRef<ProbeState>(initialProbeState(ORBIT_MISSIONS[0]))
  const missionRef = useRef<OrbitMission>(ORBIT_MISSIONS[0])
  const phaseRef = useRef<Phase>('brief')
  const thrustRef = useRef<Thrust>(0)
  const tallyRef = useRef<Tally>(ZERO_TALLY)
  const runStartRef = useRef(0)

  const setThrust = useCallback((next: Thrust) => {
    thrustRef.current = next
    setThrustUi(next)
  }, [])

  const endMission = useCallback(
    (end: MissionEnd) => {
      if (phaseRef.current !== 'flying') return
      phaseRef.current = 'result'
      setThrust(0)
      const m = missionRef.current
      const state = simRef.current
      const carried = missionFuel(m)
      const prev = tallyRef.current
      let next: Tally
      let points = 0
      if (end === 'success') {
        const combo = prev.combo + 1
        const burst = isComboBurst(combo)
        points = 300 + Math.round((state.fuel / carried) * 300) + combo * 60
        next = {
          score: prev.score + points,
          correct: prev.correct + 1,
          attempts: prev.attempts + 1,
          combo,
          bestCombo: Math.max(prev.bestCombo, combo),
          comboBursts: prev.comboBursts + (burst ? 1 : 0),
        }
        if (burst) {
          playBurstSound()
          fireComboBurst()
        } else {
          playHitSound(combo)
        }
      } else {
        next = { ...prev, attempts: prev.attempts + 1, combo: 0 }
        if (end !== 'abort') playMissSound()
      }
      tallyRef.current = next
      setTally(next)
      setResult({
        end,
        usedMs: deltaVMs(carried - state.fuel),
        idealMs: deltaVMs(missionIdealDeltaV(m)),
        points,
      })
      setHud(readHud(state, m))
      setPhase('result')
    },
    [setThrust],
  )

  const launch = () => {
    simRef.current = initialProbeState(missionRef.current)
    if (runStartRef.current === 0) runStartRef.current = performance.now()
    phaseRef.current = 'flying'
    setResult(null)
    setPhase('flying')
  }

  const loadMission = (index: number) => {
    const next = ORBIT_MISSIONS[index]
    missionRef.current = next
    simRef.current = initialProbeState(next)
    phaseRef.current = 'brief'
    setMissionIdx(index)
    setResult(null)
    setHud(readHud(simRef.current, next))
    setPhase('brief')
  }

  const nextMission = async () => {
    if (missionIdx + 1 < ORBIT_MISSIONS.length) {
      loadMission(missionIdx + 1)
      return
    }
    setFinished(true)
    const t = tallyRef.current
    const banked = await finishRun({
      score: t.score,
      correct: t.correct,
      attempts: t.attempts,
      bestCombo: t.bestCombo,
      comboBursts: t.comboBursts,
      durationMs: Math.max(1500, Math.round(performance.now() - runStartRef.current)),
    })
    setPayout(banked)
  }

  const restartAll = () => {
    tallyRef.current = ZERO_TALLY
    runStartRef.current = 0
    setTally(ZERO_TALLY)
    setPayout(null)
    setFinished(false)
    loadMission(0)
  }

  // ── 3D view and flight loop ──────────────────────────────────
  useEffect(() => {
    if (finished) return
    const host = hostRef.current
    if (!host) return
    const view = createOrbitPilotView(host, profile)
    if (!view) {
      queueMicrotask(() => setWebglError(true))
      return
    }
    const observer = new ResizeObserver(view.resize)
    observer.observe(host)
    const shouldDraw = createFrameLimiter(profile.maxFps)
    const isTooSlow = createFrameMonitor(profile)
    let frame = 0
    let last = 0
    let lastHud = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (!shouldDraw(now)) return
      const elapsedMs = last ? now - last : 0
      last = now
      // On Auto, a run of slow frames steps the tier down; the view is then rebuilt.
      if (elapsedMs && isTooSlow(elapsedMs) && lowerAutoTier()) return
      const dt = Math.min(elapsedMs / 1000, 0.05)
      const state = simRef.current
      const m = missionRef.current
      let applied: Thrust = 0
      if (phaseRef.current === 'flying') {
        applied = state.fuel > 0 ? thrustRef.current : 0
        const end = advanceProbe(state, m, thrustRef.current, dt)
        if (end) endMission(end)
      }
      view.draw(state, m.targetRadius, applied, dt)
      if (phaseRef.current === 'flying' && now - lastHud > 120) {
        lastHud = now
        setHud(readHud(state, m))
      }
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      view.dispose()
    }
  }, [profile, finished, endMission])

  // ── Keyboard: W / Up burns prograde, S / Down burns retrograde ──
  useEffect(() => {
    if (phase !== 'flying') return
    const thrustFor = (event: KeyboardEvent): Thrust => {
      if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') return 1
      if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') return -1
      return 0
    }
    const inField = (target: EventTarget | null) =>
      target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)
    const onDown = (event: KeyboardEvent) => {
      const next = thrustFor(event)
      if (next === 0 || inField(event.target)) return
      event.preventDefault()
      setThrust(next)
    }
    const onUp = (event: KeyboardEvent) => {
      const released = thrustFor(event)
      if (released !== 0 && thrustRef.current === released) setThrust(0)
    }
    const onBlur = () => setThrust(0)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [phase, setThrust])

  const burnButton = (direction: 1 | -1) => ({
    type: 'button' as const,
    disabled: phase !== 'flying' || hud.fuelFraction <= 0,
    'aria-pressed': thrustUi === direction,
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      setThrust(direction)
    },
    onPointerUp: () => setThrust(0),
    onPointerCancel: () => setThrust(0),
    onLostPointerCapture: () => setThrust(0),
    onBlur: () => setThrust(0),
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setThrust(direction)
      }
    },
    onKeyUp: (event: React.KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') setThrust(0)
    },
    className: cn(
      'flex flex-1 touch-none select-none flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-xs font-bold transition disabled:opacity-40',
      thrustUi === direction
        ? 'border-amber-400 bg-amber-400/20 text-amber-600 dark:text-amber-300'
        : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
    ),
  })

  const targetAltitude = altitudeKm(mission.targetRadius)
  const targetSpread = altitudeKm(1 + mission.targetRadius * BAND_TOLERANCE)
  const readouts = [
    { label: 'Altitude', value: km(hud.altitude) },
    { label: 'Speed', value: `${hud.speed.toFixed(2)} km/s` },
    { label: 'High point (Ap)', value: hud.apoapsis === null ? 'escaping' : km(hud.apoapsis) },
    { label: 'Low point (Pe)', value: km(hud.periapsis) },
  ]
  const lastMission = missionIdx + 1 >= ORBIT_MISSIONS.length

  return (
    <div className="flex flex-col gap-5">
      <ArcadeTopBar
        title="Orbit Pilot"
        subtitle="Fly a probe to the target orbit before the fuel runs out"
        badge={
          <Chip color="brand">
            Mission {missionIdx + 1} / {ORBIT_MISSIONS.length}
          </Chip>
        }
      />

      {finished ? (
        <ArcadePayoutView
          mode="orbit-pilot"
          title="Flight Log Complete!"
          score={tally.score}
          correct={tally.correct}
          attempts={tally.attempts}
          bestCombo={tally.bestCombo}
          comboBursts={tally.comboBursts}
          extraStats={[{ label: 'Orbits Locked', value: `${tally.correct} / ${ORBIT_MISSIONS.length}` }]}
          result={payout?.result ?? null}
          isNewHigh={payout?.isNewHigh ?? false}
          onPlayAgain={restartAll}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Chip color="emerald">Physics</Chip>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{mission.title}</span>
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-500">
                <Target size={13} /> {km(targetAltitude)} ± {km(targetSpread)}
              </span>
            </div>

            <div
              ref={hostRef}
              className="relative aspect-[16/10] min-h-[280px] w-full overflow-hidden rounded-2xl bg-ink-950"
            >
              {webglError && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-300">
                  3D graphics are not available in this browser, so Orbit Pilot cannot run here.
                </div>
              )}
              <div className="absolute right-3 top-3">
                <GraphicsQualitySelect variant="overlay" />
              </div>

              {phase === 'flying' && (
                <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                    <span className="inline-flex items-center gap-1">
                      <Fuel size={12} /> {Math.round(hud.fuelMs)} m/s of delta-v left
                    </span>
                    <span>{Math.ceil(hud.timeLeft)} s</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/15">
                    <div
                      className={cn('h-full rounded-full', hud.fuelFraction > 0.25 ? 'bg-amber-400' : 'bg-rose-500')}
                      style={{ width: `${Math.max(0, hud.fuelFraction) * 100}%` }}
                    />
                  </div>
                  {hud.inBand && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${hud.lock * 100}%` }} />
                    </div>
                  )}
                </div>
              )}

              {phase === 'brief' && !webglError && (
                <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/15 bg-ink-900/90 p-4 text-slate-200 backdrop-blur">
                  <p className="text-sm">{mission.brief}</p>
                  <p className="mt-2 text-xs text-slate-400">{mission.tip}</p>
                  <Button onClick={launch} className="mt-3 px-4 py-2 text-xs">
                    <Rocket size={14} /> Start mission
                  </Button>
                </div>
              )}

              {phase === 'result' && result && (
                <div
                  role="status"
                  className={cn(
                    'absolute inset-x-3 bottom-3 rounded-2xl border bg-ink-900/90 p-4 text-slate-200 backdrop-blur',
                    result.end === 'success' ? 'border-emerald-400/50' : 'border-rose-400/50',
                  )}
                >
                  <p className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                    {result.end === 'success' ? (
                      <Target size={15} className="text-emerald-400" />
                    ) : (
                      <XCircle size={15} className="text-rose-400" />
                    )}
                    {END_TEXT[result.end].title}
                    {result.points > 0 && <span className="text-emerald-400">+{result.points}</span>}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    {result.end === 'success' ? mission.debrief : END_TEXT[result.end].body}
                  </p>
                  {result.end !== 'abort' && (
                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                      You used {Math.round(result.usedMs)} m/s of delta-v. The ideal two-burn transfer needs{' '}
                      {Math.round(result.idealMs)} m/s.
                    </p>
                  )}
                  <Button onClick={() => void nextMission()} className="mt-3 px-4 py-2 text-xs">
                    {lastMission ? 'Finish & collect coins' : 'Next mission'} <ArrowRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="flex flex-col justify-between gap-4 p-5">
            <div className="flex flex-col gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                <Gauge size={14} /> Flight data
              </span>
              <dl className="grid grid-cols-2 gap-2">
                {readouts.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 dark:border-white/10 dark:bg-white/5"
                  >
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</dt>
                    <dd className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Score {tally.score}</span>
                <span>
                  Locked {tally.correct} · Streak {tally.combo}×
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <strong className="block text-[11px] uppercase tracking-wider text-slate-400">Flight rule</strong>
                <span className="mt-1 block">
                  A burn changes the far side of the orbit. Speed up to raise it, slow down to lower it. The
                  blue line shows where the probe will go; it turns green when the orbit fits the band.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button {...burnButton(1)}>
                  <ChevronsUp size={18} />
                  Burn prograde
                  <span className="font-mono text-[10px] font-semibold opacity-70">hold W or ↑</span>
                </button>
                <button {...burnButton(-1)}>
                  <ChevronsDown size={18} />
                  Burn retrograde
                  <span className="font-mono text-[10px] font-semibold opacity-70">hold S or ↓</span>
                </button>
              </div>
              {phase === 'flying' && (
                <button type="button" onClick={() => endMission('abort')} className="btn-ghost text-xs">
                  Skip this mission →
                </button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default OrbitPilotGame
