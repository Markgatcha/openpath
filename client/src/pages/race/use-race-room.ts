import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { connectRace } from '@/lib/race-socket'
import { useAuth } from '@/store/auth'
import { useToast } from '@/components/ui'
import type { FigureGeometry } from '@shared/figure'
import type {
  RaceClientFrame,
  RaceHandOptionDTO,
  RacePlayerDTO,
  RaceQuestionDTO,
  RaceRevealDTO,
  RaceRoomDTO,
  RaceServerFrame,
  RaceSquadDTO,
} from '@shared/types'

export interface SquadRoundState {
  round: number
  stem: string
  figure?: FigureGeometry | null
  handOptions: RaceHandOptionDTO[]
  squads: RaceSquadDTO[]
  squadProgress: Record<string, number>
}

export interface RaceState {
  room: RaceRoomDTO
  question: RaceQuestionDTO | null
  reveal: RaceRevealDTO | null
  standings: RacePlayerDTO[] | null
  you: RacePlayerDTO
  role: 'host' | 'player'
  /** How many players have locked in for the current question. */
  answeredCount: number
  /** Current asymmetric hand + squad telemetry in `squad-sync` mode. */
  squadQuestion: SquadRoundState | null
  /** Timestamp until which rapid-miss recalibration pauses inputs in `classroom-siege`. */
  cooldownUntilMs: number | null
  /** Explanation/hint surfaced when an Aegis Seal fractures in `classroom-siege`. */
  recalibrateHint: string | null
}

interface UseRaceRoom {
  state: RaceState | null
  error: string
  /** False while the socket is down (reconnects automatically). */
  connected: boolean
  /**
   * Push a frame to the server (student answers). Returns false when
   * the socket isn't open — the caller keeps the input live instead
   * of claiming a lock-in the server never saw.
   */
  send: (frame: RaceClientFrame) => boolean
}

/** How many reconnect attempts before giving up with a clear error. */
const MAX_RECONNECTS = 8
const RECONNECT_DELAY_MS = 1500

/**
 * One hook drives both race surfaces (host console and student view).
 *
 * State arrives twice: a REST GET hydrates the room instantly (fast
 * first paint, works before the socket is up), then the WebSocket's
 * `joined` frame confirms it and every later frame mutates it. If
 * the socket drops — laptop sleep, LAN hiccup — it reconnects on a
 * short delay; the `joined` frame on reconnect restores the exact
 * screen (reveal and standings included) thanks to the room's
 * cached payloads.
 */
