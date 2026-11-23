import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '../db'
import { getUserRow, requireAuth, requireRole } from '../lib/auth'
import { badRequest, forbidden, notFound, parse } from '../lib/http'
import { studentCanSeeQuiz } from '../lib/quiz-access'
import {
  advanceRace,
  attachHost,
  attachPlayer,
  createRoom,
  detachSocket,
  endRace,
  getRoom,
  playerDTO,
  revealRace,
  roomView,
  setRoomMode,
  startRace,
  submitAnswer,
  submitSquadOption,
  submitSquadPing,
  syncParticipantOnJoin,
  type RaceRoom,
  type RaceSocket,
} from '../lib/race'
import { CreateRaceSchema, RaceModeSchema } from '../../shared/schemas'
import type { AuthUser } from '../lib/auth'
import type {
  QuizRow,
  RaceClientFrame,
  RacePlayerDTO,
  RaceServerFrame,
} from '../../shared/types'

function getQuiz(id: string): QuizRow {
  const row = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as
    | QuizRow
    | undefined
  if (!row) throw notFound('Quiz not found')
  return row
}

/** Teacher-owned room lookup for the host controls. */
function hostRoom(code: string, teacherId: string): RaceRoom {
  const room = getRoom(code)
  if (!room) throw notFound('Race not found')
  if (room.teacherId !== teacherId) throw forbidden('This race belongs to another teacher')
  return room
}

/** The connecting user's own row for the `joined` frame. */
function youRow(room: RaceRoom, user: AuthUser, isHost: boolean): RacePlayerDTO {
  if (!isHost) {
    const player = room.players.get(user.id)
    if (player) return playerDTO(player)
  }
  return {
    userId: user.id,
    name: user.name,
    avatarColor: user.avatar_color,
    score: 0,
    correctCount: 0,
    streak: 0,
    answered: false,
    lastCorrect: null,
    lastPoints: 0,
  }
}

/**
 * Live race mode: REST creates rooms and drives the host's controls;
 * one WebSocket per participant carries the live frames. The socket
 * path is `/api/races/:code/live` — distinct from the REST route so
 * the upgrade never collides with a normal GET.
 *
 * Auth on the socket: browsers cannot set headers on WebSockets, so
 * the JWT rides in the `token` query parameter — same token, same
 * verification, one-shot at connect time.
 */
export const raceRoutes: FastifyPluginAsync = async (app) => {
  // ── Create a room (teacher) ─────────────────────────────────
  app.post('/', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const input = parse(CreateRaceSchema, request.body)
    const quiz = getQuiz(input.quizId)
    if (quiz.teacher_id !== teacher.id) {
      throw forbidden('You can only race your own quizzes')
    }
    const room = createRoom(quiz, teacher.id, {
      mode: input.mode,
      squadSize: input.squadSize,
    })
    return reply.status(201).send({ code: room.code })
  })

  app.post<{ Params: { code: string } }>('/:code/mode', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const room = hostRoom(request.params.code, teacher.id)
    if (room.phase !== 'lobby') {
      throw badRequest('Switch race mode in the lobby before starting')
    }
    const input = parse(
      z.object({
        mode: RaceModeSchema,
        squadSize: z.number().int().min(2).max(5).optional(),
      }),
      request.body,
    )
    setRoomMode(room, input.mode, input.squadSize)
    return { ok: true }
  })

  // ── Room state (refresh / late join / host reconnect) ────────
  app.get<{ Params: { code: string } }>('/:code', async (request) => {
    const user = await requireAuth(request)
    const room = getRoom(request.params.code)
    if (!room) throw notFound('Race not found')
    const view = roomView(room, user)
    if (!view.isHost) {
      if (user.role !== 'student') throw forbidden('Only students join a race')
      if (!studentCanSeeQuiz(user.id, room.quiz)) {
        throw forbidden('This quiz is not available to you')
      }
      if (room.phase === 'over') throw badRequest('This race already finished')
    }
    return { ...view, you: youRow(room, user, view.isHost) }
  })

  // ── Host controls ───────────────────────────────────────────
  app.post<{ Params: { code: string } }>('/:code/start', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const room = hostRoom(request.params.code, teacher.id)
    if (room.phase !== 'lobby') throw badRequest('This race already started')
    if (room.questions.length === 0) throw badRequest('This quiz has no questions yet')
    startRace(room)
    return { ok: true }
  })

  app.post<{ Params: { code: string } }>('/:code/reveal', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const room = hostRoom(request.params.code, teacher.id)
    if (room.phase !== 'question') throw badRequest('No question is open right now')
    revealRace(room)
    return { ok: true }
  })

  app.post<{ Params: { code: string } }>('/:code/next', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const room = hostRoom(request.params.code, teacher.id)
    if (room.phase !== 'reveal') throw badRequest('Reveal the question first')
    advanceRace(room)
    return { ok: true }
  })

  app.post<{ Params: { code: string } }>('/:code/end', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const room = hostRoom(request.params.code, teacher.id)
    if (room.phase !== 'over') endRace(room)
    return { ok: true }
  })

  // ── Live socket ─────────────────────────────────────────────
  app.get<{ Params: { code: string }; Querystring: { token?: string } }>(
    '/:code/live',
    { websocket: true },
    async (connection, request) => {
      const socket = connection as unknown as RaceSocket
      const token = request.query.token
      let user: AuthUser | null = null
      if (token) {
        try {
          const payload = app.jwt.verify<{ sub: string }>(token)
          user = getUserRow(payload.sub) ?? null
        } catch {
          user = null
        }
      }
      if (!user) {
        send(socket, { t: 'error', message: 'Sign in again to join this race' })
        socket.close()
        return
      }

      const room = getRoom(request.params.code)
      if (!room) {
        send(socket, { t: 'error', message: 'Race not found' })
        socket.close()
        return
      }

      const isHost = room.teacherId === user.id
      if (isHost) {
        attachHost(room, socket)
      } else {
        if (user.role !== 'student' || !studentCanSeeQuiz(user.id, room.quiz)) {
          send(socket, { t: 'error', message: 'This race is not open to you' })
          socket.close()
          return
        }
        if (room.phase === 'over') {
          send(socket, { t: 'error', message: 'This race already finished' })
          socket.close()
          return
        }
        attachPlayer(room, user, socket)
      }

      const view = roomView(room, user)
      send(socket, {
        t: 'joined',
        room: view.room,
        question: view.question,
        reveal: view.reveal,
        standings: view.standings,
        you: youRow(room, user, isHost),
        role: isHost ? 'host' : 'player',
      })
      syncParticipantOnJoin(room, isHost ? null : user.id)

      connection.on('message', (raw: Buffer | string) => {
        let frame: RaceClientFrame | null = null
        try {
          frame = JSON.parse(raw.toString()) as RaceClientFrame
        } catch {
          return // Ignore malformed frames; the socket stays usable.
        }
        if (!frame) return
        const player = room.players.get(user.id)
        if (!player) return
        if (frame.t === 'answer') {
          submitAnswer(room, player, frame.response, frame.msTaken)
        } else if (frame.t === 'ping') {
          submitSquadPing(room, player, frame.tag)
        } else if (frame.t === 'squad_submit') {
          submitSquadOption(room, player, frame.optionIdx, frame.msTaken)
        }
      })

      connection.on('close', () => detachSocket(room, socket))
    },
  )
}

function send(socket: RaceSocket, frame: RaceServerFrame): void {
  try {
    socket.send(JSON.stringify(frame))
  } catch {
    // Best-effort: a dead socket is cleaned up by its close handler.
  }
}
