import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireRole } from '../lib/auth'
import { forbidden, notFound } from '../lib/http'
import { toAttemptSummaryDTO, toBadgeDTO } from '../lib/mappers'
import {
  attemptsTodayFor,
  globalRankFor,
  studentSummary,
  subjectAccuracyFor,
  weakQuestionsFor,
  weeklyMinutesFor,
} from '../lib/student-stats'
import { quizDTO } from './quizzes'
import { toUserDTO } from '../../shared/types'
import type {
  AttemptRow,
  BadgeDTO,
  BadgeRow,
  ChildDetailDTO,
  QuizRow,
  StudentDashboardDTO,
  UserRow,
} from '../../shared/types'

function currentUser(id: string): UserRow {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as
    | UserRow
    | undefined
  if (!row) throw notFound('User not found')
  return row
}

function minutesTodayOf(user: UserRow): number {
  const today = new Date().toISOString().slice(0, 10)
  return user.minutes_today_date === today ? user.minutes_today : 0
}

export const statsRoutes: FastifyPluginAsync = async (app) => {
  // ── Student dashboard ───────────────────────────────────────
  app.get('/student/dashboard', async (request) => {
    const auth = await requireRole(request, 'student')
    const user = currentUser(auth.id)

    const attemptedQuizIds = new Set(
      (
        db
          .prepare('SELECT DISTINCT quiz_id FROM attempts WHERE student_id = ?')
          .all(auth.id) as { quiz_id: string }[]
      ).map((row) => row.quiz_id),
    )

    const classroomQuizRows = db
      .prepare(
        `SELECT q.* FROM quizzes q
         WHERE q.published = 1
           AND q.classroom_id IN (SELECT classroom_id FROM classroom_members WHERE student_id = ?)
         ORDER BY q.updated_at DESC`,
      )
      .all(auth.id) as QuizRow[]

    const publicRows = db
      .prepare(
        `SELECT * FROM quizzes
         WHERE published = 1 AND classroom_id IS NULL
         ORDER BY updated_at DESC
         LIMIT 12`,
      )
      .all() as QuizRow[]

    const recommended = publicRows
      .filter((row) => !attemptedQuizIds.has(row.id))
      .slice(0, 6)

    const recentRows = db
      .prepare(
        `SELECT a.*, q.title as quiz_title, q.subject as subject
         FROM attempts a
         JOIN quizzes q ON q.id = a.quiz_id
         WHERE a.student_id = ? AND a.finished_at IS NOT NULL
         ORDER BY a.finished_at DESC
         LIMIT 5`,
      )
      .all(auth.id) as (AttemptRow & { quiz_title: string; subject: string })[]

    const badgeDefs = db
      .prepare('SELECT * FROM badges ORDER BY sort_order')
      .all() as BadgeRow[]
    const earnedMap = new Map(
      (
        db
          .prepare('SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?')
          .all(auth.id) as { badge_id: string; earned_at: string }[]
      ).map((row) => [row.badge_id, row.earned_at]),
    )
    const earnedBadges: BadgeDTO[] = badgeDefs
      .filter((def) => earnedMap.has(def.id))
      .map((def) => toBadgeDTO(def, true, earnedMap.get(def.id) ?? null))

    const dashboard: StudentDashboardDTO = {
      user: toUserDTO(user),
      minutesToday: minutesTodayOf(user),
      dailyGoalMinutes: user.daily_goal_minutes,
      attemptsToday: attemptsTodayFor(auth.id),
      recommended: recommended.map((row) => quizDTO(row, auth.id)),
      classroomQuizzes: classroomQuizRows.map((row) =>
        quizDTO(row, auth.id),
      ),
      recentAttempts: recentRows.map((row) =>
        toAttemptSummaryDTO(row, row.quiz_title, row.subject),
      ),
      earnedBadges,
      weeklyMinutes: weeklyMinutesFor(auth.id),
      myRank: globalRankFor(auth.id),
    }
    return dashboard
  })

  // ── Parent: child detail ────────────────────────────────────
  app.get<{ Params: { studentId: string } }>(
    '/parent/child/:studentId',
    async (request) => {
      const parent = await requireRole(request, 'parent')
      const linked = db
        .prepare(
          'SELECT 1 FROM parent_links WHERE parent_id = ? AND student_id = ?',
        )
        .get(parent.id, request.params.studentId)
      if (!linked) throw forbidden('You are not linked to this student')

      const student = currentUser(request.params.studentId)

      const recentRows = db
        .prepare(
          `SELECT a.*, q.title as quiz_title, q.subject as subject
           FROM attempts a
           JOIN quizzes q ON q.id = a.quiz_id
           WHERE a.student_id = ? AND a.finished_at IS NOT NULL
           ORDER BY a.finished_at DESC
           LIMIT 10`,
        )
        .all(student.id) as (AttemptRow & {
        quiz_title: string
        subject: string
      })[]

      const badgeDefs = db
        .prepare('SELECT * FROM badges ORDER BY sort_order')
        .all() as BadgeRow[]
      const earnedMap = new Map(
        (
          db
            .prepare(
              'SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?',
            )
            .all(student.id) as { badge_id: string; earned_at: string }[]
        ).map((row) => [row.badge_id, row.earned_at]),
      )

      const detail: ChildDetailDTO = {
        student: toUserDTO(student),
        summary: studentSummary(student),
        recentAttempts: recentRows.map((row) =>
          toAttemptSummaryDTO(row, row.quiz_title, row.subject),
        ),
        subjectAccuracy: subjectAccuracyFor(student.id),
        weakQuestions: weakQuestionsFor(student.id),
        weeklyMinutes: weeklyMinutesFor(student.id),
        badges: badgeDefs.map((def) =>
          toBadgeDTO(def, earnedMap.has(def.id), earnedMap.get(def.id) ?? null),
        ),
      }
      return detail
    },
  )
}
