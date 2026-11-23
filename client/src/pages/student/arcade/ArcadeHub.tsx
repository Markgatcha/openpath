import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpenCheck,
  Box,
  Bug,
  Castle,
  Coins,
  Crosshair,
  Flame,
  Gamepad2,
  GitCommitHorizontal,
  Grid2x2,
  Play,
  Rocket,
  Scale,
  Shield,
  Sliders,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Card, Chip, ProgressBar, Select } from '@/components/ui'
import { isSoundMuted, setSoundMuted } from '@/lib/sound'
import { dailyPick } from '@shared/arcade'
import { ARCADE_DAILY_COIN_CAP } from '@shared/economy'
import { CONTENT_PACKS, SUBJECT_GROUPS } from '@shared/packs'
import type { ArcadeMode } from '@shared/schemas'
import { readLocalArcadeStats } from './arcade-common'

interface ArcadeGameCardDef {
  mode: ArcadeMode
  route: string
  title: string
  tagline: string
  description: string
  difficulty:
    | 'Adaptive'
    | 'Fast-Paced'
    | 'Analytical'
    | 'Precision'
    | 'Strategic'
    | 'Roguelite'
    | 'Calibration'
    | 'Spatial'
    | 'Synthesis'
    | 'Tower Defense'
  pacing: 'Untimed / Strategic' | 'Timed'
  badgeColor: 'emerald' | 'brand' | 'amber' | 'rose'
  icon: typeof Shield
  emoji: string
  accent: string
}

