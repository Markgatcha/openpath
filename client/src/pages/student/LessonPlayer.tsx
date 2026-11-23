import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  RotateCcw,
} from 'lucide-react'
import { api } from '@/lib/api'
import {
  LessonStepRenderer,
  type LessonStepResultMeta,
} from '@/components/LessonStepRenderer'
import { Button, Card, Chip, ProgressBar, Spinner, useToast } from '@/components/ui'
import { isTypingTarget, usePrefersReducedMotion } from '@/lib/a11y'
import { fireComboBurst, playVictorySound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import type { MasteryLevel } from '@shared/lessons'
import type { LessonDetailDTO } from '@shared/types'

const MASTERY_STYLE: Record<
  MasteryLevel,
  { label: string; color: 'slate' | 'amber' | 'brand' | 'gold' | 'emerald' }
> = {
  unstarted: { label: 'Unstarted', color: 'slate' },
  attempted: { label: 'Attempted', color: 'amber' },
  familiar: { label: 'Familiar', color: 'brand' },
  proficient: { label: 'Proficient', color: 'gold' },
  mastered: { label: 'Mastered', color: 'emerald' },
}

const STEP_SHORT_LABEL: Record<string, string> = {
  narrative: 'Hook',
  'predict-observe-explain': 'Lab POE',
  'worked-example': 'Example',
  'faded-practice': 'Practice',
  checkpoint: 'Check',
  'branching-scenario': 'Scenario',
  synthesis: 'Summary',
}

function LessonPlayerBody({ data }: { data: LessonDetailDTO }) {
  const { lesson, track, unit, progress, prerequisitesMet, prerequisiteLessons } = data
  const queryClient = useQueryClient()
  const toast = useToast()
  const reducedMotion = usePrefersReducedMotion()

  const { data: trackDetail } = useQuery({
    queryKey: ['track', track.id],
    queryFn: () => api.lessons.track(track.id),
  })

  const initialStep = useMemo(() => {
    if (progress.completed || lesson.steps.length === 0) return 0
    if (progress.highestStepIndex > 0 && progress.highestStepIndex < lesson.steps.length) {
      return progress.highestStepIndex
    }
    return 0
  }, [progress.completed, progress.highestStepIndex, lesson.steps.length])

  const [stepIndex, setStepIndex] = useState(initialStep)
  const [completedStepIds, setCompletedStepIds] = useState<string[]>(progress.completedSteps)
  const [lessonCompleted, setLessonCompleted] = useState(progress.completed)
  const [challengeCompleted, setChallengeCompleted] = useState(progress.challengeCompleted)
  const [masteryLevel, setMasteryLevel] = useState<MasteryLevel>(progress.masteryLevel)
  const [justEnrolledCount, setJustEnrolledCount] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [announcement, setAnnouncement] = useState('')

  const stepStartRef = useRef(0)
  const completionSentRef = useRef(progress.completed)
  const checkpointResultsRef = useRef<Map<string, { resolved: boolean; firstTry: boolean }>>(
    new Map(),
  )

  useEffect(() => {
    stepStartRef.current = Date.now()
  }, [stepIndex])

  const totalCheckpointsInLesson = useMemo(
    () =>
      lesson.steps.filter((s) => s.kind === 'checkpoint' || s.kind === 'faded-practice').length,
    [lesson.steps],
  )

  const persistProgress = useCallback(
    async (opts: {
      stepId?: string
      nextIndex: number
      completedStepsList: string[]
      completed: boolean
      challengeDone: boolean
    }) => {
      const now = Date.now()
      const elapsedSec =
        stepStartRef.current > 0
          ? Math.min(600, Math.max(1, Math.round((now - stepStartRef.current) / 1000)))
          : 0
      stepStartRef.current = now

      const entries = Array.from(checkpointResultsRef.current.values())
      const resolvedCount = entries.filter((e) => e.resolved).length
      const firstTryCount = entries.filter((e) => e.firstTry).length
      const nudgeSolvedCount = Math.max(0, resolvedCount - firstTryCount)

      let computedScore: number | undefined
      if (entries.length > 0) {
        const denom = Math.max(totalCheckpointsInLesson, entries.length)
        computedScore = Math.round(((firstTryCount + nudgeSolvedCount * 0.85) / denom) * 100)
      } else if (opts.completed) {
        computedScore = 100
      }

      setSaving(true)
      setSaveError('')
      try {
        const res = await api.lessons.submitProgress(lesson.id, {
          stepId: opts.stepId,
          stepIndex: opts.nextIndex,
          completedSteps: opts.completedStepsList,
          completed: opts.completed,
          challengeCompleted: opts.challengeDone,
          checkpointCorrectCount: resolvedCount,
          checkpointTotalCount: entries.length,
          score: computedScore,
          timeSpentSec: elapsedSec,
          enrollFlashcards: opts.completed,
        })
        setMasteryLevel(res.progress.masteryLevel)
        setLessonCompleted(res.progress.completed)
        setCompletedStepIds(res.progress.completedSteps)
        if (res.enrolledFlashcards > 0) {
          setJustEnrolledCount(res.enrolledFlashcards)
        }
        void queryClient.invalidateQueries({ queryKey: ['tracks'] })
        void queryClient.invalidateQueries({ queryKey: ['lesson', lesson.id] })
        void queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
        if (opts.completed || res.enrolledFlashcards > 0) {
          void queryClient.invalidateQueries({ queryKey: ['srs-stats'] })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not save lesson progress'
        setSaveError(msg)
        toast(msg, 'error')
      } finally {
        setSaving(false)
      }
    },
    [lesson.id, totalCheckpointsInLesson, queryClient, toast],
  )

  const currentStep = lesson.steps[stepIndex]

  // If the student arrives directly on a synthesis step that isn't saved completed yet, persist it.
  useEffect(() => {
    if (!currentStep || currentStep.kind !== 'synthesis' || completionSentRef.current) return
    completionSentRef.current = true
    const nextList = completedStepIds.includes(currentStep.id)
      ? completedStepIds
      : [...completedStepIds, currentStep.id]
    setCompletedStepIds(nextList)
    void persistProgress({
      stepId: currentStep.id,
      nextIndex: stepIndex,
      completedStepsList: nextList,
      completed: true,
      challengeDone: challengeCompleted,
    })
    if (!lessonCompleted) {
      playVictorySound()
      if (!reducedMotion) fireComboBurst()
    }
  }, [
    currentStep,
    completedStepIds,
    stepIndex,
    challengeCompleted,
    lessonCompleted,
    reducedMotion,
    persistProgress,
  ])

  const handleStepComplete = useCallback(
    (stepId: string, meta?: LessonStepResultMeta) => {
      const nextList = completedStepIds.includes(stepId)
        ? completedStepIds
        : [...completedStepIds, stepId]
      setCompletedStepIds(nextList)

      const nextChallengeDone = challengeCompleted || Boolean(meta?.challengeCompleted)
      if (nextChallengeDone && !challengeCompleted) {
        setChallengeCompleted(true)
      }

      if (meta?.checkpointAttempted) {
        const prev = checkpointResultsRef.current.get(stepId)
        checkpointResultsRef.current.set(stepId, {
          resolved: Boolean(meta.checkpointCorrect) || Boolean(prev?.resolved),
          firstTry: Boolean(meta.checkpointFirstTry) || Boolean(prev?.firstTry),
        })
      }

      const isSynth = lesson.steps[stepIndex]?.kind === 'synthesis'
      const shouldComplete = lessonCompleted || isSynth
      if (shouldComplete) completionSentRef.current = true

      void persistProgress({
        stepId,
        nextIndex: stepIndex,
        completedStepsList: nextList,
        completed: shouldComplete,
        challengeDone: nextChallengeDone,
      })
    },
    [
      completedStepIds,
      challengeCompleted,
      lesson.steps,
      stepIndex,
      lessonCompleted,
      persistProgress,
    ],
  )

  const goToStep = useCallback(
    (nextIdx: number) => {
      if (nextIdx < 0 || nextIdx >= lesson.steps.length) return
      const targetStep = lesson.steps[nextIdx]
      setStepIndex(nextIdx)
      setAnnouncement(`Step ${nextIdx + 1} of ${lesson.steps.length}: ${targetStep.title}`)

      if (targetStep.kind === 'synthesis' && !completionSentRef.current) {
        completionSentRef.current = true
        const nextList = completedStepIds.includes(targetStep.id)
          ? completedStepIds
          : [...completedStepIds, targetStep.id]
        setCompletedStepIds(nextList)
        void persistProgress({
          stepId: targetStep.id,
          nextIndex: nextIdx,
          completedStepsList: nextList,
          completed: true,
          challengeDone: challengeCompleted,
        })
        if (!lessonCompleted) {
          playVictorySound()
          if (!reducedMotion) fireComboBurst()
        }
      }
    },
    [
      lesson.steps,
      completedStepIds,
      challengeCompleted,
      lessonCompleted,
      reducedMotion,
      persistProgress,
    ],
  )

  const handleNext = useCallback(() => {
    if (stepIndex + 1 < lesson.steps.length) {
      goToStep(stepIndex + 1)
    } else if (!completionSentRef.current) {
      completionSentRef.current = true
      void persistProgress({
        stepId: currentStep?.id,
        nextIndex: stepIndex,
        completedStepsList: completedStepIds,
        completed: true,
        challengeDone: challengeCompleted,
      })
    }
  }, [
    stepIndex,
    lesson.steps.length,
    goToStep,
    persistProgress,
    currentStep?.id,
    completedStepIds,
    challengeCompleted,
  ])

  // Keyboard shortcuts: Alt+ArrowLeft / Alt+ArrowRight step navigation (never steals slider arrows)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.altKey) return
      if (isTypingTarget(event.target)) return
      if (event.key === 'ArrowLeft' && stepIndex > 0) {
        event.preventDefault()
        goToStep(stepIndex - 1)
      } else if (event.key === 'ArrowRight' && stepIndex + 1 < lesson.steps.length) {
        event.preventDefault()
        goToStep(stepIndex + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stepIndex, lesson.steps.length, goToStep])

  const masteryMeta = MASTERY_STYLE[masteryLevel] ?? MASTERY_STYLE.unstarted
  const completionPct =
    lesson.steps.length > 0 ? completedStepIds.length / lesson.steps.length : 0

  if (!currentStep) return null

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      {/* Screen-reader live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Top breadcrumb & status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            to={`/student/lessons?track=${encodeURIComponent(track.id)}`}
            className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline dark:text-brand-300"
          >
            <ChevronLeft size={14} /> Lessons
          </Link>
          <span>/</span>
          <span className="truncate font-medium">{track.title}</span>
          <span>/</span>
          <span className="truncate">{unit.title}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip color="slate">
            <Clock size={11} /> ~{lesson.estimatedMinutes} min
          </Chip>
          <Chip color={masteryMeta.color}>
            {masteryLevel === 'mastered' && <Award size={11} />}
            {masteryMeta.label}
          </Chip>
        </div>
      </div>

      {/* Lesson title & standards */}
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
          {lesson.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lesson.summary}</p>
        {lesson.standards.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {lesson.standards.map((std) => (
              <span
                key={std}
                className="rounded-md bg-slate-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400"
              >
                {std}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Soft-recommended prerequisite notice (never locks out self-learners) */}
      {!prerequisitesMet && prerequisiteLessons.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Compass size={15} className="shrink-0" />
            <span>
              <strong>Recommended first:</strong>{' '}
              {prerequisiteLessons
                .filter((p) => !p.completed)
                .map((p) => p.title)
                .join(', ')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {prerequisiteLessons
              .filter((p) => !p.completed)
              .map((p) => (
                <Link
                  key={p.id}
                  to={`/student/lessons/${p.id}`}
                  className="font-bold text-amber-800 underline hover:opacity-80 dark:text-amber-200"
                >
                  Open “{p.title}”
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Save error retry bar if offline/failed */}
      {saveError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-700 dark:border-rose-500/40 dark:text-rose-200">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} /> {saveError}
          </span>
          <Button
            variant="ghost"
            onClick={() =>
              void persistProgress({
                stepId: currentStep.id,
                nextIndex: stepIndex,
                completedStepsList: completedStepIds,
                completed: lessonCompleted || currentStep.kind === 'synthesis',
                challengeDone: challengeCompleted,
              })
            }
          >
            <RotateCcw size={13} /> Retry save
          </Button>
        </div>
      )}

      {/* Progress & interactive step switcher */}
      <div className="flex flex-col gap-2.5">
        <ProgressBar value={completionPct} className="h-2" />
        <nav
          aria-label="Lesson steps"
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {lesson.steps.map((s, idx) => {
            const done = completedStepIds.includes(s.id)
            const active = idx === stepIndex
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToStep(idx)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  active
                    ? 'border-brand-500 bg-brand-500/15 text-brand-700 dark:text-brand-200'
                    : done
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-400',
                )}
              >
                {done ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <span className="font-mono">{idx + 1}.</span>
                )}
                <span>{STEP_SHORT_LABEL[s.kind] ?? s.kind}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Active step content (keyed by step.id so step-local UI starts fresh) */}
      <LessonStepRenderer
        key={currentStep.id}
        lessonId={lesson.id}
        packId={track.packId}
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={lesson.steps.length}
        stepAlreadyDone={completedStepIds.includes(currentStep.id)}
        linkedQuizId={data.linkedQuizId}
        relatedQuizzes={trackDetail?.relatedQuizzes}
        nextLessonId={data.nextLessonId}
        enrolledFlashcardCount={data.enrolledFlashcardCount}
        justEnrolledCount={justEnrolledCount}
        savingProgress={saving}
        onStepComplete={handleStepComplete}
        onNext={handleNext}
        onAnnounce={setAnnouncement}
      />

      {/* Footer navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            disabled={stepIndex === 0}
            onClick={() => goToStep(stepIndex - 1)}
          >
            <ArrowLeft size={15} /> Previous step
          </Button>
          {data.prevLessonId && (
            <Link to={`/student/lessons/${data.prevLessonId}`} className="btn-ghost">
              <ChevronLeft size={15} /> Prev lesson
            </Link>
          )}
        </div>

        <span className="hidden text-xs text-slate-400 sm:inline">
          Tip: Alt + ← / → switches steps · Track license: {track.license}
        </span>

        <div className="flex items-center gap-2">
          {stepIndex + 1 < lesson.steps.length && (
            <Button variant="ghost" onClick={() => goToStep(stepIndex + 1)}>
              Next step <ArrowRight size={15} />
            </Button>
          )}
          {data.nextLessonId && (
            <Link to={`/student/lessons/${data.nextLessonId}`} className="btn-ghost">
              Next lesson <ChevronRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export function LessonPlayer() {
  const { lessonId = '' } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => api.lessons.get(lessonId),
    enabled: Boolean(lessonId),
  })

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-3xl">🧭</p>
        <h1 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white">
          Lesson not found
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {error instanceof Error
            ? error.message
            : 'We could not load that micro-lesson.'}
        </p>
        <Link to="/student/lessons" className="btn-primary mt-5 inline-flex">
          Back to lessons
        </Link>
      </Card>
    )
  }

  return <LessonPlayerBody key={lessonId} data={data} />
}

export default LessonPlayer
