/**
 * Live race engine — in-memory rooms for Kahoot-style synchronous play.
 *
 * Supports three live modes on the same ephemeral LAN-first socket layer:
 * - `classic`: individual Kahoot-style sprint with speed/streak scoring.
 * - `squad-sync`: asymmetric team desks where each question's options are
 *   partitioned disjointly across 3–4 teammates with non-verbal pings and
 *   a -2 checkpoint relay penalty for blind tapping.
 * - `classroom-siege`: cooperative PvE where the whole class chips down a
 *   shared Boss HP bar while protecting the Team Aegis Shield from rapid
 *   blind-miss recoil cracks, plus a top-3 missed-question debrief.
 */
import { randomInt } from 'node:crypto'
import { db } from '../db'
import { buildChoices, hashSeed, primaryAnswer } from '../../shared/arcade'
import { figureSeed } from '../../shared/figure'
import type { QuestionType, RaceMode } from '../../shared/schemas'
import { gradeAnswer } from './grading'
import { toStudentQuestionDTO } from './mappers'
import {
  figureSpecOf,
  makeVariant,
  specVaries,
  type FigureVariant,
  type VariantMap,
} from './variants'
import type {
  ClassroomSiegeStateDTO,
  QuestionRow,
  QuizRow,
  RaceHandOptionDTO,
  RacePhase,
  RacePingTag,
  RacePlayerDTO,
  RaceQuestionDTO,
  RaceRevealDTO,
  RaceRoomDTO,
  RaceServerFrame,
  RaceSquadDTO,
} from '../../shared/types'

// ── Scoring ────────────────────────────────────────────────────
export const RACE_SPEED_WINDOW_MS = 15_000
const MAX_SPEED_BONUS = 0.5
const MAX_STREAK_BONUS = 0.5
const STREAK_FULL_AT = 5
const RAPID_MISS_WINDOW_MS = 2500

const SQUAD_DEFS = [
  { name: 'Quantum Quills', color: '#6366f1' },
  { name: 'Vector Vanguards', color: '#10b981' },
  { name: 'Catalyst Crew', color: '#f59e0b' },
  { name: 'Theorem Titans', color: '#ec4899' },
  { name: 'Axiom Allies', color: '#06b6d4' },
  { name: 'Synapse Squad', color: '#8b5cf6' },
] as const

export function racePoints(
  points: number,
  correct: boolean,
  msTaken: number,
  streakBefore: number,
): number {
  if (!correct) return 0
  const speedRatio = Math.max(0, 1 - msTaken / RACE_SPEED_WINDOW_MS)
  const streakRatio = Math.min(streakBefore, STREAK_FULL_AT) / STREAK_FULL_AT
  return Math.round(points * (1 + speedRatio * MAX_SPEED_BONUS + streakRatio * MAX_STREAK_BONUS))
}

// ── Room plumbing ──────────────────────────────────────────────
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6
const ROOM_IDLE_REAP_MS = 30 * 60_000

export interface RaceSocket {
  send(data: string): void
  close(): void
}

export interface RacePlayer {
  userId: string
  name: string
  avatarColor: string
  socket: RaceSocket | null
  score: number
  correctCount: number
  streak: number
  answered: boolean
  lastCorrect: boolean | null
  lastPoints: number
  squadId?: string
  squadName?: string
  ping?: RacePingTag | null
}

interface InternalSquad {
  id: string
  name: string
  color: string
  progress: number
  score: number
  memberIds: string[]
  answeredThisRound: boolean
}

interface RoundSquadHands {
  options: string[]
  correctIndex: number
  /** Per userId -> hand options assigned to that teammate in this round. */
  byUser: Map<string, RaceHandOptionDTO[]>
}

