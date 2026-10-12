import { randomBytes, randomUUID } from 'node:crypto'
import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { db } from '../db'
import { requireAuth, requireRole } from '../lib/auth'
import { conflict, forbidden, notFound, parse } from '../lib/http'
import {
  ClassroomCreateSchema,
  JoinClassroomSchema,
} from '../../shared/schemas'
import type { ClassroomDTO, ClassroomRow } from '../../shared/types'

function uniqueJoinCode(): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomBytes(3).toString('hex').toUpperCase()
    const exists = db
      .prepare('SELECT 1 FROM classrooms WHERE join_code = ?')
      .get(code)
    if (!exists) return code
  }
  return randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
}

function getClassroom(id: string): ClassroomRow {
  const row = db.prepare('SELECT * FROM classrooms WHERE id = ?').get(id) as
    | ClassroomRow
    | undefined
  if (!row) throw notFound('Classroom not found')
  return row
}

function toClassroomDTO(row: ClassroomRow): ClassroomDTO {
  const memberCount = (
    db
      .prepare(
        'SELECT COUNT(*) as n FROM classroom_members WHERE classroom_id = ?',
      )
      .get(row.id) as { n: number }
  ).n
  const quizCount = (
    db
      .prepare('SELECT COUNT(*) as n FROM quizzes WHERE classroom_id = ?')
      .get(row.id) as { n: number }
  ).n
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    joinCode: row.join_code,
    memberCount,
    quizCount,
    createdAt: row.created_at,
  }
}

export const classroomRoutes: FastifyPluginAsync = async (app) => {
  app.post('/', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const input = parse(ClassroomCreateSchema, request.body)

    const id = randomUUID()
    db.prepare(
      `INSERT INTO classrooms (id, name, subject, teacher_id, join_code)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.name.trim(),
      input.subject.trim(),
      teacher.id,
      uniqueJoinCode(),
    )

    return reply.status(201).send({ classroom: toClassroomDTO(getClassroom(id)) })
  })

  app.get('/mine', async (request) => {
    const user = await requireAuth(request)

    if (user.role === 'teacher') {
      const rows = db
        .prepare(
          'SELECT * FROM classrooms WHERE teacher_id = ? ORDER BY created_at DESC',
        )
        .all(user.id) as ClassroomRow[]
      return { classrooms: rows.map(toClassroomDTO) }
    }

    if (user.role === 'student') {
      const rows = db
        .prepare(
          `SELECT c.* FROM classrooms c
           JOIN classroom_members m ON m.classroom_id = c.id
           WHERE m.student_id = ? ORDER BY c.created_at DESC`,
        )
        .all(user.id) as ClassroomRow[]
      return { classrooms: rows.map(toClassroomDTO) }
    }

    const rows = db
      .prepare(
        `SELECT DISTINCT c.* FROM classrooms c
         JOIN classroom_members m ON m.classroom_id = c.id
         JOIN parent_links p ON p.student_id = m.student_id
         WHERE p.parent_id = ? ORDER BY c.created_at DESC`,
      )
      .all(user.id) as ClassroomRow[]
    return { classrooms: rows.map(toClassroomDTO) }
  })

  app.post('/join', async (request, reply) => {
    const student = await requireRole(request, 'student')
    const input = parse(JoinClassroomSchema, request.body)

    const classroom = db
      .prepare('SELECT * FROM classrooms WHERE join_code = ?')
      .get(input.code.trim().toUpperCase()) as ClassroomRow | undefined
    if (!classroom) throw notFound('No classroom found with that join code')

    const already = db
      .prepare(
        'SELECT 1 FROM classroom_members WHERE classroom_id = ? AND student_id = ?',
      )
      .get(classroom.id, student.id)
    if (already) throw conflict('You are already a member of this classroom')

    db.prepare(
      'INSERT INTO classroom_members (classroom_id, student_id) VALUES (?, ?)',
    ).run(classroom.id, student.id)

    return reply.status(201).send({ classroom: toClassroomDTO(classroom) })
  })

  app.get<{ Params: { id: string } }>('/:id', async (request) => {
    const user = await requireAuth(request)
    const classroom = getClassroom(request.params.id)

    const isOwner =
      user.role === 'teacher' && classroom.teacher_id === user.id
    if (!isOwner) {
      let allowed = false
      if (user.role === 'student') {
        allowed = !!db
          .prepare(
            'SELECT 1 FROM classroom_members WHERE classroom_id = ? AND student_id = ?',
          )
          .get(classroom.id, user.id)
      } else if (user.role === 'parent') {
        allowed = !!db
          .prepare(
            `SELECT 1 FROM classroom_members m
             JOIN parent_links p ON p.student_id = m.student_id
             WHERE m.classroom_id = ? AND p.parent_id = ?`,
          )
          .get(classroom.id, user.id)
      }
      if (!allowed) throw forbidden('You are not a member of this classroom')
    }

    const members = db
      .prepare(
        `SELECT u.id, u.name, u.avatar_color, u.xp, u.streak_days
         FROM classroom_members m
         JOIN users u ON u.id = m.student_id
         WHERE m.classroom_id = ?
         ORDER BY u.xp DESC`,
      )
      .all(classroom.id) as {
      id: string
      name: string
      avatar_color: string
      xp: number
      streak_days: number
    }[]

    return {
      classroom: toClassroomDTO(classroom),
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        avatarColor: m.avatar_color,
        xp: m.xp,
        streakDays: m.streak_days,
      })),
    }
  })

  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const teacher = await requireRole(request, 'teacher')
      const classroom = getClassroom(request.params.id)
      if (classroom.teacher_id !== teacher.id) {
        throw forbidden('You can only delete your own classrooms')
      }
      db.prepare('DELETE FROM classrooms WHERE id = ?').run(classroom.id)
      return reply.status(204).send()
    },
  )
}
