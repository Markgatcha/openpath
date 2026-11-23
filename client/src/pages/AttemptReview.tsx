import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Clock, Eye, Lightbulb, X } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card, ProgressBar, Spinner } from '@/components/ui'
import { FigureCanvas } from '@/components/FigureCanvas'
import {
  CONFIDENCE_LABELS,
  summarizeConfidence,
  type Confidence,
  type ConfidenceAnswer,
  type ConfidenceSummary,
} from '@shared/confidence'
import { cn, formatDuration, formatDate } from '@/lib/utils'
import type {
  AnswerResultDTO,
  AttemptReviewQuestionDTO,
  AttemptSummaryDTO,
} from '@shared/types'

function encodeLabUrl(modelId: string, params?: Record<string, number>): string {
  if (!params || Object.keys(params).length === 0) return `/student/lab/${modelId}`
  return `/student/lab/${modelId}?params=${encodeURIComponent(JSON.stringify(params))}`
}

function labLinkForFigure(
  figure: Parameters<typeof FigureCanvas>[0]['geometry'],
): { to: string; label: string } | null {
  const d = figure.diagram
  if (!d) return null
  const num = (key: string): number | undefined => {
    const val = (d as unknown as Record<string, unknown>)[key]
    return typeof val === 'number' && Number.isFinite(val) ? val : undefined
  }
  switch (d.kind) {
    case 'supply-demand': {
      const tax = num('tax') ?? 0
      return {
        to: encodeLabUrl('elasticity-price-controls-2d', {
          dSlope: Math.max(0.4, Math.min(3.2, num('demandSlope') ?? 1.2)),
          sSlope: Math.max(0.4, Math.min(3.2, num('supplySlope') ?? 1.0)),
          policyMode: tax > 0 ? 3 : 0,
          policyLevel: tax > 0 ? Math.max(10, Math.min(90, Math.round(tax * 2))) : 36,
        }),
        label: 'Supply & Demand',
      }
    }
    case 'normal-curve':
      return {
        to: encodeLabUrl('clt-sampling-inference-2d', { popShape: 3, sampleN: 1 }),
        label: 'Sampling & Normal Curve',
      }
    case 'series-parallel-circuit': {
      const series = (d as unknown as Record<string, unknown>).arrangement !== 'parallel'
      return {
        to: encodeLabUrl('dc-rc-circuits-2d', {
          mode: series ? 0 : 1,
          voltage: Math.max(3, Math.min(24, Math.round(num('voltage') ?? 12))),
          r1: Math.max(50, Math.min(500, Math.round((num('r1') ?? 100) / 10) * 10)),
          r2: Math.max(50, Math.min(500, Math.round((num('r2') ?? 200) / 10) * 10)),
        }),
        label: 'DC Circuits Lab',
      }
    }
    case 'unit-circle':
      return {
        to: encodeLabUrl('unit-circle-wave-2d', {
          angleDeg: Math.max(0, Math.min(720, num('angleDeg') ?? num('angle') ?? 45)),
        }),
        label: 'Unit Circle & Wave',
      }
    case 'vector-2d':
      return {
        to: encodeLabUrl('linear-transform-eigen-2d', {
          vx: Math.max(-2.5, Math.min(2.5, num('x') ?? num('dx') ?? 1.0)),
          vy: Math.max(-2.5, Math.min(2.5, num('y') ?? num('dy') ?? 1.0)),
        }),
        label: 'Linear Plane Lab',
      }
    case 'parabola-vertex':
      return {
        to: '/student/lab/derivative-integral-ftc-2d',
        label: 'Calculus Curve Explorer',
      }
    case 'coordinate-line':
      return {
        to: '/student/lab/quantitative-ratio-balance-2d',
        label: 'Number Line & Ratio Lab',
      }
    default:
      return null
  }
}

/**
 * Attempt review mode.
 *
 * Two surfaces share one list component:
 *  - this page (`/attempts/:attemptId/review`), reachable from the
 *    student dashboard and the teacher analytics table, and
 *  - the results screen right after a run.
 *
 * Per question the student sees their answer next to the correct one,
 * the points earned, the teacher's explanation, and — for figure
 * questions — the exact figure they were shown, redrawn from the
 * attempt's variant so parameterized runs review honestly.
 */

// ── Answer formatting ───────────────────────────────────────────

/** Safe stringify for an unknown stored response (never "[object Object]"). */
function stringify(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((item) => stringify(item)).join(', ')
  return '—'
}

/** What the student submitted, rendered for humans. */
function formatResponse(
  question: AttemptReviewQuestionDTO,
  response: unknown,
): string {
  if (response === undefined || response === null) return '—'
  switch (question.type) {
    case 'mcq':
      return question.options?.[Number(response)] ?? `Option ${Number(response) + 1}`
    case 'truefalse':
      return response ? 'True' : 'False'
    case 'fill':
      return stringify(response)
    case 'order':
      return Array.isArray(response)
        ? response.map((index) => question.options?.[index] ?? index).join(' → ')
        : stringify(response)
    case 'figure':
      return typeof response === 'number' ? response.toFixed(2) : stringify(response)
  }
}

