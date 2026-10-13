import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Copy,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  HardDriveDownload,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { api } from '@/lib/api'
import {
  Button,
  Chip,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
  useToast,
} from '@/components/ui'
import { subjectEmoji } from '@/lib/utils'

const SUBJECTS = [
  'General',
  'Science',
  'Math',
  'Geography',
  'History',
  'English',
  'Language',
  'Art',
  'Music',
  'Computer',
]

export function QuizList() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: api.quizzes.list,
  })
  const { data: classrooms } = useQuery({
    queryKey: ['classrooms'],
    queryFn: api.classrooms.list,
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subject: 'General',
    difficulty: 'medium',
    classroomId: '',
    description: '',
    timeLimitSec: '',
  })
  const [creating, setCreating] = useState(false)

  const quizzes = data?.quizzes ?? []

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['quizzes'] })
  }

  const create = async () => {
    setCreating(true)
    try {
      const result = await api.quizzes.create({
        title: form.title,
        subject: form.subject,
        difficulty: form.difficulty as 'easy' | 'medium' | 'hard',
        description: form.description,
        classroomId: form.classroomId || null,
        timeLimitSec: form.timeLimitSec ? Number(form.timeLimitSec) * 60 : null,
      })
      setCreateOpen(false)
      setForm({
        title: '',
        subject: 'General',
        difficulty: 'medium',
        classroomId: '',
        description: '',
        timeLimitSec: '',
      })
      invalidate()
      toast('Quiz created — time to add questions!', 'success')
      window.location.href = `/teacher/quizzes/${result.quiz.id}`
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Create failed', 'error')
    } finally {
      setCreating(false)
    }
  }

  const publishToggle = async (quizId: string, publish: boolean) => {
    try {
      if (publish) {
        await api.quizzes.publish(quizId)
        toast('Published — students can see it now.', 'success')
      } else {
        await api.quizzes.unpublish(quizId)
        toast('Unpublished.', 'info')
      }
      invalidate()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const duplicate = async (quizId: string) => {
    try {
      await api.quizzes.duplicate(quizId)
      invalidate()
      toast('Duplicated as a new draft.', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const remove = async (quizId: string, title: string) => {
    if (!window.confirm(`Delete “${title}” and all its attempts? This cannot be undone.`)) {
      return
    }
    try {
      await api.quizzes.remove(quizId)
      invalidate()
      toast('Quiz deleted.', 'info')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            My quizzes
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {quizzes.length} quiz{quizzes.length === 1 ? '' : 'zes'} ·{' '}
            {quizzes.filter((quiz) => quiz.published).length} published
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => setImportOpen(true)}>
            <Upload size={16} /> Import QTI
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              void api.io
                .backup()
                .then(() => toast('Backup downloaded.', 'success'))
                .catch((err: unknown) =>
                  toast(
                    err instanceof Error ? err.message : 'Backup failed',
                    'error',
                  ),
                )
            }}
          >
            <HardDriveDownload size={16} /> Backup
          </Button>
          <Button variant="ghost" onClick={() => setRestoreOpen(true)}>
            <FileUp size={16} /> Restore
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> New quiz
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon="🛠️"
          title="The workshop is empty"
          description="Create your first quiz — pick a title, add questions, publish, and your students can play."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New quiz
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {quizzes.map((quiz) => (
            <motion.div key={quiz.id} layout className="card card-hover p-5">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-3xl">{subjectEmoji(quiz.subject)}</span>

                <div className="min-w-48 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/teacher/quizzes/${quiz.id}`}
                      className="font-display text-base font-bold text-slate-900 hover:text-brand-500 dark:text-white"
                    >
                      {quiz.title}
                    </Link>
                    <Chip color={quiz.published ? 'emerald' : 'amber'}>
                      {quiz.published ? 'published' : 'draft'}
                    </Chip>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {quiz.subject} · {quiz.questionCount} questions ·{' '}
                    {quiz.attemptCount} runs
                    {quiz.classroomName && ` · ${quiz.classroomName}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/teacher/quizzes/${quiz.id}`}
                    className="btn-ghost px-3 py-2"
                    title="Edit quiz"
                  >
                    <Pencil size={15} />
                  </Link>
                  <Link
                    to={`/teacher/quizzes/${quiz.id}/analytics`}
                    className="btn-ghost px-3 py-2"
                    title="Analytics"
                  >
                    <BarChart3 size={15} />
                  </Link>
                  <button
                    onClick={() => void publishToggle(quiz.id, !quiz.published)}
                    className="btn-ghost px-3 py-2"
                    title={quiz.published ? 'Unpublish' : 'Publish'}
                  >
                    {quiz.published ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    onClick={() => void duplicate(quiz.id)}
                    className="btn-ghost px-3 py-2"
                    title="Duplicate"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => void remove(quiz.id, quiz.title)}
                    className="btn-danger px-3 py-2"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {!quiz.published && quiz.questionCount === 0 && (
                <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-300">
                  Add at least one question before publishing this quiz.
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a new quiz"
      >
        <div className="flex flex-col gap-4">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="e.g. Volcanoes & Earthquakes"
              minLength={3}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject">
              <Select
                value={form.subject}
                onChange={(event) =>
                  setForm({ ...form, subject: event.target.value })
                }
              >
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Difficulty">
              <Select
                value={form.difficulty}
                onChange={(event) =>
                  setForm({ ...form, difficulty: event.target.value })
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time limit (minutes)" hint="Leave empty for no limit">
              <Input
                type="number"
                min={0}
                max={120}
                value={form.timeLimitSec}
                onChange={(event) =>
                  setForm({ ...form, timeLimitSec: event.target.value })
                }
                placeholder="e.g. 10"
              />
            </Field>
            <Field label="Classroom" hint="Optional — assign to a class">
              <Select
                value={form.classroomId}
                onChange={(event) =>
                  setForm({ ...form, classroomId: event.target.value })
                }
              >
                <option value="">Public (everyone)</option>
                {(classrooms?.classrooms ?? []).map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="A short hook for your students"
            />
          </Field>
          <Button
            className="mt-1 w-full"
            loading={creating}
            disabled={form.title.trim().length < 3}
            onClick={create}
          >
            <FileText size={16} /> Create & open builder
          </Button>
        </div>
      </Modal>

      {importOpen && (
        <ImportQtiModal
          quizzes={quizzes}
          onClose={() => setImportOpen(false)}
          onDone={() => {
            setImportOpen(false)
            invalidate()
          }}
        />
      )}

      {restoreOpen && (
        <RestoreModal
          onClose={() => setRestoreOpen(false)}
          onDone={() => {
            setRestoreOpen(false)
            invalidate()
          }}
        />
      )}
    </div>
  )
}

// ── QTI import ─────────────────────────────────────────────────
function ImportQtiModal({
  quizzes,
  onClose,
  onDone,
}: {
  quizzes: { id: string; title: string }[]
  onClose: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const [quizId, setQuizId] = useState(quizzes[0]?.id ?? '')
  const [xml, setXml] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{
    imported: number
    skipped: { title: string; reason: string }[]
  } | null>(null)

  const submit = async () => {
    if (!quizId) {
      toast('Pick a quiz to import into.', 'error')
      return
    }
    setBusy(true)
    try {
      const response = await api.io.importQti({ quizId, xml })
      setResult(response)
      toast(`Imported ${response.imported} question(s).`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Import QTI 2.1" className="max-w-2xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Paste a QTI 2.1 XML export from your LMS. Multiple-choice,
          true/false, fill-in, and ordering interactions are supported;
          anything else is reported back so nothing vanishes silently.
        </p>
        <Field label="Import into quiz">
          <Select value={quizId} onChange={(event) => setQuizId(event.target.value)}>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="QTI XML">
          <Textarea
            value={xml}
            onChange={(event) => setXml(event.target.value)}
            rows={10}
            placeholder={'<questestinterop>…<assessmentItem>…</assessmentItem>…</questestinterop>'}
            className="font-mono text-xs"
          />
        </Field>
        <Button className="w-full" loading={busy} disabled={xml.trim().length < 20} onClick={submit}>
          <Upload size={16} /> Import questions
        </Button>

        {result && (
          <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-white/10">
            <p className="font-semibold text-emerald-600 dark:text-emerald-300">
              {result.imported} question{result.imported === 1 ? '' : 's'} imported
            </p>
            {result.skipped.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 text-xs text-amber-600 dark:text-amber-300">
                {result.skipped.map((item, index) => (
                  <li key={`${item.title}-${index}`}>
                    Skipped “{item.title || 'Untitled'}”: {item.reason}
                  </li>
                ))}
              </ul>
            )}
            <Button className="mt-3" variant="ghost" onClick={onDone}>
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Backup restore ─────────────────────────────────────────────
function RestoreModal({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{
    quizzes: number
    createdAssignments: number
  } | null>(null)

  const submit = async () => {
    setBusy(true)
    try {
      const backup = JSON.parse(text)
      const response = await api.io.restore({ backup })
      setResult({
        quizzes: response.quizzes.length,
        createdAssignments: response.createdAssignments,
      })
      toast('Backup restored as drafts.', 'success')
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'That is not a valid backup file',
        'error',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Restore backup" className="max-w-2xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Paste the contents of an OpenPath backup JSON. Quizzes come back as
          unpublished drafts (never straight into students' hands), and
          assignments are rebuilt where their classroom or student still
          exists.
        </p>
        <Field label="Backup JSON">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={10}
            placeholder="{ &quot;format&quot;: &quot;openpath-backup&quot;, … }"
            className="font-mono text-xs"
          />
        </Field>
        <div className="flex gap-2">
          <label className="btn-ghost cursor-pointer px-3 py-2 text-sm">
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                void file.text().then(setText)
              }}
            />
            Choose file…
          </label>
          <Button
            className="flex-1"
            loading={busy}
            disabled={text.trim().length < 10}
            onClick={submit}
          >
            <FileUp size={16} /> Restore
          </Button>
        </div>

        {result && (
          <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-white/10">
            <p className="font-semibold text-emerald-600 dark:text-emerald-300">
              {result.quizzes} quiz{result.quizzes === 1 ? '' : 'zes'} restored
              {result.createdAssignments > 0 &&
                ` · ${result.createdAssignments} assignment${result.createdAssignments === 1 ? '' : 's'} rebuilt`}
            </p>
            <Button className="mt-3" variant="ghost" onClick={onDone}>
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
