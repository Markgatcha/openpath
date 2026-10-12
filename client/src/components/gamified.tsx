import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Timer, Zap } from 'lucide-react'
import { cn, formatClock } from '@/lib/utils'
import type { XpProgress } from '@shared/game'

// ── XP bar with level badge ────────────────────────────────────
export function XpBar({
  progress,
  className,
  compact = false,
}: {
  progress: XpProgress
  className?: string
  compact?: boolean
}) {
  return (
    <div className={cn('w-full', className)}>
      <div className={cn('flex items-center', compact ? 'gap-2' : 'mb-1.5 justify-between')}>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 items-center rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-2 text-[11px] font-bold text-white">
            Lv {progress.level}
          </span>
          {!compact && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {progress.into} / {progress.need} XP
            </span>
          )}
        </div>
        {!compact && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {progress.need - progress.into} XP to level {progress.level + 1}
          </span>
        )}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 via-violet-400 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(progress.pct * 100)}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </div>
    </div>
  )
}

// ── Streak flame ───────────────────────────────────────────────
export function StreakFlame({
  days,
  className,
}: {
  days: number
  className?: string
}) {
  const active = days > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        active
          ? 'bg-orange-500/15 text-orange-500 dark:text-orange-400'
          : 'bg-slate-500/15 text-slate-500 dark:text-slate-400',
        className,
      )}
      title={`${days}-day streak`}
    >
      <Flame size={13} className={active ? 'fill-orange-400' : ''} />
      {days}d
    </span>
  )
}

// ── Countdown ring ─────────────────────────────────────────────
export function TimerRing({
  secondsLeft,
  totalSeconds,
  size = 56,
}: {
  secondsLeft: number
  totalSeconds: number
  size?: number
}) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = totalSeconds > 0 ? secondsLeft / totalSeconds : 0
  const urgent = secondsLeft <= 10

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={5}
          className="stroke-slate-200 dark:stroke-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className={cn(
            'transition-[stroke-dashoffset] duration-1000 ease-linear',
            urgent ? 'stroke-rose-500' : 'stroke-brand-400',
          )}
        />
      </svg>
      <span
        className={cn(
          'absolute font-mono text-xs font-bold',
          urgent ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300',
        )}
      >
        {formatClock(Math.max(0, secondsLeft))}
      </span>
    </div>
  )
}

// ── Combo meter ────────────────────────────────────────────────
export function ComboMeter({ combo }: { combo: number }) {
  return (
    <AnimatePresence>
      {combo >= 2 && (
        <motion.div
          key={combo}
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 14 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-3 py-1.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/30"
        >
          <Zap size={14} className="fill-white" />
          {combo}x combo
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Score ring for results screens ─────────────────────────────
export function ScoreRing({
  score,
  maxScore,
  size = 140,
}: {
  score: number
  maxScore: number
  size?: number
}) {
  const [displayed, setDisplayed] = useState(0)
  const accuracy = maxScore > 0 ? score / maxScore : 0
  const radius = (size - 14) / 2
  const circumference = 2 * Math.PI * radius
  const targetPct = Math.round(accuracy * 100)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setDisplayed(Math.round(targetPct * (1 - (1 - t) ** 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [targetPct])

  const tone =
    accuracy >= 0.8
      ? 'text-emerald-500 dark:text-emerald-400'
      : accuracy >= 0.5
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-rose-500 dark:text-rose-400'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={10}
          className="stroke-slate-200 dark:stroke-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - accuracy)}
          className="stroke-brand-500 transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn('font-display text-3xl font-extrabold', tone)}>
          {displayed}%
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {score}/{maxScore} pts
        </span>
      </div>
    </div>
  )
}

// ── Timer display (quiz session clock) ─────────────────────────
export function SessionTimer({ startedAt }: { startedAt: number }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [startedAt])
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1.5 font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">
      <Timer size={14} />
      {formatClock(seconds)}
    </span>
  )
}
