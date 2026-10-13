import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Download, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card, Chip, Spinner, useToast } from '@/components/ui'
import { EmptyState } from '@/components/ui'
import { subjectEmoji } from '@/lib/utils'

interface PackQuizSummary {
  title: string
  description: string
  difficulty: string
  questionCount: number
}

interface PackSummary {
  id: string
  name: string
  description: string
  subject: string
  icon: string
  quizzes: PackQuizSummary[]
}

const DIFFICULTY_COLORS: Record<string, 'emerald' | 'amber' | 'rose'> = {
  easy: 'emerald',
  medium: 'amber',
  hard: 'rose',
}

export function ContentPacks() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['packs'],
    queryFn: api.packs.list,
  })

  const install = async (pack: PackSummary) => {
    try {
      const result = await api.packs.install({ packId: pack.id, confirmDuplicates: false })
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      toast(
        `Added ${result.quizzes.length} quiz${result.quizzes.length === 1 ? '' : 'zes'} to your library — they start unpublished.`,
        'success',
      )
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Install failed', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const packs = data?.packs ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          Content packs
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Ready-made quiz sets, cloned straight into your library as drafts.
          Edit everything, publish when you like — a pack is a starting point,
          not a contract.
        </p>
      </div>

      {packs.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No packs available"
          description="The registry is empty. Check back after the next release."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {packs.map((pack) => (
            <motion.div key={pack.id} layout className="card flex flex-col gap-4 p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-2xl">
                  {pack.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    {pack.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {subjectEmoji(pack.subject)} {pack.subject} ·{' '}
                    {pack.quizzes.length} quiz{pack.quizzes.length === 1 ? '' : 'zes'}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {pack.description}
              </p>

              <ul className="flex flex-col gap-2">
                {pack.quizzes.map((quiz) => (
                  <li
                    key={quiz.title}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                        {quiz.title}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {quiz.questionCount} question{quiz.questionCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Chip color={DIFFICULTY_COLORS[quiz.difficulty] ?? 'slate'}>
                      {quiz.difficulty}
                    </Chip>
                  </li>
                ))}
              </ul>

              <Button className="w-full" onClick={() => void install(pack)}>
                <Download size={16} /> Add to my library
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      <Card className="flex items-start gap-3 p-5">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-gold-500" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Looking for more? Packs ship with the app, so new content arrives with
          every release — no store, no accounts, no tracking.
        </p>
      </Card>
    </div>
  )
}
