import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  BookOpen,
  Box,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Layers,
  Lock,
  Play,
  Search,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Card, Chip, EmptyState, Input, ProgressBar, Spinner } from '@/components/ui'
import { usePrefersReducedMotion } from '@/lib/a11y'
import { cn, subjectEmoji } from '@/lib/utils'
import { findPack, SUBJECT_GROUPS } from '@shared/packs'
import type { GradeBand, MasteryLevel } from '@shared/lessons'
import type { CurriculumTrackDTO, LessonSummaryDTO } from '@shared/types'

const GRADE_BAND_LABELS: Record<GradeBand, string> = {
  MS: 'Middle School',
  HS: 'High School',
  'College-Intro': 'College Intro',
  'All-Ages': 'All Ages',
}

const MASTERY_META: Record<
  MasteryLevel,
  { label: string; color: 'slate' | 'amber' | 'brand' | 'gold' | 'emerald' }
> = {
  unstarted: { label: 'Unstarted', color: 'slate' },
  attempted: { label: 'Attempted', color: 'amber' },
  familiar: { label: 'Familiar', color: 'brand' },
  proficient: { label: 'Proficient', color: 'gold' },
  mastered: { label: 'Mastered', color: 'emerald' },
}

const VISUAL_BADGE_LABEL: Record<LessonSummaryDTO['visualKind'], string | null> = {
  'model-3d': '3D Lab',
  'model-2d': '2D Lab',
  'figure-2d': 'Diagram',
  none: null,
}

interface ResumePick {
  track: CurriculumTrackDTO
  unitTitle: string
  lesson: LessonSummaryDTO
  inProgress: boolean
}

function findResumeLesson(tracks: CurriculumTrackDTO[]): ResumePick | null {
  // 1. Any started, incomplete lesson gets highest priority.
  for (const track of tracks) {
    for (const unit of track.units) {
      for (const lesson of unit.lessons) {
        if (!lesson.completed && lesson.masteryLevel !== 'unstarted') {
          return { track, unitTitle: unit.title, lesson, inProgress: true }
        }
      }
    }
  }
  // 2. Next unlocked incomplete lesson inside a track already started.
  for (const track of tracks) {
    if (track.completedLessons === 0) continue
    for (const unit of track.units) {
      for (const lesson of unit.lessons) {
        if (!lesson.completed && lesson.unlocked) {
          return { track, unitTitle: unit.title, lesson, inProgress: false }
        }
      }
    }
  }
  // 3. First incomplete unlocked lesson overall.
  for (const track of tracks) {
    for (const unit of track.units) {
      for (const lesson of unit.lessons) {
        if (!lesson.completed && lesson.unlocked) {
          return { track, unitTitle: unit.title, lesson, inProgress: false }
        }
      }
    }
  }
  // 4. Fallback: first lesson of first track.
  const firstTrack = tracks[0]
  const firstUnit = firstTrack?.units[0]
  const firstLesson = firstUnit?.lessons[0]
  if (firstTrack && firstUnit && firstLesson) {
    return {
      track: firstTrack,
      unitTitle: firstUnit.title,
      lesson: firstLesson,
      inProgress: false,
    }
  }
  return null
}

function MasteryPill({ level }: { level: MasteryLevel }) {
  const meta = MASTERY_META[level] ?? MASTERY_META.unstarted
  return (
    <Chip color={meta.color} className="capitalize">
      {level === 'mastered' && <Award size={11} />}
      {meta.label}
    </Chip>
  )
}