/** The correct answer, rendered for humans. */
function formatCorrect(
  question: AttemptReviewQuestionDTO,
  correct: unknown,
): string {
  switch (question.type) {
    case 'mcq':
      return question.options?.[Number(correct)] ?? stringify(correct)
    case 'truefalse':
      return correct ? 'True' : 'False'
    case 'fill':
      return stringify(correct)
    case 'order':
      return Array.isArray(correct)
        ? correct.map((index) => question.options?.[index] ?? index).join(' → ')
        : stringify(correct)
    case 'figure':
      return typeof correct === 'number' ? correct.toFixed(2) : stringify(correct)
  }
}

/** Degrees when an angle was asked, units for lengths and areas. */
function figureUnits(geometry: AnswerResultDTO['figure']): string {
  if (geometry?.angles.some((angle) => angle.label === '?')) return '°'
  return ''
}

/**
 * One answer's self-rating, flagged when the outcome is worth a
 * second look: a guess that paid off, or certainty that did not.
 */
function ConfidenceChip({
  confidence,
  correct,
}: {
  confidence: Confidence
  correct: boolean
}) {
  const lucky = confidence === 'guessed' && correct
  const overconfident = confidence === 'certain' && !correct
  return (
    <span
      className={cn(
        'chip',
        overconfident
          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
          : lucky
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
            : 'bg-slate-500/10 text-slate-500 dark:text-slate-300',
      )}
    >
      {overconfident
        ? `⚠️ ${CONFIDENCE_LABELS[confidence]} — overconfident`
        : lucky
          ? `🎲 ${CONFIDENCE_LABELS[confidence]} — lucky guess`
          : `Felt: ${CONFIDENCE_LABELS[confidence]}`}
    </span>
  )
}

// ── Calibration summary ──────────────────────────────────────────

/**
 * Renders a confidence summary (buckets + "knew it vs. guessed it"
 * headline). Pure presentation: student results and the attempt
 * review page compute the summary locally from that attempt's
 * answers; teacher analytics receives the server-side aggregate.
 */
export function ConfidenceSummaryView({
  summary,
}: {
  summary: ConfidenceSummary
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Headline: did trusting themselves pay off? */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-500/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            Knew it
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {Math.round(summary.knewIt.accuracy * 100)}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary.knewIt.correct}/{summary.knewIt.seen} right when
            fairly-sure or certain
          </p>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
            Guessed it
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {Math.round(summary.guessed.accuracy * 100)}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary.guessed.correct}/{summary.guessed.seen} right when
            guessing or unsure
          </p>
        </div>
      </div>

      {/* Per-level breakdown */}
      <ul className="flex flex-col gap-2.5">
        {summary.buckets.map((bucket) => (
          <li key={bucket.level} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {bucket.label}
            </span>
            <ProgressBar
              value={bucket.accuracy}
              barClassName={
                bucket.accuracy >= 0.8
                  ? 'bg-emerald-500'
                  : bucket.accuracy >= 0.5
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              }
              className="h-2 flex-1"
            />
            <span className="w-20 shrink-0 text-right font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
              {bucket.seen > 0
                ? `${Math.round(bucket.accuracy * 100)}% · ${bucket.correct}/${bucket.seen}`
                : '—'}
            </span>
          </li>
        ))}
      </ul>

      {(summary.lucky > 0 || summary.overconfident > 0) && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {summary.lucky > 0 && `🎲 ${summary.lucky} lucky guess${summary.lucky === 1 ? '' : 'es'}`}
          {summary.lucky > 0 && summary.overconfident > 0 && ' · '}
          {summary.overconfident > 0 &&
            `⚠️ ${summary.overconfident} overconfident miss${summary.overconfident === 1 ? '' : 'es'}`}
        </p>
      )}
    </div>
  )
}

/**
 * Calibration card for a single attempt's answers (student results
 * and the review page). Renders nothing when no answer was tagged.
 */
export function ConfidenceCard({
  answers,
}: {
  answers: readonly ConfidenceAnswer[]
}) {
  const summary = useMemo(() => summarizeConfidence(answers), [answers])
  if (summary.tagged === 0) return null
  return (
    <Card className="p-6">
      <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Confidence check
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        How your gut feeling matched the truth, across {summary.tagged} tagged
        answer{summary.tagged === 1 ? '' : 's'}.
      </p>
      <ConfidenceSummaryView summary={summary} />
    </Card>
  )
}

// ── Review list ─────────────────────────────────────────────────

