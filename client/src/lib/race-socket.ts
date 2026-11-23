import type { RaceServerFrame } from '@shared/types'

/**
 * Live race transport.
 *
 * One WebSocket per participant carries every race frame; REST is only
 * used for host controls and room lookups. Browsers cannot set headers
 * on a WebSocket, so the JWT rides the `token` query parameter (the
 * same token the REST client sends, verified once at connect time).
 *
 * The URL points at the app's own origin: in dev the Vite proxy
 * (`ws: true` on /api) forwards the upgrade, in production the
 * Fastify server serves both.
 */
export function raceSocketUrl(code: string, token: string): string {
  const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const query = new URLSearchParams({ token })
  return `${scheme}//${window.location.host}/api/races/${code}/live?${query}`
}

export interface RaceConnection {
  /** Raw socket — kept for manual close() if ever needed. */
  socket: WebSocket
  /** Idempotent teardown; safe to call twice. */
  close: () => void
}

/**
 * Open the live socket and route every parsed frame to `onFrame`.
 * Returns a connection whose `close()` tears the socket down — call
 * it from a React effect cleanup. Frames that fail to parse are
 * dropped silently (the server guarantees valid JSON, but the socket
 * must survive noise either way).
 */
export function connectRace(
  code: string,
  token: string,
  onFrame: (frame: RaceServerFrame) => void,
  onClose?: () => void,
): RaceConnection {
  const socket = new WebSocket(raceSocketUrl(code, token))

  socket.addEventListener('message', (event: MessageEvent) => {
    try {
      onFrame(JSON.parse(String(event.data)) as RaceServerFrame)
    } catch {
      // Ignore malformed frames; the next one is already on its way.
    }
  })
  socket.addEventListener('close', () => onClose?.())

  let closed = false
  return {
    socket,
    close() {
      if (closed) return
      closed = true
      socket.close()
    },
  }
}
