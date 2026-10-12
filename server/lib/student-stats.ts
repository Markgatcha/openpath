import { db } from '../db'
import { levelFromXp } from '../../shared/game'
import type {
  StudentSummaryDTO,
  UserRow,
} from '../../shared/types'

const DAY_MS = 86_400_000

export interface WeeklyMinutesPoint {
  day: string
  minutes: number
}

/** Study minutes per day for the last 7 days (oldest first). */
export function weeklyMinutesFor(studentId: string): WeeklyMinutesPoint[] {
  const rows = db
    .prepare(
      `SELECT date(finished_at) as day, SUM(duration_sec) as seconds
       FROM attempts
       WHERE student_id = ? AND finished_at IS NOT NULL
         AND date(finished_at) >= date('now', '-6 days')
       GROUP BY date(finished_at)`,
    )
    .all(studentId) as { day: string; seconds: number }[]

  const byDay = new Map(rows.map((row) => [row.day, row.seconds]))
  const points: WeeklyMinutesPoint[] = []
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(Date.now() - offset * DAY_MS).toISOString().slice(0, 10)
    const seconds = byDay.get(day) ?? 0
    points.push({ day, minutes: Math.round(seconds / 60) })
  }
  return points
}

export interface SubjectAccuracyPoint {
  subject: string
  accuracy: number
  attempts: number
}

/** Points-weighted accuracy per subject across finished attempts. */
export function subjectAccuracyFor(studentId: string): SubjectAccuracyPoint[] {
  return db
    .prepare(
      `SELECT q.subject as subject,
              SUM(CASE WHEN ans.correct = 1 THEN qq.points ELSE 0 END) * 1.0
                / NULLIF(SUM(qq.points), 0) as accuracy,
              COUNT(DISTINCT a.id) as attempts
       FROM attempt_answers ans
       JOIN questions qq ON qq.id = ans.question_id
       JOIN quizzes q ON q.id = qq.quiz_id
       JOIN attempts a ON a.id = ans.attempt_id
       WHERE a.student_id = ? AND a.finished_at IS NOT NULL
       GROUP BY q.subject
       ORDER BY attempts DESC`,
    )
    .all(studentId) as SubjectAccuracyPoint[]
}

export interface WeakQuestionPoint {
  prompt: string
  quizTitle: string
  wrongCount: number
  seenCount: number
}

/** Questions the student has missed most often. */
export function weakQuestionsFor(studentId: string): WeakQuestionPoint[] {
  return db
    .prepare(
      `SELECT qq.prompt as prompt, q.title as quiz_title,
              SUM(CASE WHEN ans.correct = 0 THEN 1 ELSE 0 END) as wrong_count,
              COUNT(ans.id) as seen_count
       FROM attempt_answers ans
       JOIN questions qq ON qq.id = ans.question_id
       JOIN quizzes q ON q.id = qq.quiz_id
       JOIN attempts a ON a.id = ans.attempt_id
       WHERE a.student_id = ? AND a.finished_at IS NOT NULL
       GROUP BY ans.question_id
       HAVING wrong_count > 0
       ORDER BY wrong_count DESC, seen_count DESC
       LIMIT 5`,
    )
    .all(studentId) as WeakQuestionPoint[]
}

export function attemptsTodayFor(studentId: string): number {
  return (
    db
      .prepare(
        `SELECT COUNT(*) as n FROM attempts
         WHERE student_id = ? AND finished_at IS NOT NULL AND date(finished_at) = date('now')`,
      )
      .get(studentId) as { n: number }
  ).n
}

export function attemptsThisWeekFor(studentId: string): number {
  return (
    db
      .prepare(
        `SELECT COUNT(*) as n FROM attempts
         WHERE student_id = ? AND finished_at IS NOT NULL
           AND date(finished_at) >= date('now', 'weekday 1', '-7 days')`,
      )
      .get(studentId) as { n: number }
  ).n
}

export function avgAccuracyFor(studentId: string): number {
  const row = db
    .prepare(
      `SELECT AVG(score * 1.0 / NULLIF(max_score, 0)) as avg FROM attempts
       WHERE student_id = ? AND finished_at IS NOT NULL AND max_score > 0`,
    )
    .get(studentId) as { avg: number | null }
  return row.avg ?? 0
}

/** 1-based all-time rank among all students by XP. */
export function globalRankFor(studentId: string): number {
  const row = db
    .prepare(
      `SELECT (SELECT COUNT(*) + 1 FROM users
               WHERE role = 'student' AND xp > (SELECT xp FROM users WHERE id = ?)) as rank`,
    )
    .get(studentId) as { rank: number }
  return row.rank
}

export function studentSummary(row: UserRow): StudentSummaryDTO {
  const lastAttempt = db
    .prepare(
      `SELECT MAX(finished_at) as last FROM attempts
       WHERE student_id = ? AND finished_at IS NOT NULL`,
    )
    .get(row.id) as { last: string | null }

  const minutesToday =
    row.minutes_today_date === new Date().toISOString().slice(0, 10)
      ? row.minutes_today
      : 0

  return {
    id: row.id,
    name: row.name,
    avatarColor: row.avatar_color,
    xp: row.xp,
    level: levelFromXp(row.xp),
    streakDays: row.streak_days,
    lastActive: lastAttempt.last,
    minutesToday,
    dailyGoalMinutes: row.daily_goal_minutes,
    attemptsThisWeek: attemptsThisWeekFor(row.id),
    avgAccuracy: avgAccuracyFor(row.id),
    isLinked: true,
  }
}
