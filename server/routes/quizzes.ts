import { randomUUID } from 'node:crypto'
import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { db } from '../db'
import { requireAuth, requireRole } from '../lib/auth'
import { badRequest, forbidden, notFound, parse } from '../lib/http'
import {
  toQuestionTeacherDTO,
  toQuizDTO,
  toStudentQuestionDTO,
  type QuizDTOExtras,
} from '../lib/mappers'
import {
  QuestionInputSchema,
  QuizCreateSchema,
  QuizUpdateSchema,
  ReorderSchema,
  type FigureSpec,
  type QuestionInput,
} from '../../shared/schemas'
import { computeAnswer, validateFigure } from '../../shared/figure'
import type {
  AttemptRow,
  ClassroomRow,
  QuestionRow,
  QuizDTO,
  QuizRow,
  StudentQuestionDTO,
  TeacherQuestionDTO,
} from '../../shared/types'

function getQuiz(id: string): QuizRow {
  const row = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as
    | QuizRow
    | undefined
  if (!row) throw notFound('Quiz not found')
  return row
}

function getQuizOrForbidden(id: string, teacherId: string): QuizRow {
  const quiz = getQuiz(id)
  if (quiz.teacher_id !== teacherId) {
    throw forbidden('You can only edit your own quizzes')
  }
  return quiz
}

function quizVisibilitySql(role: string): { sql: string; bindsUserId: boolean } {
  if (role === 'teacher') {
    return {
      sql: `FROM quizzes q WHERE q.teacher_id = ?`,
      bindsUserId: true,
    }
  }
  if (role === 'student') {
    return {
      sql: `FROM quizzes q
            WHERE q.published = 1
              AND (
                q.classroom_id IS NULL
                OR q.classroom_id IN (
                  SELECT classroom_id FROM classroom_members WHERE student_id = ?
                )
              )`,
      bindsUserId: true,
    }
  }
  // parent: quizzes their linked children have attempted
  return {
    sql: `FROM quizzes q
          WHERE q.id IN (
            SELECT a.quiz_id FROM attempts a
            JOIN parent_links p ON p.student_id = a.student_id
            WHERE p.parent_id = ?
          )`,
    bindsUserId: true,
  }
}

export function quizDTO(quiz: QuizRow, viewerId: string | null): QuizDTO {
  const teacher = db
    .prepare('SELECT name FROM users WHERE id = ?')
    .get(quiz.teacher_id) as { name: string } | undefined
  let classroomName: string | null = null
  if (quiz.classroom_id) {
    const classroom = db
      .prepare('SELECT name FROM classrooms WHERE id = ?')
      .get(quiz.classroom_id) as { name: string } | undefined
    classroomName = classroom?.name ?? null
  }
  const questionCount = (
    db
      .prepare('SELECT COUNT(*) as n FROM questions WHERE quiz_id = ?')
      .get(quiz.id) as { n: number }
  ).n
  const attemptCount = (
    db
      .prepare(
        'SELECT COUNT(*) as n FROM attempts WHERE quiz_id = ? AND finished_at IS NOT NULL',
      )
      .get(quiz.id) as { n: number }
  ).n
  let myBestScore: number | null = null
  if (viewerId) {
    const best = db
      .prepare(
        `SELECT MAX(score * 100.0 / NULLIF(max_score, 0)) as best
         FROM attempts
         WHERE quiz_id = ? AND student_id = ? AND finished_at IS NOT NULL`,
      )
      .get(quiz.id, viewerId) as { best: number | null }
    myBestScore = best.best === null ? null : Math.round(best.best)
  }

  const extras: QuizDTOExtras = {
    questionCount,
    teacherName: teacher?.name ?? 'Unknown',
    classroomName,
    attemptCount,
    myBestScore,
  }
  return toQuizDTO(quiz, extras)
}

function validateQuestionInput(input: QuestionInput): void {
  if (input.type === 'mcq') {
    if (input.correct >= input.options.length) {
      throw badRequest('The correct answer index is out of range')
    }
  }
  if (input.type === 'order') {
    if (input.correct.length !== input.options.length) {
      throw badRequest('The ranking must include every option exactly once')
    }
    const sorted = [...input.correct].sort((a, b) => a - b)
    if (sorted.some((value, index) => value !== index)) {
      throw badRequest('The ranking must be a permutation of option indexes')
    }
  }
  if (input.type === 'figure') {
    const problem = validateFigure(input.figure)
    if (problem) throw badRequest(problem)
  }
}

function figureAnswerKey(spec: FigureSpec): number {
  try {
    return computeAnswer(spec)
  } catch {
    throw badRequest('This figure has no solvable answer with the given values')
  }
}

