import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireAuth } from '../lib/auth'
import { notFound, parse } from '../lib/http'
import { CONTENT_PACKS, type ContentPack } from '../../shared/packs'
import {
  MASTERY_LEVELS,
  type CurriculumTrack,
  type MasteryLevel,
  type PackLesson,
  type TrackSubjectGroup,
  type TrackUnit,
} from '../../shared/lessons'
import { LessonProgressSubmitSchema, type Difficulty } from '../../shared/schemas'
import { isoDay } from '../../shared/srs'
import type {
  CurriculumTrackDTO,
  LessonDetailDTO,
  LessonProgressDTO,
  LessonSummaryDTO,
  TrackDetailDTO,
  TrackUnitDTO,
} from '../../shared/types'

const MASTERY_RANK: Record<MasteryLevel, number> = {
  unstarted: 0,
  attempted: 1,
  familiar: 2,
  proficient: 3,
  mastered: 4,
}

function higherMastery(a: MasteryLevel, b: MasteryLevel): MasteryLevel {
  return MASTERY_RANK[a] >= MASTERY_RANK[b] ? a : b
}

function inferSubjectGroup(subject: string, category: string): TrackSubjectGroup {
  const hay = `${subject} ${category}`.toLowerCase()
  if (
    hay.includes('math') ||
    hay.includes('geometr') ||
    hay.includes('algebra') ||
    hay.includes('calculus') ||
    hay.includes('trig') ||
    hay.includes('stat') ||
    hay.includes('number')
  ) {
    return 'Math'
  }
  if (
    hay.includes('computer') ||
    hay.includes('cyber') ||
    hay.includes('code') ||
    hay.includes('algorithm') ||
    hay.includes('data struct') ||
    hay.includes('network') ||
    hay.includes('tech')
  ) {
    return 'CS'
  }
  if (hay.includes('econ') || hay.includes('financ') || hay.includes('business')) {
    return 'Economics'
  }
  if (
    hay.includes('lang') ||
    hay.includes('spanish') ||
    hay.includes('french') ||
    hay.includes('german') ||
    hay.includes('latin')
  ) {
    return 'Languages'
  }
  if (
    hay.includes('history') ||
    hay.includes('civic') ||
    hay.includes('gov') ||
    hay.includes('art') ||
    hay.includes('humanit') ||
    hay.includes('music') ||
    hay.includes('geo')
  ) {
    return 'History'
  }
  return 'Science'
}

function normalizePackTrack(pack: ContentPack): CurriculumTrack | null {
  if (pack.track) {
    return {
      ...pack.track,
      packId: pack.track.packId || pack.id,
      license: pack.track.license ?? pack.license ?? 'MIT',
      sourceAttribution:
        pack.track.sourceAttribution ||
        pack.sourceAttribution ||
        'OpenPath Curriculum Collective (MIT)',
      srsInterleaveDefault: pack.track.srsInterleaveDefault ?? pack.srsInterleave ?? true,
    }
  }

  const units: TrackUnit[] | null = pack.units?.length
    ? pack.units
    : pack.lessons?.length
      ? [
          {
            id: `${pack.id}-unit-1`,
            title: pack.name,
            anchoringPhenomenon: pack.description,
            lessons: pack.lessons,
          },
        ]
      : null

  if (!units || units.length === 0) return null

  return {
    id: `track-${pack.id}`,
    slug: pack.id,
    packId: pack.id,
    title: pack.name,
    category: inferSubjectGroup(pack.subject, pack.category),
    subject: pack.subject,
    gradeBand: pack.gradeBand ?? 'HS',
    license: pack.license ?? 'MIT',
    sourceAttribution:
      pack.sourceAttribution ?? 'OpenPath Curriculum Collective (MIT)',
    prerequisiteTrackIds: pack.prerequisitePackIds ?? [],
    srsInterleaveDefault: pack.srsInterleave ?? true,
    units,
  }
}

