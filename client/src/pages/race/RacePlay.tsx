import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  Clock,
  Radio,
  Shield,
  Swords,
  Users,
  Zap,
} from 'lucide-react'
import { Avatar, Button, Card, Chip, Spinner, useToast } from '@/components/ui'
import {
  FillAnswer,
  FigureAnswer,
  OrderAnswer,
} from '@/components/AnswerInputs'
import { FigureCanvas } from '@/components/FigureCanvas'
import { isTypingTarget, usePrefersReducedMotion } from '@/lib/a11y'
import { cn } from '@/lib/utils'
import { useRaceRoom } from './use-race-room'
import {
  formatRaceAnswer,
  RACE_MODE_OPTIONS,
  RACE_PING_OPTIONS,
  racePingLabel,
} from './race-format'
import type { RacePingTag, RaceQuestionDTO } from '@shared/types'

/** Mirrors RACE_SPEED_WINDOW_MS on the server: how long answering
 *  fast keeps earning the (dwindling) speed bonus. */
const SPEED_WINDOW_MS = 15_000

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/**
 * Student's race view: lobby → question → reveal → standings, all
 * pushed by the socket. Supports Classic Sprint, Asymmetric Squad Sync,
 * and Classroom Siege co-op Boss mode over the same room socket.
 */