export function useRaceRoom(code: string): UseRaceRoom {
  const { token } = useAuth()
  const toast = useToast()
  const [state, setState] = useState<RaceState | null>(null)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  // The live connection lives in a ref so `send` stays stable while
  // the socket behind it may be swapped by a reconnect.
  const connectionRef = useRef<ReturnType<typeof connectRace> | null>(null)

  // Keep the latest toast callback reachable from the (stable) frame
  // handler without re-opening the socket on every render.
  const toastRef = useRef(toast)
  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  const applyFrame = useCallback((frame: RaceServerFrame) => {
    switch (frame.t) {
      case 'joined':
        setState({
          room: frame.room,
          question: frame.question,
          reveal: frame.reveal,
          standings: frame.standings,
          you: frame.you,
          role: frame.role,
          answeredCount: frame.room.players.filter((p) => p.answered).length,
          squadQuestion: null,
          cooldownUntilMs: null,
          recalibrateHint: null,
        })
        setError('')
        break

      case 'player_joined':
        // Upsert: a rejoining tab replaces its own row, keeping score.
        setState((current) =>
          current
            ? {
                ...current,
                room: {
                  ...current.room,
                  players: [
                    ...current.room.players.filter(
                      (p) => p.userId !== frame.player.userId,
                    ),
                    frame.player,
                  ],
                },
              }
            : current,
        )
        break

      case 'player_left':
        setState((current) =>
          current
            ? {
                ...current,
                room: {
                  ...current.room,
                  players: current.room.players.filter(
                    (p) => p.userId !== frame.userId,
                  ),
                },
              }
            : current,
        )
        break

      case 'question':
        // Fresh question: clear the previous reveal, cooldowns, pings,
        // and every "locked in" flag so the answered tally starts from zero.
        setState((current) =>
          current
            ? {
                ...current,
                question: frame.question,
                reveal: null,
                answeredCount: 0,
                squadQuestion: null,
                cooldownUntilMs: null,
                recalibrateHint: null,
                you: { ...current.you, answered: false, ping: null },
                room: {
                  ...current.room,
                  phase: 'question',
                  questionIndex: frame.question.index,
                  players: current.room.players.map((p) => ({
                    ...p,
                    answered: false,
                    ping: null,
                  })),
                },
              }
            : current,
        )
        break

      case 'answered':
        setState((current) =>
          current
            ? {
                ...current,
                answeredCount: frame.answeredCount,
                you:
                  current.you.userId === frame.userId
                    ? { ...current.you, answered: true }
                    : current.you,
                room: {
                  ...current.room,
                  players: current.room.players.map((p) =>
                    p.userId === frame.userId ? { ...p, answered: true } : p,
                  ),
                },
              }
            : current,
        )
        break

      case 'squad_question':
        setState((current) => {
          if (!current) return current
          const syncSquad = (player: RacePlayerDTO): RacePlayerDTO => {
            const sq = frame.squads.find((s) => s.memberIds.includes(player.userId))
            return sq ? { ...player, squadId: sq.id, squadName: sq.name } : player
          }
          return {
            ...current,
            squadQuestion: {
              round: frame.round,
              stem: frame.stem,
              figure: frame.figure,
              handOptions: frame.handOptions,
              squads: frame.squads,
              squadProgress: frame.squadProgress,
            },
            you: syncSquad(current.you),
            room: {
              ...current.room,
              squads: frame.squads,
              players: current.room.players.map(syncSquad),
            },
          }
        })
        break

      case 'squad_ping':
        setState((current) =>
          current
            ? {
                ...current,
                you:
                  current.you.userId === frame.userId
                    ? { ...current.you, ping: frame.tag }
                    : current.you,
                room: {
                  ...current.room,
                  players: current.room.players.map((p) =>
                    p.userId === frame.userId ? { ...p, ping: frame.tag } : p,
                  ),
                },
              }
            : current,
        )
        break

      case 'siege_state':
        setState((current) =>
          current
            ? {
                ...current,
                cooldownUntilMs: frame.cooldownUntilMs
                  ? Date.now() + 3000
                  : current.cooldownUntilMs,
                recalibrateHint:
                  frame.recalibrateHint !== undefined
                    ? frame.recalibrateHint
                    : current.recalibrateHint,
                room: {
                  ...current.room,
                  siege: frame.siege,
                },
              }
            : current,
        )
        break

      case 'reveal':
        setState((current) =>
          current
            ? {
                ...current,
                reveal: frame.reveal,
                you: frame.you,
                cooldownUntilMs: null,
                recalibrateHint: null,
                room: {
                  ...current.room,
                  phase: 'reveal',
                  players: frame.players,
                },
              }
            : current,
        )
        break

      case 'over':
        setState((current) =>
          current
            ? {
                ...current,
                standings: frame.standings,
                you: frame.you,
                reveal: null,
                question: null,
                squadQuestion: null,
                cooldownUntilMs: null,
                recalibrateHint: null,
                room: { ...current.room, phase: 'over' },
              }
            : current,
        )
        break

      case 'error':
        // Server-side refusals ("race already finished", "not open
        // to you") belong on screen, not lost in a console.
        toastRef.current(frame.message, 'error')
        break
    }
  }, [])

  // REST hydration: paints the room before the socket exists.
  useEffect(() => {
    let cancelled = false
    api.races
      .get(code)
      .then((res) => {
        if (cancelled) return
        setState({
          room: res.room,
          question: res.question,
          reveal: res.reveal,
          standings: res.standings,
          you: res.you,
          role: res.isHost ? 'host' : 'player',
          answeredCount: res.room.players.filter((p) => p.answered).length,
          squadQuestion: null,
          cooldownUntilMs: null,
          recalibrateHint: null,
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load this race')
      })
    return () => {
      cancelled = true
    }
  }, [code])

  // Live socket with reconnect: the failure modes on a classroom LAN
  // are transient (sleep, roaming), so retrying beats showing a dead
  // end. The `joined` frame restores the full screen on reconnect.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    let retries = 0
    let retryTimer = 0

    const open = () => {
      if (cancelled) return
      const connection = connectRace(
        code,
        token,
        applyFrame,
        () => {
          setConnected(false)
          if (cancelled) return
          retries += 1
          if (retries > MAX_RECONNECTS) {
            setError('Lost the race connection. Reopen the page to rejoin.')
            return
          }
          retryTimer = window.setTimeout(open, RECONNECT_DELAY_MS)
        },
      )
      connectionRef.current = connection
      connection.socket.addEventListener('open', () => {
        if (cancelled) return
        setConnected(true)
        retries = 0
      })
    }

    open()
    return () => {
      cancelled = true
      window.clearTimeout(retryTimer)
      connectionRef.current?.close()
      connectionRef.current = null
    }
  }, [code, token, applyFrame])

  // A frame typed while the socket is mid-reconnect is refused here
  // (not silently dropped): the caller keeps the input live so the
  // answer can be re-sent once the connection is back.
  const send = useCallback((frame: RaceClientFrame): boolean => {
    const connection = connectionRef.current
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      return false
    }
    connection.socket.send(JSON.stringify(frame))
    return true
  }, [])

  return { state, error, connected, send }
}
