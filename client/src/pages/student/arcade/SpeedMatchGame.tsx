import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Grid2x2, Play, Sparkles, Timer, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card, Chip, Select } from '@/components/ui'
import { FigureCanvas } from '@/components/FigureCanvas'
import { cn } from '@/lib/utils'
import { isTypingTarget } from '@/lib/a11y'
import { fireComboBurst, playBurstSound, playHitSound, playMissSound } from '@/lib/sound'
import { buildFigureGeometry } from '@shared/figure'
import {
  MATCH,
  MATCH_DECKS,
  dealBoard,
  deckFromCards,
  deckFromPack,
  matchPoints,
   seededRng,
  type MatchDeck,
  type MatchTile,
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

type GridMode = '4x4' | '5x4'
type Phase = 'ready' | 'playing' | 'done'

const CHAIN_WINDOW_MS = 3_000
const LOCKOUT_MS = 1_000

export function SpeedMatchGame() {
  const [searchParams] = useSearchParams()
  const initialPackId = searchParams.get('pack') ?? ''
  const subjectFilter = searchParams.get('subject') ?? 'All'
  const finishRun = useFinishArcadeRun('speed-match')

  const { data: dueData } = useQuery({
    queryKey: ['srs-due-for-match'],
    queryFn: api.srs.due,
  })

  const allDecks = useMemo<MatchDeck[]>(() => {
    const packDecks = CONTENT_PACKS.filter((p) =>
      matchesSubjectFilter(p.subject, subjectFilter) || p.category === subjectFilter || subjectFilter === 'All',
    ).map((p) => deckFromPack(p))
    const personal = dueData ? deckFromCards(dueData.cards) : null
    return [...(personal ? [personal] : []), ...packDecks, ...MATCH_DECKS]
  }, [dueData, subjectFilter])

  const [deckId, setDeckId] = useState<string>(() => {
    if (initialPackId) return `pack:${initialPackId}`
    return allDecks[0]?.id ?? MATCH_DECKS[0].id
  })
  const [gridMode, setGridMode] = useState<GridMode>('4x4')
  const [phase, setPhase] = useState<Phase>('ready')

  const activeDeck = useMemo(
    () => allDecks.find((d) => d.id === deckId) ?? allDecks[0] ?? MATCH_DECKS[0],
    [allDecks, deckId],
  )

  const cols = gridMode === '5x4' ? 5 : 4
  const pairCount = gridMode === '5x4' ? 10 : 8

  const [tiles, setTiles] = useState<MatchTile[]>([])
  const [cleared, setCleared] = useState<Set<string>>(new Set())
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [mismatchPair, setMismatchPair] = useState<[number, number] | null>(null)
  const [burstTiles, setBurstTiles] = useState<[number, number] | null>(null)
  const [cursorIdx, setCursorIdx] = useState<number>(0)
  const [lockedUntil, setLockedUntil] = useState<number>(0)

  const [timeLeft, setTimeLeft] = useState<number>(MATCH.runSeconds)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [comboBursts, setComboBursts] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [boardsCleared, setBoardsCleared] = useState(0)
  const [score, setScore] = useState(0)
  const [payout, setPayout] = useState<{
    result: ArcadeRunResultDTO | null
    isNewHigh: boolean
  } | null>(null)

  const boardRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([])
  const lastMatchAtRef = useRef<number | null>(null)
  const runStartRef = useRef<number>(0)
  const finishingRef = useRef(false)

  // Compute SVG connection line coordinates when a tile is selected and cursor/second tile is active
  const [wireCoords, setWireCoords] = useState<{
    x1: number
    y1: number
    x2: number
    y2: number
    status: 'active' | 'match' | 'miss'
  } | null>(null)

  const updateWire = useCallback(
    (fromIdx: number | null, toIdx: number | null, status: 'active' | 'match' | 'miss') => {
      const host = boardRef.current
      if (!host || fromIdx === null || toIdx === null || fromIdx === toIdx) {
        setWireCoords(null)
        return
      }
      const elA = tileRefs.current[fromIdx]
      const elB = tileRefs.current[toIdx]
      if (!elA || !elB) {
        setWireCoords(null)
        return
      }
      const hostRect = host.getBoundingClientRect()
      const rA = elA.getBoundingClientRect()
      const rB = elB.getBoundingClientRect()
      setWireCoords({
        x1: rA.left - hostRect.left + rA.width / 2,
        y1: rA.top - hostRect.top + rA.height / 2,
        x2: rB.left - hostRect.left + rB.width / 2,
        y2: rB.top - hostRect.top + rB.height / 2,
        status,
      })
    },
    [],
  )

  const dealFreshBoard = useCallback(
    (seed: number) => {
      const rng = seededRng(seed)
      const dealt = dealBoard(activeDeck, pairCount, rng)
      setTiles(dealt)
      setCleared(new Set())
      setSelectedIdx(null)
      setMismatchPair(null)
      setBurstTiles(null)
      setWireCoords(null)
      setCursorIdx(0)
    },
    [activeDeck, pairCount],
  )

  const startRun = () => {
    dealFreshBoard(Date.now())
    setTimeLeft(MATCH.runSeconds)
    setCombo(0)
    setBestCombo(0)
    setComboBursts(0)
    setCorrect(0)
    setAttempts(0)
    setBoardsCleared(0)
    setScore(0)
    setPayout(null)
    setLockedUntil(0)
    lastMatchAtRef.current = null
    finishingRef.current = false
    runStartRef.current = performance.now()
    setPhase('playing')
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
      setPhase('done')
      const durationMs = Math.max(1000, Math.round(performance.now() - runStartRef.current))
      const banked = await finishRun({
        ...vals,
        durationMs,
        deckId: activeDeck.id.slice(0, 60),
      })
      setPayout(banked)
    },
    [finishRun, activeDeck.id],
  )

  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      setTimeLeft((prev) => (prev <= 0.1 ? 0 : Math.round((prev - 0.1) * 10) / 10))
    }, 100)
    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      void endRun({ score, correct, attempts, bestCombo, comboBursts })
    }
  }, [phase, timeLeft, score, correct, attempts, bestCombo, comboBursts, endRun])

  useEffect(() => {
    if (selectedIdx !== null && mismatchPair === null && burstTiles === null) {
      updateWire(selectedIdx, cursorIdx, 'active')
    }
  }, [selectedIdx, cursorIdx, mismatchPair, burstTiles, updateWire])

  const selectTile = useCallback(
    (idx: number) => {
      if (phase !== 'playing') return
      const now = performance.now()
      if (now < lockedUntil) return
      const tile = tiles[idx]
      if (!tile || cleared.has(tile.tileId)) return

      setCursorIdx(idx)

      if (selectedIdx === null) {
        setSelectedIdx(idx)
        return
      }
      if (selectedIdx === idx) {
        setSelectedIdx(null)
        setWireCoords(null)
        return
      }

      const first = tiles[selectedIdx]
      if (!first) return

      setAttempts((a) => a + 1)

      if (first.pairId === tile.pairId && first.side !== tile.side) {
        // Match! Check 3s Chain Multiplier window
        const deltaMs = lastMatchAtRef.current !== null ? now - lastMatchAtRef.current : null
        const nextCombo = deltaMs !== null && deltaMs <= CHAIN_WINDOW_MS ? combo + 1 : 1
        lastMatchAtRef.current = now
        const nextBest = Math.max(bestCombo, nextCombo)
        const burst = isComboBurst(nextCombo)
        const nextBursts = burst ? comboBursts + 1 : comboBursts
        const pts = matchPoints(nextCombo)

        if (burst) {
          playBurstSound()
          fireComboBurst()
        } else {
          playHitSound(nextCombo)
        }

        updateWire(selectedIdx, idx, 'match')
        setBurstTiles([selectedIdx, idx])
        const nextCleared = new Set(cleared)
        nextCleared.add(first.tileId)
        nextCleared.add(tile.tileId)

        setCleared(nextCleared)
        setSelectedIdx(null)
        setCombo(nextCombo)
        setBestCombo(nextBest)
        setComboBursts(nextBursts)
        setCorrect((c) => c + 1)
        setScore((s) => s + pts)

        window.setTimeout(() => {
          setBurstTiles(null)
          setWireCoords(null)
        }, 380)

        // Whole board cleared? Deal a fresh board + bonus time!
        if (nextCleared.size >= tiles.length) {
          setBoardsCleared((b) => b + 1)
          setTimeLeft((t) => t + MATCH.clearBonusSeconds)
          window.setTimeout(() => {
            dealFreshBoard(Date.now() + nextCleared.size)
          }, 420)
        }
      } else {
        // Wrong pair -> 1s red lockout & -2s penalty
        playMissSound()
        updateWire(selectedIdx, idx, 'miss')
        setMismatchPair([selectedIdx, idx])
        setSelectedIdx(null)
        setCombo(0)
        setLockedUntil(now + LOCKOUT_MS)
        setTimeLeft((t) => Math.max(0, Math.round((t - MATCH.missPenaltySeconds) * 10) / 10))
        window.setTimeout(() => {
          setMismatchPair(null)
          setWireCoords(null)
        }, LOCKOUT_MS)
      }
    },
    [
      phase,
      lockedUntil,
      tiles,
      cleared,
      selectedIdx,
      combo,
      bestCombo,
      comboBursts,
      updateWire,
      dealFreshBoard,
    ],
  )

  // Full 2D Arrow-Key + Space/Enter keyboard navigation
  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      const total = tiles.length
      if (total === 0) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCursorIdx((i) => (i + 1) % total)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCursorIdx((i) => (i - 1 + total) % total)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursorIdx((i) => (i + cols) % total)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursorIdx((i) => (i - cols + total) % total)
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        selectTile(cursorIdx)
      } else if (e.key === 'Escape') {
        setSelectedIdx(null)
        setWireCoords(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, tiles.length, cols, cursorIdx, selectTile])

  return (
    <div className="flex flex-col gap-5">
      <ArcadeTopBar
        title="Speed Match"
        subtitle="Connect terms & definitions inside 3.0s for Chain Multipliers — full Arrow + Space/Enter support"
        badge={<Chip color="brand">{gridMode}</Chip>}
      />

      {phase === 'ready' && (
        <Card className="mx-auto flex max-w-2xl flex-col gap-5 p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-3xl">
              ⚡
            </span>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                Configure Your Match Matrix
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Match each blue <strong>Term</strong> tile to its emerald <strong>Definition</strong>{' '}
                partner. Consecutive hits under <strong>3 seconds</strong> build a Chain Multiplier!
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="match-deck-select" className="label">
                Content Pack / Vocabulary Deck
              </label>
              <Select
                id="match-deck-select"
                value={activeDeck.id}
                onChange={(e) => setDeckId(e.target.value)}
              >
                {allDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.icon} {d.name} ({d.pairs.length} pairs)
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <span className="label">Grid Dimensions</span>
              <div className="grid grid-cols-2 gap-2">
                {(['4x4', '5x4'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setGridMode(mode)}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-xs font-bold transition',
                      gridMode === mode
                        ? 'border-brand-500 bg-brand-500/15 text-brand-700 dark:text-brand-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300',
                    )}
                  >
                    <Grid2x2 size={14} className="mr-1 inline" />
                    {mode} ({mode === '5x4' ? '20 tiles' : '16 tiles'})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Keyboard: Arrow keys navigate grid · Space/Enter links tiles · Wrong pair = 1s lockout.
            </span>
            <Button onClick={startRun}>
              <Play size={16} /> Deal {gridMode} Board
            </Button>
          </div>
        </Card>
      )}

      {phase === 'playing' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="flex items-center gap-2.5 p-3.5">
              <Timer size={20} className={timeLeft <= 10 ? 'animate-pulse text-rose-500' : 'text-brand-500'} />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Clock</div>
                <div className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
                  {timeLeft.toFixed(1)}s
                </div>
              </div>
            </Card>
            <Card className="flex items-center gap-2.5 p-3.5">
              <Flame size={20} className="text-amber-500" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Chain (&lt;3s)</div>
                <div className="font-mono text-xl font-extrabold text-amber-500">{combo}×</div>
              </div>
            </Card>
            <Card className="flex items-center gap-2.5 p-3.5">
              <Sparkles size={20} className="text-emerald-500" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Matched</div>
                <div className="font-mono text-xl font-extrabold text-emerald-500">{correct}</div>
              </div>
            </Card>
            <Card className="flex items-center gap-2.5 p-3.5">
              <Zap size={20} className="text-violet-500" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Score</div>
                <div className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
                  {score.toLocaleString()}
                </div>
              </div>
            </Card>
          </div>

          <div ref={boardRef} className="relative">
            {/* Active SVG Connection Line Overlay */}
            {wireCoords && (
              <svg
                className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                aria-hidden
              >
                <line
                  x1={wireCoords.x1}
                  y1={wireCoords.y1}
                  x2={wireCoords.x2}
                  y2={wireCoords.y2}
                  strokeWidth={3.5}
                  strokeDasharray={wireCoords.status === 'active' ? '6 4' : undefined}
                  className={
                    wireCoords.status === 'match'
                      ? 'stroke-emerald-400'
                      : wireCoords.status === 'miss'
                        ? 'stroke-rose-500'
                        : 'stroke-brand-400'
                  }
                />
                <circle cx={wireCoords.x1} cy={wireCoords.y1} r={5} className="fill-brand-400" />
                <circle cx={wireCoords.x2} cy={wireCoords.y2} r={5} className="fill-brand-400" />
              </svg>
            )}

            <div
              className={cn(
                'grid gap-2.5',
                cols === 5 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4',
              )}
            >
              {tiles.map((tile, idx) => {
                const isCleared = cleared.has(tile.tileId)
                const isSelected = selectedIdx === idx
                const isCursor = cursorIdx === idx
                const isMiss =
                  mismatchPair !== null && (mismatchPair[0] === idx || mismatchPair[1] === idx)
                const isBurst =
                  burstTiles !== null && (burstTiles[0] === idx || burstTiles[1] === idx)

                return (
                  <div key={tile.tileId} className="relative min-h-28">
                    <AnimatePresence>
                      {isBurst && (
                        <motion.div
                          initial={{ scale: 0.6, opacity: 1 }}
                          animate={{ scale: 1.45, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.36 }}
                          className="pointer-events-none absolute inset-0 z-10 rounded-2xl border-2 border-emerald-400 bg-emerald-400/20"
                        />
                      )}
                    </AnimatePresence>

                    <motion.button
                      ref={(el) => {
                        tileRefs.current[idx] = el
                      }}
                      type="button"
                      disabled={isCleared}
                      onMouseEnter={() => setCursorIdx(idx)}
                      onClick={() => selectTile(idx)}
                      animate={
                        isMiss
                          ? { x: [0, -6, 6, -4, 4, 0] }
                          : isCleared
                            ? { scale: 0.88, opacity: 0.14 }
                            : { scale: 1, opacity: 1 }
                      }
                      transition={{ duration: 0.22 }}
                      className={cn(
                        'flex h-full min-h-28 w-full flex-col justify-between rounded-2xl border p-3 text-left text-xs font-semibold transition',
                        isCleared
                          ? 'pointer-events-none border-dashed border-slate-200 dark:border-white/5'
                          : isMiss
                            ? 'border-rose-500 bg-rose-500/20 text-rose-900 dark:text-rose-100'
                            : isSelected
                              ? 'border-brand-500 bg-brand-500/20 ring-2 ring-brand-400 dark:text-white'
                              : tile.side === 'term'
                                ? 'border-slate-200 bg-white text-slate-800 hover:border-brand-400 dark:border-white/10 dark:bg-ink-800 dark:text-slate-100'
                                : 'border-emerald-500/25 bg-emerald-500/5 text-slate-800 hover:border-emerald-400 dark:bg-emerald-500/10 dark:text-slate-100',
                        isCursor && !isCleared && 'ring-2 ring-amber-400/80',
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-extrabold uppercase tracking-wider',
                          tile.side === 'term'
                            ? 'text-brand-500 dark:text-brand-300'
                            : 'text-emerald-600 dark:text-emerald-300',
                        )}
                      >
                        {tile.side === 'term' ? 'Term' : 'Match'}
                      </span>

                      {tile.figure ? (
                        <div className="my-1 flex flex-col items-center gap-1">
                          <FigureCanvas geometry={buildFigureGeometry(tile.figure)} size={78} />
                          <span className="text-[11px] font-bold">{tile.text}</span>
                        </div>
                      ) : (
                        <span className="line-clamp-4 leading-snug">{tile.text}</span>
                      )}
                    </motion.button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <ArcadePayoutView
          mode="speed-match"
          title="Matrix Cleared!"
          score={score}
          correct={correct}
          attempts={attempts}
          bestCombo={bestCombo}
          comboBursts={comboBursts}
          extraStats={[
            { label: 'Full Boards Cleared', value: String(boardsCleared) },
            { label: 'Grid Mode', value: gridMode },
            { label: 'Deck', value: activeDeck.name },
          ]}
          result={payout?.result ?? null}
          isNewHigh={payout?.isNewHigh ?? false}
          onPlayAgain={startRun}
        />
      )}
    </div>
  )
}

export default SpeedMatchGame
