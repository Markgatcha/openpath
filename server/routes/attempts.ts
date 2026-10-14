import { randomUUID } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireAuth, requireRole } from '../lib/auth'
import { gradeAnswer } from '../lib/grading'
import { badRequest, forbidden, notFound, parse } from '../lib/http'
import { checkAssignmentRules } from '../lib/assignments'
import { awardCoins, grantLevelRewards } from '../lib/economy'
import { notifyWorkCompleted } from '../lib/notifications'
import { toAttemptSummaryDTO, toStudentQuestionDTO } from '../lib/mappers'
import { quizDTO } from './quizzes'
import {
  AttemptAnswerSchema,
  StartAttemptSchema,
} from '../../shared/schemas'
import { computeXp, levelFromXp, nextStreak, todayStr } from '../../shared/game'
import type {
  AnswerResultDTO,
  AttemptAnswerRow,
  AttemptFinishDTO,
  AttemptRow,
  BadgeRow,
  QuestionRow,
  QuizRow,
  StudentQuestionDTO,
  UserRow,
} from '../../shared/types'

function getAttempt(id: string): AttemptRow {
  const row = db.prepare('SELECT * FROM attempts WHERE id = ?').get(id) as
    | AttemptRow
    | undefined
  if (!row) throw notFound('Attempt not found')
  return row
}

function getQuiz(id: string): QuizRow {
  const row = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as
    | QuizRow
    | undefined
  if (!row) throw notFound('Quiz not found')
  return row
}

function studentCanSeeQuiz(studentId: string, quiz: QuizRow): boolean {
  if (quiz.published !== 1) return false
  if (!quiz.classroom_id) return true
  return !!db
    .prepare(
      'SELECT 1 FROM classroom_members WHERE classroom_id = ? AND student_id = ?',
    )
    .get(quiz.classroom_id, studentId)
}

function questionsFor(quizId: string): QuestionRow[] {
  return db
    .prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY position')
    .all(quizId) as QuestionRow[]
}

function freshAttemptRow(id: string): AttemptRow {
  return db.prepare('SELECT * FROM attempts WHERE id = ?').get(id) as AttemptRow
}