export function AttemptReviewList({
  questions,
  breakdown,
  answers,
}: {
  questions: AttemptReviewQuestionDTO[]
  breakdown: AnswerResultDTO[]
  answers: {
    questionId: string
    response: unknown
    msTaken: number
    confidence: Confidence | null
  }[]
}) {
  const responseByQuestion = new Map(
    answers.map((answer) => [answer.questionId, answer]),
  )
  return (
    <ul className="flex flex-col gap-3">
      {breakdown.map((item, index) => {
        const question = questions.find((q) => q.id === item.questionId)
        const answer = responseByQuestion.get(item.questionId)
        const yours = question ? formatResponse(question, answer?.response) : '—'
        const correct = question ? formatCorrect(question, item.correctAnswer) : '—'
        const skipped = answer === undefined
        const confidence = item.confidence
        return (
          <motion.li
            key={item.questionId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.3) }}
            className={cn(
              'rounded-xl border p-4',
              item.correct
                ? 'border-emerald-300/60 bg-emerald-500/5 dark:border-emerald-500/30'
                : 'border-rose-300/60 bg-rose-500/5 dark:border-rose-500/30',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Q{index + 1}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {confidence && (
                  <ConfidenceChip confidence={confidence} correct={item.correct} />
                )}
                <span
                  className={cn(
                    'chip font-bold',
                    item.correct
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
                  )}
                >
                  {item.correct ? `+${item.earnedPoints}` : '0'} / {item.points}
                </span>
              </span>
            </div>

            {question && (
              <p className="mt-1.5 text-sm font-medium leading-snug text-slate-800 dark:text-slate-100">
                {question.prompt}
              </p>
            )}

            {/* Your answer vs the key */}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-500/10 px-3 py-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Your answer
                </span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {skipped ? <span className="text-slate-400">skipped</span> : yours}
                  {question?.type === 'figure' && yours !== '—' && figureUnits(item.figure)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-500/10 px-3 py-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Correct answer
                </span>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                  {correct}
                  {question?.type === 'figure' && figureUnits(item.figure)}
                </p>
              </div>
            </div>

            {/* Figures: the exact drawing the student saw */}
            {item.figure && (() => {
              const labDeepLink = labLinkForFigure(item.figure)
              return (
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                    <FigureCanvas geometry={item.figure} size={150} />
                  </div>
                  <div className="flex max-w-72 flex-col gap-2">
                    <p className="text-xs text-slate-400">
                      Figure answers are graded within a small tolerance for the
                      question&apos;s rounding — no need for the thousandth place.
                    </p>
                    {labDeepLink && (
                      <Link
                        to={labDeepLink.to}
                        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-brand-400/40 bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-500/20 dark:text-brand-200"
                      >
                        Test in Model Lab: {labDeepLink.label} →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })()}

            {item.explanation && (
              <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                <Lightbulb size={15} className="mt-0.5 shrink-0 text-gold-500" />
                {item.explanation}
              </p>
            )}
          </motion.li>
        )
      })}
    </ul>
  )
}

// ── Standalone review page ──────────────────────────────────────

export function AttemptReview() {
  const { attemptId = '' } = useParams()
  const location = useLocation()
  const fromResults = (location.state as { fromResults?: boolean } | null)?.fromResults

  const { data, isLoading, error } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => api.attempts.get(attemptId),
  })

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-3xl">🤔</p>
        <h1 className="mt-3 font-display text-lg font-bold">Run not found</h1>
        <Link to="/home" className="btn-primary mt-5">
          Back home
        </Link>
      </Card>
    )
  }

  const attempt: AttemptSummaryDTO = data.attempt
  const accuracy = attempt.accuracy

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        to="/home"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft size={15} /> {fromResults ? 'Back to results' : 'Home'}
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-500">
              Attempt review
            </p>
            <h1 className="truncate font-display text-xl font-extrabold text-slate-900 dark:text-white">
              {attempt.quizTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {attempt.correctCount}/{attempt.totalQuestions} correct ·{' '}
              {Math.round(accuracy * 100)}% · {formatDuration(attempt.durationSec)} ·{' '}
              {formatDate(attempt.finishedAt ?? attempt.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-300">
              <Check size={15} /> {attempt.correctCount}
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-600 dark:text-rose-300">
              <X size={15} /> {attempt.totalQuestions - attempt.correctCount}
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-500/10 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300">
              <Clock size={15} /> {formatDuration(attempt.durationSec)}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Question by question
        </h2>
        <AttemptReviewList
          questions={data.questions}
          breakdown={data.breakdown}
          answers={data.answers}
        />
        {data.attempt.finishedAt === null && (
          <p className="mt-4 text-center text-xs text-slate-400">
            This run is still in progress — only answered questions appear.
          </p>
        )}
      </Card>

      {/* Calibration — hidden entirely when no answer was tagged. */}
      <ConfidenceCard answers={data.answers} />

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="ghost" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  )
}

/** Small link used in attempt lists (dashboard, analytics). */
export function ReviewLink({ attemptId }: { attemptId: string }) {
  return (
    <Link
      to={`/attempts/${attemptId}/review`}
      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600"
    >
      <Eye size={13} /> Review
    </Link>
  )
}
