import { randomBytes, randomUUID } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { hashPassword, requireAuth, signToken, verifyPassword } from '../lib/auth'
import { conflict, parse, unauthorized } from '../lib/http'
import { AVATAR_COLORS } from '../../shared/game'
import { toUserDTO, type UserRow } from '../../shared/types'
import {
  LoginSchema,
  ProfileUpdateSchema,
  RegisterSchema,
} from '../../shared/schemas'

/** Students get a shareable code so parents can link to their progress. */
function uniqueLinkCode(): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = `OL-${randomBytes(3).toString('hex').toUpperCase()}`
    const exists = db.prepare('SELECT 1 FROM users WHERE link_code = ?').get(code)
    if (!exists) return code
  }
  return `OL-${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`
}

function getUser(id: string): UserRow {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as
    | UserRow
    | undefined
  if (!row) throw unauthorized('Account no longer exists')
  return row
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/register', async (request, reply) => {
    const input = parse(RegisterSchema, request.body)
    const email = input.email.toLowerCase()

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) throw conflict('An account with this email already exists')

    const id = randomUUID()
    db.prepare(
      `INSERT INTO users (id, email, name, role, password_hash, avatar_color, link_code, minutes_today_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, date('now'))`,
    ).run(
      id,
      email,
      input.name.trim(),
      input.role,
      hashPassword(input.password),
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      input.role === 'student' ? uniqueLinkCode() : null,
    )

    const row = getUser(id)
    const token = signToken(app, row)
    return reply.status(201).send({ token, user: toUserDTO(row) })
  })

  app.post('/login', async (request, reply) => {
    const input = parse(LoginSchema, request.body)
    const row = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(input.email.toLowerCase()) as UserRow | undefined

    if (!row || !verifyPassword(input.password, row.password_hash)) {
      throw unauthorized('Invalid email or password')
    }

    const token = signToken(app, row)
    return reply.send({ token, user: toUserDTO(row) })
  })

  app.get('/me', async (request) => {
    const auth = await requireAuth(request)
    return { user: toUserDTO(getUser(auth.id)) }
  })

  app.patch('/me', async (request) => {
    const auth = await requireAuth(request)
    const input = parse(ProfileUpdateSchema, request.body)

    if (input.name !== undefined) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(
        input.name.trim(),
        auth.id,
      )
    }
    if (input.avatarColor !== undefined) {
      db.prepare('UPDATE users SET avatar_color = ? WHERE id = ?').run(
        input.avatarColor,
        auth.id,
      )
    }
    if (input.dailyGoalMinutes !== undefined) {
      db.prepare('UPDATE users SET daily_goal_minutes = ? WHERE id = ?').run(
        input.dailyGoalMinutes,
        auth.id,
      )
    }
    return { user: toUserDTO(getUser(auth.id)) }
  })
}