export function Lessons() {
  const reducedMotion = usePrefersReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') ?? 'All'
  const focusedTrackParam = searchParams.get('track') ?? ''

  const [category, setCategory] = useState<string>(initialCategory)
  const [search, setSearch] = useState('')
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(() =>
    focusedTrackParam ? new Set([focusedTrackParam]) : new Set(),
  )

  const { data, isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => api.lessons.tracks(),
  })

  // Optional dashboard cache check so assignment-gated lessons display a helpful badge.
  const { data: dashboard } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: api.stats.studentDashboard,
    retry: false,
  })

  const tracks = useMemo(() => data?.tracks ?? [], [data])

  const requiredLessonTitles = useMemo(() => {
    const map = new Map<string, string>()
    for (const assignment of dashboard?.assignments ?? []) {
      if (assignment.requiredLessonId && !assignment.lessonCompleted) {
        map.set(assignment.requiredLessonId, assignment.title)
      }
    }
    return map
  }, [dashboard])

  const trackLookup = useMemo(() => {
    const map = new Map<string, CurriculumTrackDTO>()
    for (const track of tracks) {
      map.set(track.id, track)
      map.set(track.packId, track)
      map.set(track.slug, track)
    }
    return map
  }, [tracks])

  const lessonTitleLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const track of tracks) {
      for (const unit of track.units) {
        for (const lesson of unit.lessons) {
          map.set(lesson.id, lesson.title)
        }
      }
    }
    return map
  }, [tracks])

  const resumePick = useMemo(() => findResumeLesson(tracks), [tracks])

  const filteredTracks = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tracks.filter((track) => {
      const matchesCat =
        category === 'All' || track.category.toLowerCase() === category.toLowerCase()
      if (!matchesCat) return false
      if (!term) return true
      return (
        track.title.toLowerCase().includes(term) ||
        track.subject.toLowerCase().includes(term) ||
        track.sourceAttribution.toLowerCase().includes(term) ||
        track.units.some(
          (unit) =>
            unit.title.toLowerCase().includes(term) ||
            unit.anchoringPhenomenon.toLowerCase().includes(term) ||
            unit.lessons.some(
              (lesson) =>
                lesson.title.toLowerCase().includes(term) ||
                lesson.summary.toLowerCase().includes(term),
            ),
        )
      )
    })
  }, [tracks, category, search])

  const totals = useMemo(() => {
    let lessonsTotal = 0
    let lessonsDone = 0
    for (const track of tracks) {
      lessonsTotal += track.totalLessons
      lessonsDone += track.completedLessons
    }
    return { lessonsTotal, lessonsDone }
  }, [tracks])

  const pickCategory = (nextCat: string) => {
    setCategory(nextCat)
    const next = new URLSearchParams(searchParams)
    if (nextCat === 'All') next.delete('category')
    else next.set('category', nextCat)
    setSearchParams(next, { replace: true })
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            <BookOpen className="text-brand-500" /> Guided Lessons &amp; Curriculum Tracks
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Interactive 5-step micro-lessons pairing Predict–Observe–Explain labs, worked examples,
            and FSRS flashcards. Self-learners can explore any track freely.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip color="brand">
            <Compass size={12} /> {tracks.length} tracks
          </Chip>
          <Chip color="emerald">
            <Check size={12} /> {totals.lessonsDone}/{totals.lessonsTotal} lessons done
          </Chip>
        </div>
      </header>

      {/* Resume-where-you-left-off CTA */}
      {resumePick && (
        <Card className="border-brand-500/30 bg-gradient-to-br from-brand-500/10 via-violet-500/5 to-cyan-500/10 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-2xl">
                {findPack(resumePick.track.packId)?.icon ?? subjectEmoji(resumePick.track.subject)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip color="brand">
                    <Sparkles size={11} />
                    {resumePick.inProgress ? 'Resume where you left off' : 'Recommended next lesson'}
                  </Chip>
                  <MasteryPill level={resumePick.lesson.masteryLevel} />
                </div>
                <h2 className="mt-2 truncate font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  {resumePick.lesson.title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {resumePick.track.title} · {resumePick.unitTitle} · ~
                  {resumePick.lesson.estimatedMinutes} min · {resumePick.lesson.stepCount} steps
                </p>
              </div>
            </div>
            <Link
              to={`/student/lessons/${resumePick.lesson.id}`}
              className="btn-primary shrink-0"
            >
              <Play size={15} />
              {resumePick.inProgress ? 'Resume lesson' : 'Start lesson'}
              <ArrowRight size={15} />
            </Link>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tracks, units, lessons, or phenomena…"
              aria-label="Search lessons and curriculum tracks"
              className="pl-10"
            />
          </div>
          <Link to="/student/flashcards" className="btn-ghost">
            <Layers size={15} /> Open Flashcards
          </Link>
        </div>

        <div
          className="flex flex-wrap gap-1.5"
          role="tablist"
          aria-label="Filter curriculum tracks by subject"
        >
          {(['All', ...SUBJECT_GROUPS] as const).map((group) => {
            const active = category.toLowerCase() === group.toLowerCase()
            return (
              <button
                key={group}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => pickCategory(group)}
                className={cn(
                  'chip cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  active
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 dark:text-slate-300',
                )}
              >
                {group}
              </button>
            )
          })}
        </div>
      </div>

      {/* Curriculum Track Cards */}
      {filteredTracks.length === 0 ? (
        <EmptyState
          icon="🧭"
          title="No curriculum tracks match that filter"
          description="Try selecting All subjects or clearing your search query."
          action={
            <button
              type="button"
              onClick={() => {
                setSearch('')
                pickCategory('All')
              }}
              className="btn-ghost"
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {filteredTracks.map((track) => {
            const pack = findPack(track.packId)
            const icon = pack?.icon ?? subjectEmoji(track.subject)
            const progressRatio =
              track.totalLessons > 0 ? track.completedLessons / track.totalLessons : 0
            const progressPct = Math.round(progressRatio * 100)
            const totalMinutes = track.units.reduce(
              (sum, unit) =>
                sum + unit.lessons.reduce((uSum, lesson) => uSum + lesson.estimatedMinutes, 0),
              0,
            )

            const isAutoExpanded =
              focusedTrackParam === track.id ||
              focusedTrackParam === track.packId ||
              focusedTrackParam === track.slug ||
              search.trim().length > 0 ||
              (track.completedLessons > 0 && track.completedLessons < track.totalLessons) ||
              filteredTracks.length <= 2
            const isExpanded =
              expandedTracks.has(track.id) ||
              (isAutoExpanded && !expandedTracks.has(`closed:${track.id}`))

            const handleToggle = () => {
              if (expandedTracks.has(track.id)) {
                setExpandedTracks((prev) => {
                  const next = new Set(prev)
                  next.delete(track.id)
                  next.add(`closed:${track.id}`)
                  return next
                })
              } else if (isAutoExpanded && !expandedTracks.has(`closed:${track.id}`)) {
                setExpandedTracks((prev) => {
                  const next = new Set(prev)
                  next.add(`closed:${track.id}`)
                  return next
                })
              } else {
                setExpandedTracks((prev) => {
                  const next = new Set(prev)
                  next.delete(`closed:${track.id}`)
                  next.add(track.id)
                  return next
                })
              }
            }

            const prereqNames = track.prerequisiteTrackIds
              .map((pid) => trackLookup.get(pid)?.title ?? pid)
              .filter(Boolean)

            const nextLessonInTrack =
              track.units
                .flatMap((u) => u.lessons)
                .find((l) => !l.completed && l.unlocked) ??
              track.units.flatMap((u) => u.lessons).find((l) => !l.completed) ??
              track.units[0]?.lessons[0]

            return (
              <Card key={track.id} id={`track-${track.id}`} className="overflow-hidden p-5 sm:p-6">
                {/* Track Header */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-2xl dark:bg-white/10">
                        {icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Chip color="slate">{track.category}</Chip>
                          <Chip color="brand">{GRADE_BAND_LABELS[track.gradeBand]}</Chip>
                          <MasteryPill level={track.masteryLevel} />
                          {track.units.length > 0 && (
                            <span className="text-xs font-medium text-slate-400">
                              {track.units.length} unit{track.units.length === 1 ? '' : 's'} · ~
                              {totalMinutes} min total
                            </span>
                          )}
                        </div>
                        <h2 className="mt-1.5 font-display text-xl font-extrabold text-slate-900 dark:text-white">
                          {track.title}
                        </h2>
                        {pack?.description && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {pack.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {nextLessonInTrack && (
                        <Link
                          to={`/student/lessons/${nextLessonInTrack.id}`}
                          className="btn-primary"
                        >
                          <Play size={14} />
                          {track.completedLessons > 0 ? 'Continue' : 'Start track'}
                        </Link>
                      )}
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={handleToggle}
                        className="btn-ghost"
                      >
                        {isExpanded ? 'Hide units' : `Explore ${track.totalLessons} lessons`}
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Soft-recommended prerequisite badges */}
                  {prereqNames.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-700 dark:text-amber-300">
                        <Compass size={12} />
                        Recommended first: {prereqNames.join(', ')}
                      </span>
                      <span className="text-slate-400">
                        (Soft recommendation — self-learners can jump in anytime)
                      </span>
                    </div>
                  )}

                  {/* Progress bar + MIT/OER attribution */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">
                        {track.completedLessons} of {track.totalLessons} lessons completed
                      </span>
                      <span className="font-mono text-brand-600 dark:text-brand-300">
                        {progressPct}%
                      </span>
                    </div>
                    <ProgressBar value={progressRatio} />
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                      <span>
                        License: <strong className="text-slate-600 dark:text-slate-300">{track.license}</strong> ·{' '}
                        {track.sourceAttribution}
                      </span>
                      <span>
                        FSRS mode:{' '}
                        {track.srsInterleaveDefault ? 'Interleaved mix' : 'Focused blocked deck'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unit & Lesson Breakdown */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 flex flex-col gap-4 border-t border-slate-200/80 pt-5 dark:border-white/10">
                        {track.units.map((unit, uIdx) => {
                          const unitDone = unit.lessons.filter((l) => l.completed).length
                          return (
                            <div
                              key={unit.id}
                              className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.02]"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <span className="text-[11px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                                    Unit {uIdx + 1}
                                  </span>
                                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                                    {unit.title}
                                  </h3>
                                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Anchoring phenomenon: {unit.anchoringPhenomenon}
                                  </p>
                                </div>
                                <Chip color={unitDone === unit.lessons.length ? 'emerald' : 'slate'}>
                                  {unitDone}/{unit.lessons.length} done
                                </Chip>
                              </div>

                              <ul className="mt-3 flex flex-col gap-2">
                                {unit.lessons.map((lesson, lIdx) => {
                                  const visualBadge = VISUAL_BADGE_LABEL[lesson.visualKind]
                                  const assignmentTitle = requiredLessonTitles.get(lesson.id)
                                  const prereqTitles = lesson.prerequisiteLessonIds.map(
                                    (pid) => lessonTitleLookup.get(pid) ?? pid,
                                  )
                                  return (
                                    <li key={lesson.id}>
                                      <Link
                                        to={`/student/lessons/${lesson.id}`}
                                        className={cn(
                                          'group flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                                          lesson.completed
                                            ? 'border-emerald-500/25 bg-emerald-500/[0.04] hover:border-emerald-500/50'
                                            : 'border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-500/[0.03] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-400/60',
                                        )}
                                      >
                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                          <span
                                            className={cn(
                                              'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                                              lesson.completed
                                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                                : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
                                            )}
                                          >
                                            {lesson.completed ? <Check size={14} /> : lIdx + 1}
                                          </span>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="font-display text-sm font-bold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                                                {lesson.title}
                                              </span>
                                              <MasteryPill level={lesson.masteryLevel} />
                                              {visualBadge && (
                                                <Chip color="brand">
                                                  <Box size={11} /> {visualBadge}
                                                </Chip>
                                              )}
                                              {assignmentTitle && (
                                                <Chip color="rose">
                                                  <Lock size={11} /> Required for: {assignmentTitle}
                                                </Chip>
                                              )}
                                            </div>
                                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                                              {lesson.summary}
                                            </p>
                                            {!lesson.unlocked && prereqTitles.length > 0 && (
                                              <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-300">
                                                Recommended first: {prereqTitles.join(', ')}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                          <span className="inline-flex items-center gap-1">
                                            <Clock size={12} /> ~{lesson.estimatedMinutes}m
                                          </span>
                                          <span>{lesson.stepCount} steps</span>
                                          <span className="inline-flex items-center gap-1 font-bold text-brand-600 dark:text-brand-300">
                                            {lesson.completed
                                              ? 'Review'
                                              : lesson.masteryLevel !== 'unstarted'
                                                ? 'Resume'
                                                : 'Start'}
                                            <ArrowRight size={13} />
                                          </span>
                                        </div>
                                      </Link>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Lessons
