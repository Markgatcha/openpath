import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireRole } from '../lib/auth'
import { notFound, parse } from '../lib/http'
import {
  initialSrsState,
  interleaveQueue,
  isoDay,
  schedule,
  type SrsState,
} from '../../shared/srs'
import { SrsReviewSchema } from '../../shared/schemas'
import { buildFigureGeometry, type FigureGeometry, type FigureSpec } from '../../shared/figure'
import type { QuestionRow, QuizRow } from '../../shared/types'
import type { QuestionType } from '../../shared/schemas'

/** The answer as a student should see it on the back of a flashcard. */
function answerBack(question: QuestionRow): string {
  switch (question.type) {
    case 'mcq': {
      const options = question.options_json
        ? (JSON.parse(question.options_json) as string[])
        : []
      return options[JSON.parse(question.correct_json) as number] ?? '—'
    }
    case 'truefalse':
      return JSON.parse(question.correct_json) ? 'True' : 'False'
    case 'fill': {
      const alternatives = question.alternatives_json
        ? (JSON.parse(question.alternatives_json) as string[])
        : []
      return [JSON.parse(question.correct_json) as string, ...alternatives].join(' / ')
    }
    case 'order': {
      const options = question.options_json
        ? (JSON.parse(question.options_json) as string[])
        : []
      const order = JSON.parse(question.correct_json) as number[]
      return order.map((index) => options[index]).join(' → ')
    }
    case 'figure':
      return String(roundForDisplay(JSON.parse(question.correct_json) as number))
  }
}

function roundForDisplay(value: number): number {
  return Math.round(value * 100) / 100
}

interface DueCard {
  questionId: string
  quizId: string
  quizTitle: string
  subject: string
  prompt: string
  type: QuestionType
  isNew: boolean
  /** Practice-only: answers arrive with the queue and must not be shown before reveal. */
  answer: string
  explanation: string
  /** Deck grouping key used by the interleaver (the quiz id). */
  category: string
  state: SrsState | null
  options: string[] | null
  figure: FigureGeometry | null
  interleave: boolean
  packId: string | null
  sourceType: 'question' | 'lesson-flashcard'
}

interface SrsFilters {
  quizId?: string
  packId?: string
}

function parseSrsFilters(query: unknown): SrsFilters {
  const q = (query ?? {}) as Record<string, unknown>
  const quizId = typeof q.quizId === 'string' && q.quizId.trim() ? q.quizId.trim() : undefined
  const packId = typeof q.packId === 'string' && q.packId.trim() ? q.packId.trim() : undefined
  return { quizId, packId }
}

function orderByInterleave<T extends { category: string; interleave?: boolean }>(
  items: T[],
): T[] {
  const interleaved = items.filter((item) => item.interleave !== false)
  const blocked = items.filter((item) => item.interleave === false)
  if (blocked.length === 0) return interleaveQueue(interleaved)
  const groups = new Map<string, T[]>()
  for (const item of blocked) {
    const list = groups.get(item.category) ?? []
    list.push(item)
    groups.set(item.category, list)
  }
  const orderedBlocked = Array.from(groups.values()).flat()
  return [...interleaveQueue(interleaved), ...orderedBlocked]
}

function mcqOptions(question: QuestionRow): string[] | null {
  if (question.type !== 'mcq' || !question.options_json) return null
  try {
    return JSON.parse(question.options_json) as string[]
  } catch {
    return null
  }
}

function cardFigure(question: QuestionRow): FigureGeometry | null {
  if (question.type !== 'figure' || !question.options_json) return null
  try {
    return buildFigureGeometry(JSON.parse(question.options_json) as FigureSpec)
  } catch {
    return null
  }
}

/** Published quiz ids this student can learn from, optionally scoped to quizId/packId. */
function visibleQuizIds(studentId: string, filters: SrsFilters = {}): string[] {
  const clauses = [
    `published = 1`,
    `(classroom_id IS NULL OR classroom_id IN (SELECT classroom_id FROM classroom_members WHERE student_id = ?))`,
  ]
  const params: unknown[] = [studentId]
  if (filters.quizId) {
    clauses.push('id = ?')
    params.push(filters.quizId)
  }
  if (filters.packId) {
    clauses.push('pack_id = ?')
    params.push(filters.packId)
  }
  const rows = db
    .prepare(`SELECT id FROM quizzes WHERE ${clauses.join(' AND ')}`)
    .all(...params) as { id: string }[]
  return rows.map((row) => row.id)
}