/** Column payload for a question input, with figure keys computed here. */
function questionPayload(input: QuestionInput): {
  optionsJson: string | null
  correctJson: string
} {
  if (input.type === 'figure') {
    return {
      optionsJson: JSON.stringify(input.figure),
      correctJson: JSON.stringify(figureAnswerKey(input.figure)),
    }
  }
  return {
    optionsJson: 'options' in input ? JSON.stringify(input.options) : null,
    correctJson: JSON.stringify(input.correct),
  }
}

function insertQuestion(
  quizId: string,
  input: QuestionInput,
  position: number,
): string {
  const id = randomUUID()
  const { optionsJson, correctJson } = questionPayload(input)
  db.prepare(
    `INSERT INTO questions
       (id, quiz_id, type, prompt, options_json, correct_json, alternatives_json,
        points, position, explanation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    quizId,
    input.type,
    input.prompt.trim(),
    optionsJson,
    correctJson,
    input.type === 'fill' ? JSON.stringify(input.alternatives ?? []) : null,
    input.points,
    position,
    input.explanation ?? '',
  )
  return id
}

function nextPosition(quizId: string): number {
  const row = db
    .prepare('SELECT COALESCE(MAX(position), -1) + 1 as next FROM questions WHERE quiz_id = ?')
    .get(quizId) as { next: number }
  return row.next
}

export const quizRoutes: FastifyPluginAsync = async (app) => {
  // ── Create ──────────────────────────────────────────────────
  app.post('/', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const input = parse(QuizCreateSchema, request.body)

    if (input.classroomId) {
      const classroom = db
        .prepare('SELECT * FROM classrooms WHERE id = ?')
        .get(input.classroomId) as ClassroomRow | undefined
      if (!classroom || classroom.teacher_id !== teacher.id) {
        throw badRequest('Classroom not found')
      }
    }

    const id = randomUUID()
    db.prepare(
      `INSERT INTO quizzes (id, title, description, subject, difficulty, teacher_id, classroom_id, time_limit_sec, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).run(
      id,
      input.title.trim(),
      input.description.trim(),
      input.subject.trim(),
      input.difficulty,
      teacher.id,
      input.classroomId,
      input.timeLimitSec,
    )

    return reply.status(201).send({ quiz: quizDTO(getQuiz(id), teacher.id) })
  })

  // ── List (role-aware) ───────────────────────────────────────
  app.get('/', async (request) => {
    const user = await requireAuth(request)
    const { sql } = quizVisibilitySql(user.role)
    const orderBy =
      user.role === 'teacher' ? ' ORDER BY q.updated_at DESC' : ' ORDER BY q.updated_at DESC'
    const rows = db
      .prepare(`SELECT q.* ${sql}${orderBy}`)
      .all(user.id) as QuizRow[]
    return { quizzes: rows.map((row) => quizDTO(row, user.id)) }
  })

  // ── Detail ──────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>('/:id', async (request) => {
    const user = await requireAuth(request)
    const quiz = getQuiz(request.params.id)

    let includeAnswers = false

    if (user.role === 'teacher' && quiz.teacher_id === user.id) {
      includeAnswers = true
    } else if (user.role === 'student') {
      if (!quiz.published) throw forbidden('This quiz is not published yet')
      const member = quiz.classroom_id
        ? db
            .prepare(
              'SELECT 1 FROM classroom_members WHERE classroom_id = ? AND student_id = ?',
            )
            .get(quiz.classroom_id, user.id)
        : true
      if (!member) throw forbidden('This quiz belongs to a classroom you are not in')
    } else if (user.role === 'parent') {
      const attempted = db
        .prepare(
          `SELECT 1 FROM attempts a
           JOIN parent_links p ON p.student_id = a.student_id
           WHERE a.quiz_id = ? AND p.parent_id = ?`,
        )
        .get(quiz.id, user.id)
      if (!attempted) throw forbidden('You can only view quizzes your child has taken')
    }

    const questionRows = db
      .prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY position')
      .all(quiz.id) as QuestionRow[]

    const questions: TeacherQuestionDTO[] | StudentQuestionDTO[] = includeAnswers
      ? questionRows.map(toQuestionTeacherDTO)
      : questionRows.map(toStudentQuestionDTO)

    return { quiz: quizDTO(quiz, user.role === 'student' ? user.id : null), questions }
  })

  // ── Update ──────────────────────────────────────────────────
  app.patch<{ Params: { id: string } }>('/:id', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const quiz = getQuizOrForbidden(request.params.id, teacher.id)
    const input = parse(QuizUpdateSchema, request.body)

    if (input.classroomId) {
      const classroom = db
        .prepare('SELECT * FROM classrooms WHERE id = ?')
        .get(input.classroomId) as ClassroomRow | undefined
      if (!classroom || classroom.teacher_id !== teacher.id) {
        throw badRequest('Classroom not found')
      }
    }

    const title = input.title?.trim() ?? quiz.title
    const description = input.description?.trim() ?? quiz.description
    const subject = input.subject?.trim() ?? quiz.subject
    const difficulty = input.difficulty ?? quiz.difficulty
    const timeLimitSec =
      input.timeLimitSec !== undefined ? input.timeLimitSec : quiz.time_limit_sec
    const classroomId =
      input.classroomId !== undefined ? input.classroomId : quiz.classroom_id

    db.prepare(
      `UPDATE quizzes
       SET title = ?, description = ?, subject = ?, difficulty = ?, time_limit_sec = ?,
           classroom_id = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      title,
      description,
      subject,
      difficulty,
      timeLimitSec,
      classroomId,
      quiz.id,
    )

    return { quiz: quizDTO(getQuiz(quiz.id), teacher.id) }
  })

  // ── Delete ──────────────────────────────────────────────────
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const teacher = await requireRole(request, 'teacher')
      const quiz = getQuizOrForbidden(request.params.id, teacher.id)
      db.prepare('DELETE FROM quizzes WHERE id = ?').run(quiz.id)
      return reply.status(204).send()
    },
  )

  // ── Publish / unpublish / duplicate ─────────────────────────
  app.post<{ Params: { id: string } }>('/:id/publish', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const quiz = getQuizOrForbidden(request.params.id, teacher.id)
    const count = (
      db
        .prepare('SELECT COUNT(*) as n FROM questions WHERE quiz_id = ?')
        .get(quiz.id) as { n: number }
    ).n
    if (count === 0) throw badRequest('Add at least one question before publishing')
    db.prepare(
      'UPDATE quizzes SET published = 1, updated_at = datetime(\'now\') WHERE id = ?',
    ).run(quiz.id)
    return { quiz: quizDTO(getQuiz(quiz.id), teacher.id) }
  })

  app.post<{ Params: { id: string } }>('/:id/unpublish', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const quiz = getQuizOrForbidden(request.params.id, teacher.id)
    db.prepare(
      'UPDATE quizzes SET published = 0, updated_at = datetime(\'now\') WHERE id = ?',
    ).run(quiz.id)
    return { quiz: quizDTO(getQuiz(quiz.id), teacher.id) }
  })

  app.post<{ Params: { id: string } }>('/:id/duplicate', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const quiz = getQuizOrForbidden(request.params.id, teacher.id)

    const newId = randomUUID()
    db.prepare(
      `INSERT INTO quizzes (id, title, description, subject, difficulty, teacher_id, classroom_id, time_limit_sec, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).run(
      newId,
      `${quiz.title} (copy)`,
      quiz.description,
      quiz.subject,
      quiz.difficulty,
      teacher.id,
      quiz.classroom_id,
      quiz.time_limit_sec,
    )

    const questions = db
      .prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY position')
      .all(quiz.id) as QuestionRow[]
    for (const question of questions) {
      const input: QuestionInput =
        question.type === 'figure'
          ? {
              type: 'figure',
              prompt: question.prompt,
              figure: JSON.parse(question.options_json ?? 'null') as FigureSpec,
              points: question.points,
              explanation: question.explanation,
            }
          : ({
              type: question.type,
              prompt: question.prompt,
              ...(question.options_json
                ? { options: JSON.parse(question.options_json) as string[] }
                : {}),
              correct: JSON.parse(question.correct_json),
              ...(question.alternatives_json
                ? {
                    alternatives: JSON.parse(question.alternatives_json) as string[],
                  }
                : {}),
              points: question.points,
              explanation: question.explanation,
            } as QuestionInput)
      insertQuestion(newId, input, nextPosition(newId))
    }

    return reply.status(201).send({ quiz: quizDTO(getQuiz(newId), teacher.id) })
  })

  // ── Questions ───────────────────────────────────────────────
  app.post<{ Params: { id: string } }>('/:id/questions', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const quiz = getQuizOrForbidden(request.params.id, teacher.id)
    const input = parse(QuestionInputSchema, request.body)
    validateQuestionInput(input)

    const id = insertQuestion(quiz.id, input, nextPosition(quiz.id))
    db.prepare(
      'UPDATE quizzes SET updated_at = datetime(\'now\') WHERE id = ?',
    ).run(quiz.id)

    const row = db
      .prepare('SELECT * FROM questions WHERE id = ?')
      .get(id) as QuestionRow
    return reply.status(201).send({ question: toQuestionTeacherDTO(row) })
  })

  app.patch<{ Params: { id: string; qid: string } }>(
    '/:id/questions/:qid',
    async (request) => {
      const teacher = await requireRole(request, 'teacher')
      const quiz = getQuizOrForbidden(request.params.id, teacher.id)
      const input = parse(QuestionInputSchema, request.body)
      validateQuestionInput(input)

    const existing = db
      .prepare('SELECT * FROM questions WHERE id = ? AND quiz_id = ?')
      .get(request.params.qid, quiz.id) as QuestionRow | undefined
    if (!existing) throw notFound('Question not found')

    const { optionsJson, correctJson } = questionPayload(input)
    db.prepare(
      `UPDATE questions
       SET type = ?, prompt = ?, options_json = ?, correct_json = ?, alternatives_json = ?,
           points = ?, explanation = ?
       WHERE id = ?`,
    ).run(
      input.type,
      input.prompt.trim(),
      optionsJson,
      correctJson,
      input.type === 'fill' ? JSON.stringify(input.alternatives ?? []) : null,
      input.points,
      input.explanation ?? '',
      existing.id,
    )

      const row = db
        .prepare('SELECT * FROM questions WHERE id = ?')
        .get(existing.id) as QuestionRow
      return { question: toQuestionTeacherDTO(row) }
    },
  )

  app.delete<{ Params: { id: string; qid: string } }>(
    '/:id/questions/:qid',
    async (request: FastifyRequest<{ Params: { id: string; qid: string } }>, reply) => {
      const teacher = await requireRole(request, 'teacher')
      const quiz = getQuizOrForbidden(request.params.id, teacher.id)
      const result = db
        .prepare('DELETE FROM questions WHERE id = ? AND quiz_id = ?')
        .run(request.params.qid, quiz.id)
      if (result.changes === 0) throw notFound('Question not found')

      // Re-pack positions so the order stays contiguous.
      const remaining = db
        .prepare('SELECT id FROM questions WHERE quiz_id = ? ORDER BY position')
        .all(quiz.id) as { id: string }[]
      remaining.forEach((row, index) => {
        db.prepare('UPDATE questions SET position = ? WHERE id = ?').run(
          index,
          row.id,
        )
      })
      return reply.status(204).send()
    },
  )

  app.post<{ Params: { id: string } }>('/:id/reorder', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const quiz = getQuizOrForbidden(request.params.id, teacher.id)
    const input = parse(ReorderSchema, request.body)

    const ids = new Set(
      (
        db
          .prepare('SELECT id FROM questions WHERE quiz_id = ?')
          .all(quiz.id) as { id: string }[]
      ).map((row) => row.id),
    )
    if (input.questionIds.some((id) => !ids.has(id)) || input.questionIds.length !== ids.size) {
      throw badRequest('Question list does not match the quiz')
    }

    input.questionIds.forEach((id, index) => {
      db.prepare('UPDATE questions SET position = ? WHERE id = ?').run(index, id)
    })
    return { questions: (db
      .prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY position')
      .all(quiz.id) as QuestionRow[]).map(toQuestionTeacherDTO) }
  })

  // ── Analytics ───────────────────────────────────────────────
  app.get<{ Params: { id: string } }>('/:id/analytics', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const quiz = getQuizOrForbidden(request.params.id, teacher.id)

    const attemptRows = db
      .prepare(
        `SELECT a.*, u.name as student_name FROM attempts a
         JOIN users u ON u.id = a.student_id
         WHERE a.quiz_id = ? AND a.finished_at IS NOT NULL
         ORDER BY a.finished_at DESC`,
      )
      .all(quiz.id) as (AttemptRow & { student_name: string })[]

    const questionRows = db
      .prepare(
        `SELECT q.id, q.prompt, q.type,
                COUNT(ans.id) as seen_count,
                COALESCE(SUM(CASE WHEN ans.correct = 1 THEN 1 ELSE 0 END), 0) as correct_count
         FROM questions q
         LEFT JOIN attempt_answers ans ON ans.question_id = q.id
         WHERE q.quiz_id = ?
         GROUP BY q.id
         ORDER BY q.position`,
      )
      .all(quiz.id) as {
      id: string
      prompt: string
      type: QuestionRow['type']
      seen_count: number
      correct_count: number
    }[]

    const totalScore = attemptRows.reduce((sum, row) => sum + row.score, 0)
    return {
      quiz: quizDTO(quiz, teacher.id),
      attempts: attemptRows.map((row) => ({
        id: row.id,
        studentName: row.student_name,
        score: row.score,
        maxScore: row.max_score,
        accuracy: row.max_score > 0 ? row.score / row.max_score : 0,
        durationSec: row.duration_sec,
        finishedAt: row.finished_at,
      })),
      questionStats: questionRows.map((row) => ({
        questionId: row.id,
        prompt: row.prompt,
        type: row.type,
        seenCount: row.seen_count,
        correctCount: row.correct_count,
        accuracy: row.seen_count > 0 ? row.correct_count / row.seen_count : 0,
      })),
      avgScore: attemptRows.length > 0 ? totalScore / attemptRows.length : 0,
      completionCount: attemptRows.length,
    }
  })
}