export interface RaceRoom {
  code: string
  quiz: QuizRow
  teacherId: string
  mode: RaceMode
  squadSize: number
  hostSocket: RaceSocket | null
  players: Map<string, RacePlayer>
  questions: QuestionRow[]
  index: number
  phase: RacePhase
  openedAt: number
  createdAt: number
  lastActivityAt: number
  variants: VariantMap
  lastReveal: RaceRevealDTO | null
  lastStandings: RacePlayerDTO[] | null
  squads: InternalSquad[]
  currentSquadHands: RoundSquadHands | null
  siege: ClassroomSiegeStateDTO | null
  questionMissCounts: Map<string, number>
  siegeHitCounter: number
}

const rooms = new Map<string, RaceRoom>()
let reaperStarted = false

function send(socket: RaceSocket | null, frame: RaceServerFrame): void {
  if (!socket) return
  try {
    socket.send(JSON.stringify(frame))
  } catch {
    // Dead socket is cleaned up by close handler.
  }
}

function broadcast(room: RaceRoom, frame: RaceServerFrame, includeHost = true): void {
  if (includeHost) send(room.hostSocket, frame)
  for (const player of room.players.values()) send(player.socket, frame)
}

function squadDTOs(squads: readonly InternalSquad[]): RaceSquadDTO[] {
  return squads.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    progress: s.progress,
    score: s.score,
    memberIds: [...s.memberIds],
  }))
}

/** One player as the clients see them. */
export function playerDTO(player: RacePlayer): RacePlayerDTO {
  return {
    userId: player.userId,
    name: player.name,
    avatarColor: player.avatarColor,
    score: player.score,
    correctCount: player.correctCount,
    streak: player.streak,
    answered: player.answered,
    lastCorrect: player.lastCorrect,
    lastPoints: player.lastPoints,
    ...(player.squadId ? { squadId: player.squadId } : {}),
    ...(player.squadName ? { squadName: player.squadName } : {}),
    ...(player.ping !== undefined ? { ping: player.ping } : {}),
  }
}

function snapshot(room: RaceRoom): RaceRoomDTO {
  return {
    code: room.code,
    quizId: room.quiz.id,
    quizTitle: room.quiz.title,
    subject: room.quiz.subject,
    phase: room.phase,
    questionIndex: room.index,
    totalQuestions: room.questions.length,
    players: [...room.players.values()].map(playerDTO),
    mode: room.mode,
    squadSize: room.squadSize,
    ...(room.mode === 'squad-sync' ? { squads: squadDTOs(room.squads) } : {}),
    ...(room.mode === 'classroom-siege' && room.siege ? { siege: { ...room.siege } } : {}),
  }
}

function questionDTO(room: RaceRoom, question: QuestionRow): RaceQuestionDTO {
  const variant = raceVariant(room, question)
  const base = toStudentQuestionDTO(question, variant?.givens)
  return {
    ...base,
    index: room.index,
    total: room.questions.length,
    openedAt: room.openedAt,
  }
}

function raceVariant(room: RaceRoom, question: QuestionRow): FigureVariant | null {
  if (question.type !== 'figure') return null
  const spec = figureSpecOf(question)
  if (!specVaries(spec)) return null
  if (!room.variants[question.id]) {
    const variant = makeVariant(spec!, figureSeed(question.id, room.code))
    if (variant) room.variants[question.id] = variant
  }
  return room.variants[question.id] ?? null
}

function answerKey(room: RaceRoom, question: QuestionRow): unknown {
  if (question.type !== 'figure') return JSON.parse(question.correct_json)
  const variant = raceVariant(room, question)
  return variant ? variant.answer : JSON.parse(question.correct_json)
}

// ── Squad & Siege Helpers ──────────────────────────────────────

function makeInitialSiege(room: RaceRoom): ClassroomSiegeStateDTO {
  const maxHp = Math.max(200, room.questions.length * 100)
  return {
    bossHp: maxHp,
    maxHp,
    aegisShield: 3,
    wave: Math.max(1, room.index + 1),
    sealsBroken: 0,
    topMissedQuestionIds: [],
  }
}

