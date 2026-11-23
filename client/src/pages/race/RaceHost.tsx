import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Eye,
  Flag,
  Play,
  Radio,
  Shield,
  Swords,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Avatar, Button, Card, Chip, Spinner, useToast } from '@/components/ui'
import { usePrefersReducedMotion } from '@/lib/a11y'
import { cn } from '@/lib/utils'
import { useRaceRoom } from './use-race-room'
import { formatRaceAnswer, RACE_MODE_OPTIONS, racePingLabel } from './race-format'
import type { RaceMode } from '@shared/schemas'
import type { StudentQuestionDTO, TeacherQuestionDTO } from '@shared/types'

/**
 * Teacher's race console: the room code, mode selector, live roster
 * / squad / boss telemetry, and phase controls. The teacher never
 * answers — they pace the room.
 *
 * Everything on screen is pushed by the socket (via useRaceRoom);
 * the REST calls here only *cause* phase or mode changes.
 */
export function RaceHost() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const reducedMotion = usePrefersReducedMotion()
  const { state, error, connected } = useRaceRoom(code)
  const [busy, setBusy] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<
    Record<string, TeacherQuestionDTO | StudentQuestionDTO>
  >({})

  const quizId = state?.room.quizId ?? null
  const mode = state?.room.mode ?? 'classic'

  useEffect(() => {
    if (!quizId || mode !== 'classroom-siege') return
    let cancelled = false
    api.quizzes
      .get(quizId)
      .then((res) => {
        if (cancelled) return
        const byId: Record<string, TeacherQuestionDTO | StudentQuestionDTO> = {}
        for (const item of res.questions) {
          byId[item.id] = item
        }
        setQuizQuestions(byId)
      })
      .catch(() => {
        // Non-blocking: missed-question debrief falls back gracefully.
      })
    return () => {
      cancelled = true
    }
  }, [quizId, mode])

  const control = useCallback(
    async (action: 'start' | 'reveal' | 'next' | 'end') => {
      setBusy(action)
      try {
        if (action === 'start') await api.races.start(code)
        if (action === 'reveal') await api.races.reveal(code)
        if (action === 'next') await api.races.next(code)
        if (action === 'end') await api.races.end(code)
      } catch (err) {
        // The socket usually catches the phase change first; a stale
        // button (double click, reconnected tab) explains the rest.
        toast(err instanceof Error ? err.message : 'Action failed', 'error')
      } finally {
        setBusy(null)
      }
    },
    [code, toast],
  )

  const switchMode = useCallback(
    async (nextMode: RaceMode, squadSize?: number) => {
      setBusy(`mode:${nextMode}`)
      try {
        await api.races.setMode(code, {
          mode: nextMode,
          ...(squadSize !== undefined ? { squadSize } : {}),
        })
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Could not change mode', 'error')
      } finally {
        setBusy(null)
      }
    },
    [code, toast],
  )

  if (error && !state) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-3xl">📡</p>
        <h1 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white">
          Race unavailable
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
        <Button className="mt-5" onClick={() => navigate('/teacher/quizzes')}>
          Back to my quizzes
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

  const { room, question, reveal, standings } = state
  // Roster is the broadcast order (join order); the live table sorts.
  const roster = [...room.players].sort((a, b) => b.score - a.score)
  const answered = room.players.filter((p) => p.answered).length
  const currentMode = room.mode ?? 'classic'
  const squadSize = room.squadSize ?? 3
  const sortedSquads = [...(room.squads ?? [])].sort(
    (a, b) => b.score - a.score || b.progress - a.progress,
  )
  const siege = room.siege ?? null

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/teacher/quizzes" className="btn-ghost px-3 py-2" title="Back">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-500">
              Live race console ·{' '}
              {RACE_MODE_OPTIONS.find((item) => item.mode === currentMode)?.title ?? 'Classic'}
            </p>
            <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {room.quizTitle}
            </h1>
          </div>
        </div>
        <Chip color={connected ? 'emerald' : 'rose'}>
          {connected ? 'connected' : 'reconnecting…'}
        </Chip>
      </div>

      {/* The code — the one thing every student needs */}
      <Card className="flex flex-col items-center gap-3 p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Join at <span className="font-mono lowercase">/race</span> with code
        </p>
        <motion.p
          key={room.code}
          initial={reducedMotion ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : undefined}
          className="select-all font-display text-6xl font-black tracking-[0.18em] text-brand-600 dark:text-brand-300"
        >
          {room.code}
        </motion.p>
        <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Users size={15} />
          {room.players.length} player{room.players.length === 1 ? '' : 's'} in
          the room · {room.totalQuestions} question
          {room.totalQuestions === 1 ? '' : 's'}
        </p>
      </Card>

      {/* Classroom Siege projector banner */}
      {currentMode === 'classroom-siege' && siege && room.phase !== 'lobby' && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Swords size={18} className="text-rose-500" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {siege.bossHp === 0
                  ? 'Boss Defeated — Knowledge Fortress Secured!'
                  : `Wave ${siege.wave} · Boss Encounter`}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Shield size={14} className="text-sky-500" />
                Aegis Shield:
                <span className="inline-flex gap-1">
                  {Array.from({ length: 5 }, (_, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        idx < siege.aegisShield
                          ? 'bg-sky-500'
                          : 'bg-slate-200 dark:bg-white/10',
                      )}
                    />
                  ))}
                </span>
              </span>
              {siege.sealsBroken > 0 && (
                <Chip color="amber">Seals broken: {siege.sealsBroken}</Chip>
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Boss Integrity</span>
              <span>
                {siege.bossHp} / {siege.maxHp} HP
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
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
          </div>
          {state.recalibrateHint && room.phase === 'question' && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-500/10 p-3 text-xs font-semibold text-amber-800 dark:border-amber-500/40 dark:text-amber-200">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>Recalibrating 3s: {state.recalibrateHint}</span>
            </div>
          )}
        </Card>
      )}

      {/* Phase controls */}
      <Card className="flex flex-col items-center gap-4 p-6">
        {room.phase === 'lobby' && (
          <>
            <div className="w-full">
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                Choose session mode
              </p>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {RACE_MODE_OPTIONS.map((item) => {
                  const selected = currentMode === item.mode
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      aria-pressed={selected}
                      disabled={busy !== null}
                      onClick={() =>
                        void switchMode(
                          item.mode,
                          item.mode === 'squad-sync' ? squadSize : undefined,
                        )
                      }
                      className={cn(
                        'flex flex-col gap-1 rounded-xl border p-3.5 text-left transition',
                        selected
                          ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-brand-400/60 dark:border-white/10 dark:hover:border-brand-400/50',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        <span className="chip bg-slate-500/15 text-[11px] text-slate-600 dark:text-slate-300">
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {item.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {currentMode === 'squad-sync' && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Target squad size:
                </span>
                {[2, 3, 4, 5].map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={squadSize === size}
                    disabled={busy !== null}
                    onClick={() => void switchMode('squad-sync', size)}
                    className={cn(
                      'rounded-lg border px-3 py-1 text-xs font-bold transition',
                      squadSize === size
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-brand-400 dark:border-white/10 dark:text-slate-300',
                    )}
                  >
                    {size} / squad
                  </button>
                ))}
              </div>
            )}

            {currentMode === 'squad-sync' && sortedSquads.length > 0 && (
              <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sortedSquads.map((sq) => {
                  const members = room.players.filter((p) =>
                    sq.memberIds.includes(p.userId),
                  )
                  return (
                    <div
                      key={sq.id}
                      className="rounded-xl border border-slate-200 p-3 dark:border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: sq.color }}
                        />
                        <span className="font-display text-xs font-bold text-slate-800 dark:text-slate-100">
                          {sq.name}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {members.length > 0
                          ? members.map((m) => m.name).join(', ')
                          : 'Waiting for players'}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Share the code — players appear below as they join. Start when
              everyone is in.
            </p>
            <Button
              loading={busy === 'start'}
              disabled={room.totalQuestions === 0}
              onClick={() => void control('start')}
            >
              <Play size={16} /> Start race
            </Button>
            {room.totalQuestions === 0 && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-300">
                This quiz has no questions yet — add some in the builder first.
              </p>
            )}
          </>
        )}

        {room.phase === 'question' && (
          <>
            <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Question {room.questionIndex + 1} of {room.totalQuestions}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {answered} of {room.players.length} answered
              {room.players.length > 0 && answered >= room.players.length
                ? ' — revealing…'
                : ' (auto-reveals when everyone is in)'}
            </p>
            <Button loading={busy === 'reveal'} onClick={() => void control('reveal')}>
              <Eye size={16} /> Reveal answers
            </Button>
          </>
        )}

        {room.phase === 'reveal' && (
          <>
            <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {reveal?.correctCount ?? 0} of {room.players.length} got it right
            </p>
            {reveal && (
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Answer:{' '}
                <span className="text-emerald-600 dark:text-emerald-300">
                  {formatRaceAnswer(reveal.correctAnswer, question?.options)}
                </span>
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Button loading={busy === 'next'} onClick={() => void control('next')}>
                {room.questionIndex + 1 >= room.totalQuestions ? (
                  <>
                    <Trophy size={16} /> Final results
                  </>
                ) : (
                  <>
                    Next question <Play size={16} />
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                loading={busy === 'end'}
                onClick={() => void control('end')}
              >
                <Flag size={16} /> End race
              </Button>
            </div>
          </>
        )}

        {room.phase === 'over' && (
          <>
            <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Race over — final standings
            </p>
            <Button onClick={() => navigate('/teacher/quizzes')}>
              Back to my quizzes
            </Button>
          </>
        )}
      </Card>

      {/* Reveal explanation */}
      {room.phase === 'reveal' && reveal?.explanation && (
        <Card className="p-5">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {reveal.explanation}
          </p>
        </Card>
      )}

      {/* Squad Relay Track */}
      {currentMode === 'squad-sync' && sortedSquads.length > 0 && room.phase !== 'lobby' && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-400">
              Squad Relay Track
            </h2>
            <span className="text-xs text-slate-400">
              +1 checkpoint on hit · -2 on miss
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {sortedSquads.map((sq) => {
              const members = room.players.filter((p) => sq.memberIds.includes(p.userId))
              const pct = Math.min(
                100,
                Math.round((sq.progress / Math.max(1, room.totalQuestions)) * 100),
              )
              return (
                <div
                  key={sq.id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-white/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: sq.color }}
                      />
                      <span className="font-display text-sm font-bold text-slate-800 dark:text-white">
                        {sq.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                      {sq.progress}/{room.totalQuestions} checkpoints · {sq.score} pts
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        !reducedMotion && 'transition-[width] duration-300',
                      )}
                      style={{ width: `${pct}%`, backgroundColor: sq.color }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {members.map((member) => {
                      const ping = racePingLabel(member.ping)
                      return (
                        <span
                          key={member.userId}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200"
                        >
                          {member.name}
                          {member.answered && (
                            <Check size={12} className="text-emerald-500" />
                          )}
                          {ping && (
                            <span className="rounded bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-300">
                              {ping}
                            </span>
                          )}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Classroom Siege Top-3 Most Missed Debrief */}
      {currentMode === 'classroom-siege' &&
        siege &&
        siege.topMissedQuestionIds.length > 0 &&
        (room.phase === 'reveal' || room.phase === 'over') && (
          <Card className="p-5">
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-slate-400">
              Top missed questions to debrief
            </h2>
            <div className="flex flex-col gap-2.5">
              {siege.topMissedQuestionIds.slice(0, 3).map((qid, idx) => {
                const q = quizQuestions[qid]
                const answerText =
                  q && 'correct' in q
                    ? formatRaceAnswer(q.correct, q.options)
                    : null
                const explanation = q && 'explanation' in q ? q.explanation : ''
                return (
                  <div
                    key={qid}
                    className="rounded-xl border border-rose-200/70 bg-rose-500/5 p-3 dark:border-rose-500/20"
                  >
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-300">
                      #{idx + 1} Most Missed
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {q?.prompt ?? `Question ${qid}`}
                    </p>
                    {answerText && (
                      <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                        Correct answer: {answerText}
                      </p>
                    )}
                    {explanation && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {explanation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

      {/* Live table / standings */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-400">
            {room.phase === 'over' ? 'Final standings' : 'Live scores'}
          </h2>
          {room.phase === 'question' && (
            <span className="text-xs font-semibold text-slate-400">
              {answered}/{room.players.length} answered
            </span>
          )}
        </div>

        {(room.phase === 'over' ? (standings ?? []) : roster).length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Waiting for players to join…
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {(room.phase === 'over' ? (standings ?? []) : roster).map(
              (player, position) => (
                <motion.div
                  layout={!reducedMotion}
                  key={player.userId}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5',
                    player.userId === state.you.userId && 'bg-brand-500/10',
                  )}
                >
                  <span className="w-6 text-center font-display text-sm font-bold text-slate-400">
                    {position + 1}
                  </span>
                  <Avatar name={player.name} color={player.avatarColor} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {player.name}
                    {player.squadName && (
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        · {player.squadName}
                      </span>
                    )}
                  </span>
                  {room.phase === 'question' && player.answered && (
                    <Check size={15} className="text-emerald-500" />
                  )}
                  {room.phase === 'reveal' && player.lastCorrect !== null &&
                    (player.lastCorrect ? (
                      <Check size={15} className="text-emerald-500" />
                    ) : (
                      <X size={15} className="text-rose-500" />
                    ))}
                  {player.streak >= 2 && room.phase !== 'over' && (
                    <span className="chip bg-orange-500/15 text-orange-500">
                      🔥 {player.streak}
                    </span>
                  )}
                  {room.phase !== 'over' && player.lastPoints > 0 && (
                    <span className="text-xs font-bold text-emerald-500">
                      +{player.lastPoints}
                    </span>
                  )}
                  <span className="w-14 text-right font-display text-sm font-bold text-slate-900 dark:text-white">
                    {player.score}
                  </span>
                </motion.div>
              ),
            )}
          </div>
        )}
      </Card>

      {!connected && (
        <p className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-300">
          <Radio size={14} /> Connection dropped — retrying…
        </p>
      )}
    </div>
  )
}
