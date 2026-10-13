import { randomUUID } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '../db'
import { requireRole } from '../lib/auth'
import { badRequest, notFound, parse } from '../lib/http'
import {
  equipItem,
  getEconomy,
  listLevelRewards,
  ownsItem,
  readCosmetics,
  spendCoins,
  upsertEconomy,
  type ShopItemRow,
} from '../lib/economy'
import {
  EconomySettingsSchema,
  LevelRewardsSchema,
  ShopItemCreateSchema,
  ShopItemUpdateSchema,
} from '../../shared/schemas'
import type { CoinTxDTO, ShopItemDTO, UserRow } from '../../shared/types'

function getItem(id: string): ShopItemRow {
  const row = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(id) as
    | ShopItemRow
    | undefined
  if (!row) throw notFound('Item not found')
  return row
}

function toItemDTO(row: ShopItemRow, viewerId: string | null): ShopItemDTO {
  const teacher = db
    .prepare('SELECT name FROM users WHERE id = ?')
    .get(row.teacher_id) as { name: string } | undefined
  const purchases = (
    db
      .prepare('SELECT COUNT(*) as n FROM purchases WHERE item_id = ?')
      .get(row.id) as { n: number }
  ).n
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: teacher?.name ?? 'Unknown teacher',
    name: row.name,
    description: row.description,
    category: row.category,
    price: row.price,
    itemData: JSON.parse(row.item_data),
    active: row.active === 1,
    owned: viewerId ? ownsItem(viewerId, row.id) : false,
    purchaseCount: purchases,
    createdAt: row.created_at,
  }
}

function currentUser(id: string): UserRow {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as
    | UserRow
    | undefined
  if (!row) throw notFound('User not found')
  return row
}