function catalogTracks(): CurriculumTrack[] {
  const tracks: CurriculumTrack[] = []
  for (const pack of CONTENT_PACKS) {
    const track = normalizePackTrack(pack)
    if (track && track.units.some((u) => u.lessons.length > 0)) {
      tracks.push(track)
    }
  }
  return tracks
}

function flashcardIdFor(lessonId: string, seedId: string | undefined, index: number): string {
  return seedId?.trim() ? seedId.trim() : `${lessonId}:fc:${index}`
}

/**
 * Syncs structured tracks, lessons, and lesson flashcards from CONTENT_PACKS
 * into SQLite so both fresh databases and upgraded DBs immediately expose the
 * full track/lesson catalog and foreign-keyed assignment lookups.
 */
export function syncCurriculumToDb(): void {
  const tracks = catalogTracks()
  db.transaction(() => {
    const upsertTrack = db.prepare(
      `INSERT INTO curriculum_tracks
         (id, slug, pack_id, title, category, subject, grade_band, license,
          source_attribution, prerequisite_track_ids_json, srs_interleave_default,
          units_json, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         slug = excluded.slug,
         pack_id = excluded.pack_id,
         title = excluded.title,
         category = excluded.category,
         subject = excluded.subject,
         grade_band = excluded.grade_band,
         license = excluded.license,
         source_attribution = excluded.source_attribution,
         prerequisite_track_ids_json = excluded.prerequisite_track_ids_json,
         srs_interleave_default = excluded.srs_interleave_default,
         units_json = excluded.units_json,
         sort_order = excluded.sort_order,
         updated_at = datetime('now')`,
    )

    const upsertLesson = db.prepare(
      `INSERT INTO lessons
         (id, track_id, unit_id, pack_id, title, summary, estimated_minutes,
          standards_json, prerequisite_lesson_ids_json, visual_json, steps_json,
          flashcard_seeds_json, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         track_id = excluded.track_id,
         unit_id = excluded.unit_id,
         pack_id = excluded.pack_id,
         title = excluded.title,
         summary = excluded.summary,
         estimated_minutes = excluded.estimated_minutes,
         standards_json = excluded.standards_json,
         prerequisite_lesson_ids_json = excluded.prerequisite_lesson_ids_json,
         visual_json = excluded.visual_json,
         steps_json = excluded.steps_json,
         flashcard_seeds_json = excluded.flashcard_seeds_json,
         sort_order = excluded.sort_order,
         updated_at = datetime('now')`,
    )

    const upsertFlashcard = db.prepare(
      `INSERT INTO lesson_flashcards
         (id, lesson_id, track_id, pack_id, subject, front, back, explanation, interleave)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         lesson_id = excluded.lesson_id,
         track_id = excluded.track_id,
         pack_id = excluded.pack_id,
         subject = excluded.subject,
         front = excluded.front,
         back = excluded.back,
         explanation = excluded.explanation,
         interleave = excluded.interleave`,
    )

    const backfillQuiz = db.prepare(
      `UPDATE quizzes
       SET pack_id = ?, model_id = COALESCE(model_id, ?), standards = COALESCE(standards, ?),
           lesson_id = COALESCE(lesson_id, ?), srs_interleave = ?
       WHERE title = ? AND pack_id IS NULL`,
    )

    tracks.forEach((track, trackIdx) => {
      const unitMeta = track.units.map((u) => ({
        id: u.id,
        title: u.title,
        anchoringPhenomenon: u.anchoringPhenomenon,
        capstoneQuizIndex: u.capstoneQuizIndex,
        masteryGate: u.masteryGate,
        lessonIds: u.lessons.map((l) => l.id),
      }))
      upsertTrack.run(
        track.id,
        track.slug,
        track.packId,
        track.title,
        track.category,
        track.subject,
        track.gradeBand,
        track.license,
        track.sourceAttribution,
        JSON.stringify(track.prerequisiteTrackIds),
        track.srsInterleaveDefault ? 1 : 0,
        JSON.stringify(unitMeta),
        trackIdx,
      )

      let lessonOrder = 0
      for (const unit of track.units) {
        for (const lesson of unit.lessons) {
          upsertLesson.run(
            lesson.id,
            track.id,
            unit.id,
            track.packId,
            lesson.title,
            lesson.summary,
            lesson.estimatedMinutes,
            JSON.stringify(lesson.standards),
            JSON.stringify(lesson.prerequisiteLessonIds),
            lesson.visual ? JSON.stringify(lesson.visual) : null,
            JSON.stringify(lesson.steps),
            JSON.stringify(lesson.flashcardSeeds ?? []),
            lessonOrder++,
          )

          ;(lesson.flashcardSeeds ?? []).forEach((seed, idx) => {
            const cardId = flashcardIdFor(lesson.id, seed.id, idx)
            const interleave = (seed.interleave ?? track.srsInterleaveDefault) ? 1 : 0
            upsertFlashcard.run(
              cardId,
              lesson.id,
              track.id,
              track.packId,
              track.subject,
              seed.front,
              seed.back,
              seed.explanation ?? '',
              interleave,
            )
          })
        }
      }
    })

    for (const pack of CONTENT_PACKS) {
      for (const quiz of pack.quizzes) {
        backfillQuiz.run(
          pack.id,
          quiz.modelId ?? pack.modelId ?? null,
          pack.standards ?? null,
          quiz.lessonId ?? null,
          (quiz.srsInterleave ?? pack.srsInterleave ?? true) ? 1 : 0,
          quiz.title,
        )
      }
    }
  })()
}

