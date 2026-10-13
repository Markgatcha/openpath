import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowLeft, Clock, FileSpreadsheet, Target, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card, Chip, EmptyState, ProgressBar, Spinner, useToast } from '@/components/ui'
import { cn, formatDate, formatDuration, pct } from '@/lib/utils'

export function Analytics() {
  const { quizId = '' } = useParams()
  const toast = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['quiz-analytics', quizId],
    queryFn: () => api.quizzes.analytics(quizId),
  })

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const { quiz, attempts, questionStats, avgScore, completionCount } = data

  // Score distribution buckets (0-49, 50-69, 70-84, 85-100)
  const buckets = [
    { label: '<50%', min: 0, max: 0.5 },
    { label: '50–69%', min: 0.5, max: 0.7 },
    { label: '70–84%', min: 0.7, max: 0.85 },
    { label: '85%+', min: 0.85, max: 1.01 },
  ].map((bucket) => ({
    label: bucket.label,
    count: attempts.filter(
      (attempt) =>
        attempt.accuracy >= bucket.min &&
        (bucket.max > 1 ? attempt.accuracy >= bucket.min : attempt.accuracy < bucket.max),
    ).length,
  }))

  const hardest = [...questionStats].sort((a, b) => a.accuracy - b.accuracy).slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/teacher/quizzes"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft size={15} /> All quizzes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {quiz.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {quiz.subject} · {quiz.questionCount} questions ·{' '}
            {quiz.published ? 'published' : 'draft'}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            void api.io
              .attemptsCsv(quizId)
              .then(() => toast('CSV downloaded.', 'success'))
              .catch((err: unknown) =>
                toast(err instanceof Error ? err.message : 'Export failed', 'error'),
              )
          }}
        >
          <FileSpreadsheet size={16} /> Export CSV
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-500">
            <Users size={20} />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
              {completionCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">completed runs</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Target size={20} />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
              {avgScore.toFixed(1)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">average score (pts)</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500/10 text-gold-500">
            <Clock size={20} />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
              {attempts.length > 0
                ? formatDuration(
                    Math.round(
                      attempts.reduce((sum, a) => sum + a.durationSec, 0) /
                        attempts.length,
                    ),
                  )
                : '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">avg completion time</p>
          </div>
        </Card>
      </div>

      {/* Distribution */}
      <Card className="p-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Score distribution
        </h2>
        {completionCount === 0 ? (
          <EmptyState
            icon="📊"
            title="No runs yet"
            description="Once students complete this quiz, the distribution appears here."
          />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/10" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  className="text-slate-500 dark:text-slate-400"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  className="text-slate-500 dark:text-slate-400"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    background: 'rgba(15,18,32,0.95)',
                    color: '#fff',
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${Number(value ?? 0)} students`, 'runs']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {buckets.map((bucket, index) => (
                    <Cell
                      key={bucket.label}
                      fill={
                        ['#f43f5e', '#f59e0b', '#6366f1', '#10b981'][index]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Question accuracy */}
        <Card className="p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Question accuracy
          </h2>
          <ul className="flex flex-col gap-3">
            {questionStats.map((question, index) => (
              <li key={question.questionId}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    Q{index + 1}. {question.prompt}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-mono text-xs font-bold',
                      question.accuracy >= 0.8
                        ? 'text-emerald-500'
                        : question.accuracy >= 0.5
                          ? 'text-amber-500'
                          : 'text-rose-500',
                    )}
                  >
                    {question.seenCount > 0 ? `${pct(question.accuracy)}%` : '—'}
                  </span>
                </div>
                <ProgressBar
                  value={question.accuracy}
                  barClassName={cn(
                    question.accuracy >= 0.8
                      ? 'bg-emerald-500'
                      : question.accuracy >= 0.5
                        ? 'bg-amber-500'
                        : 'bg-rose-500',
                  )}
                  className="h-1.5"
                />
              </li>
            ))}
          </ul>
        </Card>

        {/* Toughest questions */}
        <Card className="p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Toughest questions
          </h2>
          {hardest.every((question) => question.seenCount === 0) ? (
            <EmptyState
              icon="🧩"
              title="No data yet"
              description="Difficulty rankings appear after the first completed run."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {hardest
                .filter((question) => question.seenCount > 0)
                .map((question) => (
                  <li key={question.questionId} className="flex items-start gap-3">
                    <Chip color="rose">{pct(question.accuracy)}%</Chip>
                    <p className="text-sm leading-snug text-slate-700 dark:text-slate-200">
                      {question.prompt}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Attempts table */}
      <Card className="p-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Recent runs
        </h2>
        {attempts.length === 0 ? (
          <EmptyState icon="🎮" title="No runs yet" description="Completed attempts will be listed here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/5">
                  <th className="pb-2 pr-4">Student</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2 pr-4">Accuracy</th>
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2">Finished</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="border-b border-slate-50 last:border-0 dark:border-white/5"
                  >
                    <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-100">
                      {attempt.studentName}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-slate-600 dark:text-slate-300">
                      {attempt.score}/{attempt.maxScore}
                    </td>
                    <td
                      className={cn(
                        'py-2.5 pr-4 font-mono font-bold',
                        attempt.accuracy >= 0.8
                          ? 'text-emerald-500'
                          : attempt.accuracy >= 0.5
                            ? 'text-amber-500'
                            : 'text-rose-500',
                      )}
                    >
                      {pct(attempt.accuracy)}%
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">
                      {formatDuration(attempt.durationSec)}
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {formatDate(attempt.finishedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