function assignSquads(room: RaceRoom): void {
  const list = [...room.players.values()]
  if (list.length === 0) {
    room.squads = []
    return
  }
  const targetSize = Math.max(2, Math.min(5, room.squadSize))
  const count = Math.max(1, Math.ceil(list.length / targetSize))
  const squads: InternalSquad[] = Array.from({ length: count }, (_, idx) => {
    const def = SQUAD_DEFS[idx % SQUAD_DEFS.length]
    return {
      id: `squad-${idx + 1}`,
      name: idx >= SQUAD_DEFS.length ? `${def.name} ${idx + 1}` : def.name,
      color: def.color,
      progress: 0,
      score: 0,
      memberIds: [],
      answeredThisRound: false,
    }
  })

  list.forEach((player, idx) => {
    const sq = squads[idx % count]
    sq.memberIds.push(player.userId)
    player.squadId = sq.id
    player.squadName = sq.name
  })
  room.squads = squads
}

function questionRowChoices(room: RaceRoom, question: QuestionRow): {
  options: string[]
  correctIndex: number
} {
  const qType = question.type as QuestionType
  if (qType === 'mcq') {
    const opts = question.options_json ? (JSON.parse(question.options_json) as string[]) : []
    const correctIdx = Number(answerKey(room, question))
    if (opts.length >= 2) {
      return {
        options: opts,
        correctIndex: Math.max(0, Math.min(opts.length - 1, correctIdx)),
      }
    }
  }
  if (qType === 'truefalse') {
    const isTrue = answerKey(room, question) === true
    return { options: ['True', 'False'], correctIndex: isTrue ? 0 : 1 }
  }

  const rawCorrect = answerKey(room, question)
  const answerStr =
    qType === 'order' && Array.isArray(rawCorrect) && question.options_json
      ? (() => {
          const opts = JSON.parse(question.options_json) as string[]
          return (rawCorrect as number[]).map((i) => opts[i] ?? '').join(' → ')
        })()
      : String(rawCorrect)

  const pool = room.questions.map((row) => {
    const rType = row.type as QuestionType
    const rKey = answerKey(room, row)
    const rAns =
      rType === 'mcq' && row.options_json
        ? ((JSON.parse(row.options_json) as string[])[Number(rKey)] ?? '')
        : rType === 'truefalse'
          ? rKey === true
            ? 'True'
            : 'False'
          : String(rKey)
    return {
      questionId: row.id,
      type: rType,
      answer: primaryAnswer({ type: rType, answer: rAns }),
      options: row.options_json ? (JSON.parse(row.options_json) as string[]) : null,
    }
  })

  const built = buildChoices(
    {
      questionId: question.id,
      type: qType,
      answer: answerStr,
      options: question.options_json ? (JSON.parse(question.options_json) as string[]) : null,
    },
    pool,
    hashSeed(`${room.code}:${question.id}:${room.index}`),
  )
  return { options: built.choices, correctIndex: built.correctIndex }
}

function buildRoundSquadHands(room: RaceRoom, question: QuestionRow): RoundSquadHands {
  const { options, correctIndex } = questionRowChoices(room, question)
  const byUser = new Map<string, RaceHandOptionDTO[]>()

  room.squads.forEach((sq, sqIdx) => {
    const members = sq.memberIds
    if (members.length === 0) return
    members.forEach((uid) => byUser.set(uid, []))

    // Rotating offset guarantees the correct option circulates fairly across squadmates.
    const rotateOffset = (room.index + sqIdx) % members.length
    options.forEach((text, optIdx) => {
      const seatIdx = (optIdx + rotateOffset) % members.length
      const holderId = members[seatIdx]
      const list = byUser.get(holderId)
      if (list) list.push({ idx: optIdx, text })
    })
  })

  return { options, correctIndex, byUser }
}

function buildSquadProgressRecord(squads: readonly InternalSquad[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const s of squads) map[s.id] = s.progress
  return map
}

