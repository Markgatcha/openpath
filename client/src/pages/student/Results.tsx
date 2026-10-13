import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Award, Clock, Flame, RotateCcw, Trophy, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, Spinner } from '@/components/ui'
import { ScoreRing } from '@/components/gamified'
import { fireConfetti } from '@/lib/confetti'
import { cn, formatDuration, formatDate, subjectEmoji } from '@/lib/utils'
import type { AttemptFinishDTO } from '@shared/types'

export function Results() {
  const { attemptId = '' } = useParams()
  const location = useLocation()
  const finish = (location.state as { finish?: AttemptFinishDTO } | null)?.finish

  const { data, isLoading } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => api.attempts.get(attemptId),
    enabled: !finish,
  })

  useEffect(() => {
    if (finish && finish.attempt.accuracy >= 0.7) {
      window.setTimeout(fireConfetti, 350)
    }
  }, [finish])

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!finish && !data) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-3xl">🤔</p>
        <h1 className="mt-3 font-display text-lg font-bold">Run not found</h1>
        <Link to="/student" className="btn-primary mt-5">
          Back to dashboard
        </Link>
      </Card>
    )
  }

  const attempt = finish?.attempt ?? data!.attempt
  const breakdown = finish?.breakdown ?? data!.breakdown
  const accuracy = attempt.accuracy
  const grade =
    accuracy >= 0.9
      ? { label: 'Legendary!', tone: 'text-gold-500' }
      : accuracy >= 0.7
        ? { label: 'Great run!', tone: 'text-emerald-500' }
        : accuracy >= 0.5
          ? { label: 'Solid effort', tone: 'text-amber-500' }
          : { label: 'Room to grow', tone: 'text-rose-500' }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft size={15} /> Dashboard
      </Link>

      {/* Hero */}
      <Card className="relative overflow-hidden p-8 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-500/10 to-transparent" />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="relative flex flex-col items-center gap-4"
        >
          <span className="text-5xl">{subjectEmoji(attempt.subject)}</span>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {attempt.quizTitle}
          </h1>
          <p className={cn('font-display text-lg font-bold', grade.tone)}>
            {grade.label}
          </p>
          <ScoreRing score={attempt.score} maxScore={attempt.maxScore} />

          <div className="mt-2 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-500/10 p-3">
              <Zap size={16} className="mx-auto text-brand-500" />
              <p className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                +{attempt.xpEarned}
              </p>
              <p className="text-xs text-slate-400">XP earned</p>
            </div>
            <div className="rounded-xl bg-slate-500/10 p-3">
              <Flame size={16} className="mx-auto text-orange-500" />
              <p className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                {finish?.comboBest ?? attempt.comboBest}x
              </p>
              <p className="text-xs text-slate-400">Best combo</p>
            </div>
            <div className="rounded-xl bg-slate-500/10 p-3">
              <Clock size={16} className="mx-auto text-cyan-500" />
              <p className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                {formatDuration(attempt.durationSec)}
              </p>
              <p className="text-xs text-slate-400">Time</p>
            </div>
            <div className="rounded-xl bg-slate-500/10 p-3">
              <Trophy size={16} className="mx-auto text-gold-500" />
              <p className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                {attempt.correctCount}/{attempt.totalQuestions}
              </p>
              <p className="text-xs text-slate-400">Correct</p>
            </div>
          </div>
        </motion.div>
      </Card>

      {/* Level up + badges */}
      {finish?.newLevel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-gold-500/40 bg-gradient-to-r from-gold-500/20 to-amber-400/10 p-5 text-center"
        >
          <p className="font-display text-lg font-extrabold text-gold-500">
            ⬆️ Level up! You reached level {finish.newLevel}
          </p>
        </motion.div>
      )}

      {/* Coins + level rewards */}
      {finish && (finish.coinsEarned || finish.levelRewards.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-gold-500/10 p-5"
        >
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            {finish.coinsEarned && (
              <p className="font-display text-lg font-extrabold text-gold-500">
                {finish.coinsEarned.currencyIcon} +{finish.coinsEarned.amount}{' '}
                {finish.coinsEarned.currencyName}
              </p>
            )}
          </div>
          {finish.levelRewards.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {finish.levelRewards.map((reward) => (
                <span
                  key={reward.level}
                  className="chip bg-amber-500/15 text-amber-600 dark:text-amber-300"
                >
                  🎁 Lv {reward.level} reward:{' '}
                  {reward.rewardType === 'coins'
                    ? `${reward.currencyIcon} ${reward.coins} ${reward.currencyName}`
                    : reward.itemName ?? 'shop item'}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Spend your coins in the reward shop on backgrounds, nameplates,
            and fonts.
          </p>
        </motion.div>
      )}

      {finish && finish.newBadges.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-gold-500">
            🏅 New badges unlocked
          </h2>
          <div className="flex flex-wrap gap-3">
            {finish.newBadges.map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ rotate: -8, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-gold-500/40 bg-gold-500/10 p-4 text-center"
              >
                <span className="text-3xl">🏅</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {badge.name}
                </span>
                <span className="max-w-32 text-[11px] text-slate-500 dark:text-slate-400">
                  {badge.description}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Breakdown */}
      <Card className="p-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Question breakdown
        </h2>
        <ul className="flex flex-col gap-3">
          {breakdown.map((item, index) => (
            <li
              key={item.questionId}
              className={cn(
                'rounded-xl border p-4',
                item.correct
                  ? 'border-emerald-300/60 bg-emerald-500/5 dark:border-emerald-500/30'
                  : 'border-rose-300/60 bg-rose-500/5 dark:border-rose-500/30',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Q{index + 1}
                </span>
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
              </div>
              {item.explanation && (
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {item.explanation}
                </p>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs text-slate-400">
          Completed {formatDate(attempt.finishedAt ?? attempt.createdAt)}
        </p>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link to={`/student/play/${attempt.quizId}`} className="btn-primary">
          <RotateCcw size={16} /> Run it again
        </Link>
        <Link to="/student/leaderboard" className="btn-ghost">
          <Award size={16} /> Leaderboard
        </Link>
        <Link to="/student" className="btn-ghost">
          Dashboard
        </Link>
      </div>
    </div>
  )
}