const ARCADE_GAMES: ArcadeGameCardDef[] = [
  {
    mode: 'certainty-vault',
    route: '/student/arcade/vault',
    title: 'Certainty Vault',
    tagline: '10-Vault Confidence Wager & Calibration',
    description:
      'Take your time on every question, choose an answer, and stake Safe, Steady, or Master certainty seals to unlock vault charge without blind guessing.',
    difficulty: 'Calibration',
    pacing: 'Untimed / Strategic',
    badgeColor: 'emerald',
    icon: Scale,
    emoji: '🔐',
    accent: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    mode: 'diagram-scout',
    route: '/student/arcade/scout',
    title: 'Diagram Scout',
    tagline: 'Unlabelled 3D Model & 2D Figure Pinpointer',
    description:
      'Rotate 3D Model Lab structures and inspect 2D STEM graphs with labels hidden. Locate targets from functional clues using 3 precision hearts.',
    difficulty: 'Spatial',
    pacing: 'Untimed / Strategic',
    badgeColor: 'brand',
    icon: Crosshair,
    emoji: '🧭',
    accent: 'from-cyan-500/20 to-indigo-500/10',
  },
  {
    mode: 'cloze-workbench',
    route: '/student/arcade/cloze',
    title: 'Cloze Workbench',
    tagline: 'Joint Multi-Blank Proof & Code Builder',
    description:
      'Reconstruct complete multi-step algebra proofs, TypeScript invariants, science mechanisms, and Spanish subjunctive clauses before verifying jointly.',
    difficulty: 'Synthesis',
    pacing: 'Untimed / Strategic',
    badgeColor: 'amber',
    icon: BookOpenCheck,
    emoji: '🧩',
    accent: 'from-amber-500/20 to-yellow-500/10',
  },
  {
    mode: 'knowledge-bastion',
    route: '/student/arcade/bastion',
    title: 'Knowledge Bastion',
    tagline: 'Mastery-Charged Tower Defense Campaign',
    description:
      'Earn energy via calm untimed Mastery Charge rounds, guard against Tower Jams by avoiding rapid guesses, and deploy Pulse, Prism, and Chrono towers across 8×6 maps.',
    difficulty: 'Tower Defense',
    pacing: 'Untimed / Strategic',
    badgeColor: 'brand',
    icon: Castle,
    emoji: '🏰',
    accent: 'from-indigo-500/20 to-rose-500/10',
  },
  {
    mode: 'orbit-pilot',
    route: '/student/arcade/orbit-pilot',
    title: 'Orbit Pilot',
    tagline: '3D Orbital Mechanics Flight Missions',
    description:
      'Fly a probe around a planet in 3D. Fire the engine with or against your direction of travel to raise, lower and circularise your orbit, and reach the target band before the fuel runs out.',
    difficulty: 'Precision',
    pacing: 'Timed',
    badgeColor: 'brand',
    icon: Rocket,
    emoji: '🛰️',
    accent: 'from-sky-500/20 to-violet-500/10',
  },
  {
    mode: 'streak-siege',
    route: '/student/arcade/siege',
    title: 'Streak Siege',
    tagline: '45s FSRS Survival Blitz',
    description:
      'Race the countdown clock over your real due & weak FSRS flashcards. Build 3-pip shields, bank combo time bonuses, and strengthen spaced-repetition stability!',
    difficulty: 'Adaptive',
    pacing: 'Timed',
    badgeColor: 'emerald',
    icon: Shield,
    emoji: '🛡️',
    accent: 'from-emerald-500/20 to-cyan-500/10',
  },
  {
    mode: 'speed-match',
    route: '/student/arcade/match',
    title: 'Speed Match',
    tagline: '4×4 & 5×4 Chain-Multiplier Grid',
    description:
      'Wire terms, formulas, and parametric figures to their definitions. Chain matches inside 3 seconds for explosive multipliers with full arrow-key control.',
    difficulty: 'Fast-Paced',
    pacing: 'Timed',
    badgeColor: 'brand',
    icon: Grid2x2,
    emoji: '⚡',
    accent: 'from-brand-500/20 to-violet-500/10',
  },
  {
    mode: 'step-detective',
    route: '/student/arcade/detective',
    title: 'Step Detective',
    tagline: 'Conceptual Bug & Derivation Hunter',
    description:
      'Inspect a 4–6 step worked math proof, physics substitution, or algorithm snippet containing one subtle conceptual bug — spot the faulty line and patch it!',
    difficulty: 'Analytical',
    pacing: 'Timed',
    badgeColor: 'amber',
    icon: Bug,
    emoji: '🕵️',
    accent: 'from-amber-500/20 to-orange-500/10',
  },
  {
    mode: 'sim-sandbox',
    route: '/student/arcade/sandbox',
    title: 'Simulation Sandbox',
    tagline: '60fps Physics, Math & Market Targets',
    description:
      'Tune live launch angles, dual-gate slopes, series-parallel resistors, or excise tax wedges and hit Run Simulation to land inside the target tolerance band.',
    difficulty: 'Precision',
    pacing: 'Untimed / Strategic',
    badgeColor: 'brand',
    icon: Sliders,
    emoji: '🎯',
    accent: 'from-cyan-500/20 to-blue-500/10',
  },
  {
    mode: 'sequence-architect',
    route: '/student/arcade/sequence',
    title: 'Sequence Architect',
    tagline: 'Causal Timelines & Pathway Ordering',
    description:
      'Drag-and-drop scrambled historical eras, mitosis/synapse stages, and sorting steps into causal order with real-time inversion telemetry.',
    difficulty: 'Strategic',
    pacing: 'Untimed / Strategic',
    badgeColor: 'emerald',
    icon: GitCommitHorizontal,
    emoji: '🧬',
    accent: 'from-violet-500/20 to-fuchsia-500/10',
  },
  {
    mode: 'boss-raid',
    route: '/student/arcade/boss',
    title: 'Boss Raid',
    tagline: 'Turn-Based SRS Roguelite Encounter',
    description:
      'Battle subject guardians like The Stoichiometric Hydra and The Euclidean Titan! Answer cleanly and draft Chrono Freeze, 50/50 Shield, or 2× Bounty.',
    difficulty: 'Roguelite',
    pacing: 'Untimed / Strategic',
    badgeColor: 'rose',
    icon: Swords,
    emoji: '🐉',
    accent: 'from-rose-500/20 to-amber-500/10',
  },
]

