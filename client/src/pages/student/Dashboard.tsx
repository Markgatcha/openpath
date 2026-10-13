import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Award,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Clock,
  Flame,
  Play,
  Trophy,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Card, Chip, EmptyState, ProgressBar, Spinner } from '@/components/ui'
import { XpBar, StreakFlame } from '@/components/gamified'
import {
  DIFFICULTY_STYLES,
  cn,
  formatDate,
  formatDayLabel,
  pct,
  subjectEmoji,
} from '@/lib/utils'
import type { QuizDTO } from '@shared/types'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function QuizTile({ quiz }: { quiz: QuizDTO }) {
  return (
    <Link
      to={`/student/play/${quiz.id}`}
      className="card card-hover flex flex-col gap-3 p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{subjectEmoji(quiz.subject)}</span>
        <span
          className={cn(
            'chip',
            DIFFICULTY_STYLES[quiz.difficulty] ?? DIFFICULTY_STYLES.medium,
          )}
        >
          {quiz.difficulty}
        </span>
      </div>
      <h3 className="font-display text-base font-bold leading-snug text-slate-900 dark:text-white">
        {quiz.title}
      </h3>
      <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {quiz.description}
      </p>
      <div className="mt-auto flex items-center justify-between text-xs font-medium text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <BookOpenCheck size={13} />
          {quiz.questionCount} questions
        </span>
        {quiz.timeLimitSec ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} />
            {Math.round(quiz.timeLimitSec / 60)}m
          </span>
        ) : (
          <span>no time limit</span>
        )}
      </div>
      {quiz.myBestScore !== null && (
        <div className="flex items-center gap-2">
          <ProgressBar value={quiz.myBestScore / 100} className="h-1.5" />
          <span className="text-xs font-bold text-emerald-500">
            best {quiz.myBestScore}%
          </span>
        </div>
      )}
    </Link>
  )
}