interface ProgressRow {
  user_id: string
  lesson_id: string
  track_id: string
  pack_id: string
  completed: number
  completed_steps_json: string
  highest_step_index: number
  checkpoint_correct_count: number
  checkpoint_total_count: number
  challenge_completed: number
  mastery_level: string
  score_pct: number
  time_spent_sec: number
  completed_at: string | null
  updated_at: string
}

function progressMapForUser(userId: string): Map<string, ProgressRow> {
  const rows = db
    .prepare('SELECT * FROM lesson_progress WHERE user_id = ?')
    .all(userId) as ProgressRow[]
  return new Map(rows.map((r) => [r.lesson_id, r]))
}

function parseJsonArray<T>(raw: string | null | undefined, fallback: T[] = []): T[] {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T[]
  } catch {
    return fallback
  }
}

function asMasteryLevel(raw: string | undefined): MasteryLevel {
  return (MASTERY_LEVELS as readonly string[]).includes(raw ?? '')
    ? (raw as MasteryLevel)
    : 'unstarted'
}

function toProgressDTO(
  row: ProgressRow | undefined,
  lesson: PackLesson,
  track: CurriculumTrack,
): LessonProgressDTO {
  if (!row) {
    return {
      lessonId: lesson.id,
      trackId: track.id,
      packId: track.packId,
      completed: false,
      completedSteps: [],
      highestStepIndex: 0,
      checkpointCorrectCount: 0,
      checkpointTotalCount: 0,
      challengeCompleted: false,
      masteryLevel: 'unstarted',
      scorePct: 0,
      timeSpentSec: 0,
      completedAt: null,
      updatedAt: new Date(0).toISOString(),
    }
  }
  return {
    lessonId: row.lesson_id,
    trackId: row.track_id,
    packId: row.pack_id,
    completed: row.completed === 1,
    completedSteps: parseJsonArray<string>(row.completed_steps_json),
    highestStepIndex: row.highest_step_index,
    checkpointCorrectCount: row.checkpoint_correct_count,
    checkpointTotalCount: row.checkpoint_total_count,
    challengeCompleted: row.challenge_completed === 1,
    masteryLevel: asMasteryLevel(row.mastery_level),
    scorePct: row.score_pct,
    timeSpentSec: row.time_spent_sec,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  }
}

function visualKindOf(lesson: PackLesson): 'model-3d' | 'model-2d' | 'figure-2d' | 'none' {
  if (lesson.visual && lesson.visual.kind !== 'none') return lesson.visual.kind
  for (const step of lesson.steps) {
    if ('visual' in step && step.visual && step.visual.kind !== 'none') {
      return step.visual.kind
    }
  }
  return 'none'
}

