import { existsSync } from 'node:fs'
import path from 'node:path'
import Fastify, { type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import jwt from '@fastify/jwt'
import { env } from './env'
import { migrate } from './db'
import { HttpError } from './lib/http'
import { authRoutes } from './routes/auth'
import { classroomRoutes } from './routes/classrooms'
import { quizRoutes } from './routes/quizzes'
import { attemptRoutes } from './routes/attempts'
import { communityRoutes } from './routes/community'
import { statsRoutes } from './routes/stats'
import { aiRoutes } from './routes/ai'
import { srsRoutes } from './routes/srs'
import { assignmentRoutes } from './routes/assignments'
import { packRoutes } from './routes/packs'
import { exportRoutes, importRoutes } from './routes/import-export'
import { seedIfEmpty } from './seed'

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  })

  await app.register(cors, { origin: true })
  await app.register(jwt, { secret: env.JWT_SECRET })
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' })

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof HttpError) {
      return reply
        .status(error.status)
        .send({ error: error.message, details: error.details })
    }
    if (error.validation) {
      return reply
        .status(400)
        .send({ error: 'Validation failed', details: error.validation })
    }
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode && statusCode < 500) {
      return reply.status(statusCode).send({ error: error.message })
    }
    app.log.error(error)
    return reply.status(500).send({ error: 'Internal server error' })
  })

  migrate()
  seedIfEmpty()

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(classroomRoutes, { prefix: '/api/classrooms' })
  await app.register(quizRoutes, { prefix: '/api/quizzes' })
  await app.register(attemptRoutes, { prefix: '/api/attempts' })
  await app.register(communityRoutes, { prefix: '/api/community' })
  await app.register(statsRoutes, { prefix: '/api/stats' })
  await app.register(aiRoutes, { prefix: '/api/ai' })
  await app.register(srsRoutes, { prefix: '/api/srs' })
  await app.register(assignmentRoutes, { prefix: '/api/assignments' })
  await app.register(packRoutes, { prefix: '/api/packs' })
  await app.register(importRoutes, { prefix: '/api/import' })
  await app.register(exportRoutes, { prefix: '/api/export' })

  // Production: serve the built web client from the same port.
  const webDir = path.join(__dirname, '..', '..', 'dist', 'web')
  if (existsSync(webDir)) {
    await app.register(fastifyStatic, { root: webDir, prefix: '/' })
    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api')) {
        return reply.sendFile('index.html')
      }
      return reply.status(404).send({ error: 'Not found' })
    })
  }

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`🚀 OpenPath API listening on http://localhost:${env.PORT}`)
}

main().catch((error) => {
  console.error('Failed to start OpenPath:', error)
  process.exit(1)
})
