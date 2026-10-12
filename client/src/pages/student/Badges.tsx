import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, EmptyState, Spinner } from '@/components/ui'

const BADGE_EMOJI: Record<string, string> = {
  first_quiz: '👣',
  perfect: '🎯',
  combo_master: '🔥',
  streak_3: '📅',
  streak_7: '🗓️',
  speedster: '⚡',
  explorer: '🧭',
  marathon: '🏃',
}

export function Badges() {
  const { data, isLoading } = useQuery({
    queryKey: ['badges'],
    queryFn: api.community.badges,
  })

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const badges = data?.badges ?? []
  const earned = badges.filter((badge) => badge.earned)
  const locked = badges.filter((badge) => !badge.earned)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          Trophy hall
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {earned.length} of {badges.length} badges earned — each one is a proof
          of persistence.
        </p>
      </div>

      {earned.length === 0 && (
        <EmptyState
          icon="🏅"
          title="The shelf is empty"
          description="Complete your first quiz to earn the First Steps badge."
        />
      )}

      {earned.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {earned.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06, type: 'spring', stiffness: 260, damping: 18 }}
            >
              <Card className="flex h-full flex-col items-center gap-2.5 border-gold-500/40 bg-gradient-to-b from-gold-500/15 to-transparent p-6 text-center">
                <motion.span
                  className="text-4xl"
                  animate={{ rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
                >
                  {BADGE_EMOJI[badge.id] ?? '🏅'}
                </motion.span>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  {badge.name}
                </h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {badge.description}
                </p>
                {badge.earnedAt && (
                  <span className="mt-auto text-[11px] font-medium text-gold-500">
                    earned {badge.earnedAt.slice(0, 10)}
                  </span>
                )}
              </Card>
            </motion.div>
          ))}
        </section>
      )}

      {locked.length > 0 && (
        <>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Still locked
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {locked.map((badge) => (
              <Card
                key={badge.id}
                className="flex h-full flex-col items-center gap-2.5 p-6 text-center opacity-60 grayscale"
              >
                <span className="text-4xl">
                  {BADGE_EMOJI[badge.id] ?? '🏅'}
                </span>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  {badge.name}
                </h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {badge.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <Lock size={11} /> not earned yet
                </span>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