export function ArcadeHub() {
  const { user } = useAuth()
  const [subject, setSubject] = useState<string>('All')
  const [selectedPackId, setSelectedPackId] = useState<string>('')
  const [pacingFilter, setPacingFilter] = useState<'all' | 'untimed' | 'timed'>('all')
  const [muted, setMuted] = useState(() => isSoundMuted())

  const { data: summary } = useQuery({
    queryKey: ['arcade-summary'],
    queryFn: api.arcade.summary,
  })

  const { data: srsStats } = useQuery({
    queryKey: ['srs-stats'],
    queryFn: api.srs.stats,
  })

  const localStats = useMemo(() => readLocalArcadeStats(user?.id), [user?.id])

  const filteredPacks = useMemo(
    () =>
      subject === 'All'
        ? CONTENT_PACKS
        : CONTENT_PACKS.filter((p) => p.category === subject),
    [subject],
  )

  // Deterministic Daily Challenge combining a daily game + daily curriculum pack
  const dailyGame = useMemo(() => dailyPick(ARCADE_GAMES), [])
  const dailyPack = useMemo(() => dailyPick(CONTENT_PACKS), [])

  const coins = summary?.coins ?? user?.coins ?? 0
  const earnedToday = summary?.earnedToday ?? 0
  const dailyCap = summary?.dailyCap ?? ARCADE_DAILY_COIN_CAP
  const currencyIcon = summary?.currencyIcon ?? '🪙'
  const currencyName = summary?.currencyName ?? 'Coins'

  const buildPlayUrl = (baseRoute: string) => {
    const params = new URLSearchParams()
    if (subject !== 'All') params.set('subject', subject)
    if (selectedPackId) params.set('pack', selectedPackId)
    const qs = params.toString()
    return qs ? `${baseRoute}?${qs}` : baseRoute
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Economy Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            <Gamepad2 className="text-brand-500" /> Educational Arcade
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Ten replayable STEM, CS, Economics & Humanities games powered by your FSRS
            spaced-repetition queue and classroom economy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/student/lab" className="btn-ghost text-xs">
            <Box size={15} className="text-cyan-500" /> Model Lab
          </Link>
          <button
            type="button"
            onClick={() => {
              const next = !muted
              setMuted(next)
              setSoundMuted(next)
            }}
            className="btn-ghost text-xs"
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            {muted ? 'Muted' : 'SFX On'}
          </button>
        </div>
      </div>

      {/* Wallet + Daily Cap + Active Daily Challenge */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <Card className="flex flex-col justify-between gap-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/15 text-2xl">
                {currencyIcon}
              </span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {currencyName} Balance
                </div>
                <div className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                  {coins.toLocaleString()} {currencyIcon}
                </div>
              </div>
            </div>
            <Chip color="amber">
              <Coins size={12} /> Cap {dailyCap}/day
            </Chip>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300">
                Today’s Arcade Earnings
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-300">
                {earnedToday} / {dailyCap} {currencyIcon}
              </span>
            </div>
            <ProgressBar value={Math.min(1, earnedToday / Math.max(1, dailyCap))} />
            <p className="mt-2 text-[11px] text-slate-400">
              {srsStats
                ? `${srsStats.dueCount} FSRS cards due · ${srsStats.newCount} new cards ready for Siege, Vault, Bastion & Boss Raid`
                : 'Earn classroom currency across all 10 modes up to the 120 daily cap.'}
            </p>
          </div>
        </Card>

        {/* Daily Challenge Spotlight */}
        <Card className="relative overflow-hidden border-brand-500/30 bg-gradient-to-br from-brand-500/10 via-violet-500/5 to-cyan-500/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Chip color="brand">
                <Sparkles size={12} /> Active Daily Challenge
              </Chip>
              <Chip color="emerald">
                <Flame size={12} /> {dailyPack.subject}
              </Chip>
            </div>
            <span className="text-3xl" aria-hidden>
              {dailyGame.emoji}
            </span>
          </div>
          <h2 className="mt-3 font-display text-lg font-extrabold text-slate-900 dark:text-white">
            {dailyGame.title} × {dailyPack.name}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Complete a run in <strong>{dailyGame.title}</strong> focused on{' '}
            <strong>{dailyPack.name}</strong> ({dailyPack.standards}) to bank combo bursts toward your{' '}
            {dailyCap} {currencyIcon} daily cap!
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Link
              to={`${dailyGame.route}?subject=${encodeURIComponent(dailyPack.category)}&pack=${encodeURIComponent(dailyPack.id)}`}
              className="btn btn-primary text-xs"
            >
              <Play size={14} /> Launch Daily Challenge
            </Link>
            {dailyPack.modelId && (
              <Link
                to={`/student/lab/${dailyPack.modelId}`}
                className="btn-ghost text-xs"
              >
                <Box size={14} /> Inspect Companion Model
              </Link>
            )}
          </div>
        </Card>
      </div>

      {/* Dynamic Subject & Pack Filter Bar */}
      <Card className="flex flex-wrap items-end gap-4 p-4">
        <div className="min-w-48 flex-1">
          <label htmlFor="arcade-subject-filter" className="label">
            Subject Discipline
          </label>
          <Select
            id="arcade-subject-filter"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value)
              setSelectedPackId('')
            }}
          >
            <option value="All">All Disciplines ({CONTENT_PACKS.length} packs)</option>
            {SUBJECT_GROUPS.map((grp) => (
              <option key={grp} value={grp}>
                {grp} ({CONTENT_PACKS.filter((p) => p.category === grp).length} packs)
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-56 flex-[1.4]">
          <label htmlFor="arcade-pack-filter" className="label">
            Curriculum Content Pack (shared/packs.ts)
          </label>
          <Select
            id="arcade-pack-filter"
            value={selectedPackId}
            onChange={(e) => setSelectedPackId(e.target.value)}
          >
            <option value="">All {subject === 'All' ? '' : `${subject} `}Packs</option>
            {filteredPacks.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.icon} {pack.name} ({pack.subject})
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label">Pacing Filter</span>
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All (10)' },
                { id: 'untimed', label: 'Untimed / Strategic (7)' },
                { id: 'timed', label: 'Timed (3)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPacingFilter(opt.id)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  pacingFilter === opt.id
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-ink-900 dark:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 10 Game Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ARCADE_GAMES.filter((g) =>
          pacingFilter === 'all'
            ? true
            : pacingFilter === 'untimed'
              ? g.pacing === 'Untimed / Strategic'
              : g.pacing === 'Timed',
        ).map((game, index) => {
          const stat = localStats[game.mode]
          const GameIcon = game.icon
          return (
            <motion.div
              key={game.mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.22 }}
              className="card card-hover flex flex-col justify-between gap-4 p-5"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${game.accent} text-2xl shadow-inner`}
                  >
                    <span aria-hidden>{game.emoji}</span>
                  </div>
                  <div className="flex flex-wrap justify-end items-center gap-1.5">
                    <Chip color={game.pacing === 'Timed' ? 'amber' : 'emerald'}>
                      {game.pacing === 'Timed' ? (
                        <Timer size={10} />
                      ) : (
                        <GameIcon size={10} />
                      )}{' '}
                      {game.pacing}
                    </Chip>
                    <Chip color={game.badgeColor}>{game.difficulty}</Chip>
                    {stat && stat.highScore > 0 && (
                      <Chip color="slate">
                        <Trophy size={11} className="text-amber-500" />{' '}
                        {stat.highScore.toLocaleString()}
                      </Chip>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                    {game.title}
                  </h3>
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-300">
                    {game.tagline}
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {game.description}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/10">
                <div className="text-[11px] text-slate-400">
                  {stat?.runs
                    ? `${stat.runs} run${stat.runs === 1 ? '' : 's'} · best ${stat.bestCombo}× combo`
                    : 'No runs yet — set a record!'}
                </div>
                <Link to={buildPlayUrl(game.route)} className="btn btn-primary px-4 py-2 text-xs">
                  <Play size={14} /> Play
                </Link>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default ArcadeHub