export const economyRoutes: FastifyPluginAsync = async (app) => {
  // ── Teacher: economy overview ───────────────────────────────
  app.get('/mine', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const items = db
      .prepare('SELECT * FROM shop_items WHERE teacher_id = ? ORDER BY created_at DESC')
      .all(teacher.id) as ShopItemRow[]
    return {
      economy: getEconomy(teacher.id),
      rewards: listLevelRewards(teacher.id),
      items: items.map((item) => toItemDTO(item, null)),
    }
  })

  // ── Teacher: currency settings ──────────────────────────────
  app.put('/settings', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const input = parse(EconomySettingsSchema, request.body)
    return { economy: upsertEconomy(teacher.id, input) }
  })

  // ── Teacher: level rewards (full replace) ───────────────────
  app.put('/rewards', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const input = parse(LevelRewardsSchema, request.body)

    const levels = input.rewards.map((reward) => reward.level)
    if (new Set(levels).size !== levels.length) {
      throw badRequest('Each level can only have one reward')
    }
    for (const reward of input.rewards) {
      if (reward.rewardType === 'item') {
        if (!reward.itemId) throw badRequest('Item rewards need an item')
        const item = getItem(reward.itemId)
        if (item.teacher_id !== teacher.id) {
          throw badRequest('Item rewards must use your own shop items')
        }
      }
      if (reward.rewardType === 'coins' && reward.coins <= 0) {
        throw badRequest('Coin rewards need at least 1 coin')
      }
    }

    db.prepare('DELETE FROM level_rewards WHERE teacher_id = ?').run(teacher.id)
    for (const reward of input.rewards) {
      db.prepare(
        `INSERT INTO level_rewards (id, teacher_id, level, reward_type, coins, item_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        randomUUID(),
        teacher.id,
        reward.level,
        reward.rewardType,
        reward.coins,
        reward.itemId,
      )
    }
    return { rewards: listLevelRewards(teacher.id) }
  })

  // ── Teacher: shop item CRUD ─────────────────────────────────
  app.post('/items', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const input = parse(ShopItemCreateSchema, request.body)
    const id = randomUUID()
    db.prepare(
      `INSERT INTO shop_items (id, teacher_id, name, description, category, price, item_data, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    ).run(
      id,
      teacher.id,
      input.name.trim(),
      input.description.trim(),
      input.category,
      input.price,
      JSON.stringify(input.itemData),
    )
    return reply.status(201).send({ item: toItemDTO(getItem(id), null) })
  })

  app.patch<{ Params: { id: string } }>('/items/:id', async (request) => {
    const teacher = await requireRole(request, 'teacher')
    const item = getItem(request.params.id)
    if (item.teacher_id !== teacher.id) {
      throw badRequest('You can only edit your own items')
    }
    const input = parse(ShopItemUpdateSchema, request.body)

    db.prepare(
      `UPDATE shop_items
       SET name = ?, description = ?, category = ?, price = ?, item_data = ?, active = ?
       WHERE id = ?`,
    ).run(
      input.name?.trim() ?? item.name,
      input.description?.trim() ?? item.description,
      input.category ?? item.category,
      input.price ?? item.price,
      input.itemData ? JSON.stringify(input.itemData) : item.item_data,
      input.active === undefined ? item.active : input.active ? 1 : 0,
      item.id,
    )
    return { item: toItemDTO(getItem(item.id), null) }
  })

  app.delete<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const item = getItem(request.params.id)
    if (item.teacher_id !== teacher.id) {
      throw badRequest('You can only delete your own items')
    }
    db.prepare('DELETE FROM shop_items WHERE id = ?').run(item.id)
    db.prepare('DELETE FROM purchases WHERE item_id = ?').run(item.id)
    return reply.status(204).send()
  })

  // ── Student: shop catalog + wallet ──────────────────────────
  app.get('/shop', async (request) => {
    const student = await requireRole(request, 'student')
    const rows = db
      .prepare(
        `SELECT s.* FROM shop_items s
         WHERE s.active = 1
         ORDER BY s.category, s.price`,
      )
      .all() as ShopItemRow[]
    const user = currentUser(student.id)
    return {
      coins: user.coins,
      items: rows.map((row) => toItemDTO(row, student.id)),
      equipped: readCosmetics(user),
    }
  })

  // ── Student: buy ────────────────────────────────────────────
  app.post<{ Params: { id: string } }>('/shop/:id/buy', async (request) => {
    const student = await requireRole(request, 'student')
    const item = getItem(request.params.id)
    if (item.active !== 1) throw badRequest('This item is no longer available')
    if (ownsItem(student.id, item.id)) {
      throw badRequest('You already own this item')
    }

    const economy = getEconomy(item.teacher_id)
    const user = currentUser(student.id)
    if (item.price > user.coins) {
      throw badRequest(
        `Not enough ${economy.currencyName} — you need ${item.price - user.coins} more`,
      )
    }

    const balance = spendCoins(student.id, item.price, `Bought ${item.name}`, economy.currencyName, item.id)
    db.prepare(
      `INSERT INTO purchases (id, user_id, item_id, price, currency_name)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(randomUUID(), student.id, item.id, item.price, economy.currencyName)

    // Buying equips immediately — it is the moment of joy.
    const cosmetics = equipItem(user, item)
    return { coins: balance, item: toItemDTO(item, student.id), cosmetics }
  })

  // ── Student: equip / unequip ────────────────────────────────
  const EquipSchema = z.object({ itemId: z.string().min(1) })
  const UnequipSchema = z.object({
    category: z.enum(['background', 'name-style', 'nameplate', 'font']),
  })

  app.post('/equip', async (request) => {
    const student = await requireRole(request, 'student')
    const body = parse(EquipSchema, request.body)
    const item = getItem(body.itemId)
    if (!ownsItem(student.id, item.id)) {
      throw badRequest('You do not own this item')
    }
    const user = currentUser(student.id)
    return { cosmetics: equipItem(user, item) }
  })

  app.post('/unequip', async (request) => {
    const student = await requireRole(request, 'student')
    const body = parse(UnequipSchema, request.body)
    const user = currentUser(student.id)
    const cosmetics = readCosmetics(user)
    if (body.category === 'background') cosmetics.background = { type: 'solid', color: '#8b5cf6' }
    if (body.category === 'name-style') cosmetics.nameStyle = { type: 'solid', color: '#8b5cf6' }
    if (body.category === 'nameplate') cosmetics.nameplate = null
    if (body.category === 'font') cosmetics.font = null
    db.prepare('UPDATE users SET cosmetics_json = ? WHERE id = ?').run(
      JSON.stringify(cosmetics),
      user.id,
    )
    return { cosmetics }
  })

  // ── Student: coin ledger ────────────────────────────────────
  app.get('/ledger', async (request) => {
    const student = await requireRole(request, 'student')
    const rows = db
      .prepare(
        'SELECT * FROM coin_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      )
      .all(student.id) as {
      id: string
      delta: number
      balance_after: number
      reason: string
      currency_name: string
      created_at: string
    }[]
    const transactions: CoinTxDTO[] = rows.map((row) => ({
      id: row.id,
      delta: row.delta,
      balanceAfter: row.balance_after,
      reason: row.reason,
      currencyName: row.currency_name,
      createdAt: row.created_at,
    }))
    return { transactions }
  })

  // ── Teacher generosity: grant coins ─────────────────────────
  const GrantSchema = z.object({
    studentId: z.string().min(1),
    amount: z.number().int().min(1).max(10000),
  })

  app.post('/grant', async (request, reply) => {
    const teacher = await requireRole(request, 'teacher')
    const body = parse(GrantSchema, request.body)
    const economy = getEconomy(teacher.id)
    const student = db
      .prepare("SELECT * FROM users WHERE id = ? AND role = 'student'")
      .get(body.studentId) as UserRow | undefined
    if (!student) throw notFound('Student not found')

    const balance = (student.coins ?? 0) + body.amount
    db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(balance, student.id)
    db.prepare(
      `INSERT INTO coin_ledger (id, user_id, delta, balance_after, reason, source_type, source_id, currency_name)
       VALUES (?, ?, ?, ?, 'Teacher grant', 'grant', ?, ?)`,
    ).run(
      randomUUID(),
      student.id,
      body.amount,
      balance,
      teacher.id,
      economy.currencyName,
    )
    return reply.status(201).send({ coins: balance })
  })
}
