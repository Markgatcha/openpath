import { randomUUID } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { requireRole } from '../lib/auth'
import { badRequest, parse } from '../lib/http'
import { ArcadeRunSchema, type ArcadeMode } from '../../shared/schemas'
import { ARCADE_DAILY_COIN_CAP, arcadeCoinsForRun } from '../../shared/economy'
import type { ArcadeRunResultDTO, ArcadeSummaryDTO } from '../../shared/types'

/**
 * Educational Arcade — solo game payouts.
 *
 * Games run on the client; this route banks the final tally into the
 * classroom coin ledger (source_type = 'arcade'), capped at
 * ARCADE_DAILY_COIN_CAP (120) per day across all 6 arcade modes.
 */

const MODE_REASON: Record<ArcadeMode, string> = {
  'streak-siege': 'Arcade: Streak Siege',
  'speed-match': 'Arcade: Speed Match',
  'step-detective': 'Arcade: Step Detective',
  'sim-sandbox': 'Arcade: Simulation Sandbox',
  'sequence-architect': 'Arcade: Sequence Architect',
  'boss-raid': 'Arcade: Boss Raid',
  'certainty-vault': 'Arcade: Certainty Vault',
  'diagram-scout': 'Arcade: Diagram Scout',
  'cloze-workbench': 'Arcade: Cloze Workbench',
  'knowledge-bastion': 'Arcade: Knowledge Bastion',
  'orbit-pilot': 'Arcade: Orbit Pilot',
}

function resolveCurrency(studentId: string): { currencyName: string; currencyIcon: string } {
  const row = db
    .prepare(
      `SELECT te.currency_name, te.currency_icon
       FROM classroom_members cm
       JOIN classrooms c ON c.id = cm.classroom_id
       JOIN teacher_economy te ON te.teacher_id = c.teacher_id
       WHERE cm.student_id = ?
       LIMIT 1`,
    )
    .get(studentId) as { currency_name: string; currency_icon: string } | undefined

  if (row) {
    return { currencyName: row.currency_name, currencyIcon: row.currency_icon }
  }
  return { currencyName: 'Coins', currencyIcon: '🪙' }
}

function earnedToday(userId: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(delta), 0) as n FROM coin_ledger
       WHERE user_id = ? AND source_type = 'arcade' AND date(created_at) = date('now')`,
    )
    .get(userId) as { n: number }
  return row.n
}

function balanceOf(userId: string): number {
  return (
    (db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as
      | { coins: number }
      | undefined)?.coins ?? 0
  )
}

/** Fastest humanly plausible pace: ~0.6 s per action. */
const MIN_MS_PER_ACTION = 600

export const arcadeRoutes: FastifyPluginAsync = async (app) => {
  app.get('/summary', async (request): Promise<ArcadeSummaryDTO> => {
    const student = await requireRole(request, 'student')
    const currency = resolveCurrency(student.id)
    return {
      coins: balanceOf(student.id),
      earnedToday: earnedToday(student.id),
      dailyCap: ARCADE_DAILY_COIN_CAP,
      ...currency,
    }
  })

  app.post('/runs', async (request, reply) => {
    const student = await requireRole(request, 'student')
    const run = parse(ArcadeRunSchema, request.body)
    if (run.attempts > 0 && run.durationMs < run.attempts * MIN_MS_PER_ACTION) {
      throw badRequest('That run was implausibly fast')
    }

    const currency = resolveCurrency(student.id)
    const worth = arcadeCoinsForRun(run)
    const result = db.transaction((): ArcadeRunResultDTO => {
      const already = earnedToday(student.id)
      const credit = Math.max(0, Math.min(worth, ARCADE_DAILY_COIN_CAP - already))
      let balance = balanceOf(student.id)
      if (credit > 0) {
        balance += credit
        db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(balance, student.id)
        db.prepare(
          `INSERT INTO coin_ledger (id, user_id, delta, balance_after, reason, source_type, source_id, currency_name)
           VALUES (?, ?, ?, ?, ?, 'arcade', ?, ?)`,
        ).run(
          randomUUID(),
          student.id,
          credit,
          balance,
          MODE_REASON[run.mode] ?? 'Arcade Run',
          run.mode,
          currency.currencyName,
        )
      }
      return {
        coinsEarned: credit,
        coinsWorth: worth,
        balance,
        earnedToday: already + credit,
        dailyCap: ARCADE_DAILY_COIN_CAP,
        capped: credit < worth,
        ...currency,
      }
    })()

    return reply.status(201).send(result)
  })
}