function buildTrackDTO(
  track: CurriculumTrack,
  progressByLesson: Map<string, ProgressRow>,
): CurriculumTrackDTO {
  let totalLessons = 0
  let completedLessons = 0
  let lowestBestRank = MASTERY_RANK.mastered
  let anyStarted = false

  const units: TrackUnitDTO[] = track.units.map((unit) => {
    const lessons: LessonSummaryDTO[] = unit.lessons.map((lesson) => {
      totalLessons++
      const row = progressByLesson.get(lesson.id)
      const completed = row?.completed === 1
      if (completed) completedLessons++
      const masteryLevel = asMasteryLevel(row?.mastery_level)
      if (masteryLevel !== 'unstarted') anyStarted = true
      lowestBestRank = Math.min(lowestBestRank, MASTERY_RANK[masteryLevel])

      const unlocked = lesson.prerequisiteLessonIds.every(
        (preId) => progressByLesson.get(preId)?.completed === 1,
      )
      const visualKind = visualKindOf(lesson)

      return {
        id: lesson.id,
        unitId: unit.id,
        trackId: track.id,
        packId: track.packId,
        title: lesson.title,
        summary: lesson.summary,
        estimatedMinutes: lesson.estimatedMinutes,
        standards: lesson.standards,
        prerequisiteLessonIds: lesson.prerequisiteLessonIds,
        hasVisual: visualKind !== 'none',
        visualKind,
        unlocked,
        completed,
        masteryLevel,
        stepCount: lesson.steps.length,
      }
    })
    return {
      id: unit.id,
      title: unit.title,
      anchoringPhenomenon: unit.anchoringPhenomenon,
      capstoneQuizIndex: unit.capstoneQuizIndex,
      masteryGate: unit.masteryGate,
      lessons,
    }
  })

  let trackMastery: MasteryLevel = 'unstarted'
  if (totalLessons > 0 && completedLessons === totalLessons) {
    trackMastery = MASTERY_LEVELS[lowestBestRank] ?? 'proficient'
  } else if (completedLessons > 0) {
    trackMastery = 'familiar'
  } else if (anyStarted) {
    trackMastery = 'attempted'
  }

  return {
    id: track.id,
    slug: track.slug,
    packId: track.packId,
    title: track.title,
    category: track.category,
    subject: track.subject,
    gradeBand: track.gradeBand,
    license: track.license,
    sourceAttribution: track.sourceAttribution,
    prerequisiteTrackIds: track.prerequisiteTrackIds,
    srsInterleaveDefault: track.srsInterleaveDefault,
    totalLessons,
    completedLessons,
    masteryLevel: trackMastery,
    units,
  }
}

function findLessonLocation(lessonId: string): {
  track: CurriculumTrack
  unit: TrackUnit
  lesson: PackLesson
  flatLessons: PackLesson[]
  flatIndex: number
} | null {
  for (const track of catalogTracks()) {
    const flatLessons: PackLesson[] = track.units.flatMap((u) => u.lessons)
    for (const unit of track.units) {
      const lesson = unit.lessons.find((l) => l.id === lessonId)
      if (lesson) {
        const flatIndex = flatLessons.findIndex((l) => l.id === lessonId)
        return { track, unit, lesson, flatLessons, flatIndex }
      }
    }
  }
  return null
}

function lessonHasChallenge(lesson: PackLesson): boolean {
  if (
    lesson.visual &&
    (lesson.visual.kind === 'model-3d' || lesson.visual.kind === 'model-2d') &&
    Boolean(lesson.visual.targetChallenge || lesson.visual.challengeId)
  ) {
    return true
  }
  return lesson.steps.some(
    (s) =>
      'visual' in s &&
      s.visual &&
      (s.visual.kind === 'model-3d' || s.visual.kind === 'model-2d') &&
      Boolean(s.visual.targetChallenge || s.visual.challengeId),
  )
}