function emitSquadQuestionToParticipant(room: RaceRoom, userId: string | null): void {
  if (room.mode !== 'squad-sync' || !room.currentSquadHands || room.index < 0) return
  const q = room.questions[room.index]
  if (!q) return
  const qDto = questionDTO(room, q)
  const base = {
    t: 'squad_question' as const,
    round: room.index + 1,
    stem: qDto.prompt,
    figure: qDto.figure,
    squads: squadDTOs(room.squads),
    squadProgress: buildSquadProgressRecord(room.squads),
  }
  if (userId === null) {
    send(room.hostSocket, { ...base, handOptions: [] })
    return
  }
  const player = room.players.get(userId)
  if (!player) return
  send(player.socket, {
    ...base,
    handOptions: room.currentSquadHands.byUser.get(userId) ?? [],
  })
}

function topMissedIds(missMap: Map<string, number>): string[] {
  return [...missMap.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id)
}

function sendJoinedSnapshotToAll(room: RaceRoom): void {
  const hostView = roomView(room, { id: room.teacherId })
  send(room.hostSocket, {
    t: 'joined',
    room: hostView.room,
    question: hostView.question,
    reveal: hostView.reveal,
    standings: hostView.standings,
    you: hostPseudoPlayer(room),
    role: 'host',
  })
  for (const player of room.players.values()) {
    const view = roomView(room, { id: player.userId })
    send(player.socket, {
      t: 'joined',
      room: view.room,
      question: view.question,
      reveal: view.reveal,
      standings: view.standings,
      you: playerDTO(player),
      role: 'player',
    })
  }
}

// ── Lifecycle ──────────────────────────────────────────────────

function makeCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  return code
}

function startReaper(): void {
  if (reaperStarted) return
  reaperStarted = true
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [code, room] of rooms) {
      const hasHost = room.hostSocket !== null
      const hasPlayers = [...room.players.values()].some((p) => p.socket !== null)
      if (!hasHost && !hasPlayers && now - room.lastActivityAt > ROOM_IDLE_REAP_MS) {
        rooms.delete(code)
      }
    }
  }, 60_000)
  timer.unref()
}

/** Create a room for a teacher-owned quiz; starts in the lobby. */
export function createRoom(
  quiz: QuizRow,
  teacherId: string,
  options?: { mode?: RaceMode; squadSize?: number },
): RaceRoom {
  const questions = db
    .prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY position')
    .all(quiz.id) as QuestionRow[]

  let code = makeCode()
  while (rooms.has(code)) code = makeCode()

  const mode: RaceMode = options?.mode ?? 'classic'
  const squadSize = Math.max(2, Math.min(5, options?.squadSize ?? 3))
  const now = Date.now()

  const room: RaceRoom = {
    code,
    quiz,
    teacherId,
    mode,
    squadSize,
    hostSocket: null,
    players: new Map(),
    questions,
    index: -1,
    phase: 'lobby',
    openedAt: 0,
    createdAt: now,
    lastActivityAt: now,
    variants: {},
    lastReveal: null,
    lastStandings: null,
    squads: [],
    currentSquadHands: null,
    siege: null,
    questionMissCounts: new Map(),
    siegeHitCounter: 0,
  }
  if (mode === 'classroom-siege') {
    room.siege = makeInitialSiege(room)
  }
  rooms.set(code, room)
  startReaper()
  return room
}

export function setRoomMode(room: RaceRoom, mode: RaceMode, squadSize?: number): void {
  if (room.phase !== 'lobby') return
  room.mode = mode
  if (squadSize !== undefined) {
    room.squadSize = Math.max(2, Math.min(5, squadSize))
  }
  room.lastActivityAt = Date.now()

  if (mode === 'squad-sync') {
    assignSquads(room)
    room.siege = null
  } else if (mode === 'classroom-siege') {
    room.squads = []
    for (const p of room.players.values()) {
      p.squadId = undefined
      p.squadName = undefined
    }
    room.siege = makeInitialSiege(room)
  } else {
    room.squads = []
    room.siege = null
    for (const p of room.players.values()) {
      p.squadId = undefined
      p.squadName = undefined
    }
  }
  sendJoinedSnapshotToAll(room)
}

export function getRoom(code: string): RaceRoom | undefined {
  return rooms.get(code.trim().toUpperCase())
}

