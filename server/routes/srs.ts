import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireRole } from '../lib/auth'
import { notFound, parse } from '../lib/http'
import { initialSrsState, isoDay, schedule, type SrsState } from '../../shared/srs'
import { SrsReviewSchema } from '../../shared/schemas'
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
  prompt: string
  type: QuestionType
  isNew: boolean
  /** Practice-only: answers arrive with the queue and must not be shown before reveal. */
  answer: string
  explanation: string
  state: {
    ease: number
    intervalDays: number
    reps: number
    lapses: number
    dueDate: string
  } | null
}

/** Published quiz ids this student can learn from. */
function visibleQuizIds(studentId: string): string[] {
  const rows = db
    .prepare(
      `SELECT id FROM quizzes
       WHERE published = 1
         AND (
           classroom_id IS NULL
           OR classroom_id IN (SELECT classroom_id FROM classroom_members WHERE student_id = ?)
         )`,
    )
    .all(studentId) as { id: string }[]
  return rows.map((row) => row.id)
}

export const srsRoutes: FastifyPluginAsync = async (app) => {
  // ── Review stats ────────────────────────────────────────────
  app.get('/stats', async (request) => {
    const student = await requireRole(request, 'student')
    const today = isoDay()

    const scheduled = (
      db
        .prepare(
          `SELECT COUNT(*) as n FROM flashcard_states
           WHERE user_id = ? AND due_date <= ?`,
        )
        .get(student.id, today) as { n: number }
    ).n

    const totalCards = (
      db
        .prepare('SELECT COUNT(*) as n FROM flashcard_states WHERE user_id = ?')
        .get(student.id) as { n: number }
    ).n

    const reviewedToday = (
      db
        .prepare(
          `SELECT COUNT(*) as n FROM flashcard_states
           WHERE user_id = ? AND date(updated_at) = date('now')`,
        )
        .get(student.id) as { n: number }
    ).n

    const newCount = newCardsFor(student.id).length

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
    const today = isoDay()

    const dueRows = db
      .prepare(
        `SELECT q.*, s.ease, s.interval_days, s.reps, s.lapses, s.due_date,
                qz.title as quiz_title, qz.id as quiz_id
         FROM flashcard_states s
         JOIN questions q ON q.id = s.question_id
         JOIN quizzes qz ON qz.id = q.quiz_id
         WHERE s.user_id = ? AND s.due_date <= ?
         ORDER BY s.due_date ASC
         LIMIT 20`,
      )
      .all(student.id, today) as (QuestionRow & {
      ease: number
      interval_days: number
      reps: number
      lapses: number
      due_date: string
      quiz_title: string
      quiz_id: string
    })[]

    const cards: DueCard[] = dueRows.map((row) => ({
      questionId: row.id,
      quizId: row.quiz_id,
      quizTitle: row.quiz_title,
      prompt: row.prompt,
      type: row.type,
      isNew: false,
      answer: answerBack(row),
      explanation: row.explanation,
      state: {
        ease: row.ease,
        intervalDays: row.interval_days,
        reps: row.reps,
        lapses: row.lapses,
        dueDate: row.due_date,
      },
    }))

    // Fill the remaining slots with never-reviewed questions.
    const remaining = Math.max(0, 20 - cards.length)
    if (remaining > 0) {
      const newRows = newCardsFor(student.id).slice(0, remaining)
      for (const row of newRows) {
        const quiz = db
          .prepare('SELECT id, title FROM quizzes WHERE id = ?')
          .get(row.quiz_id) as QuizRow | undefined
        cards.push({
          questionId: row.id,
          quizId: row.quiz_id,
          quizTitle: quiz?.title ?? 'Quiz',
          prompt: row.prompt,
          type: row.type,
          isNew: true,
          answer: answerBack(row),
          explanation: row.explanation,
          state: null,
        })
      }
    }

    return { cards, today }
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
    if (!question) throw notFound('Question not found')

    const existing = db
      .prepare('SELECT * FROM flashcard_states WHERE user_id = ? AND question_id = ?')
      .get(student.id, input.questionId) as
      | {
          ease: number
          interval_days: number
          reps: number
          lapses: number
          due_date: string
        }
      | undefined

    const previous: SrsState = existing
      ? {
          ease: existing.ease,
          intervalDays: existing.interval_days,
          reps: existing.reps,
          lapses: existing.lapses,
          dueDate: existing.due_date,
        }
      : initialSrsState()
    const next = schedule(previous, input.grade)

    db.prepare(
      `INSERT INTO flashcard_states (user_id, question_id, ease, interval_days, reps, lapses, due_date, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, question_id) DO UPDATE SET
         ease = excluded.ease,
         interval_days = excluded.interval_days,
         reps = excluded.reps,
         lapses = excluded.lapses,
         due_date = excluded.due_date,
         updated_at = datetime('now')`,
    ).run(
      student.id,
      input.questionId,
      next.ease,
      next.intervalDays,
      next.reps,
      next.lapses,
      next.dueDate,
    )

    return reply.status(201).send({
      state: {
        ease: next.ease,
        intervalDays: next.intervalDays,
        reps: next.reps,
        lapses: next.lapses,
        dueDate: next.dueDate,
      },
      answer: answerBack(question),
    })
  })
}

/** Questions from visible published quizzes this student has never scheduled. */
function newCardsFor(studentId: string): (QuestionRow & { quiz_id: string })[] {
  const quizIds = visibleQuizIds(studentId)
  if (quizIds.length === 0) return []
  const placeholders = quizIds.map(() => '?').join(', ')
  const rows = db
    .prepare(
      `SELECT q.* FROM questions q
       WHERE q.quiz_id IN (${placeholders})
         AND q.id NOT IN (
           SELECT question_id FROM flashcard_states WHERE user_id = ?
         )
       ORDER BY q.created_at DESC
       LIMIT 40`,
    )
    .all(...quizIds, studentId) as (QuestionRow & { quiz_id: string })[]
  return rows
}
