import { randomUUID } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireRole } from '../lib/auth'
import { badRequest, notFound, parse } from '../lib/http'
import { CONTENT_PACKS, findPack, type ContentPack, type PackQuiz } from '../../shared/packs'
import { PackInstallSchema } from '../../shared/schemas'
import { insertQuestion, quizDTO } from './quizzes'
import type { QuizRow } from '../../shared/types'

function packSummary(pack: ContentPack) {
  return {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    subject: pack.subject,
    icon: pack.icon,
    quizzes: pack.quizzes.map((quiz: PackQuiz) => ({
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      questionCount: quiz.questions.length,
    })),
  }
}

function cloneQuiz(teacherId: string, quiz: PackQuiz): string {
  const id = randomUUID()
  db.prepare(
    `INSERT INTO quizzes (id, title, description, subject, difficulty, teacher_id, classroom_id, time_limit_sec, published)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0)`,
  ).run(
    id,
    quiz.title,
    quiz.description,
    quiz.subject,
    quiz.difficulty,
    teacherId,
    quiz.timeLimitSec,
  )
  quiz.questions.forEach((question, index) => {
    insertQuestion(id, question, index)
  })
  return id
}

export const packRoutes: FastifyPluginAsync = async (app) => {
  // ── Registry (public to teachers) ───────────────────────────
  app.get('/', async (request) => {
    await requireRole(request, 'teacher')
    return { packs: CONTENT_PACKS.map(packSummary) }
  })

  // ── Install a pack into my library ──────────────────────────
  app.post('/install', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const input = parse(PackInstallSchema, request.body)

    const pack = findPack(input.packId)
    if (!pack) throw notFound('Pack not found')

    // Installing twice would duplicate titles; ask for an explicit confirm.
    const clash = pack.quizzes.filter((quiz) =>
      db
        .prepare(
          'SELECT 1 FROM quizzes WHERE teacher_id = ? AND title = ? AND classroom_id IS NULL',
        )
        .get(teacher.id, quiz.title),
    )
    if (clash.length > 0 && !input.confirmDuplicates) {
      throw badRequest(
        `You already have “${clash[0].title}” — send confirmDuplicates to copy anyway`,
      )
    }

    const created: string[] = pack.quizzes.map((quiz) =>
      cloneQuiz(teacher.id, quiz),
    )
    const rows = created
      .map((id) => db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id))
      .filter(Boolean) as QuizRow[]

    return reply.status(201).send({
      quizzes: rows.map((row) => quizDTO(row, teacher.id)),
    })
  })
}
