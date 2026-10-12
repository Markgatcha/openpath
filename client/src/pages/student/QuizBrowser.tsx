import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, DoorOpen, Layers, Play, Search, Users } from 'lucide-react'
import { api } from '@/lib/api'
import {
  Chip,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Spinner,
  useToast,
} from '@/components/ui'
import { ProgressBar } from '@/components/ui'
import { cn, DIFFICULTY_STYLES, subjectEmoji } from '@/lib/utils'
import type { QuizDTO } from '@shared/types'

type Tab = 'available' | 'done'

function QuizCard({ quiz }: { quiz: QuizDTO }) {
  const attempted = quiz.myBestScore !== null
  return (
    <motion.div layout className="card card-hover flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{subjectEmoji(quiz.subject)}</span>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={cn(
              'chip',
              DIFFICULTY_STYLES[quiz.difficulty] ?? DIFFICULTY_STYLES.medium,
            )}
          >
            {quiz.difficulty}
          </span>
          {quiz.classroomName && (
            <Chip color="slate">
              <Users size={11} /> {quiz.classroomName}
            </Chip>
          )}
        </div>
      </div>

      <h3 className="font-display text-base font-bold leading-snug text-slate-900 dark:text-white">
        {quiz.title}
      </h3>
      <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {quiz.description}
      </p>

      <div className="flex items-center justify-between text-xs font-medium text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Layers size={13} />
          {quiz.questionCount} questions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={13} />
          {quiz.timeLimitSec
            ? `${Math.round(quiz.timeLimitSec / 60)}m limit`
            : 'no limit'}
        </span>
      </div>

      {attempted && (
        <div className="flex items-center gap-2">
          <ProgressBar value={quiz.myBestScore! / 100} className="h-1.5" />
          <span className="text-xs font-bold text-emerald-500">
            best {quiz.myBestScore}%
          </span>
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-1">
        <Link to={`/student/play/${quiz.id}`} className="btn-primary flex-1">
          <Play size={15} />
          {attempted ? 'Play again' : 'Start quest'}
        </Link>
        <Link to={`/student/flashcards/${quiz.id}`} className="btn-ghost">
          <Layers size={15} />
          Drill
        </Link>
      </div>
    </motion.div>
  )
}

export function QuizBrowser() {
  const { data, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: api.quizzes.list,
  })
  const [tab, setTab] = useState<Tab>('available')
  const [search, setSearch] = useState('')
  const [joinOpen, setJoinOpen] = useState(false)
  const [code, setCode] = useState('')
  const queryClient = useQueryClient()
  const toast = useToast()

  const quizzes = useMemo(() => data?.quizzes ?? [], [data])
  const attemptedIds = useMemo(
    () => new Set(quizzes.filter((quiz) => quiz.myBestScore !== null).map((quiz) => quiz.id)),
    [quizzes],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return quizzes.filter((quiz) => {
      const matchesTab =
        tab === 'available'
          ? quiz.myBestScore === null
          : quiz.myBestScore !== null
      const matchesSearch =
        term.length === 0 ||
        quiz.title.toLowerCase().includes(term) ||
        quiz.subject.toLowerCase().includes(term) ||
        quiz.description.toLowerCase().includes(term)
      return matchesTab && matchesSearch
    })
  }, [quizzes, tab, search])

  const join = async () => {
    try {
      await api.classrooms.join({ code })
      toast('Welcome to the classroom! New quests unlocked.', 'success')
      setJoinOpen(false)
      setCode('')
      void queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      void queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not join', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Quest board
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Every quiz is a run. Every run earns XP.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setJoinOpen(true)}>
          <DoorOpen size={16} />
          Join classroom
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            placeholder="Search quizzes, subjects…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-slate-100/60 p-1 dark:border-white/10 dark:bg-white/5">
          {(['available', 'done'] as Tab[]).map((value) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition',
                tab === value
                  ? 'bg-white text-brand-600 shadow-sm dark:bg-white/10 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              {value === 'available' ? 'New quests' : `Completed (${attemptedIds.size})`}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={tab === 'available' ? '🌵' : '📭'}
          title={
            tab === 'available'
              ? search
                ? 'Nothing matches that search'
                : 'No new quests right now'
              : 'No completed quizzes yet'
          }
          description={
            tab === 'available'
              ? 'Try a different search term, or join a classroom with a code.'
              : 'Finish a quiz and it will show up here with your best score.'
          }
        />
      )}

      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Join a classroom"
        className="max-w-sm"
      >
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Ask your teacher for the 6-character join code. Classroom quests will
          appear on your board instantly.
        </p>
        <Field label="Join code">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="ROOM42"
            className="font-mono uppercase tracking-widest"
            maxLength={16}
          />
        </Field>
        <Button className="mt-4 w-full" onClick={join} disabled={code.length < 4}>
          Join classroom
        </Button>
      </Modal>
    </div>
  )
}
