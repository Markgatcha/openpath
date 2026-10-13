import { randomUUID } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireRole } from '../lib/auth'
import { badRequest, forbidden, notFound, parse } from '../lib/http'
import { parseQti } from '../lib/qti'
import { insertQuestion, quizDTO } from './quizzes'
import {
  BackupRestoreSchema,
  QtiImportSchema,
  type QuestionInput,
} from '../../shared/schemas'
import type { FigureSpec } from '../../shared/schemas'
import type {
  AssignmentRow,
  ClassroomRow,
  QuestionRow,
  QuizRow,
} from '../../shared/types'

function ownQuiz(quizId: string, teacherId: string): QuizRow {
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId) as
    | QuizRow
    | undefined
  if (!quiz) throw notFound('Quiz not found')
  if (quiz.teacher_id !== teacherId) {
    throw forbidden('You can only import into your own quizzes')
  }
  return quiz
}

/** Rebuild a question input from its stored row (inverse of the write path). */
function rowToQuestionInput(row: QuestionRow): QuestionInput {
  const base = {
    prompt: row.prompt,
    points: row.points,
    explanation: row.explanation,
  }
  if (row.type === 'figure') {
    return {
      type: 'figure',
      ...base,
      figure: JSON.parse(row.options_json ?? '{}') as FigureSpec,
    }
  }
  return {
    type: row.type,
    ...base,
    options: row.options_json ? JSON.parse(row.options_json) : undefined,
    correct: JSON.parse(row.correct_json),
    alternatives: row.alternatives_json
      ? JSON.parse(row.alternatives_json)
      : undefined,
  } as QuestionInput
}

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// ── Import ─────────────────────────────────────────────────────
export const importRoutes: FastifyPluginAsync = async (app) => {
  // QTI 2.1 XML → questions appended to an existing quiz.
  app.post('/qti', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const input = parse(QtiImportSchema, request.body)
    ownQuiz(input.quizId, teacher.id)

    const { questions, skipped } = parseQti(input.xml)
    if (questions.length === 0) {
      throw badRequest(
        skipped.length > 0
          ? `Nothing importable found — first problem: ${skipped[0].reason}`
          : 'No assessment items found in that XML',
      )
    }

    let position =
      (
        db
          .prepare('SELECT COALESCE(MAX(position), -1) + 1 as next FROM questions WHERE quiz_id = ?')
          .get(input.quizId) as { next: number }
      ).next
    for (const question of questions) {
      insertQuestion(input.quizId, question, position)
      position += 1
    }

    return reply.status(201).send({
      imported: questions.length,
      skipped,
    })
  })

  // Full JSON backup restore: quizzes (as drafts) + assignments.
  app.post('/restore', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const input = parse(BackupRestoreSchema, request.body)
    const backup = input.backup as {
      quizzes: Record<string, unknown>[]
      assignments?: Record<string, unknown>[]
    }

    interface RestoreQuiz {
      title?: unknown
      description?: unknown
      subject?: unknown
      difficulty?: unknown
      timeLimitSec?: unknown
      questions?: unknown
    }

    const classrooms = db
      .prepare('SELECT * FROM classrooms WHERE teacher_id = ?')
      .all(teacher.id) as ClassroomRow[]
    const memberNames = new Map<string, { id: string; name: string }[]>()
    for (const classroom of classrooms) {
      memberNames.set(
        classroom.id,
        (
          db
            .prepare(
              `SELECT u.id, u.name FROM classroom_members m
               JOIN users u ON u.id = m.student_id WHERE m.classroom_id = ?`,
            )
            .all(classroom.id) as { id: string; name: string }[]
        ),
      )
    }

    const titleToQuizId = new Map<string, string>()
    const createdQuizzes: string[] = []
    for (const raw of backup.quizzes ?? []) {
      const entry = raw as RestoreQuiz
      if (typeof entry.title !== 'string' || !Array.isArray(entry.questions)) {
        continue
      }
      const id = randomUUID()
      db.prepare(
        `INSERT INTO quizzes (id, title, description, subject, difficulty, teacher_id, classroom_id, time_limit_sec, published)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0)`,
      ).run(
        id,
        entry.title.slice(0, 120),
        typeof entry.description === 'string' ? entry.description.slice(0, 1000) : '',
        typeof entry.subject === 'string' ? entry.subject.slice(0, 60) : 'General',
        entry.difficulty === 'easy' || entry.difficulty === 'hard'
          ? entry.difficulty
          : 'medium',
        teacher.id,
        typeof entry.timeLimitSec === 'number' ? entry.timeLimitSec : null,
      )
      ;(entry.questions as Record<string, unknown>[]).forEach((question, index) => {
        insertQuestion(id, question as unknown as QuestionInput, index)
      })
      titleToQuizId.set(entry.title, id)
      createdQuizzes.push(id)
    }

    let createdAssignments = 0
    for (const raw of backup.assignments ?? []) {
      const entry = raw as {
        quizTitle?: unknown
        classroomName?: unknown
        studentName?: unknown
        title?: unknown
        dueDate?: unknown
        availableFrom?: unknown
        maxAttempts?: unknown
      }
      const quizId =
        typeof entry.quizTitle === 'string'
          ? titleToQuizId.get(entry.quizTitle)
          : undefined
      if (!quizId) continue

      let classroomId: string | null = null
      let studentId: string | null = null
      if (typeof entry.classroomName === 'string') {
        const match = classrooms.find(
          (classroom) => classroom.name === entry.classroomName,
        )
        classroomId = match?.id ?? null
      } else if (typeof entry.studentName === 'string') {
        for (const members of memberNames.values()) {
          const match = members.find((member) => member.name === entry.studentName)
          if (match) {
            studentId = match.id
            break
          }
        }
      }
      if (!classroomId && !studentId) continue

      db.prepare(
        `INSERT INTO assignments
           (id, quiz_id, classroom_id, student_id, title, due_date, available_from, max_attempts, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        randomUUID(),
        quizId,
        classroomId,
        studentId,
        typeof entry.title === 'string' ? entry.title.slice(0, 120) : '',
        typeof entry.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.dueDate)
          ? entry.dueDate
          : null,
        typeof entry.availableFrom === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(entry.availableFrom)
          ? entry.availableFrom
          : null,
        typeof entry.maxAttempts === 'number' ? entry.maxAttempts : 0,
        teacher.id,
      )
      createdAssignments += 1
    }

    const rows = createdQuizzes
      .map((id) => db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id))
      .filter(Boolean) as QuizRow[]

    return reply.status(201).send({
      quizzes: rows.map((row) => quizDTO(row, teacher.id)),
      createdAssignments,
    })
  })
}

// ── Export ─────────────────────────────────────────────────────
export const exportRoutes: FastifyPluginAsync = async (app) => {
  // Full JSON backup of the teacher's content.
  app.get('/backup', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const quizzes = db
      .prepare('SELECT * FROM quizzes WHERE teacher_id = ? ORDER BY created_at')
      .all(teacher.id) as QuizRow[]

    const questionRows = new Map<string, QuestionRow[]>()
    for (const quiz of quizzes) {
      questionRows.set(
        quiz.id,
        db
          .prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY position')
          .all(quiz.id) as QuestionRow[],
      )
    }

    const assignments = db
      .prepare(
        `SELECT a.* FROM assignments a
         JOIN quizzes q ON q.id = a.quiz_id
         WHERE q.teacher_id = ?`,
      )
      .all(teacher.id) as AssignmentRow[]

    const user = db
      .prepare('SELECT name, email FROM users WHERE id = ?')
      .get(teacher.id) as { name: string; email: string }

    return {
      format: 'openpath-backup' as const,
      version: 1,
      exportedAt: new Date().toISOString(),
      user,
      quizzes: quizzes.map((quiz) => ({
        title: quiz.title,
        description: quiz.description,
        subject: quiz.subject,
        difficulty: quiz.difficulty,
        timeLimitSec: quiz.time_limit_sec,
        published: quiz.published === 1,
        questions: (questionRows.get(quiz.id) ?? []).map(rowToQuestionInput),
      })),
      assignments: assignments.map((assignment) => {
        const classroom = assignment.classroom_id
          ? (db
              .prepare('SELECT name FROM classrooms WHERE id = ?')
              .get(assignment.classroom_id) as { name: string } | undefined)
          : undefined
        const student = assignment.student_id
          ? (db.prepare('SELECT name FROM users WHERE id = ?').get(
              assignment.student_id,
            ) as { name: string } | undefined)
          : undefined
        return {
          quizTitle: (
            db.prepare('SELECT title FROM quizzes WHERE id = ?').get(
              assignment.quiz_id,
            ) as { title: string }
          ).title,
          classroomName: classroom?.name ?? null,
          studentName: student?.name ?? null,
          title: assignment.title,
          dueDate: assignment.due_date,
          availableFrom: assignment.available_from,
          maxAttempts: assignment.max_attempts,
        }
      }),
    }
  })

  // Per-quiz attempts as CSV (finished runs only).
  app.get<{ Querystring: { quizId?: string } }>('/attempts.csv', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const quizId = request.query.quizId
    if (!quizId) throw badRequest('quizId is required')
    ownQuiz(quizId, teacher.id)

    const quiz = db.prepare('SELECT title FROM quizzes WHERE id = ?').get(quizId) as {
      title: string
    }
    const rows = db
      .prepare(
        `SELECT u.name, u.email, a.score, a.max_score, a.duration_sec, a.finished_at
         FROM attempts a
         JOIN users u ON u.id = a.student_id
         WHERE a.quiz_id = ? AND a.finished_at IS NOT NULL
         ORDER BY a.finished_at DESC`,
      )
      .all(quizId) as {
      name: string
      email: string
      score: number
      max_score: number
      duration_sec: number
      finished_at: string
    }[]

    const header = [
      'Student',
      'Email',
      'Quiz',
      'Score',
      'Max score',
      'Accuracy %',
      'Duration (s)',
      'Finished at',
    ]
    const lines = rows.map((row) =>
      [
        row.name,
        row.email,
        quiz.title,
        row.score,
        row.max_score,
        row.max_score > 0 ? Math.round((row.score / row.max_score) * 100) : '',
        row.duration_sec,
        row.finished_at,
      ]
        .map(csvCell)
        .join(','),
    )
    const csv = [header.join(','), ...lines].join('\n')

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header(
        'Content-Disposition',
        `attachment; filename="attempts-${quiz.title.replace(/[^\w.-]+/g, '_')}.csv"`,
      )
      .send(csv)
  })
}
