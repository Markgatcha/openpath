import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { GraduationCap, Plus, Trash2, UserPlus } from 'lucide-react'
import { api } from '@/lib/api'
import {
  Avatar,
  Button,
  CopyCode,
  EmptyState,
  Field,
  Input,
  Modal,
  Spinner,
  useToast,
} from '@/components/ui'
import { levelFromXp } from '@shared/game'

export function Classrooms() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['classrooms'],
    queryFn: api.classrooms.list,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', subject: 'General' })

  const classrooms = data?.classrooms ?? []

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['classrooms'] })
  }

  const create = async () => {
    try {
      await api.classrooms.create({ name: form.name, subject: form.subject })
      setCreateOpen(false)
      setForm({ name: '', subject: 'General' })
      invalidate()
      toast('Classroom created — share the join code!', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Create failed', 'error')
    }
  }

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete “${name}”? Students keep their XP and history.`)) {
      return
    }
    try {
      await api.classrooms.remove(id)
      invalidate()
      toast('Classroom deleted.', 'info')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Classrooms
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Group students with a join code, assign quizzes, track their climb.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> New classroom
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      ) : classrooms.length === 0 ? (
        <EmptyState
          icon="🏫"
          title="No classrooms yet"
          description="Create your first classroom and share its join code with students."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New classroom
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              id={classroom.id}
              name={classroom.name}
              subject={classroom.subject}
              joinCode={classroom.joinCode}
              memberCount={classroom.memberCount}
              quizCount={classroom.quizCount}
              onDelete={() => void remove(classroom.id, classroom.name)}
            />
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New classroom" className="max-w-sm">
        <div className="flex flex-col gap-4">
          <Field label="Classroom name">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Room 42 — Period 3"
              minLength={2}
            />
          </Field>
          <Field label="Subject">
            <Input
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              placeholder="Science"
            />
          </Field>
          <Button className="w-full" onClick={create} disabled={form.name.trim().length < 2}>
            <GraduationCap size={16} /> Create classroom
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function ClassroomCard({
  id,
  name,
  subject,
  joinCode,
  memberCount,
  quizCount,
  onDelete,
}: {
  id: string
  name: string
  subject: string
  joinCode: string
  memberCount: number
  quizCount: number
  onDelete: () => void
}) {
  const { data } = useQuery({
    queryKey: ['classroom', id],
    queryFn: () => api.classrooms.get(id),
  })

  return (
    <motion.div layout className="card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subject} · {memberCount} students · {quizCount} quizzes
          </p>
        </div>
        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
          aria-label="Delete classroom"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Join code
        </span>
        <CopyCode code={joinCode} />
      </div>

      <div className="border-t border-slate-100 pt-3 dark:border-white/5">
        {(data?.members ?? []).length === 0 ? (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <UserPlus size={13} /> No students yet — share the join code above.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {(data?.members ?? []).map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <Avatar name={member.name} color={member.avatarColor} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {member.name}
                </span>
                <span className="chip bg-brand-500/15 text-brand-600 dark:text-brand-300">
                  Lv {levelFromXp(member.xp)} · {member.xp} XP
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}
