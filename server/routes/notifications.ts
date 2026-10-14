import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireAuth } from '../lib/auth'
import type { NotificationDTO } from '../../shared/types'

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string
  data_json: string | null
  read_at: string | null
  created_at: string
}

function toDTO(row: NotificationRow): NotificationDTO {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data_json
      ? (JSON.parse(row.data_json) as Record<string, unknown>)
      : null,
    read: row.read_at !== null,
    createdAt: row.created_at,
  }
}

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  // Unread count drives the bell badge; polled on an interval by the client.
  app.get('/unread-count', async (request) => {
    const user = await requireAuth(request)
    const row = db
      .prepare(
        'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL',
      )
      .get(user.id) as { n: number }
    return { unread: row.n }
  })

  app.get('/', async (request) => {
    const user = await requireAuth(request)
    const rows = db
      .prepare(
        `SELECT * FROM notifications WHERE user_id = ?
         ORDER BY read_at IS NULL DESC, created_at DESC LIMIT 50`,
      )
      .all(user.id) as NotificationRow[]
    return { notifications: rows.map(toDTO) }
  })

  app.post<{ Params: { id: string } }>('/:id/read', async (request) => {
    const user = await requireAuth(request)
    const existing = db
      .prepare('SELECT user_id FROM notifications WHERE id = ?')
      .get(request.params.id) as { user_id: string } | undefined
    if (!existing || existing.user_id !== user.id) {
      // Not found / not yours — mark as read either way (no info leak).
      return { read: false }
    }
    db.prepare(
      'UPDATE notifications SET read_at = datetime(\'now\') WHERE id = ? AND read_at IS NULL',
    ).run(request.params.id)
    return { read: true }
  })

  app.post('/read-all', async (request) => {
    const user = await requireAuth(request)
    db.prepare(
      `UPDATE notifications SET read_at = datetime('now')
       WHERE user_id = ? AND read_at IS NULL`,
    ).run(user.id)
    return { read: true }
  })
}