/** Attach the teacher's host socket (reconnects simply re-attach). */
export function attachHost(room: RaceRoom, socket: RaceSocket): void {
  room.hostSocket = socket
  room.lastActivityAt = Date.now()
}

/** Attach a student player, creating their row on first join. */
export function attachPlayer(
  room: RaceRoom,
  user: { id: string; name: string; avatar_color: string },
  socket: RaceSocket,
): RacePlayer {
  room.lastActivityAt = Date.now()
  const existing = room.players.get(user.id)
  if (existing) {
    existing.socket = socket
    broadcast(room, { t: 'player_joined', player: playerDTO(existing) })
    return existing
  }
  const player: RacePlayer = {
    userId: user.id,
    name: user.name,
    avatarColor: user.avatar_color,
    socket,
    score: 0,
    correctCount: 0,
    streak: 0,
    answered: false,
    lastCorrect: null,
    lastPoints: 0,
    ping: null,
  }
  room.players.set(user.id, player)

  if (room.mode === 'squad-sync') {
    if (room.phase === 'lobby') {
      assignSquads(room)
      sendJoinedSnapshotToAll(room)
    } else if (room.squads.length > 0) {
      // Late joiner during active squad-sync joins the smallest squad cleanly
      const smallest = [...room.squads].sort((a, b) => a.memberIds.length - b.memberIds.length)[0]
      smallest.memberIds.push(player.userId)
      player.squadId = smallest.id
      player.squadName = smallest.name
      if (room.currentSquadHands) {
        room.currentSquadHands.byUser.set(player.userId, [])
      }
    }
  }

  broadcast(room, { t: 'player_joined', player: playerDTO(player) })
  return player
}

/** Drop a closed socket: players leave the room, hosts just detach. */
export function detachSocket(room: RaceRoom, socket: RaceSocket): void {
  room.lastActivityAt = Date.now()
  if (room.hostSocket === socket) {
    room.hostSocket = null
    return
  }
  for (const [userId, player] of room.players) {
    if (player.socket !== socket) continue
    room.players.delete(userId)
    for (const sq of room.squads) {
      sq.memberIds = sq.memberIds.filter((id) => id !== userId)
    }
    broadcast(room, { t: 'player_left', userId })
    return
  }
}

// ── Host-driven phases ─────────────────────────────────────────

export function startRace(room: RaceRoom): void {
  if (room.phase !== 'lobby' || room.questions.length === 0) return
  if (room.mode === 'squad-sync') {
    assignSquads(room)
  } else if (room.mode === 'classroom-siege' && !room.siege) {
    room.siege = makeInitialSiege(room)
  }
  room.index = 0
  room.phase = 'question'
  openQuestion(room)
}

function openQuestion(room: RaceRoom): void {
  const question = room.questions[room.index]
  room.openedAt = Date.now()
  room.lastReveal = null
  for (const player of room.players.values()) {
    player.answered = false
    player.lastCorrect = null
    player.lastPoints = 0
    player.ping = null
  }
  for (const sq of room.squads) {
    sq.answeredThisRound = false
  }
  if (room.mode === 'classroom-siege' && room.siege) {
    room.siege.wave = room.index + 1
    room.siegeHitCounter = 0
    broadcast(room, { t: 'siege_state', siege: { ...room.siege } })
  }

  broadcast(room, { t: 'question', question: questionDTO(room, question) })

  if (room.mode === 'squad-sync') {
    room.currentSquadHands = buildRoundSquadHands(room, question)
    emitSquadQuestionToParticipant(room, null)
    for (const player of room.players.values()) {
      emitSquadQuestionToParticipant(room, player.userId)
    }
  } else {
    room.currentSquadHands = null
  }
}

/** Push cached question + optional squad hand when a participant finishes connecting. */
export function syncParticipantOnJoin(room: RaceRoom, userId: string | null): void {
  if (room.phase !== 'question') return
  if (room.mode === 'squad-sync') {
    emitSquadQuestionToParticipant(room, userId)
  } else if (room.mode === 'classroom-siege' && room.siege) {
    const targetSocket = userId === null ? room.hostSocket : room.players.get(userId)?.socket ?? null
    send(targetSocket, { t: 'siege_state', siege: { ...room.siege } })
  }
}

