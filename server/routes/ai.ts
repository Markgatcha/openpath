import type { FastifyPluginAsync } from 'fastify'
import { requireRole } from '../lib/auth'
import { badRequest, parse } from '../lib/http'
import {
  aiStatus,
  chatCompletion,
  getAiConfig,
  saveAiSettings,
} from '../ai/provider'
import { AiGenerateSchema, AiSettingsSchema } from '../../shared/schemas'
import type { AiQuestionDraft } from '../../shared/types'

const SYSTEM_PROMPT = `You are OpenPath's quiz forge: an expert assessment designer who writes clear, age-appropriate questions.
You MUST reply with a single JSON array and nothing else — no markdown fences, no commentary.
Each element must be one of these shapes:
{"type":"mcq","prompt":"question text","options":["a","b","c","d"],"correct":0,"explanation":"why the answer is right","points":10}
{"type":"truefalse","prompt":"statement","correct":true,"explanation":"...","points":10}
{"type":"fill","prompt":"question with a blank","correct":"exact answer","alternatives":["other accepted spelling"],"explanation":"...","points":10}
Rules:
- "correct" for mcq is the 0-based index of the right option.
- Distractors must be plausible but unambiguously wrong.
- Explanations are one short sentence that teaches.
- Vary where the correct answer appears.`

function extractJsonArray(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')
  if (start === -1 || end <= start) {
    throw badRequest('The AI did not return a JSON array of questions')
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    throw badRequest('The AI returned malformed JSON — try regenerating')
  }
}

function coerceDrafts(payload: unknown): AiQuestionDraft[] {
  if (!Array.isArray(payload)) {
    throw badRequest('The AI did not return a JSON array of questions')
  }

  return payload.map((item, index) => {
    const raw = item as Record<string, unknown>
    const type =
      raw.type === 'truefalse' || raw.type === 'fill' ? raw.type : 'mcq'
    const prompt = typeof raw.prompt === 'string' ? raw.prompt.trim() : ''
    if (prompt.length < 3) {
      throw badRequest(`Question ${index + 1} is missing a prompt`)
    }
    const explanation =
      typeof raw.explanation === 'string' ? raw.explanation : ''
    const points =
      typeof raw.points === 'number' && raw.points >= 1 && raw.points <= 100
        ? Math.round(raw.points)
        : 10

    if (type === 'mcq') {
      const options = Array.isArray(raw.options)
        ? raw.options.map((option) => String(option))
        : []
      if (options.length < 2) {
        throw badRequest(`Question ${index + 1} needs at least 2 options`)
      }
      const correctIndex =
        typeof raw.correct === 'number'
          ? Math.min(Math.max(Math.trunc(raw.correct), 0), options.length - 1)
          : 0
      return { type, prompt, options, correct: correctIndex, explanation, points }
    }

    if (type === 'truefalse') {
      return { type, prompt, correct: raw.correct === true, explanation, points }
    }

    const alternatives = Array.isArray(raw.alternatives)
      ? raw.alternatives.map((alt) => String(alt))
      : []
    return {
      type,
      prompt,
      correct: typeof raw.correct === 'string' ? raw.correct : '',
      alternatives,
      explanation,
      points,
    }
  })
}

export const aiRoutes: FastifyPluginAsync = async (app) => {
  app.get('/status', async () => ({ status: aiStatus() }))

  app.put('/settings', async (request) => {
    await requireRole(request, 'teacher')
    const input = parse(AiSettingsSchema, request.body)
    saveAiSettings(input)
    return { status: aiStatus() }
  })

  app.post(
    '/generate',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request) => {
      await requireRole(request, 'teacher')
      const input = parse(AiGenerateSchema, request.body)
      const config = getAiConfig()

      if (config.provider === 'openrouter' && config.apiKey.length === 0) {
        throw badRequest(
          'OpenRouter is selected but no API key is configured. Add one in Settings → AI.',
        )
      }

      const messages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        {
          role: 'user' as const,
          content: `Create ${input.count} ${input.difficulty}-difficulty questions about "${input.topic}" for the subject "${input.subject}". Use only these question types: ${input.types.join(', ')}.`,
        },
      ]

      const raw = await chatCompletion(config, messages, {
        temperature: 0.8,
        maxTokens: 2400,
      })
      const drafts = coerceDrafts(extractJsonArray(raw))

      return {
        questions: drafts,
        provider: config.provider,
        model: config.model,
      }
    },
  )
}
