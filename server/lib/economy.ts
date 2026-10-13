import { randomUUID } from 'node:crypto'
import { db } from '../db'
import {
  DEFAULT_COSMETICS,
  coinsForPoints,
  type Cosmetics,
  type Nameplate,
  type Paint,
  type QuizKind,
} from '../../shared/economy'
import type { EconomyDTO, LevelRewardDTO, UserRow } from '../../shared/types'

// ── Rows ──────────────────────────────────────────────────────
interface EconomyRow {
  teacher_id: string
  currency_name: string
  currency_icon: string
  points_per_coin: number
}

export interface ShopItemRow {
  id: string
  teacher_id: string
  name: string
  description: string
  category: 'background' | 'nameplate' | 'name-style' | 'font'
  price: number
  item_data: string
  active: number
  created_at: string
}

interface LevelRewardRow {
  id: string
  level: number
  reward_type: 'coins' | 'item'
  coins: number
  item_id: string | null
}

// ── Economy settings ──────────────────────────────────────────
export function getEconomy(teacherId: string): EconomyDTO {
  const row = db
    .prepare('SELECT * FROM teacher_economy WHERE teacher_id = ?')
    .get(teacherId) as EconomyRow | undefined
  if (row) {
    return {
      currencyName: row.currency_name,
      currencyIcon: row.currency_icon,
      pointsPerCoin: row.points_per_coin,
    }
  }
  db.prepare(
    `INSERT INTO teacher_economy (teacher_id, currency_name, currency_icon, points_per_coin)
     VALUES (?, 'Coins', '🪙', 10)
     ON CONFLICT(teacher_id) DO NOTHING`,
  ).run(teacherId)
  return { currencyName: 'Coins', currencyIcon: '🪙', pointsPerCoin: 10 }
}

export function upsertEconomy(
  teacherId: string,
  settings: { currencyName: string; currencyIcon: string; pointsPerCoin: number },
): EconomyDTO {
  db.prepare(
    `INSERT INTO teacher_economy (teacher_id, currency_name, currency_icon, points_per_coin, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(teacher_id) DO UPDATE SET
       currency_name = excluded.currency_name,
       currency_icon = excluded.currency_icon,
       points_per_coin = excluded.points_per_coin,
       updated_at = datetime('now')`,
  ).run(teacherId, settings.currencyName, settings.currencyIcon, settings.pointsPerCoin)
  return getEconomy(teacherId)
}

