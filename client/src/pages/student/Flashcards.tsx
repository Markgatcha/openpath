import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarCheck,
  Check,
  ChevronLeft,
  Layers,
  PartyPopper,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card, ProgressBar, useToast } from '@/components/ui'
import { cn, subjectEmoji } from '@/lib/utils'
import {
  GRADES,
  GRADE_LABELS,
  intervalPreview,
  type ReviewGrade,
  type SrsState,
} from '@shared/srs'
import type { SrsCardDTO } from '@shared/types'

const GRADE_STYLES: Record<ReviewGrade, string> = {
  again: 'border-rose-300 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-300',
  hard: 'border-amber-300 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-300',
  good: 'border-emerald-300 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300',
  easy: 'border-brand-300 bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 dark:border-brand-500/40 dark:text-brand-300',
}

export function Flashcards() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const [mode, setMode] = useState<'review' | 'browse'>('review')
  const [queue, setQueue] = useState<SrsCardDTO[] | null>(null)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [grading, setGrading] = useState(false)
  const [sessionDone, setSessionDone] = useState(0)

  const { data: stats } = useQuery({
    queryKey: ['srs-stats'],
    queryFn: api.srs.stats,
  })
  const { data: quizzes } = useQuery({
    queryKey: ['quizzes'],
    queryFn: api.quizzes.list,
  })

  const startReview = async () => {
    const result = await api.srs.due()
    setQueue(result.cards)
    setIndex(0)
    setRevealed(false)
    if (result.cards.length === 0) {
      toast('Nothing due right now — great work!', 'success')
    }
  }

  const card = queue?.[index] ?? null

  const grade = async (value: ReviewGrade) => {
    if (!card) return
    setGrading(true)
    try {
      await api.srs.review({ questionId: card.questionId, grade: value })
      setSessionDone((count) => count + 1)
      setRevealed(false)
      void queryClient.invalidateQueries({ queryKey: ['srs-stats'] })
      if (index + 1 < (queue?.length ?? 0)) {
        setIndex((current) => current + 1)
      } else {
        setQueue([])
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save review', 'error')
    } finally {
      setGrading(false)
    }
  }

  const previewState: SrsState = card?.state
    ? {
        ease: card.state.ease,
        intervalDays: card.state.intervalDays,
        reps: card.state.reps,
        lapses: card.state.lapses,
        dueDate: card.state.dueDate,
      }
    : { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, dueDate: '' }

  // ── Browse mode (free study, no scheduling) ──────────────────
  if (mode === 'browse') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Free study decks
          </h1>
          <Button variant="ghost" onClick={() => setMode('review')}>
            <ChevronLeft size={15} /> Review queue
          </Button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Browsing doesn't schedule anything. Grade cards in the review queue
          to build your spaced-repetition plan.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(quizzes?.quizzes ?? []).map((quiz) => (
            <Link
              key={quiz.id}
              to={`/student/play/${quiz.id}`}
              className="card card-hover flex items-center gap-4 p-5"
            >
              <span className="text-3xl">{subjectEmoji(quiz.subject)}</span>
              <div className="min-w-0">
                <h3 className="truncate font-display text-base font-bold text-slate-900 dark:text-white">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {quiz.questionCount} questions · {quiz.subject}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      {/* Header + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Flashcard training
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Spaced repetition: hard cards come back sooner, easy cards later.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setMode('browse')}>
          <Layers size={15} /> Decks
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Due today',
              value: stats.dueCount,
              icon: <CalendarCheck size={15} className="text-brand-500" />,
            },
            {
              label: 'In rotation',
              value: stats.totalCards,
              icon: <Layers size={15} className="text-cyan-500" />,
            },
            {
              label: 'Reviewed today',
              value: stats.reviewedToday,
              icon: <Check size={15} className="text-emerald-500" />,
            },
          ].map((stat) => (
            <Card key={stat.label} className="flex flex-col items-center gap-1 p-4">
              {stat.icon}
              <span className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
                {stat.value}
              </span>
              <span className="text-[11px] text-slate-400">{stat.label}</span>
            </Card>
          ))}
        </div>
      )}

      {/* Not started yet */}
      {queue === null && (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <span className="text-4xl">🧠</span>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {stats && stats.dueCount > 0
              ? `${stats.dueCount} card${stats.dueCount === 1 ? '' : 's'} waiting for you`
              : 'No cards due — but new ones are waiting'}
          </h2>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Cards come from every quiz you have access to. Grade honestly —
            the scheduler only works if you do.
          </p>
          <Button onClick={() => void startReview()}>
            <Sparkles size={16} /> Start review session
          </Button>
        </Card>
      )}

      {/* Session complete */}
      {queue !== null && queue.length === 0 && (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <motion.span
            className="text-4xl"
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 12 }}
          >
            <PartyPopper className="text-gold-500" size={40} />
          </motion.span>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Session complete — {sessionDone} card{sessionDone === 1 ? '' : 's'} reviewed
          </h2>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Your next batch unlocks on its own schedule. Come back tomorrow to
            keep the streak.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => void startReview()}>
              <RotateCcw size={15} /> Check for more
            </Button>
            <Button variant="ghost" onClick={() => setQueue(null)}>
              Done for now
            </Button>
          </div>
        </Card>
      )}

      {/* The card */}
      {card && (
        <>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>
              Card {index + 1} of {queue?.length ?? 0}
              {card.isNew && (
                <span className="ml-2 chip bg-brand-500/15 text-brand-600 dark:text-brand-300">
                  new
                </span>
              )}
            </span>
            <span className="truncate pl-3">{card.quizTitle}</span>
          </div>
          <ProgressBar value={index / Math.max(queue?.length ?? 1, 1)} className="h-2" />

          <AnimatePresence mode="wait">
            <motion.div
              key={card.questionId + (revealed ? '-back' : '-front')}
              initial={{ rotateY: revealed ? -80 : 80, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: revealed ? 80 : -80, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Card className="flex min-h-56 flex-col gap-4 p-7">
                <span className="chip self-start bg-slate-500/15 text-slate-500 dark:text-slate-300">
                  {card.type === 'truefalse'
                    ? 'true / false'
                    : card.type === 'fill'
                      ? 'fill in the blank'
                      : card.type === 'figure'
                        ? 'figure it out'
                        : card.type === 'order'
                          ? 'put in order'
                          : 'multiple choice'}
                </span>
                <p className="font-display text-lg font-bold leading-relaxed text-slate-900 dark:text-white">
                  {card.prompt}
                </p>

                {!revealed ? (
                  <Button className="mt-auto self-start" onClick={() => setRevealed(true)}>
                    Show answer
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-auto flex flex-col gap-3"
                  >
                    <div className="rounded-xl border border-emerald-300/60 bg-emerald-500/5 p-4 dark:border-emerald-500/30">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                        Answer
                      </p>
                      <p className="mt-1 font-display text-base font-bold text-slate-900 dark:text-white">
                        {card.answer}
                      </p>
                    </div>
                    {card.explanation && (
                      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        💡 {card.explanation}
                      </p>
                    )}
                  </motion.div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>

          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-2"
            >
              {GRADES.map((value) => (
                <button
                  key={value}
                  disabled={grading}
                  onClick={() => void grade(value)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-xl border p-3 text-sm font-bold transition disabled:opacity-50',
                    GRADE_STYLES[value],
                  )}
                >
                  {GRADE_LABELS[value]}
                  <span className="text-[10px] font-medium opacity-70">
                    {intervalPreview(previewState, value)}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
