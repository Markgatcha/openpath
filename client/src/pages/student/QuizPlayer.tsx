import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Flag,
  Lightbulb,
  Trophy,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card, Spinner, useToast } from '@/components/ui'
import { ComboMeter, TimerRing } from '@/components/gamified'
import {
  FillAnswer,
  FigureAnswer,
  OrderAnswer,
} from '@/components/AnswerInputs'
import {
  CONFIDENCE_LABELS,
  CONFIDENCE_LEVELS,
  type Confidence,
} from '@shared/confidence'
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
  correctAnswer?: unknown
  /** The self-rating this answer was submitted with (echoed in feedback). */
  confidence: Confidence | null
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
  /** Confidence self-rating for the current question (null = not tagged). */
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const [xpFloat, setXpFloat] = useState<{ id: number; points: number } | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const questionStartRef = useRef(0)
  const floatSeq = useRef(0)

  const question = questions[index]

  // Reset the confidence picker whenever the question changes, using
  // React's documented "adjust state during render" pattern: comparing
  // against the previous question and setting state in the same pass
  // avoids an extra commit (and keeps effects free of state writes).
  const [shownQuestion, setShownQuestion] = useState(question)
  if (question !== shownQuestion) {
    setShownQuestion(question)
    setConfidence(null)
  }

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
          // The self-rating chosen before submitting; null when skipped.
          confidence,
        })
        setLastResult({
          correct: result.correct,
          explanation: result.explanation ?? '',
          points: question.points,
          combo: result.combo ?? 0,
          correctAnswer: result.correctAnswer,
          confidence,
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
    [attemptId, question, phase, toast, confidence],
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
                      : question.type === 'figure'
                        ? 'Figure it out'
                        : 'Put in order'}
              </span>
              <span className="chip bg-slate-500/15 text-slate-500 dark:text-slate-300">
                {question.points} pts
              </span>
            </div>

            <h2 className="font-display text-xl font-bold leading-snug text-slate-900 sm:text-2xl dark:text-white">
              {question.prompt}
            </h2>

            {/* Confidence self-rating — only while answering. The rating
                must happen BEFORE the reveal, or the metacognition
                signal is worthless: once the student sees "Correct!"
                they will always claim they knew it. */}
            {phase === 'answering' && (
              <ConfidencePicker value={confidence} onChange={setConfidence} />
            )}

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

              {question.type === 'figure' && question.figure && (
                <FigureAnswer
                  key={question.id}
                  question={question}
                  disabled={phase !== 'answering'}
                  onSubmit={(value) => void submit(value)}
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
                    {/* Echo the self-rating so students connect how they
                        felt with how it turned out — the calibration
                        lesson lands right here, at the reveal. */}
                    {lastResult.confidence && (
                      <span
                        className={cn(
                          'chip',
                          lastResult.confidence === 'certain' && !lastResult.correct
                            ? 'bg-rose-500/15 text-rose-500'
                            : lastResult.confidence === 'guessed' && lastResult.correct
                              ? 'bg-amber-500/15 text-amber-500'
                              : 'bg-slate-500/10 text-slate-500 dark:text-slate-300',
                        )}
                      >
                        {lastResult.confidence === 'certain' && !lastResult.correct
                          ? `⚠️ ${CONFIDENCE_LABELS[lastResult.confidence]} — overconfident`
                          : lastResult.confidence === 'guessed' && lastResult.correct
                            ? `🎲 ${CONFIDENCE_LABELS[lastResult.confidence]} — lucky guess`
                            : `You felt: ${CONFIDENCE_LABELS[lastResult.confidence]}`}
                      </span>
                    )}
                  </div>
                  {!lastResult.correct &&
                    lastResult.correctAnswer !== undefined && (
                      <p className="mt-1.5 text-sm font-semibold text-rose-600 dark:text-rose-300">
                        Answer: {formatAnswer(lastResult.correctAnswer)}
                      </p>
                    )}
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

/** Render a stored correct answer for the feedback screen (never raw objects). */
function formatAnswer(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ')
  return ''
}

// ── Confidence self-rating ──────────────────────────────────────
// "How sure are you?" — asked before the answer is graded, so the
// tag reflects honest metacognition rather than hindsight. Real
// radio inputs (visually hidden inside the chip labels) give free
// arrow-key navigation and screen-reader semantics; nothing is
// preselected, so skipping the prompt stays one tap away.
function ConfidencePicker({
  value,
  onChange,
}: {
  value: Confidence | null
  onChange: (value: Confidence) => void
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-xs font-bold uppercase tracking-wide text-slate-400">
        How sure are you?
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {CONFIDENCE_LEVELS.map((level) => {
          const active = value === level
          return (
            <label
              key={level}
              className={cn(
                'cursor-pointer select-none rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
                'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500',
                active
                  ? 'border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-300'
                  : 'border-slate-200 text-slate-500 hover:border-brand-400 hover:text-brand-500 dark:border-white/10 dark:text-slate-400 dark:hover:text-brand-300',
              )}
            >
              <input
                type="radio"
                name="confidence"
                value={level}
                checked={active}
                onChange={() => onChange(level)}
                className="sr-only"
              />
              {CONFIDENCE_LABELS[level]}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