function lessonFilterClause(
  filters: SrsFilters,
): { sql: string; params: unknown[]; skip: boolean } {
  if (filters.quizId) {
    const quiz = db
      .prepare('SELECT lesson_id FROM quizzes WHERE id = ?')
      .get(filters.quizId) as { lesson_id?: string | null } | undefined
    if (!quiz?.lesson_id) {
      return { sql: '', params: [], skip: true }
    }
    return {
      sql: ' AND lf.lesson_id = ?',
      params: [quiz.lesson_id],
      skip: false,
    }
  }
  if (filters.packId) {
    return { sql: ' AND lf.pack_id = ?', params: [filters.packId], skip: false }
  }
  return { sql: '', params: [], skip: false }
}

export const srsRoutes: FastifyPluginAsync = async (app) => {
  // ── Review stats ────────────────────────────────────────────
  app.get('/stats', async (request) => {
    const student = await requireRole(request, 'student')
    const filters = parseSrsFilters(request.query)
    const today = isoDay()

    const qzClauses = ['s.user_id = ?']
    const qzParams: unknown[] = [student.id]
    if (filters.quizId) {
      qzClauses.push('qz.id = ?')
      qzParams.push(filters.quizId)
    }
    if (filters.packId) {
      qzClauses.push('qz.pack_id = ?')
      qzParams.push(filters.packId)
    }

    const qScheduled = (
      db
        .prepare(
          `SELECT COUNT(*) as n FROM flashcard_states s
           JOIN questions q ON q.id = s.question_id
           JOIN quizzes qz ON qz.id = q.quiz_id
           WHERE ${qzClauses.join(' AND ')} AND s.due_date <= ?`,
        )
        .get(...qzParams, today) as { n: number }
    ).n

    const qTotal = (
      db
        .prepare(
          `SELECT COUNT(*) as n FROM flashcard_states s
           JOIN questions q ON q.id = s.question_id
           JOIN quizzes qz ON qz.id = q.quiz_id
           WHERE ${qzClauses.join(' AND ')}`,
        )
        .get(...qzParams) as { n: number }
    ).n

    const qReviewedToday = (
      db
        .prepare(
          `SELECT COUNT(*) as n FROM flashcard_states s
           JOIN questions q ON q.id = s.question_id
           JOIN quizzes qz ON qz.id = q.quiz_id
           WHERE ${qzClauses.join(' AND ')} AND date(s.updated_at) = date('now')`,
        )
        .get(...qzParams) as { n: number }
    ).n

    const lfFilter = lessonFilterClause(filters)
    let lScheduled = 0
    let lTotal = 0
    let lReviewedToday = 0
    if (!lfFilter.skip) {
      lScheduled = (
        db
          .prepare(
            `SELECT COUNT(*) as n FROM lesson_flashcard_states s
             JOIN lesson_flashcards lf ON lf.id = s.flashcard_id
             WHERE s.user_id = ? AND s.due_date <= ?${lfFilter.sql}`,
          )
          .get(student.id, today, ...lfFilter.params) as { n: number }
      ).n
      lTotal = (
        db
          .prepare(
            `SELECT COUNT(*) as n FROM lesson_flashcard_states s
             JOIN lesson_flashcards lf ON lf.id = s.flashcard_id
             WHERE s.user_id = ?${lfFilter.sql}`,
          )
          .get(student.id, ...lfFilter.params) as { n: number }
      ).n
      lReviewedToday = (
        db
          .prepare(
            `SELECT COUNT(*) as n FROM lesson_flashcard_states s
             JOIN lesson_flashcards lf ON lf.id = s.flashcard_id
             WHERE s.user_id = ? AND date(s.updated_at) = date('now')${lfFilter.sql}`,
          )
          .get(student.id, ...lfFilter.params) as { n: number }
      ).n
    }

    const scheduled = qScheduled + lScheduled
    const totalCards = qTotal + lTotal
    const reviewedToday = qReviewedToday + lReviewedToday
    const newCount = newCardsFor(student.id, filters).length

    return {
      dueCount: scheduled + Math.min(newCount, 10),
      scheduledCount: scheduled,
      newCount: Math.min(newCount, 10),
      totalCards,
      reviewedToday,
    }
  })

  // ── Due queue (scheduled cards first, then new ones) ─────────
  app.get('/due', async (request) => {
    const student = await requireRole(request, 'student')
    const filters = parseSrsFilters(request.query)
    const today = isoDay()

    const qClauses = ['s.user_id = ?', 's.due_date <= ?']
    const qParams: unknown[] = [student.id, today]
    if (filters.quizId) {
      qClauses.push('qz.id = ?')
      qParams.push(filters.quizId)
    }
    if (filters.packId) {
      qClauses.push('qz.pack_id = ?')
      qParams.push(filters.packId)
    }

    const dueRows = db
      .prepare(
        `SELECT q.*, s.stability, s.difficulty, s.reps, s.lapses, s.due_date,
                s.last_reviewed_at, qz.title as quiz_title, qz.subject as quiz_subject,
                qz.id as quiz_id, qz.pack_id as pack_id, qz.srs_interleave as srs_interleave
         FROM flashcard_states s
         JOIN questions q ON q.id = s.question_id
         JOIN quizzes qz ON qz.id = q.quiz_id
         WHERE ${qClauses.join(' AND ')}
         ORDER BY s.due_date ASC
         LIMIT 20`,
      )
      .all(...qParams) as (QuestionRow & {
      stability: number
      difficulty: number
      reps: number
      lapses: number
      due_date: string
      last_reviewed_at: string | null
      quiz_title: string
      quiz_subject: string
      quiz_id: string
      pack_id: string | null
      srs_interleave: number | null
    })[]

    const cards: DueCard[] = dueRows.map((row) => ({
      questionId: row.id,
      quizId: row.quiz_id,
      quizTitle: row.quiz_title,
      subject: row.quiz_subject,
      prompt: row.prompt,
      type: row.type,
      isNew: false,
      answer: answerBack(row),
      explanation: row.explanation,
      category: row.quiz_id,
      options: mcqOptions(row),
      figure: cardFigure(row),
      interleave: row.srs_interleave !== 0,
      packId: row.pack_id ?? null,
      sourceType: 'question',
      state: {
        stability: row.stability,
        difficulty: row.difficulty,
        reps: row.reps,
        lapses: row.lapses,
        dueDate: row.due_date,
        lastReviewedAt: row.last_reviewed_at,
      },
    }))

    const lfFilter = lessonFilterClause(filters)
    if (!lfFilter.skip && cards.length < 20) {
      const lessonRows = db
        .prepare(
          `SELECT lf.*, s.stability, s.difficulty, s.reps, s.lapses, s.due_date, s.last_reviewed_at,
                  COALESCE(l.title, lf.subject) as lesson_title
           FROM lesson_flashcard_states s
           JOIN lesson_flashcards lf ON lf.id = s.flashcard_id
           LEFT JOIN lessons l ON l.id = lf.lesson_id
           WHERE s.user_id = ? AND s.due_date <= ?${lfFilter.sql}
           ORDER BY s.due_date ASC
           LIMIT ?`,
        )
        .all(student.id, today, ...lfFilter.params, 20 - cards.length) as {
        id: string
        lesson_id: string
        pack_id: string
        subject: string
        front: string
        back: string
        explanation: string
        interleave: number
        stability: number
        difficulty: number
        reps: number
        lapses: number
        due_date: string
        last_reviewed_at: string | null
        lesson_title: string
      }[]

      for (const row of lessonRows) {
        cards.push({
          questionId: row.id,
          quizId: row.lesson_id,
          quizTitle: row.lesson_title,
          subject: row.subject,
          prompt: row.front,
          type: 'fill',
          isNew: row.reps === 0,
          answer: row.back,
          explanation: row.explanation,
          category: `lesson:${row.lesson_id}`,
          options: null,
          figure: null,
          interleave: row.interleave !== 0,
          packId: row.pack_id,
          sourceType: 'lesson-flashcard',
          state:
            row.reps === 0 && row.stability === 0
              ? null
              : {
                  stability: row.stability,
                  difficulty: row.difficulty,
                  reps: row.reps,
                  lapses: row.lapses,
                  dueDate: row.due_date,
                  lastReviewedAt: row.last_reviewed_at,
                },
        })
      }
    }

    // Fill the remaining slots with never-reviewed questions.
    const remaining = Math.max(0, 20 - cards.length)
    if (remaining > 0) {
      const newRows = newCardsFor(student.id, filters).slice(0, remaining)
      for (const row of newRows) {
        const quiz = db
          .prepare('SELECT id, title, subject, pack_id, srs_interleave FROM quizzes WHERE id = ?')
          .get(row.quiz_id) as QuizRow | undefined
        cards.push({
          questionId: row.id,
          quizId: row.quiz_id,
          quizTitle: quiz?.title ?? 'Quiz',
          subject: quiz?.subject ?? 'General',
          prompt: row.prompt,
          type: row.type,
          isNew: true,
          answer: answerBack(row),
          explanation: row.explanation,
          category: row.quiz_id,
          options: mcqOptions(row),
          figure: cardFigure(row),
          interleave: quiz?.srs_interleave !== 0,
          packId: quiz?.pack_id ?? null,
          sourceType: 'question',
          state: null,
        })
      }
    }

    // Round-robin interleaved decks while preserving contiguous blocks when srs_interleave = 0.
    return { cards: orderByInterleave(cards), today }
  })

  // ── Streak Siege queue: due first, then weak (lapsed / high
  //    difficulty) cards that aren't due yet, then new ones. ─────────
  app.get('/siege', async (request) => {
    const student = await requireRole(request, 'student')
    const filters = parseSrsFilters(request.query)
    const today = isoDay()
    type Row = QuestionRow & {
      stability: number
      difficulty: number
      reps: number
      lapses: number
      due_date: string
      last_reviewed_at: string | null
      quiz_title: string
      quiz_subject: string
      quiz_id: string
      pack_id: string | null
      srs_interleave: number | null
    }
    const qFilterClauses = ['s.user_id = ?', 'qz.published = 1']
    const qFilterParams: unknown[] = [student.id]
    if (filters.quizId) {
      qFilterClauses.push('qz.id = ?')
      qFilterParams.push(filters.quizId)
    }
    if (filters.packId) {
      qFilterClauses.push('qz.pack_id = ?')
      qFilterParams.push(filters.packId)
    }
    const base = `SELECT q.*, s.stability, s.difficulty, s.reps, s.lapses, s.due_date,
                         s.last_reviewed_at, qz.title as quiz_title, qz.subject as quiz_subject,
                         qz.id as quiz_id, qz.pack_id as pack_id, qz.srs_interleave as srs_interleave
                  FROM flashcard_states s
                  JOIN questions q ON q.id = s.question_id
                  JOIN quizzes qz ON qz.id = q.quiz_id
                  WHERE ${qFilterClauses.join(' AND ')}`
    const due = db
      .prepare(`${base} AND s.due_date <= ? ORDER BY s.due_date ASC LIMIT 30`)
      .all(...qFilterParams, today) as Row[]
    const weak = db
      .prepare(
        `${base} AND s.due_date > ? AND (s.lapses > 0 OR s.difficulty >= 6)
         ORDER BY s.lapses DESC, s.difficulty DESC LIMIT 20`,
      )
      .all(...qFilterParams, today) as Row[]

    const toCard = (row: Row, pool: 'due' | 'weak') => ({
      questionId: row.id,
      quizId: row.quiz_id,
      quizTitle: row.quiz_title,
      subject: row.quiz_subject,
      prompt: row.prompt,
      type: row.type,
      isNew: false,
      answer: answerBack(row),
      explanation: row.explanation,
      category: row.quiz_id,
      options: mcqOptions(row),
      figure: cardFigure(row),
      interleave: row.srs_interleave !== 0,
      packId: row.pack_id ?? null,
      sourceType: 'question' as const,
      pool,
      state: {
        stability: row.stability,
        difficulty: row.difficulty,
        reps: row.reps,
        lapses: row.lapses,
        dueDate: row.due_date,
        lastReviewedAt: row.last_reviewed_at,
      },
    })

    const cards: (DueCard & { pool: 'due' | 'weak' | 'new' })[] = [
      ...due.map((row) => toCard(row, 'due')),
      ...weak.map((row) => toCard(row, 'weak')),
    ]
    const lfFilter = lessonFilterClause(filters)
    if (!lfFilter.skip && cards.length < 60) {
      const lRows = db
        .prepare(
          `SELECT lf.*, s.stability, s.difficulty, s.reps, s.lapses, s.due_date, s.last_reviewed_at,
                  COALESCE(l.title, lf.subject) as lesson_title
           FROM lesson_flashcard_states s
           JOIN lesson_flashcards lf ON lf.id = s.flashcard_id
           LEFT JOIN lessons l ON l.id = lf.lesson_id
           WHERE s.user_id = ? AND s.due_date <= ?${lfFilter.sql}
           ORDER BY s.due_date ASC LIMIT ?`,
        )
        .all(student.id, today, ...lfFilter.params, 60 - cards.length) as {
        id: string
        lesson_id: string
        pack_id: string
        subject: string
        front: string
        back: string
        explanation: string
        interleave: number
        stability: number
        difficulty: number
        reps: number
        lapses: number
        due_date: string
        last_reviewed_at: string | null
        lesson_title: string
      }[]
      for (const row of lRows) {
        cards.push({
          questionId: row.id,
          quizId: row.lesson_id,
          quizTitle: row.lesson_title,
          subject: row.subject,
          prompt: row.front,
          type: 'fill',
          isNew: row.reps === 0,
          answer: row.back,
          explanation: row.explanation,
          category: `lesson:${row.lesson_id}`,
          options: null,
          figure: null,
          interleave: row.interleave !== 0,
          packId: row.pack_id,
          sourceType: 'lesson-flashcard',
          pool: row.reps === 0 ? 'new' : 'due',
          state:
            row.reps === 0 && row.stability === 0
              ? null
              : {
                  stability: row.stability,
                  difficulty: row.difficulty,
                  reps: row.reps,
                  lapses: row.lapses,
                  dueDate: row.due_date,
                  lastReviewedAt: row.last_reviewed_at,
                },
        })
      }
    }

    const remaining = Math.max(0, 60 - cards.length)
    for (const row of newCardsFor(student.id, filters).slice(0, remaining)) {
      const quiz = db
        .prepare('SELECT id, title, subject, pack_id, srs_interleave FROM quizzes WHERE id = ?')
        .get(row.quiz_id) as QuizRow | undefined
      cards.push({
        questionId: row.id,
        quizId: row.quiz_id,
        quizTitle: quiz?.title ?? 'Quiz',
        subject: quiz?.subject ?? 'General',
        prompt: row.prompt,
        type: row.type,
        isNew: true,
        answer: answerBack(row),
        explanation: row.explanation,
        category: row.quiz_id,
        options: mcqOptions(row),
        figure: cardFigure(row),
        interleave: quiz?.srs_interleave !== 0,
        packId: quiz?.pack_id ?? null,
        sourceType: 'question',
        pool: 'new',
        state: null,
      })
    }
    return { cards: orderByInterleave(cards), today }
  })

  // ── Grade a card ────────────────────────────────────────────
  app.post('/review', async (request, reply) => {
    const student = await requireRole(request, 'student')
    const input = parse(SrsReviewSchema, request.body)

    const question = db
      .prepare(
        `SELECT q.* FROM questions q
         JOIN quizzes qz ON qz.id = q.quiz_id
         WHERE q.id = ? AND qz.published = 1`,
      )
      .get(input.questionId) as QuestionRow | undefined

    if (!question) {
      const lessonCard = db
        .prepare('SELECT * FROM lesson_flashcards WHERE id = ?')
        .get(input.questionId) as { id: string; back: string } | undefined
      if (!lessonCard) throw notFound('Question not found')

      const existing = db
        .prepare(
          `SELECT stability, difficulty, reps, lapses, due_date, last_reviewed_at
           FROM lesson_flashcard_states WHERE user_id = ? AND flashcard_id = ?`,
        )
        .get(student.id, lessonCard.id) as
        | {
            stability: number
            difficulty: number
            reps: number
            lapses: number
            due_date: string
            last_reviewed_at: string | null
          }
        | undefined

      const previous: SrsState =
        existing && (existing.reps > 0 || existing.stability > 0)
          ? {
              stability: existing.stability,
              difficulty: existing.difficulty,
              reps: existing.reps,
              lapses: existing.lapses,
              dueDate: existing.due_date,
              lastReviewedAt: existing.last_reviewed_at,
            }
          : initialSrsState()
      const next = schedule(previous, input.grade)

      db.prepare(
        `INSERT INTO lesson_flashcard_states
           (user_id, flashcard_id, stability, difficulty, reps, lapses, due_date,
            last_reviewed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, flashcard_id) DO UPDATE SET
           stability = excluded.stability,
           difficulty = excluded.difficulty,
           reps = excluded.reps,
           lapses = excluded.lapses,
           due_date = excluded.due_date,
           last_reviewed_at = excluded.last_reviewed_at,
           updated_at = datetime('now')`,
      ).run(
        student.id,
        lessonCard.id,
        next.stability,
        next.difficulty,
        next.reps,
        next.lapses,
        next.dueDate,
        next.lastReviewedAt,
      )

      return reply.status(201).send({
        state: {
          stability: next.stability,
          difficulty: next.difficulty,
          reps: next.reps,
          lapses: next.lapses,
          dueDate: next.dueDate,
          lastReviewedAt: next.lastReviewedAt,
        },
        answer: lessonCard.back,
      })
    }

    const existing = db
      .prepare(
        `SELECT stability, difficulty, reps, lapses, due_date, last_reviewed_at
         FROM flashcard_states WHERE user_id = ? AND question_id = ?`,
      )
      .get(student.id, input.questionId) as
      | {
          stability: number
          difficulty: number
          reps: number
          lapses: number
          due_date: string
          last_reviewed_at: string | null
        }
      | undefined

    const previous: SrsState = existing
      ? {
          stability: existing.stability,
          difficulty: existing.difficulty,
          reps: existing.reps,
          lapses: existing.lapses,
          dueDate: existing.due_date,
          lastReviewedAt: existing.last_reviewed_at,
        }
      : initialSrsState()
    const next = schedule(previous, input.grade)

    db.prepare(
      `INSERT INTO flashcard_states
         (user_id, question_id, stability, difficulty, reps, lapses, due_date,
          last_reviewed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, question_id) DO UPDATE SET
         stability = excluded.stability,
         difficulty = excluded.difficulty,
         reps = excluded.reps,
         lapses = excluded.lapses,
         due_date = excluded.due_date,
         last_reviewed_at = excluded.last_reviewed_at,
         updated_at = datetime('now')`,
    ).run(
      student.id,
      input.questionId,
      next.stability,
      next.difficulty,
      next.reps,
      next.lapses,
      next.dueDate,
      next.lastReviewedAt,
    )

    return reply.status(201).send({
      state: {
        stability: next.stability,
        difficulty: next.difficulty,
        reps: next.reps,
        lapses: next.lapses,
        dueDate: next.dueDate,
        lastReviewedAt: next.lastReviewedAt,
      },
      answer: answerBack(question),
    })
  })
}

/** Questions from visible published quizzes this student has never scheduled. */
function newCardsFor(
  studentId: string,
  filters: SrsFilters = {},
): (QuestionRow & { quiz_id: string })[] {
  const quizIds = visibleQuizIds(studentId, filters)
  if (quizIds.length === 0) return []
  const placeholders = quizIds.map(() => '?').join(', ')
  const rows = db
    .prepare(
      `SELECT q.* FROM questions q
       WHERE q.quiz_id IN (${placeholders})
         AND q.id NOT IN (
           SELECT question_id FROM flashcard_states WHERE user_id = ?
         )
       ORDER BY q.created_at DESC, q.rowid DESC
       LIMIT 40`,
    )
    .all(...quizIds, studentId) as (QuestionRow & { quiz_id: string })[]
  return rows
}