export function revealRace(room: RaceRoom): void {
  if (room.phase !== 'question') return
  const question = room.questions[room.index]
  const players = [...room.players.values()]
  const reveal: RaceRevealDTO = {
    questionId: question.id,
    correctAnswer:
      room.mode === 'squad-sync' && room.currentSquadHands
        ? room.currentSquadHands.options[room.currentSquadHands.correctIndex]
        : answerKey(room, question),
    figure: toStudentQuestionDTO(question, raceVariant(room, question)?.givens).figure,
    explanation: question.explanation,
    correctCount: players.filter((p) => p.lastCorrect === true).length,
    answeredCount: players.filter((p) => p.answered).length,
  }
  room.phase = 'reveal'
  room.lastReveal = reveal
  for (const player of players) {
    send(player.socket, {
      t: 'reveal',
      reveal,
      players: players.map(playerDTO),
      you: playerDTO(player),
    })
  }
  send(room.hostSocket, {
    t: 'reveal',
    reveal,
    players: players.map(playerDTO),
    you: hostPseudoPlayer(room),
  })
}

export function advanceRace(room: RaceRoom): void {
  if (room.phase !== 'reveal') return
  if (room.index + 1 < room.questions.length) {
    room.index += 1
    room.phase = 'question'
    openQuestion(room)
    return
  }
  endRace(room)
}