export function RacePlay() {
  const { code = '' } = useParams()
  const toast = useToast()
  const reducedMotion = usePrefersReducedMotion()
  const { state, error, connected, send } = useRaceRoom(code)

  const [lockedIn, setLockedIn] = useState(false)
  // Render-phase reset of the lock-in when a new question opens —
  // the documented "adjust state when a prop changes" pattern,
  // keeping effects free of state writes.
  const [shownQuestionId, setShownQuestionId] = useState<string | null>(null)
  const question = state?.question ?? null
  if ((question?.id ?? null) !== shownQuestionId) {
    setShownQuestionId(question?.id ?? null)
    setLockedIn(false)
  }

  // Ticking clock for the speed-bonus bar and 3s recalibration lock.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (state?.room.phase !== 'question' || !question) return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [state?.room.phase, question])
  const elapsed = question ? Math.max(0, now - question.openedAt) : 0

  const currentMode = state?.room.mode ?? 'classic'
  const squadLockedIn =
    lockedIn ||
    (currentMode === 'squad-sync' &&
      Boolean(
        state?.you.squadId &&
          state.room.players.some(
            (p) => p.squadId === state.you.squadId && p.answered,
          ),
      ))
  const recalibrateRemainingMs =
    currentMode === 'classroom-siege' && state?.cooldownUntilMs
      ? Math.min(3000, Math.max(0, state.cooldownUntilMs - now))
      : 0
  const recalibrateLocked = recalibrateRemainingMs > 0

  const sendPing = useCallback(
    (tag: RacePingTag) => {
      if (currentMode !== 'squad-sync') return
      if (!send({ t: 'ping', tag })) {
        toast('Still reconnecting — try that ping again', 'error')
      }
    },
    [currentMode, send, toast],
  )

  const submit = useCallback(
    (response: number | boolean | string | number[]) => {
      if (lockedIn || recalibrateLocked || !question) return
      const msTaken = Math.max(0, Date.now() - question.openedAt)
      if (!send({ t: 'answer', response, msTaken })) {
        toast('Still reconnecting — try that answer again', 'error')
        return
      }
      setLockedIn(true)
    },
    [lockedIn, question, recalibrateLocked, send, toast],
  )

  const submitSquadOption = useCallback(
    (optionIdx: number) => {
      if (squadLockedIn || !question) return
      const msTaken = Math.max(0, Date.now() - question.openedAt)
      if (!send({ t: 'squad_submit', optionIdx, msTaken })) {
        toast('Still reconnecting — try locking in again', 'error')
        return
      }
      setLockedIn(true)
    },
    [question, send, squadLockedIn, toast],
  )

  useEffect(() => {
    if (
      currentMode !== 'squad-sync' ||
      state?.room.phase !== 'question' ||
      squadLockedIn
    ) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      const idx = ['1', '2', '3', '4'].indexOf(event.key)
      if (idx >= 0) {
        const option = RACE_PING_OPTIONS[idx]
        if (option) sendPing(option.tag)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentMode, state?.room.phase, squadLockedIn, sendPing])

  if (error && !state) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-3xl">📡</p>
        <h1 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white">
          Can’t join this race
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
        <Button className="mt-5" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Card>
    )
  }

  if (!state) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const { room, reveal, standings, squadQuestion } = state
  const you = state.you
  const yourSquad =
    currentMode === 'squad-sync' && you.squadId
      ? (room.squads ?? []).find((s) => s.id === you.squadId) ?? null
      : null
  const squadMembers = yourSquad
    ? room.players.filter((p) => yourSquad.memberIds.includes(p.userId))
    : []
  const siege = currentMode === 'classroom-siege' ? room.siege ?? null : null
  const modeMeta = RACE_MODE_OPTIONS.find((item) => item.mode === currentMode)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-500">
            <Radio size={13} /> {modeMeta?.title ?? 'Live race'} · {room.code}
          </p>
          <h1 className="truncate font-display text-lg font-bold text-slate-900 dark:text-white">
            {room.quizTitle}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {yourSquad && (
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 dark:border-white/10 dark:text-slate-200">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: yourSquad.color }}
              />
              {yourSquad.name}
            </span>
          )}
          <Chip color={connected ? 'emerald' : 'rose'}>
            {connected ? 'live' : 'reconnecting…'}
          </Chip>
          <span className="flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Zap size={13} className="text-gold-500" /> {you.score}
          </span>
        </div>
      </div>

      {/* Classroom Siege live Boss + Aegis HUD */}
      {siege && room.phase !== 'lobby' && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-white">
              <Swords size={16} className="text-rose-500" />
              {siege.bossHp === 0
                ? 'Boss Defeated!'
                : `Wave ${siege.wave} · Boss HP ${siege.bossHp}/${siege.maxHp}`}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-300">
              <Shield size={14} className="text-sky-500" />
              Aegis {siege.aegisShield}/5
              {siege.sealsBroken > 0 && ` · ${siege.sealsBroken} seal broken`}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className={cn(
                'h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500',
                !reducedMotion && 'transition-[width] duration-300',
              )}
              style={{
                width: `${Math.max(0, Math.min(100, (siege.bossHp / Math.max(1, siege.maxHp)) * 100))}%`,
              }}
            />
          </div>
        </Card>
      )}

      {/* ── Lobby ─────────────────────────────────────────────── */}
      {room.phase === 'lobby' && (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="text-4xl">
            {currentMode === 'classroom-siege'
              ? '🛡️'
              : currentMode === 'squad-sync'
                ? '🤝'
                : '🎬'}
          </span>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            You’re in!
          </h2>
          <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
            {currentMode === 'squad-sync'
              ? 'Asymmetric Squad Sync: answer options split across your squadmates. Coordinate with pings or voice so the member holding the right option locks it in.'
              : currentMode === 'classroom-siege'
                ? 'Classroom Siege: correct hits chip down the shared Boss HP. Rapid guesses fracture the Aegis Shield and pause the room for recalibration!'
                : 'The race starts when your teacher presses go. Answer fast — the first correct answers of each question earn a speed bonus, and streaks add more.'}
          </p>
          {yourSquad && (
            <div className="w-full max-w-sm rounded-xl border border-brand-400/40 bg-brand-500/5 p-3 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-100">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: yourSquad.color }}
                />
                Your squad: {yourSquad.name}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Members: {squadMembers.map((m) => m.name).join(', ')}
              </p>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <Users size={15} /> {room.players.length} player
            {room.players.length === 1 ? '' : 's'} waiting
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {room.players.map((player) => (
              <span
                key={player.userId}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold',
                  player.userId === you.userId
                    ? 'border-brand-400 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                    : 'border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300',
                )}
              >
                <Avatar name={player.name} color={player.avatarColor} size="sm" />
                {player.name}
                {player.userId === you.userId && ' (you)'}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ── Question ──────────────────────────────────────────── */}
      {room.phase === 'question' && question && (
        <Card className="p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="chip bg-brand-500/15 text-brand-600 dark:text-brand-300">
              Question {question.index + 1} / {question.total}
            </span>
            <span className="chip bg-slate-500/15 text-slate-500 dark:text-slate-300">
              {question.points} pts
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Clock size={13} />
              {elapsed < SPEED_WINDOW_MS ? 'speed bonus' : 'bonus over'}
            </span>
          </div>
          <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-400 to-orange-400"
              animate={{
                width: `${Math.max(0, 100 - (elapsed / SPEED_WINDOW_MS) * 100)}%`,
              }}
              transition={{ duration: reducedMotion ? 0 : 0.25 }}
            />
          </div>

          {recalibrateLocked && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-500/10 p-3.5 text-xs font-semibold text-amber-800 dark:border-amber-500/40 dark:text-amber-200"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p>
                  Aegis Seal fractured — recalibrate for{' '}
                  {Math.ceil(recalibrateRemainingMs / 1000)}s
                </p>
                {state.recalibrateHint && (
                  <p className="mt-1 font-normal">{state.recalibrateHint}</p>
                )}
              </div>
            </div>
          )}

          {currentMode === 'squad-sync' && yourSquad && (
            <div className="mb-5 rounded-xl border border-slate-200 p-3.5 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-100">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: yourSquad.color }}
                  />
                  {yourSquad.name} · {yourSquad.progress} checkpoints ·{' '}
                  {yourSquad.score} pts
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {squadMembers.map((member) => {
                    const ping = racePingLabel(member.ping)
                    return (
                      <span
                        key={member.userId}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          member.userId === you.userId
                            ? 'bg-brand-500/15 text-brand-700 dark:text-brand-200'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
                        )}
                      >
                        {member.name}
                        {ping && (
                          <span className="rounded bg-white/70 px-1 text-[10px] font-bold text-brand-700 dark:bg-black/30 dark:text-brand-200">
                            {ping}
                          </span>
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>

              {!squadLockedIn && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200 pt-2.5 dark:border-white/10">
                  <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Ping squad:
                  </span>
                  {RACE_PING_OPTIONS.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => sendPing(item.tag)}
                      aria-pressed={you.ping === item.tag}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-semibold transition',
                        you.ping === item.tag
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-brand-400 dark:border-white/10 dark:text-slate-300',
                      )}
                    >
                      <span className="mr-1 opacity-60">[{item.keyHint}]</span>
                      {item.short}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <h2 className="font-display text-xl font-bold leading-snug text-slate-900 sm:text-2xl dark:text-white">
            {currentMode === 'squad-sync' && squadQuestion
              ? squadQuestion.stem
              : question.prompt}
          </h2>

          {((currentMode === 'squad-sync' && squadQuestion?.figure) ||
            (question.type !== 'figure' && question.figure)) && (
            <div className="mt-4">
              <FigureCanvas
                geometry={
                  (currentMode === 'squad-sync' && squadQuestion?.figure) ||
                  question.figure!
                }
              />
            </div>
          )}

          <div className="mt-6">
            {currentMode === 'squad-sync' ? (
              squadLockedIn ? (
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reducedMotion ? { duration: 0 } : undefined}
                  className="flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-600 dark:border-emerald-500/40 dark:text-emerald-300"
                >
                  <Check size={18} /> Your squad locked in — waiting for the reveal
                  {room.players.length > 1 && (
                    <span className="ml-auto text-xs font-medium text-slate-400">
                      {state.answeredCount}/{room.players.length} answered
                    </span>
                  )}
                </motion.div>
              ) : !squadQuestion ? (
                <p className="text-sm text-slate-400">Syncing your squad hand…</p>
              ) : squadQuestion.handOptions.length === 0 ? (
                <div className="rounded-xl border border-brand-300/60 bg-brand-500/5 p-4 text-sm text-slate-600 dark:border-brand-400/30 dark:text-slate-300">
                  <p className="font-semibold text-brand-700 dark:text-brand-300">
                    Strategist turn — your squadmates hold this round’s answer choices
                  </p>
                  <p className="mt-1 text-xs">
                    Talk through the problem and use the quick pings above so your
                    squadmates know whether to hold or lock in.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Your hand holds {squadQuestion.handOptions.length} option
                    {squadQuestion.handOptions.length === 1 ? '' : 's'} — only lock
                    in if yours matches the squad’s reasoning (-2 checkpoints on miss):
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {squadQuestion.handOptions.map((opt) => (
                      <button
                        key={opt.idx}
                        type="button"
                        onClick={() => submitSquadOption(opt.idx)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition',
                          'border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-500/5',
                          'dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/60 dark:hover:bg-brand-500/10',
                        )}
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                          {LETTERS[opt.idx] ?? opt.idx + 1}
                        </span>
                        <span className="text-slate-800 dark:text-slate-100">
                          {opt.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : lockedIn ? (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0 } : undefined}
                className="flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-600 dark:border-emerald-500/40 dark:text-emerald-300"
              >
                <Check size={18} /> Locked in — waiting for the reveal
                {room.players.length > 1 && (
                  <span className="ml-auto text-xs font-medium text-slate-400">
                    {state.answeredCount}/{room.players.length} answered
                  </span>
                )}
              </motion.div>
            ) : (
              <RaceAnswerInputs
                question={question}
                disabled={recalibrateLocked}
                onSubmit={submit}
              />
            )}
          </div>
        </Card>
      )}

      {/* ── Reveal ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {room.phase === 'reveal' && (
          <motion.div
            key="reveal"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            className="flex flex-col gap-4"
          >
            <Card
              className={cn(
                'p-6 text-center',
                you.lastCorrect
                  ? 'border-emerald-300 bg-emerald-500/10 dark:border-emerald-500/40'
                  : 'border-rose-300 bg-rose-500/10 dark:border-rose-500/40',
              )}
            >
              <p className="text-4xl">{you.lastCorrect ? '🎉' : '💪'}</p>
              <h2
                className={cn(
                  'mt-2 font-display text-2xl font-extrabold',
                  you.lastCorrect
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : 'text-rose-600 dark:text-rose-300',
                )}
              >
                {you.lastCorrect
                  ? `Correct! +${you.lastPoints}`
                  : 'Not quite'}
              </h2>
              {reveal && (
                <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Answer:{' '}
                  <span className="text-emerald-600 dark:text-emerald-300">
                    {formatRaceAnswer(reveal.correctAnswer, question?.options)}
                  </span>
                </p>
              )}
              {!you.lastCorrect && you.answered && (
                <p className="mt-1 text-xs text-slate-400">
                  {currentMode === 'squad-sync'
                    ? 'Squad stepped back -2 checkpoints on the relay track — align before the next lock-in!'
                    : 'Your answer didn’t match — the next one is yours.'}
                </p>
              )}
              {!you.answered && (
                <p className="mt-1 text-xs text-slate-400">
                  You didn’t answer this one.
                </p>
              )}
              {reveal?.explanation && (
                <p className="mt-3 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-600 dark:border-white/10 dark:text-slate-300">
                  {reveal.explanation}
                </p>
              )}
            </Card>

            {currentMode === 'squad-sync' && (room.squads ?? []).length > 0 && (
              <Card className="p-5">
                <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-slate-400">
                  Squad standings
                </h3>
                <div className="flex flex-col gap-2">
                  {[...(room.squads ?? [])]
                    .sort((a, b) => b.score - a.score || b.progress - a.progress)
                    .map((sq, idx) => (
                      <div
                        key={sq.id}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2',
                          sq.id === you.squadId && 'bg-brand-500/10',
                        )}
                      >
                        <span className="w-5 text-center text-sm font-bold text-slate-400">
                          {idx + 1}
                        </span>
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: sq.color }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {sq.name}
                          {sq.id === you.squadId && ' (your squad)'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {sq.progress} cp
                        </span>
                        <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                          {sq.score}
                        </span>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            <Card className="p-5">
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-slate-400">
                Live scores
              </h3>
              <div className="flex flex-col gap-1.5">
                {[...room.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, position) => (
                    <div
                      key={player.userId}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2',
                        player.userId === you.userId && 'bg-brand-500/10',
                      )}
                    >
                      <span className="w-5 text-center text-sm font-bold text-slate-400">
                        {position + 1}
                      </span>
                      <Avatar
                        name={player.name}
                        color={player.avatarColor}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {player.name}
                        {player.userId === you.userId && ' (you)'}
                      </span>
                      {player.streak >= 2 && (
                        <span className="chip bg-orange-500/15 text-orange-500">
                          🔥 {player.streak}
                        </span>
                      )}
                      <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                        {player.score}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Over ──────────────────────────────────────────────── */}
      {room.phase === 'over' && (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="text-4xl">
            {siege && siege.bossHp === 0 ? '🏆' : '🏁'}
          </span>
          <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {siege
              ? siege.bossHp === 0
                ? 'Boss defeated!'
                : 'Siege complete'
              : 'Race over'}
          </h2>
          {siege && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Remaining Boss HP: {siege.bossHp}/{siege.maxHp} · Seals broken:{' '}
              {siege.sealsBroken}
            </p>
          )}
          {(standings ?? []).length > 0 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You finished{' '}
                <span className="font-bold text-brand-600 dark:text-brand-300">
                  #
                  {(standings ?? []).findIndex((p) => p.userId === you.userId) + 1}
                </span>{' '}
                of {standings?.length} with {you.score} points
              </p>
              <div className="flex w-full max-w-sm flex-col gap-1.5">
                {(standings ?? []).map((player, position) => (
                  <div
                    key={player.userId}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left',
                      position === 0 && 'bg-gold-500/10',
                      player.userId === you.userId && 'bg-brand-500/10',
                    )}
                  >
                    <span className="w-6 text-center font-display text-sm font-bold text-slate-400">
                      {position === 0 ? '🥇' : position + 1}
                    </span>
                    <Avatar
                      name={player.name}
                      color={player.avatarColor}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {player.name}
                      {player.userId === you.userId && ' (you)'}
                    </span>
                    <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      {player.score}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Race again
            </Button>
            <Link to="/student/quizzes">
              <Button>Back to quest board</Button>
            </Link>
          </div>
        </Card>
      )}

      {!connected && (
        <p className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-300">
          <Radio size={14} /> Connection dropped — reconnecting…
        </p>
      )}
    </div>
  )
}

/**
 * The answer area for a live question. MCQ and true/false render
 * inline (a click is the whole answer); fill, order and figure
 * reuse the shared widgets from solo play verbatim.
 */
function RaceAnswerInputs({
  question,
  disabled,
  onSubmit,
}: {
  question: RaceQuestionDTO
  disabled: boolean
  onSubmit: (response: number | boolean | string | number[]) => void
}) {
  switch (question.type) {
    case 'mcq':
      return (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(question.options ?? []).map((option, optionIndex) => (
            <button
              key={optionIndex}
              type="button"
              disabled={disabled}
              onClick={() => onSubmit(optionIndex)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition disabled:opacity-50',
                'border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-500/5',
                'dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/60 dark:hover:bg-brand-500/10',
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                {LETTERS[optionIndex]}
              </span>
              <span className="text-slate-800 dark:text-slate-100">{option}</span>
            </button>
          ))}
        </div>
      )

    case 'truefalse':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              disabled={disabled}
              onClick={() => onSubmit(value)}
              className={cn(
                'rounded-xl border p-6 text-center font-display text-lg font-bold transition disabled:opacity-50',
                value
                  ? 'border-emerald-300 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300'
                  : 'border-rose-300 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-300',
              )}
            >
              {value ? '✓ True' : '✗ False'}
            </button>
          ))}
        </div>
      )

    case 'fill':
      return <FillAnswer disabled={disabled} onSubmit={onSubmit} />

    case 'order':
      return (
        <OrderAnswer question={question} disabled={disabled} onSubmit={onSubmit} />
      )

    case 'figure':
      return (
        <FigureAnswer question={question} disabled={disabled} onSubmit={onSubmit} />
      )
  }
}