function lessonNeedsAutoEnroll(lesson: PackLesson): boolean {
  const synth = lesson.steps.find((s) => s.kind === 'synthesis')
  if (synth && synth.kind === 'synthesis') {
    return synth.flashcardEnroll.autoEnroll
  }
  return Boolean(lesson.flashcardSeeds?.length)
}

function computeMastery(args: {
  lesson: PackLesson
  completed: boolean
  completedSteps: string[]
  highestStepIndex: number
  scorePct: number
  challengeCompleted: boolean
}): MasteryLevel {
  if (args.completed) {
    const needsChallenge = lessonHasChallenge(args.lesson)
    if (args.scorePct >= 85 && (!needsChallenge || args.challengeCompleted)) {
      return 'mastered'
    }
    if (args.scorePct >= 70) return 'proficient'
    return 'familiar'
  }
  if (args.completedSteps.length >= Math.ceil(args.lesson.steps.length / 2)) {
    return 'familiar'
  }
  if (args.completedSteps.length > 0 || args.highestStepIndex > 0) {
    return 'attempted'
  }
  return 'unstarted'
}

export const trackRoutes: FastifyPluginAsync = async (app) => {
  // ── List curriculum tracks with user progress ───────────────
  app.get('/', async (request) => {
    const user = await requireAuth(request)
    const query = (request.query ?? {}) as Record<string, unknown>
    const category =
      typeof query.category === 'string' && query.category.trim()
        ? query.category.trim().toLowerCase()
        : null
    const q =
      typeof query.q === 'string' && query.q.trim()
        ? query.q.trim().toLowerCase()
        : null

    const progressMap = progressMapForUser(user.id)
    let tracks = catalogTracks().map((t) => buildTrackDTO(t, progressMap))
    if (category && category !== 'all') {
      tracks = tracks.filter((t) => t.category.toLowerCase() === category)
    }
    if (q) {
      tracks = tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.units.some(
            (u) =>
              u.title.toLowerCase().includes(q) ||
              u.lessons.some((l) => l.title.toLowerCase().includes(q)),
          ),
      )
    }
    return { tracks }
  })

  // ── Single curriculum track detail ──────────────────────────
  app.get<{ Params: { id: string } }>('/:id', async (request): Promise<TrackDetailDTO> => {
    const user = await requireAuth(request)
    const needle = request.params.id
    const track = catalogTracks().find(
      (t) => t.id === needle || t.slug === needle || t.packId === needle,
    )
    if (!track) throw notFound('Curriculum track not found')

    const progressMap = progressMapForUser(user.id)
    const trackDTO = buildTrackDTO(track, progressMap)

    const quizRows = db
      .prepare(
        `SELECT q.id, q.title, q.difficulty, COUNT(qs.id) as question_count
         FROM quizzes q
         LEFT JOIN questions qs ON qs.quiz_id = q.id
         WHERE q.published = 1 AND q.pack_id = ?
         GROUP BY q.id
         ORDER BY CASE q.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, q.title ASC`,
      )
      .all(track.packId) as {
      id: string
      title: string
      difficulty: Difficulty
      question_count: number
    }[]

    return {
      track: trackDTO,
      relatedQuizzes: quizRows.map((row) => ({
        id: row.id,
        title: row.title,
        difficulty: row.difficulty,
        questionCount: row.question_count,
      })),
    }
  })
}