export function endRace(room: RaceRoom): void {
  room.phase = 'over'
  const standings = [...room.players.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map(playerDTO)
  room.lastStandings = standings
  for (const player of room.players.values()) {
    send(player.socket, { t: 'over', standings, you: playerDTO(player) })
  }
  send(room.hostSocket, {
    t: 'over',
    standings,
    you: hostPseudoPlayer(room),
  })
}

// ── Live answering & team actions ──────────────────────────────

export function submitSquadPing(room: RaceRoom, player: RacePlayer, tag: RacePingTag): void {
  if (room.mode !== 'squad-sync' || !player.squadId) return
  player.ping = tag
  broadcast(room, {
    t: 'squad_ping',
    userId: player.userId,
    squadId: player.squadId,
    tag,
  })
}

export function submitSquadOption(
  room: RaceRoom,
  player: RacePlayer,
  optionIdx: number,
  msTaken: number,
): void {
  if (room.mode !== 'squad-sync' || room.phase !== 'question') return
  if (!room.currentSquadHands || !player.squadId) return
  const squad = room.squads.find((s) => s.id === player.squadId)
  if (!squad || squad.answeredThisRound) return

  // Enforce asymmetric ownership: a player can only lock in an option in their own hand.
  const hand = room.currentSquadHands.byUser.get(player.userId) ?? []
  if (!hand.some((opt) => opt.idx === optionIdx)) return

  const question = room.questions[room.index]
  const correct = optionIdx === room.currentSquadHands.correctIndex
  squad.answeredThisRound = true

  if (correct) {
    squad.progress += 1
    const basePts = racePoints(question.points, true, msTaken, player.streak)
    squad.score += basePts
    for (const uid of squad.memberIds) {
      const m = room.players.get(uid)
      if (!m) continue
      m.answered = true
      m.lastCorrect = true
      m.streak += 1
      m.correctCount += 1
      m.score += basePts
      m.lastPoints = basePts
    }
  } else {
    squad.progress = Math.max(0, squad.progress - 2)
    for (const uid of squad.memberIds) {
      const m = room.players.get(uid)
      if (!m) continue
      m.answered = true
      m.lastCorrect = false
      m.streak = 0
      m.lastPoints = 0
    }
  }

  const answeredCount = [...room.players.values()].filter((p) => p.answered).length
  broadcast(room, { t: 'answered', userId: player.userId, answeredCount })
  emitSquadQuestionToParticipant(room, null)
  for (const p of room.players.values()) {
    emitSquadQuestionToParticipant(room, p.userId)
  }

  if (room.squads.length > 0 && room.squads.every((s) => s.answeredThisRound)) {
    revealRace(room)
  }
}

export function submitAnswer(
  room: RaceRoom,
  player: RacePlayer,
  response: number | boolean | string | number[],
  msTaken: number,
): void {
  if (room.phase !== 'question' || player.answered) return

  if (room.mode === 'squad-sync' && typeof response === 'number') {
    submitSquadOption(room, player, response, msTaken)
    return
  }

  const question = room.questions[room.index]
  const variant = raceVariant(room, question)
  const correct = gradeAnswer(question, response, variant?.answer ?? null)

  player.answered = true
  player.lastCorrect = correct
  if (correct) {
    player.streak += 1
    player.correctCount += 1
    const points = racePoints(question.points, true, msTaken, player.streak - 1)
    player.score += points
    player.lastPoints = points
  } else {
    player.streak = 0
    player.lastPoints = 0
  }

  if (room.mode === 'classroom-siege' && room.siege) {
    if (correct) {
      const perHit = Math.max(25, Math.round(100 / Math.max(1, room.players.size)))
      const shieldBonus = room.siege.aegisShield >= 3 ? 1.2 : 1
      const dmg = Math.round(perHit * shieldBonus)
      room.siege.bossHp = Math.max(0, room.siege.bossHp - dmg)
      room.siegeHitCounter += 1
      if (room.siegeHitCounter % 3 === 0) {
        room.siege.aegisShield = Math.min(5, room.siege.aegisShield + 1)
      }
      broadcast(room, { t: 'siege_state', siege: { ...room.siege } })
    } else {
      room.questionMissCounts.set(
        question.id,
        (room.questionMissCounts.get(question.id) ?? 0) + 1,
      )
      room.siege.topMissedQuestionIds = topMissedIds(room.questionMissCounts)
      let cooldownUntilMs: number | undefined
      let recalibrateHint: string | undefined

      if (msTaken < RAPID_MISS_WINDOW_MS) {
        room.siege.aegisShield = Math.max(0, room.siege.aegisShield - 1)
        if (room.siege.aegisShield === 0) {
          room.siege.sealsBroken += 1
          room.siege.bossHp = Math.min(room.siege.maxHp, room.siege.bossHp + 40)
          room.siege.aegisShield = 2
          cooldownUntilMs = Date.now() + 3000
          recalibrateHint =
            question.explanation ||
            'Aegis Seal fractured from rapid misses — pause 3s to read carefully before firing!'
        }
      }
      broadcast(room, {
        t: 'siege_state',
        siege: { ...room.siege },
        ...(cooldownUntilMs ? { cooldownUntilMs, recalibrateHint } : {}),
      })
    }
  }

  const answeredCount = [...room.players.values()].filter((p) => p.answered).length
  broadcast(room, { t: 'answered', userId: player.userId, answeredCount })

  if (room.players.size > 0 && answeredCount >= room.players.size) {
    revealRace(room)
  }
}

function hostPseudoPlayer(room: RaceRoom): RacePlayerDTO {
  return {
    userId: room.teacherId,
    name: 'Host',
    avatarColor: '#6366f1',
    score: 0,
    correctCount: 0,
    streak: 0,
    answered: false,
    lastCorrect: null,
    lastPoints: 0,
  }
}

export function roomView(
  room: RaceRoom,
  viewer: { id: string },
): {
  room: RaceRoomDTO
  question: RaceQuestionDTO | null
  reveal: RaceRevealDTO | null
  standings: RacePlayerDTO[] | null
  isHost: boolean
} {
  const isHost = room.teacherId === viewer.id
  const question =
    room.phase === 'question' || room.phase === 'reveal'
      ? questionDTO(room, room.questions[room.index])
      : null
  return {
    room: snapshot(room),
    question,
    reveal: room.phase === 'reveal' ? room.lastReveal : null,
    standings: room.phase === 'over' ? room.lastStandings : null,
    isHost,
  }
}
