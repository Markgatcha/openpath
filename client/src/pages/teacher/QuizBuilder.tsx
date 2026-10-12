import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Check,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import {
  Button,
  Card,
  Chip,
  Field,
  Input,
  Modal,
  Spinner,
  Textarea,
  useToast,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import type { QuestionInput } from '@shared/schemas'
import type { AiQuestionDraft, QuizDTO, TeacherQuestionDTO } from '@shared/types'

type QuestionType = 'mcq' | 'truefalse' | 'fill' | 'order'

const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'Multiple choice',
  truefalse: 'True / false',
  fill: 'Fill in the blank',
  order: 'Put in order',
}

const SUBJECTS = ['General', 'Science', 'Math', 'Geography', 'History', 'English', 'Language', 'Art', 'Music', 'Computer']

export function QuizBuilder() {
  const { quizId = '' } = useParams()
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => api.quizzes.get(quizId),
  })

  const quiz = data?.quiz as QuizDTO | undefined
  const questions = useMemo(
    () => (data?.questions ?? []) as TeacherQuestionDTO[],
    [data],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved')
  const [aiOpen, setAiOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const selected = useMemo(
    () => questions.find((question) => question.id === selectedId) ?? questions[0],
    [questions, selectedId],
  )

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['quiz', quizId] })
    void queryClient.invalidateQueries({ queryKey: ['quizzes'] })
  }

  // ── Meta editing ────────────────────────────────────────────
  const metaTimer = useRef<number | null>(null)
  const saveMeta = (patch: Parameters<typeof api.quizzes.update>[1]) => {
    if (metaTimer.current) window.clearTimeout(metaTimer.current)
    setSaveState('saving')
    metaTimer.current = window.setTimeout(async () => {
      try {
        await api.quizzes.update(quizId, patch)
        setSaveState('saved')
        void queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Save failed', 'error')
        setSaveState('saved')
      }
    }, 700)
  }

  // ── Question editing ─────────────────────────────────────────
  const saveQuestion = async (questionId: string, input: QuestionInput) => {
    setSaveState('saving')
    try {
      await api.quizzes.updateQuestion(quizId, questionId, input)
      setSaveState('saved')
      invalidate()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error')
    }
  }

  const addQuestion = async (type: QuestionType) => {
    setAddOpen(false)
    const base = {
      type,
      prompt: type === 'mcq' ? 'New question…' : type === 'order' ? 'Put these in order…' : type === 'fill' ? 'Fill in the blank: …' : 'True or false: …',
      points: 10,
      explanation: '',
    }
    const input: QuestionInput =
      type === 'mcq'
        ? { ...base, type: 'mcq', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0 }
        : type === 'truefalse'
          ? { ...base, type: 'truefalse', correct: true }
          : type === 'fill'
            ? { ...base, type: 'fill', correct: '', alternatives: [] }
            : { ...base, type: 'order', options: ['First', 'Second', 'Third'], correct: [0, 1, 2] }
    try {
      const result = await api.quizzes.addQuestion(quizId, input)
      invalidate()
      setSelectedId(result.question.id)
      toast('Question added.', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const removeQuestion = async (questionId: string) => {
    if (!window.confirm('Delete this question?')) return
    try {
      await api.quizzes.removeQuestion(quizId, questionId)
      if (selectedId === questionId) setSelectedId(null)
      invalidate()
      toast('Question deleted.', 'info')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const move = async (questionId: string, direction: -1 | 1) => {
    const ids = questions.map((question) => question.id)
    const index = ids.indexOf(questionId)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    const next = [...ids]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    try {
      await api.quizzes.reorder(quizId, next)
      invalidate()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Reorder failed', 'error')
    }
  }

  const togglePublish = async () => {
    if (!quiz) return
    try {
      if (quiz.published) {
        await api.quizzes.unpublish(quizId)
        toast('Unpublished.', 'info')
      } else {
        await api.quizzes.publish(quizId)
        toast('Published — students can play it now!', 'success')
      }
      invalidate()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  if (isLoading || !quiz) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/teacher/quizzes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={15} /> All quizzes
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'chip',
              saveState === 'saving'
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-emerald-500/15 text-emerald-500',
            )}
          >
            {saveState === 'saving' ? 'saving…' : 'all changes saved'}
          </span>
          <Button variant="ghost" onClick={() => setAiOpen(true)}>
            <Sparkles size={15} /> AI draft
          </Button>
          <Link to={`/teacher/quizzes/${quiz.id}/analytics`} className="btn-ghost">
            <BarChart3 size={15} /> Analytics
          </Link>
          <Button variant="ghost" onClick={togglePublish}>
            {quiz.published ? <EyeOff size={15} /> : <Eye size={15} />}
            {quiz.published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Meta */}
      <Card className="grid gap-4 p-5 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Field label="Quiz title">
            <Input
              value={quiz.title}
              onChange={(event) => {
                saveMeta({ title: event.target.value })
                void queryClient.setQueryData(['quiz', quizId], (old: typeof data) =>
                  old ? { ...old, quiz: { ...old.quiz, title: event.target.value } } : old,
                )
              }}
            />
          </Field>
        </div>
        <Field label="Subject">
          <select
            className="input cursor-pointer"
            value={quiz.subject}
            onChange={(event) => saveMeta({ subject: event.target.value })}
          >
            {SUBJECTS.map((subject) => (
              <option key={subject}>{subject}</option>
            ))}
          </select>
        </Field>
        <Field label="Difficulty">
          <select
            className="input cursor-pointer"
            value={quiz.difficulty}
            onChange={(event) =>
              saveMeta({ difficulty: event.target.value as 'easy' | 'medium' | 'hard' })
            }
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </Field>
        <div className="lg:col-span-3">
          <Field label="Description">
            <Textarea
              rows={2}
              value={quiz.description}
              onChange={(event) => saveMeta({ description: event.target.value })}
              placeholder="What awaits your students?"
            />
          </Field>
        </div>
        <Field label="Time limit (minutes)" hint="0 = no limit">
          <Input
            type="number"
            min={0}
            max={120}
            value={quiz.timeLimitSec ? Math.round(quiz.timeLimitSec / 60) : ''}
            onChange={(event) =>
              saveMeta({
                timeLimitSec: event.target.value ? Number(event.target.value) * 60 : null,
              })
            }
          />
        </Field>
        <div className="flex items-end gap-2 lg:col-span-4">
          <Chip color={quiz.published ? 'emerald' : 'amber'}>
            {quiz.published ? 'published' : 'draft'}
          </Chip>
          <Chip color="slate">{questions.length} questions</Chip>
          <Chip color="slate">{quiz.attemptCount} runs</Chip>
          {quiz.classroomName && <Chip color="brand">{quiz.classroomName}</Chip>}
        </div>
      </Card>

      {/* Builder body */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Question list */}
        <Card className="flex flex-col gap-3 p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Questions
            </h2>
            <div className="relative">
              <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setAddOpen((value) => !value)}>
                <Plus size={14} /> Add
              </Button>
              <AnimatePresence>
                {addOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="card absolute right-0 top-10 z-20 w-52 p-1.5"
                  >
                    {(Object.keys(TYPE_LABEL) as QuestionType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => void addQuestion(type)}
                        className="nav-item w-full text-left text-xs"
                      >
                        {TYPE_LABEL[type]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {questions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400 dark:border-white/10">
              No questions yet. Add one, or let the AI forge a draft.
            </p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {questions.map((question, index) => (
                <li
                  key={question.id}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-2.5 transition',
                    selected?.id === question.id
                      ? 'border-brand-400 bg-brand-500/5'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5',
                  )}
                >
                  <button
                    onClick={() => setSelectedId(question.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      Q{index + 1} · {question.points}pts
                    </span>
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {question.prompt}
                    </p>
                  </button>
                  <button
                    onClick={() => void move(question.id, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/10"
                    aria-label="Move up"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => void move(question.id, 1)}
                    disabled={index === questions.length - 1}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/10"
                    aria-label="Move down"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => void removeQuestion(question.id)}
                    className="rounded p-1 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                    aria-label="Delete question"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Editor */}
        <div className="lg:col-span-3">
          {selected ? (
            <QuestionEditor
              key={selected.id}
              question={selected}
              onChange={(input) => void saveQuestion(selected.id, input)}
            />
          ) : (
            <Card className="grid h-64 place-items-center p-8 text-center text-sm text-slate-400">
              Select a question on the left, or add a new one.
            </Card>
          )}
        </div>
      </div>

      <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} quiz={quiz} onDone={invalidate} />
    </div>
  )
}

// ── Question editor ─────────────────────────────────────────────
function QuestionEditor({
  question,
  onChange,
}: {
  question: TeacherQuestionDTO
  onChange: (input: QuestionInput) => void
}) {
  const [draft, setDraft] = useState<QuestionInput>(() => {
    if (question.type === 'mcq') {
      return {
        type: 'mcq',
        prompt: question.prompt,
        options: question.options ?? ['', '', '', ''],
        correct: (question.correct as number) ?? 0,
        points: question.points,
        explanation: question.explanation,
      }
    }
    if (question.type === 'truefalse') {
      return {
        type: 'truefalse',
        prompt: question.prompt,
        correct: (question.correct as boolean) ?? true,
        points: question.points,
        explanation: question.explanation,
      }
    }
    if (question.type === 'fill') {
      return {
        type: 'fill',
        prompt: question.prompt,
        correct: (question.correct as string) ?? '',
        alternatives: question.alternatives,
        points: question.points,
        explanation: question.explanation,
      }
    }
    return {
      type: 'order',
      prompt: question.prompt,
      options: question.options ?? ['', '', ''],
      correct: (question.correct as number[]) ?? [0, 1, 2],
      points: question.points,
      explanation: question.explanation,
    }
  })

  const update = (patch: Partial<QuestionInput>) => {
    const next = { ...draft, ...patch } as QuestionInput
    setDraft(next)
    onChange(next)
  }

  return (
    <Card className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <Chip color="brand">{TYPE_LABEL[question.type]}</Chip>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Points
          <Input
            type="number"
            min={1}
            max={100}
            className="w-20 py-1.5"
            value={draft.points}
            onChange={(event) => update({ points: Number(event.target.value) })}
          />
        </label>
      </div>

      <Field label="Prompt">
        <Textarea
          rows={2}
          value={draft.prompt}
          onChange={(event) => update({ prompt: event.target.value })}
        />
      </Field>

      {draft.type === 'mcq' && (
        <div className="flex flex-col gap-2.5">
          <span className="label">Options — mark the correct one</span>
          {draft.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <button
                onClick={() => update({ correct: index })}
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-sm font-bold transition',
                  draft.correct === index
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300 dark:border-white/10',
                )}
                aria-label={`Mark option ${index + 1} correct`}
              >
                {draft.correct === index ? <Check size={15} /> : String.fromCharCode(65 + index)}
              </button>
              <Input
                value={option}
                onChange={(event) => {
                  const options = [...draft.options]
                  options[index] = event.target.value
                  update({ options })
                }}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
              />
              {draft.options.length > 2 && (
                <button
                  onClick={() => {
                    const options = draft.options.filter((_, i) => i !== index)
                    update({
                      options,
                      correct: draft.correct >= options.length ? 0 : draft.correct,
                    })
                  }}
                  className="rounded p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                  aria-label="Remove option"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
          {draft.options.length < 6 && (
            <Button
              variant="ghost"
              className="self-start px-3 py-1.5 text-xs"
              onClick={() => update({ options: [...draft.options, ''] })}
            >
              <Plus size={13} /> Add option
            </Button>
          )}
        </div>
      )}

      {draft.type === 'truefalse' && (
        <div className="flex gap-3">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              onClick={() => update({ correct: value })}
              className={cn(
                'flex-1 rounded-xl border p-4 text-center font-display font-bold transition',
                draft.correct === value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-white/10',
              )}
            >
              {value ? '✓ True' : '✗ False'}
            </button>
          ))}
        </div>
      )}

      {draft.type === 'fill' && (
        <div className="flex flex-col gap-3">
          <Field label="Accepted answer" hint="Compared case- and punctuation-insensitively">
            <Input
              value={draft.correct}
              onChange={(event) => update({ correct: event.target.value })}
              placeholder="e.g. Milky Way"
            />
          </Field>
          <div>
            <span className="label">Also accept</span>
            <div className="flex flex-wrap gap-2">
              {draft.alternatives.map((alt, index) => (
                <span
                  key={index}
                  className="chip bg-slate-500/15 text-slate-600 dark:text-slate-300"
                >
                  {alt}
                  <button
                    onClick={() =>
                      update({
                        alternatives: draft.alternatives.filter((_, i) => i !== index),
                      })
                    }
                    className="text-slate-400 hover:text-rose-500"
                    aria-label="Remove alternative"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <Input
                className="w-40 py-1.5 text-xs"
                placeholder="+ alternative"
                onKeyDown={(event) => {
                  const value = (event.target as HTMLInputElement).value.trim()
                  if (event.key === 'Enter' && value) {
                    update({ alternatives: [...draft.alternatives, value] })
                    ;(event.target as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {draft.type === 'order' && (
        <div className="flex flex-col gap-2.5">
          <span className="label">
            Items — listed top-to-bottom in the correct order
          </span>
          {draft.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-500/15 text-xs font-bold text-brand-600 dark:text-brand-300">
                {index + 1}
              </span>
              <Input
                value={option}
                onChange={(event) => {
                  const options = [...draft.options]
                  options[index] = event.target.value
                  update({ options, correct: options.map((_, i) => i) })
                }}
              />
              {draft.options.length > 2 && (
                <button
                  onClick={() => {
                    const options = draft.options.filter((_, i) => i !== index)
                    update({ options, correct: options.map((_, i) => i) })
                  }}
                  className="rounded p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                  aria-label="Remove item"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
          {draft.options.length < 8 && (
            <Button
              variant="ghost"
              className="self-start px-3 py-1.5 text-xs"
              onClick={() => {
                const options = [...draft.options, '']
                update({ options, correct: options.map((_, i) => i) })
              }}
            >
              <Plus size={13} /> Add item
            </Button>
          )}
        </div>
      )}

      <Field label="Explanation" hint="Shown after the student answers — teach the why">
        <Textarea
          rows={2}
          value={draft.explanation}
          onChange={(event) => update({ explanation: event.target.value })}
          placeholder="Iron oxide (rust) gives Mars its reddish colour."
        />
      </Field>
    </Card>
  )
}

// ── AI question forge ───────────────────────────────────────────
function AiPanel({
  open,
  onClose,
  quiz,
  onDone,
}: {
  open: boolean
  onClose: () => void
  quiz: QuizDTO
  onDone: () => void
}) {
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState(quiz.subject)
  const [count, setCount] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(quiz.difficulty)
  const [types, setTypes] = useState<('mcq' | 'truefalse' | 'fill')[]>(['mcq', 'truefalse', 'fill'])
  const [drafts, setDrafts] = useState<AiQuestionDraft[]>([])
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [status, setStatus] = useState<'idle' | 'loading' | 'inserting'>('idle')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const toast = useToast()

  useEffect(() => {
    if (open) {
      void api.ai.status().then((result) => {
        if (!result.status.configured) {
          setNote(
            `No AI key configured — the forge is idle. Add an OpenRouter key (or point at a local model) in Settings → AI.`,
          )
        } else {
          setNote(`Forge online: ${result.status.provider} · ${result.status.model}`)
        }
      })
    }
  }, [open])

  const generate = async () => {
    setStatus('loading')
    setError('')
    try {
      const result = await api.ai.generate({ topic, subject, count, difficulty, types })
      setDrafts(result.questions)
      setPicked(new Set(result.questions.map((_, index) => index)))
      setNote(`Forged ${result.questions.length} drafts with ${result.provider} · ${result.model}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setStatus('idle')
    }
  }

  const insert = async () => {
    setStatus('inserting')
    try {
      for (const index of picked) {
        const draft = drafts[index]
        await api.quizzes.addQuestion(quiz.id, {
          type: draft.type,
          prompt: draft.prompt,
          ...(draft.options ? { options: draft.options } : {}),
          correct: draft.correct,
          ...(draft.alternatives ? { alternatives: draft.alternatives } : {}),
          points: draft.points ?? 10,
          explanation: draft.explanation ?? '',
        } as QuestionInput)
      }
      onDone()
      toast(`${picked.size} question${picked.size === 1 ? '' : 's'} added to the quiz.`, 'success')
      setDrafts([])
      setPicked(new Set())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Insert failed')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="AI question forge" className="max-w-2xl">
      <div className="flex flex-col gap-4">
        <p className="rounded-xl bg-brand-500/10 px-3.5 py-2.5 text-xs font-medium text-brand-700 dark:text-brand-300">
          ⚒️ {note || 'Checking the forge…'}
        </p>

        <Field label="Topic" hint="A subject, a chapter, or paste a paragraph of source material">
          <Textarea
            rows={2}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. The water cycle and cloud formation"
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Count">
            <Input
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </Field>
          <Field label="Difficulty">
            <select
              className="input cursor-pointer"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as 'easy' | 'medium' | 'hard')}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </Field>
          <Field label="Subject">
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </Field>
        </div>

        <div>
          <span className="label">Question types</span>
          <div className="flex flex-wrap gap-2">
            {(['mcq', 'truefalse', 'fill'] as const).map((type) => (
              <button
                key={type}
                onClick={() =>
                  setTypes((current) =>
                    current.includes(type)
                      ? current.filter((value) => value !== type)
                      : [...current, type],
                  )
                }
                className={cn(
                  'chip border transition',
                  types.includes(type)
                    ? 'border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-300'
                    : 'border-slate-200 text-slate-400 dark:border-white/10',
                )}
              >
                {TYPE_LABEL[type]}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={generate}
          loading={status === 'loading'}
          disabled={topic.trim().length < 3 || types.length === 0}
        >
          <Sparkles size={16} /> Generate {count} drafts
        </Button>

        {error && (
          <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-300">
            {error}
          </p>
        )}

        {drafts.length > 0 && (
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {drafts.map((draft, index) => (
              <label
                key={index}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition',
                  picked.has(index)
                    ? 'border-brand-400 bg-brand-500/5'
                    : 'border-slate-200 dark:border-white/10',
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={picked.has(index)}
                  onChange={(event) => {
                    const next = new Set(picked)
                    if (event.target.checked) next.add(index)
                    else next.delete(index)
                    setPicked(next)
                  }}
                />
                <span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {draft.prompt}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {draft.type === 'mcq'
                      ? (draft.options ?? []).map((option, i) => `${i === draft.correct ? '✓' : ''} ${option}`).join(' · ')
                      : `Answer: ${String(draft.correct)}`}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        {drafts.length > 0 && (
          <Button onClick={insert} loading={status === 'inserting'} disabled={picked.size === 0}>
            <Copy size={15} /> Insert {picked.size} into quiz
          </Button>
        )}
      </div>
    </Modal>
  )
}
