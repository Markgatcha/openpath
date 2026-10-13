import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireAuth, requireRole } from '../lib/auth'
import { badRequest, notFound, parse } from '../lib/http'
import { toBadgeDTO } from '../lib/mappers'
import { readCosmetics } from '../lib/economy'
import { studentSummary } from '../lib/student-stats'
import { levelFromXp } from '../../shared/game'
import { LinkChildSchema } from '../../shared/schemas'
import type {
  BadgeDTO,
  BadgeRow,
  LeaderboardEntryDTO,
  UserRow,
} from '../../shared/types'

export const communityRoutes: FastifyPluginAsync = async (app) => {
  // ── All badges + which ones I earned ────────────────────────
  app.get('/badges', async (request) => {
    const user = await requireAuth(request)
    const defs = db
      .prepare('SELECT * FROM badges ORDER BY sort_order')
      .all() as BadgeRow[]
    const earned = new Map(
      (
        db
          .prepare(
            'SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?',
          )
          .all(user.id) as { badge_id: string; earned_at: string }[]
      ).map((row) => [row.badge_id, row.earned_at]),
    )
    const badges: BadgeDTO[] = defs.map((def) =>
      toBadgeDTO(def, earned.has(def.id), earned.get(def.id) ?? null),
    )
    return { badges }
  })

  // ── Leaderboard ─────────────────────────────────────────────
  app.get('/leaderboard', async (request) => {
    const user = await requireAuth(request)
    const query = request.query as {
      scope?: string
      window?: string
      classroomId?: string
    }

    let students: UserRow[]
    if (query.scope === 'classroom') {
      if (!query.classroomId) {
        throw badRequest('classroomId is required for classroom scope')
      }
      students = db
        .prepare(
          `SELECT u.* FROM classroom_members m
           JOIN users u ON u.id = m.student_id
           WHERE m.classroom_id = ?`,
        )
        .all(query.classroomId) as UserRow[]
    } else {
      students = db
        .prepare(`SELECT * FROM users WHERE role = 'student'`)
        .all() as UserRow[]
    }

    let weeklyXp = new Map<string, number>()
    if (query.window === 'week') {
      const rows = db
        .prepare(
          `SELECT student_id, COALESCE(SUM(xp_earned), 0) as xp
           FROM attempts
           WHERE finished_at IS NOT NULL
             AND date(finished_at) >= date('now', 'weekday 1', '-7 days')
           GROUP BY student_id`,
        )
        .all() as { student_id: string; xp: number }[]
      weeklyXp = new Map(rows.map((row) => [row.student_id, row.xp]))
    }

    const useWeekly = query.window === 'week'
    const sorted = students
      .map((row) => ({
        row,
        xp: useWeekly ? (weeklyXp.get(row.id) ?? 0) : row.xp,
      }))
      .sort((a, b) => b.xp - a.xp)

    const top = sorted.slice(0, 50)
    const entries: LeaderboardEntryDTO[] = top.map((entry, index) => ({
      rank: index + 1,
      userId: entry.row.id,
      name: entry.row.name,
      avatarColor: entry.row.avatar_color,
      xp: entry.xp,
      level: levelFromXp(entry.xp),
      streakDays: entry.row.streak_days,
      isMe: entry.row.id === user.id,
      cosmetics: readCosmetics(entry.row),
    }))

    let myRank: number | null = null
    const inTop = entries.findIndex((entry) => entry.isMe)
    if (inTop !== -1) {
      myRank = entries[inTop].rank
    } else {
      const myIndex = sorted.findIndex((entry) => entry.row.id === user.id)
      if (myIndex !== -1) myRank = myIndex + 1
    }

    return { entries, myRank }
  })

  // ── Parent: link to a child via their link code ─────────────
  app.post('/parent/link', async (request, reply) => {
    const parent = await requireRole(request, 'parent')
    const input = parse(LinkChildSchema, request.body)

    const student = db
      .prepare('SELECT * FROM users WHERE link_code = ?')
      .get(input.code.trim().toUpperCase()) as UserRow | undefined
    if (!student || student.role !== 'student') {
      throw notFound('No student found with that link code')
    }

    db.prepare(
      'INSERT OR IGNORE INTO parent_links (parent_id, student_id) VALUES (?, ?)',
    ).run(parent.id, student.id)

    return reply.status(201).send({ child: studentSummary(student) })
  })

  // ── Parent: my linked children ──────────────────────────────
  app.get('/parent/children', async (request) => {
    const parent = await requireRole(request, 'parent')
    const students = db
      .prepare(
        `SELECT u.* FROM parent_links p
         JOIN users u ON u.id = p.student_id
         WHERE p.parent_id = ?
         ORDER BY u.name`,
      )
      .all(parent.id) as UserRow[]
    return { children: students.map(studentSummary) }
  })
}