// ── Ledger ────────────────────────────────────────────────────
function ledger(
  userId: string,
  delta: number,
  balanceAfter: number,
  reason: string,
  currencyName: string,
  sourceType?: string,
  sourceId?: string,
): void {
  db.prepare(
    `INSERT INTO coin_ledger (id, user_id, delta, balance_after, reason, source_type, source_id, currency_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    userId,
    delta,
    balanceAfter,
    reason,
    sourceType ?? null,
    sourceId ?? null,
    currencyName,
  )
}

function coinBalance(userId: string): number {
  return (
    db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as
      | { coins: number }
      | undefined
  )?.coins ?? 0
}

// ── Earning ───────────────────────────────────────────────────
export interface CoinAward {
  amount: number
  currencyName: string
  currencyIcon: string
  balance: number
}

/** Award coins for a finished run; returns null when nothing was earned. */
export function awardCoins(
  userId: string,
  points: number,
  kind: QuizKind,
  teacherId: string,
  attemptId: string,
): CoinAward | null {
  const economy = getEconomy(teacherId)
  const amount = coinsForPoints(points, kind, economy.pointsPerCoin)
  if (amount <= 0) return null

  const balance = coinBalance(userId) + amount
  db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(balance, userId)
  ledger(
    userId,
    amount,
    balance,
    `Earned for a finished ${kind}`,
    economy.currencyName,
    'attempt',
    attemptId,
  )
  return {
    amount,
    currencyName: economy.currencyName,
    currencyIcon: economy.currencyIcon,
    balance,
  }
}

// ── Level rewards ─────────────────────────────────────────────
export function listLevelRewards(teacherId: string): LevelRewardDTO[] {
  const rows = db
    .prepare(
      `SELECT r.*, i.name as item_name FROM level_rewards r
       LEFT JOIN shop_items i ON i.id = r.item_id
       WHERE r.teacher_id = ? ORDER BY r.level`,
    )
    .all(teacherId) as (LevelRewardRow & { item_name: string | null })[]
  return rows.map((row) => ({
    id: row.id,
    level: row.level,
    rewardType: row.reward_type,
    coins: row.coins,
    itemId: row.item_id,
    itemName: row.item_name,
  }))
}

export interface GrantedReward {
  level: number
  rewardType: 'coins' | 'item'
  coins: number
  itemName: string | null
  currencyName: string
  currencyIcon: string
}

/**
 * Grant every configured reward for levels in (fromLevel, toLevel].
 * Each (student, teacher, level) grants at most once — replays are free
 * of double-dips.
 */
export function grantLevelRewards(
  userId: string,
  teacherId: string,
  fromLevel: number,
  toLevel: number,
): GrantedReward[] {
  if (toLevel <= fromLevel) return []
  const economy = getEconomy(teacherId)
  const rows = db
    .prepare(
      `SELECT r.*, i.name as item_name FROM level_rewards r
       LEFT JOIN shop_items i ON i.id = r.item_id
       WHERE r.teacher_id = ? AND r.level > ? AND r.level <= ? ORDER BY r.level`,
    )
    .all(teacherId, fromLevel, toLevel) as (LevelRewardRow & {
    item_name: string | null
  })[]

  const granted: GrantedReward[] = []
  for (const row of rows) {
    const claim = db
      .prepare(
        `INSERT OR IGNORE INTO level_rewards_granted (user_id, teacher_id, level)
         VALUES (?, ?, ?)`,
      )
      .run(userId, teacherId, row.level)
    if (claim.changes === 0) continue

    if (row.reward_type === 'coins' && row.coins > 0) {
      const balance = coinBalance(userId) + row.coins
      db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(balance, userId)
      ledger(
        userId,
        row.coins,
        balance,
        `Level ${row.level} reward`,
        economy.currencyName,
        'level_reward',
        row.id,
      )
    }
    if (row.reward_type === 'item' && row.item_id) {
      grantItem(userId, row.item_id)
    }
    granted.push({
      level: row.level,
      rewardType: row.reward_type,
      coins: row.coins,
      itemName: row.item_name,
      currencyName: economy.currencyName,
      currencyIcon: economy.currencyIcon,
    })
  }
  return granted
}

// ── Ownership ─────────────────────────────────────────────────
export function ownsItem(userId: string, itemId: string): boolean {
  return !!db
    .prepare('SELECT 1 FROM purchases WHERE user_id = ? AND item_id = ?')
    .get(userId, itemId)
}

/** Grant an item without charging (level rewards, giveaways). */
export function grantItem(userId: string, itemId: string): void {
  const item = db
    .prepare('SELECT * FROM shop_items WHERE id = ?')
    .get(itemId) as ShopItemRow | undefined
  if (!item) return
  db.prepare(
    `INSERT INTO purchases (id, user_id, item_id, price, currency_name)
     VALUES (?, ?, ?, 0, 'granted')`,
  ).run(randomUUID(), userId, itemId)
}

// ── Spending ──────────────────────────────────────────────────
export function spendCoins(
  userId: string,
  amount: number,
  reason: string,
  currencyName: string,
  sourceId?: string,
): number {
  const balance = coinBalance(userId)
  if (amount > balance) throw new Error('Not enough coins')
  const next = balance - amount
  db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(next, userId)
  ledger(userId, -amount, next, reason, currencyName, 'purchase', sourceId)
  return next
}

// ── Cosmetics ─────────────────────────────────────────────────
export function readCosmetics(user: UserRow): Cosmetics {
  if (!user.cosmetics_json) return DEFAULT_COSMETICS
  try {
    return {
      ...DEFAULT_COSMETICS,
      ...(JSON.parse(user.cosmetics_json) as Cosmetics),
    }
  } catch {
    return DEFAULT_COSMETICS
  }
}

export function writeCosmetics(userId: string, cosmetics: Cosmetics): void {
  db.prepare('UPDATE users SET cosmetics_json = ? WHERE id = ?').run(
    JSON.stringify(cosmetics),
    userId,
  )
}

/**
 * Equip a purchased item: item data lands in the cosmetics slot its
 * category owns. Font and nameplate pass through; paints keep their
 * chosen direction when the student overrides it afterwards.
 */
export function equipItem(user: UserRow, item: ShopItemRow): Cosmetics {
  const cosmetics = readCosmetics(user)
  const data = JSON.parse(item.item_data) as Paint | Nameplate | { font: string }
  switch (item.category) {
    case 'background':
      cosmetics.background = data as Paint
      break
    case 'name-style':
      cosmetics.nameStyle = data as Paint
      break
    case 'nameplate':
      cosmetics.nameplate = data as Nameplate
      break
    case 'font':
      cosmetics.font = (data as { font: string }).font
      break
  }
  writeCosmetics(user.id, cosmetics)
  return cosmetics
}