export function StudentDashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: api.stats.studentDashboard,
  })

  if (isLoading || !data || !user) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const goalPct = Math.min(1, data.minutesToday / data.dailyGoalMinutes)
  const weekTotal = data.weeklyMinutes.reduce((sum, day) => sum + day.minutes, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {greeting()}, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {data.attemptsToday > 0
              ? `You’ve completed ${data.attemptsToday} quiz${data.attemptsToday > 1 ? 'zes' : ''} today — keep the streak alive!`
              : 'A new quest awaits. Pick a quiz to begin.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StreakFlame days={data.user.streakDays} />
          <Chip color="brand" className="px-3 py-1.5 text-sm">
            <Trophy size={13} /> Rank #{data.myRank ?? '—'}
          </Chip>
        </div>
      </div>

      {/* XP + daily goal */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="flex flex-col justify-between gap-4 p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Level progress
            </h2>
            <span className="font-mono text-sm font-semibold text-brand-500">
              {data.user.xp} XP total
            </span>
          </div>
          <XpBar progress={data.user.xpProgress} />
          <div className="flex items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Flame size={14} className="text-orange-500" />
              {data.user.streakDays}-day streak
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Award size={14} className="text-gold-500" />
              {data.earnedBadges.length} badges earned
            </span>
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center gap-3 p-6 lg:col-span-2">
          <h2 className="self-start font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Daily goal
          </h2>
          <div className="relative grid h-28 w-28 place-items-center">
            <svg width={112} height={112} className="-rotate-90">
              <circle
                cx={56}
                cy={56}
                r={48}
                fill="none"
                strokeWidth={10}
                className="stroke-slate-200 dark:stroke-white/10"
              />
              <motion.circle
                cx={56}
                cy={56}
                r={48}
                fill="none"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 48}
                initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 48 * (1 - goalPct),
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="stroke-emerald-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                {data.minutesToday}
              </span>
              <span className="text-xs text-slate-400">of {data.dailyGoalMinutes}m</span>
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {goalPct >= 1
              ? '🎉 Goal smashed! Bonus bragging rights.'
              : `${data.dailyGoalMinutes - data.minutesToday} more minutes to hit today’s goal.`}
          </p>
        </Card>
      </div>

      {/* Weekly minutes */}
      <Card className="p-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          This week · {weekTotal} minutes of learning
        </h2>
        <div className="flex items-end justify-between gap-2">
          {data.weeklyMinutes.map((day) => {
            const max = Math.max(...data.weeklyMinutes.map((d) => d.minutes), 1)
            return (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.minutes / max) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                    className={cn(
                      'w-full rounded-t-lg',
                      day.minutes > 0
                        ? 'bg-gradient-to-t from-brand-500/60 to-violet-400'
                        : 'bg-slate-200 dark:bg-white/10',
                    )}
                    title={`${day.minutes} minutes`}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {formatDayLabel(day.day)}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300">
                  {day.minutes}m
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Spaced repetition nudge */}
      <SrsDueCard />

      {/* Recommended */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Recommended for you
          </h2>
          <Link
            to="/student/quizzes"
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Browse all →
          </Link>
        </div>
        {data.recommended.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommended.map((quiz) => (
              <QuizTile key={quiz.id} quiz={quiz} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🎯"
            title="You’ve tried everything new!"
            description="Check your classroom quests below, or ask your teacher for more."
          />
        )}
      </section>

      {/* Classroom quests */}
      {data.classroomQuizzes.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-slate-900 dark:text-white">
            Classroom quests
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.classroomQuizzes.map((quiz) => (
              <QuizTile key={quiz.id} quiz={quiz} />
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recent runs
          </h2>
          {data.recentAttempts.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {data.recentAttempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {attempt.quizTitle}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(attempt.finishedAt ?? attempt.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'font-mono text-sm font-bold',
                        attempt.accuracy >= 0.8
                          ? 'text-emerald-500'
                          : attempt.accuracy >= 0.5
                            ? 'text-amber-500'
                            : 'text-rose-500',
                      )}
                    >
                      {pct(attempt.accuracy)}%
                    </span>
                    <span className="chip bg-brand-500/15 text-brand-600 dark:text-brand-300">
                      +{attempt.xpEarned} XP
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="🕹️"
              title="No runs yet"
              description="Your finished quizzes will appear here."
            />
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Badge shelf
          </h2>
          {data.earnedBadges.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {data.earnedBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.06, rotate: -2 }}
                  className="flex w-20 flex-col items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 p-3 text-center"
                  title={badge.description}
                >
                  <span className="text-2xl">🏅</span>
                  <span className="text-[10px] font-bold leading-tight text-slate-700 dark:text-slate-200">
                    {badge.name}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🏅"
              title="No badges yet"
              description="Finish your first quiz to earn “First Steps”."
            />
          )}
          <Link
            to="/student/badges"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            <BarChart3 size={14} /> View all badges
          </Link>
        </Card>
      </section>

      <Card className="flex flex-col items-center gap-3 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Ready for a quick run?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Five questions, a few minutes, a pile of XP.
          </p>
        </div>
        <Link to="/student/quizzes" className="btn-primary shrink-0">
          <Play size={16} /> Find a quiz
        </Link>
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <CalendarDays size={12} /> Streaks update every day you complete a quiz
      </p>
    </div>
  )
}

// ── Spaced-repetition due card ──────────────────────────────────
function SrsDueCard() {
  const { data } = useQuery({
    queryKey: ['srs-stats'],
    queryFn: api.srs.stats,
  })

  if (!data || data.dueCount === 0) return null

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 border-cyan-500/30 bg-cyan-500/5 p-6">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-500/15 text-2xl">
          🧠
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {data.dueCount} flashcard{data.dueCount === 1 ? '' : 's'} due today
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Two minutes of retrieval practice now beats an hour of rereading
            later.
          </p>
        </div>
      </div>
      <Link to="/student/flashcards" className="btn-primary shrink-0">
        Start review
      </Link>
    </Card>
  )
}
