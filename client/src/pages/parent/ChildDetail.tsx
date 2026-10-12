import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowLeft, Award } from 'lucide-react'
import { api } from '@/lib/api'
import { Avatar, Card, EmptyState, ProgressBar, Spinner } from '@/components/ui'
import { XpBar, StreakFlame } from '@/components/gamified'
import { cn, formatDate, formatDayLabel, pct } from '@/lib/utils'
import { xpProgress } from '@shared/game'

const CHART_TOOLTIP = {
  borderRadius: 12,
  border: 'none',
  background: 'rgba(15,18,32,0.95)',
  color: '#fff',
  fontSize: 12,
} as const

export function ChildDetail() {
  const { studentId = '' } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['parent-child', studentId],
    queryFn: () => api.stats.parentChild(studentId),
  })

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const { student, summary, recentAttempts, subjectAccuracy, weakQuestions, weeklyMinutes, badges } = data

  const trend = [...recentAttempts]
    .reverse()
    .map((attempt) => ({
      name: attempt.quizTitle.length > 14
        ? `${attempt.quizTitle.slice(0, 13)}…`
        : attempt.quizTitle,
      accuracy: pct(attempt.accuracy),
    }))

  const earnedBadges = badges.filter((badge) => badge.earned)

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/parent"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft size={15} /> Family overview
      </Link>

      {/* Header */}
      <Card className="flex flex-wrap items-center gap-5 p-6">
        <Avatar name={student.name} color={student.avatarColor} size="xl" />
        <div className="min-w-48 flex-1">
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {student.name}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Joined {formatDate(student.createdAt)} · Level {student.level}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StreakFlame days={student.streakDays} />
            <span className="chip bg-brand-500/15 text-brand-600 dark:text-brand-300">
              {student.xp} XP
            </span>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <XpBar progress={xpProgress(student.xp)} compact />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'This week', value: `${summary.attemptsThisWeek} quizzes` },
          { label: 'Avg accuracy', value: summary.avgAccuracy > 0 ? `${pct(summary.avgAccuracy)}%` : '—' },
          {
            label: 'Study time (week)',
            value: `${weeklyMinutes.reduce((sum, day) => sum + day.minutes, 0)} min`,
          },
          { label: 'Badges', value: `${earnedBadges.length}/${badges.length}` },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <p className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Accuracy trend */}
        <Card className="p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recent scores
          </h2>
          {trend.length === 0 ? (
            <EmptyState icon="📈" title="No completed quizzes yet" />
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="accuracyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                  <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-slate-400" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-slate-400" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(value) => [`${value}%`, 'score']} />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#accuracyFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Weekly minutes */}
        <Card className="p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Study minutes this week
          </h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyMinutes.map((day) => ({ ...day, label: formatDayLabel(day.day) }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-slate-400" axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'currentColor', fontSize: 11 }} className="text-slate-400" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(value) => [`${value} min`, 'studied']} />
                <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
                  {weeklyMinutes.map((day) => (
                    <Cell key={day.day} fill={day.minutes > 0 ? '#10b981' : '#94a3b833'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Subject accuracy */}
        <Card className="p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Subject strengths
          </h2>
          {subjectAccuracy.length === 0 ? (
            <EmptyState icon="📚" title="No subject data yet" />
          ) : (
            <ul className="flex flex-col gap-3">
              {subjectAccuracy.map((subject) => (
                <li key={subject.subject}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {subject.subject}
                    </span>
                    <span
                      className={cn(
                        'font-mono text-xs font-bold',
                        subject.accuracy >= 0.8
                          ? 'text-emerald-500'
                          : subject.accuracy >= 0.5
                            ? 'text-amber-500'
                            : 'text-rose-500',
                      )}
                    >
                      {pct(subject.accuracy)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={subject.accuracy}
                    barClassName={cn(
                      subject.accuracy >= 0.8
                        ? 'bg-emerald-500'
                        : subject.accuracy >= 0.5
                          ? 'bg-amber-500'
                          : 'bg-rose-500',
                    )}
                    className="h-1.5"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Weak spots */}
        <Card className="p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Worth another look
          </h2>
          {weakQuestions.length === 0 ? (
            <EmptyState
              icon="✨"
              title="No weak spots detected"
              description="Questions missed more than once show up here."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {weakQuestions.map((question, index) => (
                <li key={index} className="rounded-xl bg-slate-500/5 p-3.5">
                  <p className="text-sm font-medium leading-snug text-slate-700 dark:text-slate-200">
                    {question.prompt}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    missed {question.wrongCount} of {question.seenCount} times ·{' '}
                    {question.quizTitle}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Badges */}
      <Card className="p-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Trophy shelf
        </h2>
        {earnedBadges.length === 0 ? (
          <EmptyState icon="🏅" title="No badges earned yet" />
        ) : (
          <div className="flex flex-wrap gap-3">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 p-3.5 text-center"
              >
                <Award size={22} className="text-gold-500" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent attempts */}
      <Card className="p-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Recent runs
        </h2>
        {recentAttempts.length === 0 ? (
          <EmptyState icon="🎮" title="No completed runs yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/5">
                  <th className="pb-2 pr-4">Quiz</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2 pr-4">Accuracy</th>
                  <th className="pb-2">Finished</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b border-slate-50 last:border-0 dark:border-white/5">
                    <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-100">
                      {attempt.quizTitle}
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
