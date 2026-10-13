import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Crown, Medal, Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import { Avatar, Card, Spinner, Tabs } from '@/components/ui'
import { NameplateBadge, StyledName } from '@/components/Cosmetics'
import { cn } from '@/lib/utils'

const PODIUM_STYLES = [
  'border-gold-500/60 bg-gold-500/10',
  'border-slate-400/60 bg-slate-400/10',
  'border-amber-700/60 bg-amber-700/10',
]

const PODIUM_EMOJI = ['🥇', '🥈', '🥉']

export function Leaderboard() {
  const [window_, setWindow] = useState<'all' | 'week'>('week')
  const [scope, setScope] = useState<'global' | 'classroom'>('global')

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', scope, window_],
    queryFn: () => api.community.leaderboard({ scope, window: window_ }),
  })

  const entries = data?.entries ?? []
  const podium = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          XP is earned by finishing quizzes. Grind honest, climb fast.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          tabs={[
            { id: 'week', label: 'This week' },
            { id: 'all', label: 'All time' },
          ]}
          active={window_}
          onChange={(id) => setWindow(id as 'week' | 'all')}
        />
        <Tabs
          tabs={[
            { id: 'global', label: 'Global' },
            { id: 'classroom', label: 'Classroom' },
          ]}
          active={scope}
          onChange={(id) => setScope(id as 'global' | 'classroom')}
        />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          No ranked adventurers yet — finish a quiz to take the crown.
        </Card>
      ) : (
        <>
          {/* Podium */}
          <div className="grid items-end gap-4 sm:grid-cols-3">
            {[1, 0, 2].map((podiumIndex) => {
              const entry = podium[podiumIndex]
              if (!entry) return <div key={podiumIndex} />
              const place = podiumIndex
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * place, type: 'spring', stiffness: 200, damping: 18 }}
                  className={cn(
                    'card flex flex-col items-center gap-3 border-2 p-6 text-center',
                    PODIUM_STYLES[place],
                    place === 0 && 'sm:-mt-6 sm:pb-10',
                  )}
                >
                  <span className="text-3xl">{PODIUM_EMOJI[place]}</span>
                  <Avatar
                    name={entry.name}
                    color={entry.avatarColor}
                    size={place === 0 ? 'lg' : 'md'}
                  />
                  <div>
                    <NameplateBadge nameplate={entry.cosmetics.nameplate}>
                      <StyledName
                        name={entry.name}
                        paint={entry.cosmetics.nameStyle}
                        font={entry.cosmetics.font}
                        className="font-display text-sm font-bold"
                      />
                    </NameplateBadge>
                    {entry.isMe && (
                      <span className="ml-1.5 text-xs font-semibold text-brand-500">
                        (you)
                      </span>
                    )}
                    <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Lv {entry.level} · {entry.streakDays}d streak
                    </p>
                  </div>
                  <p className="font-display text-lg font-extrabold text-gradient">
                    {entry.xp} XP
                  </p>
                </motion.div>
              )
            })}
          </div>

          {/* The rest */}
          {rest.length > 0 && (
            <Card className="divide-y divide-slate-100 p-0 dark:divide-white/5">
              {rest.map((entry) => (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center gap-4 px-5 py-3.5',
                    entry.isMe && 'bg-brand-500/5',
                  )}
                >
                  <span className="w-8 text-center font-mono text-sm font-bold text-slate-400">
                    {entry.rank}
                  </span>
                  <Avatar name={entry.name} color={entry.avatarColor} size="sm" />
                  <NameplateBadge nameplate={entry.cosmetics.nameplate}>
                    <StyledName
                      name={entry.name}
                      paint={entry.cosmetics.nameStyle}
                      font={entry.cosmetics.font}
                      className="text-sm font-semibold"
                    />
                  </NameplateBadge>
                  {entry.isMe && (
                    <span className="ml-2 text-xs font-semibold text-brand-500">
                      (you)
                    </span>
                  )}
                  <span className="hidden text-xs text-slate-400 sm:block">
                    Lv {entry.level}
                  </span>
                  <span className="font-mono text-sm font-bold text-brand-500">
                    {entry.xp} XP
                  </span>
                </div>
              ))}
            </Card>
          )}

          {data?.myRank && data.myRank > entries.length && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              You’re ranked <span className="font-bold text-brand-500">#{data.myRank}</span>{' '}
              overall — keep going!
            </p>
          )}

          {podium[0] && (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <Crown size={13} className="text-gold-500" />
              {podium[0].name} leads with {podium[0].xp} XP
              <Trophy size={13} className="ml-2 text-brand-500" />
              <Medal size={13} className="text-slate-400" />
            </p>
          )}
        </>
      )}
    </div>
  )
}