function evaluateBadges(
  userId: string,
  ctx: {
    score: number
    maxScore: number
    comboBest: number
    avgMs: number
    accuracy: number
    total: number
  },
): { id: string; name: string; description: string; icon: string }[] {
  const user = db
    .prepare('SELECT streak_days FROM users WHERE id = ?')
    .get(userId) as { streak_days: number }

  const earned = new Set(
    (
      db
        .prepare('SELECT badge_id FROM user_badges WHERE user_id = ?')
        .all(userId) as { badge_id: string }[]
    ).map((row) => row.badge_id),
  )

  const defs = db
    .prepare('SELECT * FROM badges ORDER BY sort_order')
    .all() as BadgeRow[]

  const attemptsCount = (
    db
      .prepare(
        `SELECT COUNT(*) as n FROM attempts
         WHERE student_id = ? AND finished_at IS NOT NULL`,
      )
      .get(userId) as { n: number }
  ).n

  const subjectsCount = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT q.subject) as n FROM attempts a
         JOIN quizzes q ON q.id = a.quiz_id
         WHERE a.student_id = ? AND a.finished_at IS NOT NULL`,
      )
      .get(userId) as { n: number }
  ).n

  const newly: BadgeRow[] = []
  for (const def of defs) {
    if (earned.has(def.id)) continue
    let ok = false
    switch (def.condition) {
      case 'first_quiz':
        ok = attemptsCount >= 1
        break
      case 'perfect':
        ok = ctx.maxScore > 0 && ctx.score === ctx.maxScore
        break
      case 'combo_10':
        ok = ctx.comboBest >= 10
        break
      case 'streak_3':
        ok = user.streak_days >= 3
        break
      case 'streak_7':
        ok = user.streak_days >= 7
        break
      case 'speedster':
        ok = ctx.avgMs < 5000 && ctx.accuracy >= 0.8 && ctx.total >= 5
        break
      case 'explorer':
        ok = subjectsCount >= 3
        break
      case 'marathon_10':
        ok = attemptsCount >= 10
        break
    }
    if (ok) {
      db.prepare(
        'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
      ).run(userId, def.id)
      newly.push(def)
    }
  }

  return newly.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
  }))
}

export const attemptRoutes: FastifyPluginAsync = async (app) => {
  // ── Start (or resume) an attempt ────────────────────────────
  app.post('/', async (request, reply) => {
    const student = await requireRole(request, 'student')
    const input = parse(StartAttemptSchema, request.body)
    const quiz = getQuiz(input.quizId)
    if (!studentCanSeeQuiz(student.id, quiz)) {
      throw forbidden('This quiz is not available to you')
    }

    // Homework rules: availability window and attempt caps.
    const rules = checkAssignmentRules(student.id, quiz.id)
    if (!rules.ok) throw forbidden(rules.message!)

    const existing = db
      .prepare(
        `SELECT * FROM attempts
         WHERE quiz_id = ? AND student_id = ? AND finished_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(quiz.id, student.id) as AttemptRow | undefined

    const attempt = existing ?? {
      id: randomUUID(),
      quiz_id: quiz.id,
      student_id: student.id,
      score: 0,
      max_score: 0,
      xp_earned: 0,
      correct_count: 0,
      total_questions: 0,
      combo_best: 0,
      duration_sec: 0,
      created_at: new Date().toISOString(),
      finished_at: null,
    }

    if (!existing) {
      db.prepare(
        'INSERT INTO attempts (id, quiz_id, student_id) VALUES (?, ?, ?)',
      ).run(attempt.id, quiz.id, student.id)
    }

    const questions: StudentQuestionDTO[] = questionsFor(quiz.id).map(
      toStudentQuestionDTO,
    )

    return reply.status(existing ? 200 : 201).send({
      attemptId: attempt.id,
      quiz: quizDTO(quiz, student.id),
      questions,
      resumed: Boolean(existing),
    })
  })

  // ── Submit one answer (first answer is final) ───────────────
  app.post<{ Params: { id: string } }>('/:id/answer', async (request, reply) => {
    const student = await requireRole(request, 'student')
    const attempt = getAttempt(request.params.id)
    if (attempt.student_id !== student.id) {
      throw forbidden('This attempt belongs to another student')
    }
    if (attempt.finished_at) {
      throw badRequest('This attempt is already finished')
    }

    const input = parse(AttemptAnswerSchema, request.body)
    const question = db
      .prepare('SELECT * FROM questions WHERE id = ? AND quiz_id = ?')
      .get(input.questionId, attempt.quiz_id) as QuestionRow | undefined
    if (!question) throw notFound('Question is not part of this quiz')

    const already = db
      .prepare(
        'SELECT id, correct FROM attempt_answers WHERE attempt_id = ? AND question_id = ?',
      )
      .get(attempt.id, question.id) as { id: string; correct: number } | undefined
    if (already) {
      return reply.status(200).send({
        alreadyAnswered: true,
        correct: already.correct === 1,
      })
    }

    const correct = gradeAnswer(question, input.response)
    db.prepare(
      `INSERT INTO attempt_answers (id, attempt_id, question_id, response_json, correct, ms_taken)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      attempt.id,
      question.id,
      JSON.stringify(input.response),
      correct ? 1 : 0,
      input.msTaken,
    )

    // Live combo = consecutive correct answers ending at this one.
    const answers = db
      .prepare(
        'SELECT correct FROM attempt_answers WHERE attempt_id = ? ORDER BY created_at',
      )
      .all(attempt.id) as { correct: number }[]
    let combo = 0
    for (let i = answers.length - 1; i >= 0 && answers[i].correct === 1; i -= 1) {
      combo += 1
    }

    return reply.status(201).send({
      alreadyAnswered: false,
      correct,
      correctAnswer: JSON.parse(question.correct_json),
      explanation: question.explanation,
      points: question.points,
      combo,
    })
  })

  // ── Finish: score, XP, streaks, badges ──────────────────────
  app.post<{ Params: { id: string } }>('/:id/finish', async (request) => {
    const student = await requireRole(request, 'student')
    const attempt = getAttempt(request.params.id)
    if (attempt.student_id !== student.id) {
      throw forbidden('This attempt belongs to another student')
    }

    const quiz = getQuiz(attempt.quiz_id)
    const questions = questionsFor(quiz.id)

    if (attempt.finished_at) {
      // Idempotent: return the recorded result again.
      const user = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(student.id) as UserRow
      const answers = db
        .prepare(
          'SELECT * FROM attempt_answers WHERE attempt_id = ? ORDER BY created_at',
        )
        .all(attempt.id) as AttemptAnswerRow[]
      return {
        attempt: toAttemptSummaryDTO(attempt, quiz.title, quiz.subject),
        xpEarned: attempt.xp_earned,
        newLevel: null,
        streakDays: user.streak_days,
        newBadges: [],
        breakdown: buildBreakdown(questions, answers),
        comboBest: attempt.combo_best,
        avgMs: answers.length > 0
          ? answers.reduce((sum, a) => sum + a.ms_taken, 0) / answers.length
          : 0,
        coinsEarned: null,
        levelRewards: [],
      } satisfies AttemptFinishDTO
    }

    const answers = db
      .prepare(
        'SELECT * FROM attempt_answers WHERE attempt_id = ? ORDER BY created_at',
      )
      .all(attempt.id) as AttemptAnswerRow[]
    const byQuestion = new Map(answers.map((a) => [a.question_id, a]))

    let score = 0
    let maxScore = 0
    let correctCount = 0
    let combo = 0
    let comboBest = 0
    let answeredMs = 0
    let answeredCount = 0

    for (const question of questions) {
      maxScore += question.points
      const answer = byQuestion.get(question.id)
      if (!answer) continue
      answeredCount += 1
      answeredMs += answer.ms_taken
      if (answer.correct === 1) {
        score += question.points
        correctCount += 1
        combo += 1
        comboBest = Math.max(comboBest, combo)
      } else {
        combo = 0
      }
    }

    const avgMs = answeredCount > 0 ? answeredMs / answeredCount : 0
    const startedAt = new Date(`${attempt.created_at.replace(' ', 'T')}Z`)
    const durationSec = Math.max(
      1,
      Math.round((Date.now() - startedAt.getTime()) / 1000),
    )

    const xpEarned = computeXp({
      correct: correctCount,
      total: questions.length,
      comboBest,
      avgMs,
      difficulty: quiz.difficulty,
      timeUsedSec: durationSec,
      timeLimitSec: quiz.time_limit_sec,
    })

    const user = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(student.id) as UserRow

    const streakDays = nextStreak(user.streak_last_active, user.streak_days)
    const today = todayStr()
    const previousMinutes =
      user.minutes_today_date === today ? user.minutes_today : 0
    const addedMinutes = Math.round(durationSec / 60)

    const newXp = user.xp + xpEarned
    const newLevel = levelFromXp(newXp)
    const leveledUp =
      newLevel > levelFromXp(user.xp) ? newLevel : null

    db.prepare(
      `UPDATE attempts
       SET score = ?, max_score = ?, xp_earned = ?, correct_count = ?, total_questions = ?,
           combo_best = ?, duration_sec = ?, finished_at = datetime('now')
       WHERE id = ?`,
    ).run(
      score,
      maxScore,
      xpEarned,
      correctCount,
      questions.length,
      comboBest,
      durationSec,
      attempt.id,
    )

    db.prepare(
      `UPDATE users
       SET xp = ?, streak_days = ?, streak_last_active = ?, minutes_today = ?, minutes_today_date = ?
       WHERE id = ?`,
    ).run(newXp, streakDays, today, previousMinutes + addedMinutes, today, student.id)

    const newBadges = evaluateBadges(student.id, {
      score,
      maxScore,
      comboBest,
      avgMs,
      accuracy: maxScore > 0 ? score / maxScore : 0,
      total: questions.length,
    })

    // Classroom economy: points on graded work mint coins; leveling up
    // pays out the teacher's configured rewards.
    const coinsEarned = awardCoins(
      student.id,
      score,
      quiz.kind,
      quiz.teacher_id,
      attempt.id,
    )
    const levelRewards = leveledUp
      ? grantLevelRewards(
          student.id,
          quiz.teacher_id,
          levelFromXp(user.xp),
          leveledUp,
        )
      : []

    // Parents + teacher get told when graded out-of-class work is done.
    if (quiz.kind === 'homework' || quiz.kind === 'classwork') {
      notifyWorkCompleted({
        studentId: student.id,
        studentName: user.name,
        quizTitle: quiz.title,
        kind: quiz.kind,
        accuracy: maxScore > 0 ? score / maxScore : 0,
        attemptId: attempt.id,
        quizId: quiz.id,
      })
    }

    const fresh = freshAttemptRow(attempt.id)
    return {
      attempt: toAttemptSummaryDTO(fresh, quiz.title, quiz.subject),
      xpEarned,
      newLevel: leveledUp,
      streakDays,
      newBadges,
      breakdown: buildBreakdown(questions, answers),
      comboBest,
      avgMs,
      coinsEarned,
      levelRewards,
    } satisfies AttemptFinishDTO
  })

  // ── My attempts ─────────────────────────────────────────────
  app.get('/mine', async (request) => {
    const student = await requireRole(request, 'student')
    const rows = db
      .prepare(
        `SELECT a.*, q.title as quiz_title, q.subject as subject
         FROM attempts a
         JOIN quizzes q ON q.id = a.quiz_id
         WHERE a.student_id = ?
         ORDER BY a.created_at DESC
         LIMIT 50`,
      )
      .all(student.id) as (AttemptRow & {
      quiz_title: string
      subject: string
    })[]
    return {
      attempts: rows.map((row) =>
        toAttemptSummaryDTO(row, row.quiz_title, row.subject),
      ),
    }
  })

  // ── Attempt detail (owner student or owning teacher) ─────────
  app.get<{ Params: { id: string } }>('/:id', async (request) => {
    const user = await requireAuth(request)
    const attempt = getAttempt(request.params.id)
    const quiz = getQuiz(attempt.quiz_id)

    const isOwner = attempt.student_id === user.id
    const isTeacher = user.role === 'teacher' && quiz.teacher_id === user.id
    if (!isOwner && !isTeacher) throw forbidden('You cannot view this attempt')

    const answers = db
      .prepare(
        'SELECT * FROM attempt_answers WHERE attempt_id = ? ORDER BY created_at',
      )
      .all(attempt.id) as AttemptAnswerRow[]

    return {
      attempt: toAttemptSummaryDTO(attempt, quiz.title, quiz.subject),
      breakdown: buildBreakdown(questionsFor(quiz.id), answers),
      answers: answers.map((a) => ({
        questionId: a.question_id,
        response: JSON.parse(a.response_json),
        correct: a.correct === 1,
        msTaken: a.ms_taken,
      })),
    }
  })
}

function buildBreakdown(
  questions: QuestionRow[],
  answers: AttemptAnswerRow[],
): AnswerResultDTO[] {
  const byQuestion = new Map(answers.map((a) => [a.question_id, a]))
  return questions.map((question) => {
    const answer = byQuestion.get(question.id)
    const isCorrect = answer?.correct === 1
    return {
      questionId: question.id,
      correct: isCorrect,
      correctAnswer: JSON.parse(question.correct_json),
      explanation: question.explanation,
      points: question.points,
      earnedPoints: isCorrect ? question.points : 0,
      combo: 0,
    }
  })
}
