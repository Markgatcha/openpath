import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Baby, Heart, Link2, TrendingUp } from 'lucide-react'
import { api } from '@/lib/api'
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  ProgressBar,
  Spinner,
  useToast,
} from '@/components/ui'
import { XpBar } from '@/components/gamified'
import { cn, formatDuration, pct, timeAgo } from '@/lib/utils'
import { xpProgress } from '@shared/game'

export function ParentDashboard() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: api.community.children,
  })
  const [linkOpen, setLinkOpen] = useState(false)
  const [code, setCode] = useState('')

  const children = data?.children ?? []

  const link = async () => {
    try {
      await api.community.linkChild({ code })
      setLinkOpen(false)
      setCode('')
      void queryClient.invalidateQueries({ queryKey: ['children'] })
      toast('Child linked — you can now follow their journey.', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Link failed', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Family overview
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A calm window into your child’s learning adventure.
          </p>
        </div>
        <Button onClick={() => setLinkOpen(true)}>
          <Link2 size={16} /> Link a child
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      ) : children.length === 0 ? (
        <EmptyState
          icon="🧑‍👧"
          title="No children linked yet"
          description="Ask your child for their link code from Settings, then link here to follow their progress."
          action={
            <Button onClick={() => setLinkOpen(true)}>
              <Link2 size={16} /> Link a child
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {children.map((child) => (
            <motion.div key={child.id} whileHover={{ y: -2 }}>
              <Link to={`/parent/child/${child.id}`}>
                <Card className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-center gap-4">
                    <Avatar name={child.name} color={child.avatarColor} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        {child.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Level {child.level} · {child.xp} XP · active{' '}
                        {timeAgo(child.lastActive)}
                      </p>
                    </div>
                    <TrendingUp size={18} className="text-emerald-500" />
                  </div>

                  <XpBar progress={xpProgress(child.xp)} compact />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-500/10 p-3">
                      <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        {child.streakDays}
                      </p>
                      <p className="text-[11px] text-slate-400">day streak</p>
                    </div>
                    <div className="rounded-xl bg-slate-500/10 p-3">
                      <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        {child.attemptsThisWeek}
                      </p>
                      <p className="text-[11px] text-slate-400">quizzes (week)</p>
                    </div>
                    <div className="rounded-xl bg-slate-500/10 p-3">
                      <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        {child.avgAccuracy > 0 ? `${pct(child.avgAccuracy)}%` : '—'}
                      </p>
                      <p className="text-[11px] text-slate-400">avg accuracy</p>
                    </div>
                  </div>

                  {/* Daily goal */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Today’s goal</span>
                      <span>
                        {child.minutesToday}/{child.dailyGoalMinutes} min
                      </span>
                    </div>
                    <ProgressBar
                      value={
                        child.dailyGoalMinutes > 0
                          ? child.minutesToday / child.dailyGoalMinutes
                          : 0
                      }
                    />
                  </div>

                  <p
                    className={cn(
                      'mt-auto rounded-xl px-3.5 py-2.5 text-xs font-medium',
                      child.minutesToday >= child.dailyGoalMinutes
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                        : 'bg-brand-500/10 text-brand-700 dark:text-brand-300',
                    )}
                  >
                    {child.minutesToday >= child.dailyGoalMinutes
                      ? `🎉 Daily goal met — ${formatDuration(child.minutesToday * 60)} of learning today.`
                      : `${child.dailyGoalMinutes - child.minutesToday} minutes left to today’s goal.`}
                  </p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title="Link a child" className="max-w-sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your child can find their personal link code in{' '}
            <span className="font-semibold">Settings</span> on their account.
          </p>
          <Field label="Link code">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="OL-1A2B3C"
              className="font-mono uppercase tracking-widest"
              maxLength={32}
            />
          </Field>
          <Button onClick={link} disabled={code.length < 4}>
            <Baby size={16} /> Link child
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Heart size={12} className="text-rose-400" /> You only see progress — never
            their answers or passwords.
          </p>
        </div>
      </Modal>
    </div>
  )
}
