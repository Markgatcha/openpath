import { db } from '../db'
import type {
  AssignmentDTO,
  AssignmentDueDTO,
  AssignmentRosterDTO,
  AssignmentRow,
  QuizRow,
} from '../../shared/types'

/** Student ids an assignment reaches (classroom members or the direct student). */
export function assignmentStudentIds(row: AssignmentRow): string[] {
  if (row.student_id) return [row.student_id]
  if (!row.classroom_id) return []
  return (
    db
      .prepare(
        'SELECT student_id FROM classroom_members WHERE classroom_id = ?',
      )
      .all(row.classroom_id) as { student_id: string }[]
  ).map((member) => member.student_id)
}

function attemptStatsFor(quizId: string, studentId: string): {
  used: number
  completed: boolean
  bestScore: number | null
  bestMaxScore: number | null
  completedAt: string | null
} {
  const rows = db
    .prepare(
      `SELECT score, max_score, finished_at FROM attempts
       WHERE quiz_id = ? AND student_id = ? AND finished_at IS NOT NULL
       ORDER BY finished_at DESC`,
    )
    .all(quizId, studentId) as {
    score: number
    max_score: number
    finished_at: string
  }[]
  const best = rows.reduce<{ score: number; max_score: number } | null>(
    (top, row) =>
      !top || row.score / (row.max_score || 1) > top.score / (top.max_score || 1)
        ? { score: row.score, max_score: row.max_score }
        : top,
    null,
  )
  return {
    used: rows.length,
    completed: rows.length > 0,
    bestScore: best?.score ?? null,
    bestMaxScore: best?.max_score ?? null,
    completedAt: rows[0]?.finished_at ?? null,
  }
}

export function assignmentRoster(row: AssignmentRow): AssignmentRosterDTO[] {
  const users = db
    .prepare(
      `SELECT id, name FROM users WHERE id IN (${assignmentStudentIds(row)
        .map(() => '?')
        .join(', ') || "''"}) ORDER BY name`,
    )
    .all(...assignmentStudentIds(row)) as { id: string; name: string }[]
  return users.map((user) => {
    const stats = attemptStatsFor(row.quiz_id, user.id)
    return {
      studentId: user.id,
      studentName: user.name,
      attemptsUsed: stats.used,
      completed: stats.completed,
      bestScore: stats.bestScore,
      bestMaxScore: stats.bestMaxScore,
      completedAt: stats.completedAt,
    }
  })
}

export function toAssignmentDTO(row: AssignmentRow): AssignmentDTO {
  const quiz = db.prepare('SELECT title FROM quizzes WHERE id = ?').get(
    row.quiz_id,
  ) as { title: string } | undefined
  const classroom = row.classroom_id
    ? (db
        .prepare('SELECT name FROM classrooms WHERE id = ?')
        .get(row.classroom_id) as { name: string } | undefined)
    : undefined
  const student = row.student_id
    ? (db.prepare('SELECT name FROM users WHERE id = ?').get(row.student_id) as
        | { name: string }
        | undefined)
    : undefined

  const students = assignmentStudentIds(row)
  const completed = students.filter((id) =>
    attemptStatsFor(row.quiz_id, id).completed,
  ).length

  return {
    id: row.id,
    quizId: row.quiz_id,
    quizTitle: quiz?.title ?? 'Deleted quiz',
    classroomId: row.classroom_id,
    classroomName: classroom?.name ?? null,
    studentId: row.student_id,
    studentName: student?.name ?? null,
    title: row.title,
    dueDate: row.due_date,
    availableFrom: row.available_from,
    maxAttempts: row.max_attempts,
    createdAt: row.created_at,
    assignedCount: students.length,
    completedCount: completed,
  }
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Assignments waiting for this student: directly assigned or via a joined
 * classroom, on published quizzes, within their availability window or with
 * one still in the future.
 */
export function dueAssignmentsFor(studentId: string): AssignmentDueDTO[] {
  const rows = db
    .prepare(
      `SELECT a.* FROM assignments a
       JOIN quizzes q ON q.id = a.quiz_id
       WHERE q.published = 1
         AND (
           a.student_id = ?
           OR a.classroom_id IN (
             SELECT classroom_id FROM classroom_members WHERE student_id = ?
           )
         )
       ORDER BY a.due_date IS NULL, a.due_date ASC, a.created_at DESC`,
    )
    .all(studentId, studentId) as AssignmentRow[]

  const today = isoToday()
  return rows.map((row) => {
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(
      row.quiz_id,
    ) as QuizRow | undefined
    const stats = attemptStatsFor(row.quiz_id, studentId)
    const locked = row.available_from !== null && row.available_from > today
    const daysLeft =
      row.due_date === null
        ? null
        : Math.round(
            (Date.parse(`${row.due_date}T00:00:00Z`) -
              Date.parse(`${today}T00:00:00Z`)) /
              86_400_000,
          )
    return {
      id: row.id,
      title: row.title || quiz?.title || 'Assignment',
      quizId: row.quiz_id,
      quizTitle: quiz?.title ?? 'Quiz',
      subject: quiz?.subject ?? 'General',
      dueDate: row.due_date,
      daysLeft,
      availableFrom: row.available_from,
      locked,
      attemptsUsed: stats.used,
      maxAttempts: row.max_attempts,
      completed: stats.completed,
      bestScore: stats.bestScore,
    }
  })
}

export interface AssignmentWindowCheck {
  ok: boolean
  message?: string
  /** The assignment whose rules apply (direct assignment wins over classroom). */
  assignment: AssignmentRow | null
}

/**
 * The assignment governing this student+quiz, if any. A direct (student)
 * assignment takes precedence over a classroom one; among classroom ones the
 * earliest due date wins so the strictest deadline applies.
 */
export function governingAssignment(
  studentId: string,
  quizId: string,
): AssignmentRow | null {
  const row = db
    .prepare(
      `SELECT * FROM assignments
       WHERE quiz_id = ?
         AND (
           student_id = ?
           OR classroom_id IN (SELECT classroom_id FROM classroom_members WHERE student_id = ?)
         )
       ORDER BY (student_id = ?) DESC, (due_date IS NULL), due_date ASC
       LIMIT 1`,
    )
    .get(quizId, studentId, studentId, studentId) as AssignmentRow | undefined
  return row ?? null
}

/** Availability window + attempt cap for the governing assignment. */
export function checkAssignmentRules(
  studentId: string,
  quizId: string,
): AssignmentWindowCheck {
  const assignment = governingAssignment(studentId, quizId)
  if (!assignment) return { ok: true, assignment: null }

  const today = isoToday()
  if (assignment.available_from && assignment.available_from > today) {
    return {
      ok: false,
      message: `This assignment opens on ${assignment.available_from}`,
      assignment,
    }
  }
  if (assignment.max_attempts > 0) {
    const used = (
      db
        .prepare(
          `SELECT COUNT(*) as n FROM attempts
           WHERE quiz_id = ? AND student_id = ? AND finished_at IS NOT NULL`,
        )
        .get(quizId, studentId) as { n: number }
    ).n
    if (used >= assignment.max_attempts) {
      return {
        ok: false,
        message: `No attempts left — this assignment allows ${assignment.max_attempts}`,
        assignment,
      }
    }
  }
  return { ok: true, assignment }
}
