import { useMemo, useState } from 'react'
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CalendarClock,
  CalendarPlus,
  Check,
  ClipboardList,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import {
  Button,
  Chip,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  useToast,
} from '@/components/ui'
import { EmptyState } from '@/components/ui'
import type { AssignmentDTO } from '@shared/types'

function dueChip(assignment: AssignmentDTO) {
  if (!assignment.dueDate) {
    return <Chip color="slate">No due date</Chip>
  }
  const today = new Date().toISOString().slice(0, 10)
  const days = Math.round(
    (Date.parse(`${assignment.dueDate}T00:00:00Z`) -
      Date.parse(`${today}T00:00:00Z`)) /
      86_400_000,
  )
  if (days < 0) {
    return <Chip color="rose">Due {assignment.dueDate} (closed)</Chip>
  }
  if (days === 0) return <Chip color="rose">Due today</Chip>
  if (days === 1) return <Chip color="amber">Due tomorrow</Chip>
  return <Chip color="slate">Due {assignment.dueDate}</Chip>
}

export function Assignments() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: api.assignments.list,
  })
  const [editing, setEditing] = useState<AssignmentDTO | 'new' | null>(null)
  const [rosterFor, setRosterFor] = useState<string | null>(null)

  const assignments = data?.assignments ?? []

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['assignments'] })
  }

  const remove = async (assignment: AssignmentDTO) => {
    if (!window.confirm(`Delete the assignment “${assignment.title}”?`)) return
    try {
      await api.assignments.remove(assignment.id)
      invalidate()
      toast('Assignment deleted.', 'info')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Assignments
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Send a quiz to a classroom or a student, with a due date and an
            attempt cap. Deadlines double as spacing.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <CalendarPlus size={16} /> New assignment
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No assignments yet"
          description="Assign a published quiz to a classroom or a student to see it here."
          action={
            <Button onClick={() => setEditing('new')}>
              <CalendarPlus size={16} /> New assignment
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {assignments.map((assignment) => (
            <motion.div key={assignment.id} layout className="card flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-base font-bold text-slate-900 dark:text-white">
                    {assignment.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {assignment.quizTitle} ·{' '}
                    {assignment.classroomName ??
                      assignment.studentName ??
                      'unknown target'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setRosterFor(assignment.id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-500/10 hover:text-brand-500"
                    aria-label="Completion roster"
                  >
                    <ClipboardList size={15} />
                  </button>
                  <button
                    onClick={() => setEditing(assignment)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-white"
                    aria-label="Edit assignment"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => void remove(assignment)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                    aria-label="Delete assignment"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {dueChip(assignment)}
                {assignment.availableFrom && (
                  <Chip color="slate">Opens {assignment.availableFrom}</Chip>
                )}
                <Chip color="slate">
                  {assignment.maxAttempts === 0
                    ? 'Unlimited attempts'
                    : `Max ${assignment.maxAttempts} attempt${assignment.maxAttempts === 1 ? '' : 's'}`}
                </Chip>
                <Chip
                  color={
                    assignment.assignedCount > 0 &&
                    assignment.completedCount === assignment.assignedCount
                      ? 'emerald'
                      : 'slate'
                  }
                >
                  <Users size={11} /> {assignment.completedCount}/
                  {assignment.assignedCount} done
                </Chip>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {editing && (
        <AssignmentModal
          assignment={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            invalidate()
          }}
        />
      )}

      {rosterFor && (
        <RosterModal id={rosterFor} onClose={() => setRosterFor(null)} />
      )}
    </div>
  )
}

// ── Create / edit ─────────────────────────────────────────────
function AssignmentModal({
  assignment,
  onClose,
  onSaved,
}: {
  assignment: AssignmentDTO | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const { data: quizData } = useQuery({
    queryKey: ['quizzes'],
    queryFn: api.quizzes.list,
  })
  const { data: classroomData } = useQuery({
    queryKey: ['classrooms'],
    queryFn: api.classrooms.list,
  })
  const classrooms = useMemo(
    () => classroomData?.classrooms ?? [],
    [classroomData],
  )
  const quizzes = quizData?.quizzes ?? []

  const [target, setTarget] = useState<'classroom' | 'student'>(
    assignment?.studentId ? 'student' : 'classroom',
  )
  const [form, setForm] = useState({
    quizId: assignment?.quizId ?? '',
    classroomId: assignment?.classroomId ?? classrooms[0]?.id ?? '',
    studentId: assignment?.studentId ?? '',
    title: assignment?.title ?? '',
    dueDate: assignment?.dueDate ?? '',
    availableFrom: assignment?.availableFrom ?? '',
    maxAttempts: String(assignment?.maxAttempts ?? 0),
  })
  const [saving, setSaving] = useState(false)

  // Students enrolled in any of the teacher's classrooms.
  const memberQueries = useQueries({
    queries: classrooms.map((classroom) => ({
      queryKey: ['classroom', classroom.id],
      queryFn: () => api.classrooms.get(classroom.id),
    })),
  })
  const studentOptions = useMemo(() => {
    if (target !== 'student') return []
    const entries: { id: string; name: string; classroom: string }[] = []
    classrooms.forEach((classroom, index) => {
      for (const member of memberQueries[index]?.data?.members ?? []) {
        if (!entries.some((entry) => entry.id === member.id)) {
          entries.push({ id: member.id, name: member.name, classroom: classroom.name })
        }
      }
    })
    return entries
  }, [target, classrooms, memberQueries])

  const submit = async () => {
    if (!form.quizId) {
      toast('Pick a quiz first.', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        quizId: form.quizId,
        classroomId: target === 'classroom' ? form.classroomId || null : null,
        studentId: target === 'student' ? form.studentId || null : null,
        title: form.title.trim(),
        dueDate: form.dueDate || null,
        availableFrom: form.availableFrom || null,
        maxAttempts: Number(form.maxAttempts) || 0,
      }
      if (assignment) {
        await api.assignments.update(assignment.id, payload)
        toast('Assignment updated.', 'success')
      } else {
        await api.assignments.create(payload)
        toast('Assignment sent — students will see it on their dashboard.', 'success')
      }
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={assignment ? 'Edit assignment' : 'New assignment'}
      className="max-w-lg"
    >
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        <Field label="Quiz">
          <Select
            value={form.quizId}
            onChange={(event) => setForm({ ...form, quizId: event.target.value })}
          >
            <option value="">Pick a quiz…</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
                {quiz.published ? '' : ' (draft)'}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Assign to">
          <div className="flex gap-2">
            <Button
              variant={target === 'classroom' ? 'primary' : 'ghost'}
              onClick={() => setTarget('classroom')}
            >
              Classroom
            </Button>
            <Button
              variant={target === 'student' ? 'primary' : 'ghost'}
              onClick={() => setTarget('student')}
            >
              One student
            </Button>
          </div>
        </Field>

        {target === 'classroom' ? (
          <Field label="Classroom">
            <Select
              value={form.classroomId}
              onChange={(event) =>
                setForm({ ...form, classroomId: event.target.value })
              }
            >
              <option value="">Pick a classroom…</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} · {classroom.memberCount} students
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Student">
            <Select
              value={form.studentId}
              onChange={(event) =>
                setForm({ ...form, studentId: event.target.value })
              }
            >
              <option value="">Pick a student…</option>
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.classroom}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Title (optional — defaults to the quiz name)">
          <Input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Unit 3 review"
            maxLength={120}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Due date">
            <Input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </Field>
          <Field label="Opens on (optional)">
            <Input
              type="date"
              value={form.availableFrom}
              onChange={(event) =>
                setForm({ ...form, availableFrom: event.target.value })
              }
            />
          </Field>
        </div>

        <Field label="Max attempts (0 = unlimited)">
          <Input
            type="number"
            min={0}
            max={20}
            value={form.maxAttempts}
            onChange={(event) =>
              setForm({ ...form, maxAttempts: event.target.value })
            }
          />
        </Field>

        <Button className="w-full" onClick={submit} disabled={saving}>
          <Check size={16} />
          {assignment ? 'Save changes' : 'Send assignment'}
        </Button>
      </div>
    </Modal>
  )
}

// ── Roster ────────────────────────────────────────────────────
function RosterModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['assignment-roster', id],
    queryFn: () => api.assignments.roster(id),
  })

  return (
    <Modal open onClose={onClose} title="Completion roster" className="max-w-lg">
      {!data ? (
        <div className="grid place-items-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data.assignment.title} · {data.assignment.quizTitle}
          </p>
          <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
            {data.roster.map((row) => (
              <li
                key={row.studentId}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/5"
              >
                <span
                  className={
                    row.completed
                      ? 'grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-500'
                      : 'grid h-8 w-8 place-items-center rounded-full bg-slate-500/10 text-slate-400'
                  }
                >
                  {row.completed ? <Check size={15} /> : <CalendarClock size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                    {row.studentName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {row.attemptsUsed} attempt{row.attemptsUsed === 1 ? '' : 's'} used
                    {row.bestScore !== null && row.bestMaxScore !== null
                      ? ` · best ${row.bestScore}/${row.bestMaxScore}`
                      : ''}
                  </p>
                </div>
                {row.completed && <Chip color="emerald">done</Chip>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}
