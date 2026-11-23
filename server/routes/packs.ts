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
  const trackLessons = pack.track
    ? pack.track.units.reduce((sum, u) => sum + u.lessons.length, 0)
    : pack.units
      ? pack.units.reduce((sum, u) => sum + u.lessons.length, 0)
      : (pack.lessons?.length ?? 0)
  return {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    subject: pack.subject,
    category: pack.category,
    icon: pack.icon,
    modelId: pack.modelId,
    relatedModelIds: pack.relatedModelIds ?? [],
    standards: pack.standards,
    license: pack.license ?? 'MIT',
    srsInterleave: pack.srsInterleave ?? true,
    gradeBand: pack.gradeBand,
    lessonCount: trackLessons,
    quizzes: pack.quizzes.map((quiz: PackQuiz) => ({
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      questionCount: quiz.questions.length,
      modelId: quiz.modelId ?? pack.modelId,
      srsInterleave: quiz.srsInterleave ?? pack.srsInterleave ?? true,
      lessonId: quiz.lessonId,
    })),
  }
}

function cloneQuiz(teacherId: string, pack: ContentPack, quiz: PackQuiz): string {
  const id = randomUUID()
  const srsInterleave = (quiz.srsInterleave ?? pack.srsInterleave ?? true) ? 1 : 0
  db.prepare(
    `INSERT INTO quizzes (
       id, title, description, subject, difficulty, teacher_id, classroom_id,
       time_limit_sec, published, pack_id, model_id, standards, lesson_id, srs_interleave
     )
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    quiz.title,
    quiz.description,
    quiz.subject,
    quiz.difficulty,
    teacherId,
    quiz.timeLimitSec,
    pack.id,
    quiz.modelId ?? pack.modelId ?? null,
    pack.standards ?? null,
    quiz.lessonId ?? null,
    srsInterleave,
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

    const selectedQuizzes = input.difficulties?.length
      ? pack.quizzes.filter((quiz) => input.difficulties!.includes(quiz.difficulty))
      : pack.quizzes
    if (selectedQuizzes.length === 0) {
      throw badRequest('No quizzes in this pack match the selected difficulties')
    }

    // Installing twice would duplicate titles; ask for an explicit confirm.
    const clash = selectedQuizzes.filter((quiz) =>
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

    const created: string[] = selectedQuizzes.map((quiz) =>
      cloneQuiz(teacher.id, pack, quiz),
    )
    const rows = created
      .map((id) => db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id))
      .filter(Boolean) as QuizRow[]

    return reply.status(201).send({
      quizzes: rows.map((row) => quizDTO(row, teacher.id)),
    })
  })
}
