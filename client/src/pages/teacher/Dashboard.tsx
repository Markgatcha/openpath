import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3,
  ClipboardList,
  FileText,
  Layers,
  LineChart,
  Plus,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Card, EmptyState, Spinner } from '@/components/ui'
import { subjectEmoji } from '@/lib/utils'

function StatCard({
  icon,
  value,
  label,
  tone = 'brand',
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  tone?: 'brand' | 'emerald' | 'gold' | 'cyan'
}) {
  const tones = {
    brand: 'text-brand-500 bg-brand-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    gold: 'text-gold-500 bg-gold-500/10',
    cyan: 'text-cyan-500 bg-cyan-500/10',
  }
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          {value}
        </p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </Card>
  )
}

export function TeacherDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: api.quizzes.list,
  })
  const { data: classrooms } = useQuery({
    queryKey: ['classrooms'],
    queryFn: api.classrooms.list,
  })

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const quizzes = data?.quizzes ?? []
  const published = quizzes.filter((quiz) => quiz.published)
  const drafts = quizzes.filter((quiz) => !quiz.published)
  const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.questionCount, 0)
  const totalAttempts = quizzes.reduce((sum, quiz) => sum + quiz.attemptCount, 0)
  const top = [...published].sort((a, b) => b.attemptCount - a.attemptCount).slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Quest master console
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Forge quizzes, guide classrooms, watch the data speak.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/teacher/classrooms" className="btn-ghost">
            <Users size={16} /> Classrooms
          </Link>
          <Link to="/teacher/quizzes" className="btn-primary">
            <Plus size={16} /> New quiz
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList size={20} />}
          value={quizzes.length}
          label="Quizzes created"
        />
        <StatCard
          icon={<FileText size={20} />}
          value={published.length}
          label={`Published (${drafts.length} drafts)`}
          tone="emerald"
        />
        <StatCard
          icon={<Layers size={20} />}
          value={totalQuestions}
          label="Questions forged"
          tone="gold"
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          value={totalAttempts}
          label="Runs completed"
          tone="cyan"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Popular quizzes */}
        <Card className="p-6 lg:col-span-3">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Most played
          </h2>
          {top.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {top.map((quiz) => (
                <li key={quiz.id} className="flex items-center gap-3">
                  <span className="text-xl">{subjectEmoji(quiz.subject)}</span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/teacher/quizzes/${quiz.id}`}
                      className="truncate text-sm font-semibold text-slate-800 hover:text-brand-500 dark:text-slate-100"
                    >
                      {quiz.title}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {quiz.questionCount} questions · {quiz.subject}
                    </p>
                  </div>
                  <span className="chip bg-brand-500/15 text-brand-600 dark:text-brand-300">
                    {quiz.attemptCount} runs
                  </span>
                  <Link
                    to={`/teacher/quizzes/${quiz.id}/analytics`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={`Analytics for ${quiz.title}`}
                  >
                    <LineChart size={15} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="📊"
              title="No plays yet"
              description="Publish a quiz and share it — runs will show up here."
            />
          )}
        </Card>

        {/* Quick actions */}
        <Card className="flex flex-col gap-3 p-6 lg:col-span-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Quick actions
          </h2>
          <Link to="/teacher/quizzes" className="btn-ghost justify-start">
            <Plus size={16} /> Create a quiz
          </Link>
          <Link to="/teacher/quizzes" className="btn-ghost justify-start">
            <Layers size={16} /> Manage questions
          </Link>
          <Link to="/teacher/classrooms" className="btn-ghost justify-start">
            <Users size={16} /> Invite students
          </Link>
          {published[0] && (
            <Link
              to={`/teacher/quizzes/${published[0].id}/analytics`}
              className="btn-ghost justify-start"
            >
              <BarChart3 size={16} /> View analytics
            </Link>
          )}
          <div className="mt-auto rounded-xl bg-brand-500/10 p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            💡 Tip: open <span className="font-semibold">Settings → AI</span> to
            connect OpenRouter or a local model, then draft questions from a
            topic right inside the quiz builder.
          </div>
        </Card>
      </div>

      {/* Drafts nudge */}
      {drafts.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-500/30 bg-amber-500/5 p-5">
          <div>
            <h3 className="font-display text-sm font-bold text-amber-600 dark:text-amber-300">
              {drafts.length} draft{drafts.length > 1 ? 's' : ''} waiting
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Unpublished quizzes are invisible to students.
            </p>
          </div>
          <Link to="/teacher/quizzes" className="btn-primary">
            Review drafts
          </Link>
        </Card>
      )}

      {/* Classrooms strip */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Your classrooms
          </h2>
          <Link
            to="/teacher/classrooms"
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Manage →
          </Link>
        </div>
        {(classrooms?.classrooms ?? []).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(classrooms?.classrooms ?? []).map((classroom) => (
              <motion.div
                key={classroom.id}
                whileHover={{ y: -2 }}
                className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
              >
                <p className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  {classroom.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {classroom.memberCount} students · {classroom.quizCount} quizzes
                </p>
                <p className="mt-2 font-mono text-xs font-bold text-brand-500">
                  code: {classroom.joinCode}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🏫"
            title="No classrooms yet"
            description="Create one to group students and assign quests."
          />
        )}
      </Card>
    </div>
  )
}
