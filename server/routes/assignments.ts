import { randomUUID } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireRole } from '../lib/auth'
import { badRequest, forbidden, notFound, parse } from '../lib/http'
import {
  assignmentRoster,
  dueAssignmentsFor,
  toAssignmentDTO,
} from '../lib/assignments'
import {
  AssignmentCreateSchema,
  AssignmentUpdateSchema,
} from '../../shared/schemas'
import type { AssignmentRow, ClassroomRow, QuizRow, UserRow } from '../../shared/types'

function getAssignment(id: string): AssignmentRow {
  const row = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as
    | AssignmentRow
    | undefined
  if (!row) throw notFound('Assignment not found')
  return row
}

function ownQuiz(quizId: string, teacherId: string): QuizRow {
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId) as
    | QuizRow
    | undefined
  if (!quiz) throw notFound('Quiz not found')
  if (quiz.teacher_id !== teacherId) {
    throw forbidden('You can only assign your own quizzes')
  }
  return quiz
}

function ownClassroom(classroomId: string, teacherId: string): ClassroomRow {
  const classroom = db
    .prepare('SELECT * FROM classrooms WHERE id = ?')
    .get(classroomId) as ClassroomRow | undefined
  if (!classroom) throw notFound('Classroom not found')
  if (classroom.teacher_id !== teacherId) {
    throw forbidden('You can only assign to your own classrooms')
  }
  return classroom
}

function ownStudent(studentId: string, teacherId: string): UserRow {
  const student = db.prepare('SELECT * FROM users WHERE id = ?').get(studentId) as
    | UserRow
    | undefined
  if (!student) throw notFound('Student not found')
  if (student.role !== 'student') {
    throw badRequest('That user is not a student')
  }
  // Teachers may only directly assign students who share a classroom with them.
  const shared = db
    .prepare(
      `SELECT 1 FROM classroom_members m
       JOIN classrooms c ON c.id = m.classroom_id
       WHERE m.student_id = ? AND c.teacher_id = ?`,
    )
    .get(studentId, teacherId)
  if (!shared) {
    throw forbidden('You can only assign students enrolled in your classrooms')
  }
  return student
}

export const assignmentRoutes: FastifyPluginAsync = async (app) => {
  // ── Teacher: create ─────────────────────────────────────────
  app.post('/', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const input = parse(AssignmentCreateSchema, request.body)

    ownQuiz(input.quizId, teacher.id)
    if (input.classroomId) ownClassroom(input.classroomId, teacher.id)
    if (input.studentId) ownStudent(input.studentId, teacher.id)
    if (
      input.dueDate &&
      input.availableFrom &&
      input.dueDate < input.availableFrom
    ) {
      throw badRequest('The due date cannot be before the opening date')
    }

    const id = randomUUID()
    db.prepare(
      `INSERT INTO assignments
         (id, quiz_id, classroom_id, student_id, title, due_date, available_from, max_attempts, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.quizId,
      input.classroomId,
      input.studentId,
      input.title.trim(),
      input.dueDate,
      input.availableFrom,
      input.maxAttempts,
      teacher.id,
    )

    return reply.status(201).send({ assignment: toAssignmentDTO(getAssignment(id)) })
  })

  // ── Teacher: my assignments ─────────────────────────────────
  app.get('/mine', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const rows = db
      .prepare(
        `SELECT a.* FROM assignments a
         JOIN quizzes q ON q.id = a.quiz_id
         WHERE q.teacher_id = ?
         ORDER BY a.due_date IS NULL, a.due_date ASC, a.created_at DESC`,
      )
      .all(teacher.id) as AssignmentRow[]
    return { assignments: rows.map(toAssignmentDTO) }
  })

  // ── Teacher: completion roster ──────────────────────────────
  app.get<{ Params: { id: string } }>('/:id/roster', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const assignment = getAssignment(request.params.id)
    ownQuiz(assignment.quiz_id, teacher.id)
    return {
      assignment: toAssignmentDTO(assignment),
      roster: assignmentRoster(assignment),
    }
  })

  // ── Teacher: update ─────────────────────────────────────────
  app.patch<{ Params: { id: string } }>('/:id', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const assignment = getAssignment(request.params.id)
    ownQuiz(assignment.quiz_id, teacher.id)
    const input = parse(AssignmentUpdateSchema, request.body)

    if (input.classroomId) ownClassroom(input.classroomId, teacher.id)
    if (input.studentId) ownStudent(input.studentId, teacher.id)
    // Omitted keys stay as they are; an explicit null clears the target.
    const classroomId =
      input.classroomId === undefined ? assignment.classroom_id : input.classroomId
    const studentId =
      input.studentId === undefined ? assignment.student_id : input.studentId
    if (!classroomId && !studentId) {
      throw badRequest('An assignment needs a classroom or a student')
    }
    const dueDate = input.dueDate === undefined ? assignment.due_date : input.dueDate
    const availableFrom =
      input.availableFrom === undefined
        ? assignment.available_from
        : input.availableFrom
    if (dueDate && availableFrom && dueDate < availableFrom) {
      throw badRequest('The due date cannot be before the opening date')
    }

    db.prepare(
      `UPDATE assignments
       SET classroom_id = ?, student_id = ?, title = ?, due_date = ?,
           available_from = ?, max_attempts = ?
       WHERE id = ?`,
    ).run(
      classroomId,
      studentId,
      (input.title ?? assignment.title).trim(),
      dueDate,
      availableFrom,
      input.maxAttempts ?? assignment.max_attempts,
      assignment.id,
    )
    return { assignment: toAssignmentDTO(getAssignment(assignment.id)) }
  })

  // ── Teacher: delete ─────────────────────────────────────────
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const assignment = getAssignment(request.params.id)
    ownQuiz(assignment.quiz_id, teacher.id)
    db.prepare('DELETE FROM assignments WHERE id = ?').run(assignment.id)
    return reply.status(204).send()
  })

  // ── Student: what is waiting for me ─────────────────────────
  app.get('/due', async (request) => {
    const student = await requireRole(request, 'student')
    return { assignments: dueAssignmentsFor(student.id) }
  })
}