export const lessonRoutes: FastifyPluginAsync = async (app) => {
  // ── Full lesson detail ──────────────────────────────────────
  app.get<{ Params: { id: string } }>('/:id', async (request): Promise<LessonDetailDTO> => {
    const user = await requireAuth(request)
    const found = findLessonLocation(request.params.id)
    if (!found) throw notFound('Lesson not found')

    const { track, unit, lesson, flatLessons, flatIndex } = found
    const progressMap = progressMapForUser(user.id)
    const trackDTO = buildTrackDTO(track, progressMap)
    const unitDTO = trackDTO.units.find((u) => u.id === unit.id)!
    const progress = toProgressDTO(progressMap.get(lesson.id), lesson, track)

    const lessonTitleLookup = new Map<string, string>(
      catalogTracks().flatMap((t) =>
        t.units.flatMap((u) => u.lessons.map((l) => [l.id, l.title] as const)),
      ),
    )

    const prerequisiteLessons = lesson.prerequisiteLessonIds.map((id) => ({
      id,
      title: lessonTitleLookup.get(id) ?? id,
      completed: progressMap.get(id)?.completed === 1,
    }))
    const prerequisitesMet = prerequisiteLessons.every((p) => p.completed)

    const prevLessonId = flatIndex > 0 ? flatLessons[flatIndex - 1].id : null
    const nextLessonId =
      flatIndex >= 0 && flatIndex + 1 < flatLessons.length
        ? flatLessons[flatIndex + 1].id
        : null

    const linkedQuiz =
      (db
        .prepare(
          `SELECT id FROM quizzes
           WHERE published = 1 AND (lesson_id = ? OR pack_id = ?)
           ORDER BY (lesson_id = ?) DESC, CASE difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
           LIMIT 1`,
        )
        .get(lesson.id, track.packId, lesson.id) as { id: string } | undefined) ?? null

    const enrolledFlashcardCount = (
      db
        .prepare(
          `SELECT COUNT(*) as n FROM lesson_flashcard_states s
           JOIN lesson_flashcards lf ON lf.id = s.flashcard_id
           WHERE s.user_id = ? AND lf.lesson_id = ?`,
        )
        .get(user.id, lesson.id) as { n: number }
    ).n

    const { units: _units, ...trackMeta } = trackDTO
    const { lessons: _lessons, ...unitMeta } = unitDTO
    return {
      lesson,
      track: trackMeta,
      unit: unitMeta,
      progress,
      prerequisitesMet,
      prerequisiteLessons,
      nextLessonId,
      prevLessonId,
      linkedQuizId: linkedQuiz?.id ?? null,
      enrolledFlashcardCount,
    }
  })

  // ── Record step / completion progress & enroll SRS seeds ────
  app.post<{ Params: { id: string } }>('/:id/progress', async (request) => {
    const user = await requireAuth(request)
    const found = findLessonLocation(request.params.id)
    if (!found) throw notFound('Lesson not found')

    const { track, lesson } = found
    const input = parse(LessonProgressSubmitSchema, request.body)

    const existing = db
      .prepare('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?')
      .get(user.id, lesson.id) as ProgressRow | undefined

    const stepSet = new Set<string>(
      parseJsonArray<string>(existing?.completed_steps_json),
    )
    if (input.stepId) stepSet.add(input.stepId)
    for (const s of input.completedSteps ?? []) stepSet.add(s)
    const completedSteps = Array.from(stepSet)

    const highestStepIndex = Math.max(
      existing?.highest_step_index ?? 0,
      input.stepIndex ?? 0,
      completedSteps.length,
    )
    const completed = Boolean(existing?.completed === 1 || input.completed)
    const challengeCompleted = Boolean(
      existing?.challenge_completed === 1 || input.challengeCompleted,
    )
    const checkpointCorrect = Math.max(
      existing?.checkpoint_correct_count ?? 0,
      input.checkpointCorrectCount ?? 0,
    )
    const checkpointTotal = Math.max(
      existing?.checkpoint_total_count ?? 0,
      input.checkpointTotalCount ?? 0,
    )

    let computedScore = existing?.score_pct ?? 0
    if (input.score !== undefined) {
      computedScore = Math.max(computedScore, input.score)
    } else if (checkpointTotal > 0) {
      computedScore = Math.max(
        computedScore,
        Math.round((checkpointCorrect / checkpointTotal) * 100),
      )
    } else if (completed) {
      computedScore = Math.max(computedScore, 100)
    } else {
      computedScore = Math.max(
        computedScore,
        Math.round((completedSteps.length / Math.max(1, lesson.steps.length)) * 100),
      )
    }

    const masteryLevel = higherMastery(
      asMasteryLevel(existing?.mastery_level),
      computeMastery({
        lesson,
        completed,
        completedSteps,
        highestStepIndex,
        scorePct: computedScore,
        challengeCompleted,
      }),
    )

    const timeSpentSec =
      (existing?.time_spent_sec ?? 0) + (input.timeSpentSec ?? 0)
    const completedAt = completed
      ? (existing?.completed_at ?? new Date().toISOString())
      : null

    let enrolledFlashcards = 0
    const today = isoDay()

    db.transaction(() => {
      db.prepare(
        `INSERT INTO lesson_progress
           (user_id, lesson_id, track_id, pack_id, completed, completed_steps_json,
            highest_step_index, checkpoint_correct_count, checkpoint_total_count,
            challenge_completed, mastery_level, score_pct, time_spent_sec,
            completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, lesson_id) DO UPDATE SET
           completed = excluded.completed,
           completed_steps_json = excluded.completed_steps_json,
           highest_step_index = excluded.highest_step_index,
           checkpoint_correct_count = excluded.checkpoint_correct_count,
           checkpoint_total_count = excluded.checkpoint_total_count,
           challenge_completed = excluded.challenge_completed,
           mastery_level = excluded.mastery_level,
           score_pct = excluded.score_pct,
           time_spent_sec = excluded.time_spent_sec,
           completed_at = COALESCE(lesson_progress.completed_at, excluded.completed_at),
           updated_at = datetime('now')`,
      ).run(
        user.id,
        lesson.id,
        track.id,
        track.packId,
        completed ? 1 : 0,
        JSON.stringify(completedSteps),
        highestStepIndex,
        checkpointCorrect,
        checkpointTotal,
        challengeCompleted ? 1 : 0,
        masteryLevel,
        computedScore,
        timeSpentSec,
        completedAt,
      )

      const upsertSkill = db.prepare(
        `INSERT INTO skill_mastery (user_id, skill_id, level, score_pct, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, skill_id) DO UPDATE SET
           level = excluded.level,
           score_pct = MAX(skill_mastery.score_pct, excluded.score_pct),
           updated_at = datetime('now')`,
      )

      for (const std of lesson.standards) {
        const cur = db
          .prepare('SELECT level FROM skill_mastery WHERE user_id = ? AND skill_id = ?')
          .get(user.id, std) as { level: string } | undefined
        upsertSkill.run(
          user.id,
          std,
          higherMastery(asMasteryLevel(cur?.level), masteryLevel),
          computedScore,
        )
      }

      const shouldEnroll =
        Boolean(lesson.flashcardSeeds?.length) &&
        (input.enrollFlashcards === true ||
          (completed && lessonNeedsAutoEnroll(lesson)))

      if (shouldEnroll) {
        const insertState = db.prepare(
          `INSERT OR IGNORE INTO lesson_flashcard_states
             (user_id, flashcard_id, stability, difficulty, reps, lapses, due_date)
           VALUES (?, ?, 0, 0, 0, 0, ?)`,
        )
        for (let i = 0; i < (lesson.flashcardSeeds?.length ?? 0); i++) {
          const seed = lesson.flashcardSeeds![i]
          const fcId = flashcardIdFor(lesson.id, seed.id, i)
          const res = insertState.run(user.id, fcId, today)
          if (res.changes > 0) enrolledFlashcards++
        }
      }
    })()

    const updatedRow = db
      .prepare('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?')
      .get(user.id, lesson.id) as ProgressRow | undefined

    const progressMap = progressMapForUser(user.id)
    const unlockedLessonIds = track.units
      .flatMap((u) => u.lessons)
      .filter(
        (l) =>
          l.prerequisiteLessonIds.includes(lesson.id) &&
          l.prerequisiteLessonIds.every((id) => progressMap.get(id)?.completed === 1),
      )
      .map((l) => l.id)

    return {
      progress: toProgressDTO(updatedRow, lesson, track),
      enrolledFlashcards,
      unlockedLessonIds,
    }
  })
}
