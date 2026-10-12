import type { FastifyInstance, FastifyRequest } from 'fastify'
import bcrypt from 'bcryptjs'
import type { Role } from '../../shared/schemas'
import { db } from '../db'
import { forbidden, unauthorized } from './http'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: Role }
    user: { sub: string; role: Role }
  }
}

export interface AuthUser {
  id: string
  role: Role
  name: string
  email: string
  avatar_color: string
  xp: number
  streak_days: number
  daily_goal_minutes: number
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function signToken(
  app: FastifyInstance,
  user: { id: string; role: Role },
): string {
  return app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: '7d' })
}

export function getUserRow(id: string): AuthUser | undefined {
  return db
    .prepare(
      `SELECT id, role, name, email, avatar_color, xp, streak_days, daily_goal_minutes
       FROM users WHERE id = ?`,
    )
    .get(id) as AuthUser | undefined
}

export async function requireAuth(req: FastifyRequest): Promise<AuthUser> {
  await req.jwtVerify()
  const user = getUserRow(req.user.sub)
  if (!user) throw unauthorized('Account no longer exists')
  return user
}

export async function requireRole(
  req: FastifyRequest,
  ...roles: Role[]
): Promise<AuthUser> {
  const user = await requireAuth(req)
  if (!roles.includes(user.role)) {
    throw forbidden('You do not have access to this resource')
  }
  return user
}
