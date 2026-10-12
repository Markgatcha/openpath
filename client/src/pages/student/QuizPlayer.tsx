import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, Reorder } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Flag,
  GripVertical,
  Lightbulb,
  Trophy,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card, Spinner, useToast } from '@/components/ui'
import { ComboMeter, TimerRing } from '@/components/gamified'
import { cn } from '@/lib/utils'
import type { StudentQuestionDTO } from '@shared/types'
import type { AttemptFinishDTO } from '@shared/types'

type Phase = 'answering' | 'feedback' | 'finishing'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

interface LastResult {
  correct: boolean
  explanation: string
  points: number
  combo: number
}

export function QuizPlayer() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<StudentQuestionDTO[]>([])
  const [quizTitle, setQuizTitle] = useState('')
  const [timeLimitSec, setTimeLimitSec] = useState<number | null>(null)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('answering')
  const [lastResult, setLastResult] = useState<LastResult | null>(null)
  const [combo, setCombo] = useState(0)
  const [xpFloat, setXpFloat] = useState<{ id: number; points: number } | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const questionStartRef = useRef(0)
  const floatSeq = useRef(0)

  const question = questions[index]

  // Load (or resume) the attempt once when the quiz opens. All state
  // updates happen after the await, inside the async body.
  useEffect(() => {
    void (async () => {
      try {
        const result = await api.attempts.start({ quizId })
        setAttemptId(result.attemptId)
        setQuestions(result.questions)
        setQuizTitle(result.quiz.title)
        setTimeLimitSec(result.quiz.timeLimitSec)
        if (result.quiz.timeLimitSec) {
          setSecondsLeft(result.quiz.timeLimitSec)
        }
        setIndex(0)
        setPhase('answering')
        setCombo(0)
        setLastResult(null)
        questionStartRef.current = Date.now()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not start the quiz')
      } finally {
        setLoading(false)
      }
    })()
  }, [quizId])

  // Remember when the current question appeared (ref writes are safe in effects).
  useEffect(() => {
    questionStartRef.current = Date.now()
  }, [question])

  const finish = useCallback(async () => {
    if (!attemptId) return
    setPhase('finishing')
    try {
      const result = await api.attempts.finish(attemptId)
      void navigate(`/student/results/${result.attempt.id}`, {
        state: { finish: result as AttemptFinishDTO },
      })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not finish run', 'error')
      setPhase('answering')
    }
  }, [attemptId, navigate, toast])

  // Global countdown — the tick callback (not the effect body) decides
  // whether to keep counting or force-finish the run.
  useEffect(() => {
    if (secondsLeft === null) return
    const timer = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        void finish()
      } else {
        setSecondsLeft(secondsLeft - 1)
      }
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft, finish])

  const submit = useCallback(
    async (response: number | boolean | string | number[]) => {
      if (!attemptId || !question || phase !== 'answering') return
      const msTaken = questionStartRef.current
      ? Date.now() - questionStartRef.current
      : 0
      try {
        const result = await api.attempts.answer(attemptId, {
          questionId: question.id,
          response,
          msTaken,
        })
        setLastResult({
          correct: result.correct,
          explanation: result.explanation ?? '',
          points: question.points,
          combo: result.combo ?? 0,
        })
        setCombo(result.combo ?? 0)
        setPhase('feedback')
        if (result.correct) {
          floatSeq.current += 1
          setXpFloat({ id: floatSeq.current, points: Math.round(question.points * 1.5) })
        }
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Answer rejected', 'error')
      }
    },
    [attemptId, question, phase, toast],
  )

  const next = useCallback(() => {
    if (index + 1 < questions.length) {
      setIndex((value) => value + 1)
      setPhase('answering')
      setLastResult(null)
      setXpFloat(null)
    } else {
      void finish()
    }
  }, [index, questions.length, finish])

  // Keyboard shortcuts: number keys pick MCQ options, T/F answers
  // true-or-false. Fill and order inputs handle their own keys natively.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase !== 'answering' || !question) return
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (question.type === 'mcq' && question.options) {
        const slot = Number(event.key)
        if (slot >= 1 && slot <= question.options.length) {
          void submit(slot - 1)
        }
      }
      if (question.type === 'truefalse') {
        if (event.key.toLowerCase() === 't') void submit(true)
        if (event.key.toLowerCase() === 'f') void submit(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, question, submit])

  const progress = useMemo(
    () => (questions.length ? (index + (phase === 'feedback' ? 1 : 0)) / questions.length : 0),
    [index, phase, questions.length],
  )

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-3xl">🚧</p>
        <h1 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white">
          Can’t start this run
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
        <Button className="mt-5" onClick={() => navigate('/student/quizzes')}>
          Back to quest board
        </Button>
      </Card>
    )
  }

  if (!question) return null

  const isLast = index + 1 >= questions.length

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col gap-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-500">
            Quest in progress
          </p>
          <h1 className="truncate font-display text-lg font-bold text-slate-900 dark:text-white">
            {quizTitle}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ComboMeter combo={combo} />
          {secondsLeft !== null && (
            <TimerRing secondsLeft={secondsLeft} totalSeconds={timeLimitSec ?? 0} />
          )}
          <span className="rounded-full bg-slate-500/10 px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {index + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-400"
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id + (phase === 'feedback' ? '-fb' : '')}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.22 }}
        >
          <Card className="relative overflow-hidden p-6 sm:p-8">
            {/* XP float */}
            <AnimatePresence>
              {xpFloat && phase === 'feedback' && (
                <motion.span
                  key={xpFloat.id}
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: 1, y: -70, scale: 1.1 }}
                  exit={{ opacity: 0, y: -100 }}
                  transition={{ duration: 0.9 }}
                  className="pointer-events-none absolute right-6 top-6 font-display text-2xl font-extrabold text-emerald-500"
                >
                  +{xpFloat.points} XP
                </motion.span>
              )}
            </AnimatePresence>

            <div className="mb-5 flex items-center gap-2">
              <span className="chip bg-brand-500/15 text-brand-600 dark:text-brand-300">
                {question.type === 'mcq'
                  ? 'Multiple choice'
                  : question.type === 'truefalse'
                    ? 'True or false'
                    : question.type === 'fill'
                      ? 'Fill in the blank'
                      : 'Put in order'}
              </span>
              <span className="chip bg-slate-500/15 text-slate-500 dark:text-slate-300">
                {question.points} pts
              </span>
            </div>

            <h2 className="font-display text-xl font-bold leading-snug text-slate-900 sm:text-2xl dark:text-white">
              {question.prompt}
            </h2>

            {/* Answer area */}
            <div className="mt-6">
              {question.type === 'mcq' && question.options && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <button
                      key={optionIndex}
                      disabled={phase !== 'answering'}
                      onClick={() => void submit(optionIndex)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition disabled:cursor-default',
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
              )}

              {question.type === 'truefalse' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[true, false].map((value) => (
                    <button
                      key={String(value)}
                      disabled={phase !== 'answering'}
                      onClick={() => void submit(value)}
                      className={cn(
                        'rounded-xl border p-6 text-center font-display text-lg font-bold transition disabled:cursor-default',
                        value
                          ? 'border-emerald-300 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300'
                          : 'border-rose-300 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-300',
                      )}
                    >
                      {value ? '✓ True' : '✗ False'}
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'fill' && (
                <FillAnswer
                  key={question.id}
                  disabled={phase !== 'answering'}
                  onSubmit={(value) => void submit(value)}
                />
              )}

              {question.type === 'order' && question.options && (
                <OrderAnswer
                  key={question.id}
                  question={question}
                  disabled={phase !== 'answering'}
                  onSubmit={(indices) => void submit(indices)}
                />
              )}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {phase === 'feedback' && lastResult && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'mt-6 rounded-xl border p-4',
                    lastResult.correct
                      ? 'border-emerald-300 bg-emerald-500/10 dark:border-emerald-500/40'
                      : 'border-rose-300 bg-rose-500/10 dark:border-rose-500/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {lastResult.correct ? (
                      <Check size={18} className="text-emerald-500" />
                    ) : (
                      <X size={18} className="text-rose-500" />
                    )}
                    <span
                      className={cn(
                        'font-display text-sm font-bold',
                        lastResult.correct
                          ? 'text-emerald-600 dark:text-emerald-300'
                          : 'text-rose-600 dark:text-rose-300',
                      )}
                    >
                      {lastResult.correct
                        ? `Correct! +${lastResult.points} pts`
                        : 'Not quite'}
                    </span>
                    {lastResult.correct && combo >= 2 && (
                      <span className="chip bg-orange-500/15 text-orange-500">
                        🔥 {combo} in a row
                      </span>
                    )}
                  </div>
                  {lastResult.explanation && (
                    <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      <Lightbulb size={15} className="mt-0.5 shrink-0 text-gold-500" />
                      {lastResult.explanation}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => {
            if (
              window.confirm(
                'Abandon this run? Your progress so far will not be scored.',
              )
            ) {
              void navigate('/student/quizzes')
            }
          }}
        >
          Abandon
        </Button>

        {phase === 'feedback' ? (
          <Button onClick={next}>
            {isLast ? (
              <>
                <Trophy size={16} /> Finish run
              </>
            ) : (
              <>
                Next question <ArrowRight size={16} />
              </>
            )}
          </Button>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
            <Flag size={14} />
            {phase === 'finishing' ? 'Scoring your run…' : 'Answer to continue'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Fill-in-the-blank input ────────────────────────────────────
// Owns its input state and is keyed by question id, so every question
// starts with a fresh, empty field (no effect-based resets).
function FillAnswer({
  disabled,
  onSubmit,
}: {
  disabled: boolean
  onSubmit: (value: string) => void
}) {
  const [value, setValue] = useState('')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (value.trim()) onSubmit(value.trim())
      }}
      className="flex gap-2"
    >
      <input
        autoFocus
        className="input"
        placeholder="Type your answer…"
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Submit
      </Button>
    </form>
  )
}

// ── Drag-to-rank answer ────────────────────────────────────────
// Owns the current ordering and is keyed by question id.
function OrderAnswer({
  question,
  disabled,
  onSubmit,
}: {
  question: StudentQuestionDTO
  disabled: boolean
  onSubmit: (indices: number[]) => void
}) {
  const options = question.options ?? []
  const [order, setOrder] = useState(options)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-400">
        Drag to rank — first item at the top, last at the bottom.
      </p>
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={setOrder}
        className="flex flex-col gap-2"
      >
        {order.map((option) => (
          <Reorder.Item
            key={option}
            value={option}
            className={cn(
              'flex cursor-grab items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold text-slate-800 active:cursor-grabbing',
              'dark:border-white/10 dark:bg-white/5 dark:text-slate-100',
              disabled && 'pointer-events-none opacity-80',
            )}
          >
            <GripVertical size={16} className="text-slate-400" />
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-500/15 text-xs font-bold text-brand-600 dark:text-brand-300">
              {order.indexOf(option) + 1}
            </span>
            {option}
          </Reorder.Item>
        ))}
      </Reorder.Group>
      {!disabled && (
        <Button
          className="mt-2 self-start"
          onClick={() => onSubmit(order.map((option) => options.indexOf(option)))}
        >
          Lock in order
        </Button>
      )}
    </div>
  )
}
