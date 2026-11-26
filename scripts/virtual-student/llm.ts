/**
 * Optional LLM "error texture" for the virtual-student harness.
 *
 * The statistical model decides WHETHER an answer is wrong (calibrated
 * to real student data). This module decides WHAT the wrong answer is:
 * which distractor a confused student actually reaches for, or what a
 * confused student types into a fill-in-the-blank box. That texture is
 * what makes distractor analysis in the report meaningful instead of
 * uniform noise.
 *
 * Any OpenAI-compatible chat-completions endpoint works — OpenRouter
 * (OPENROUTER_API_KEY) or a local server like Ollama
 * (LOCAL_AI_BASE_URL / LOCAL_AI_MODEL), mirroring the server env
 * conventions in server/env.ts. With no key the harness silently falls
 * back to uniform distractor picks.
 *
 * Answers are cached per (persona, question): real students of a type
 * share misconceptions, and the cache keeps a full run cheap.
 */

export interface TextureQuestion {
  questionId: string
  type: 'mcq' | 'fill'
  prompt: string
  /** MCQ only. */
  options?: string[]
  /** Index of the key — the LLM is told to avoid it. */
  correctIndex?: number
}

export type TextureResult =
  | { kind: 'mcq'; wrongIndex: number }
  | { kind: 'fill'; wrongText: string }

interface LlmConfig {
  baseUrl: string
  model: string
  apiKey: string
}

/** Resolve config from env exactly like server/env.ts does. */
export function resolveLlmConfig(): LlmConfig | null {
  const key = process.env.OPENROUTER_API_KEY ?? ''
  if (key) {
    return {
      baseUrl: 'https://openrouter.ai/api/v1',
      model: process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat',
      apiKey: key,
    }
  }
  const localBase = process.env.LOCAL_AI_BASE_URL
  if (localBase) {
    return {
      baseUrl: localBase,
      model: process.env.LOCAL_AI_MODEL ?? 'qwen3:8b',
      apiKey: '',
    }
  }
  return null
}

async function chatCompletion(
  config: LlmConfig,
  messages: { role: string; content: string }[],
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`

  const response = await fetch(
    `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.4,
        max_tokens: 900,
      }),
    },
  )
  if (!response.ok) {
    throw new Error(`LLM provider responded with ${response.status}`)
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM provider returned an empty response')
  return content
}

/** Extract the first JSON object from an LLM reply (fences tolerated). */
function extractJson(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('no JSON object in reply')
  return JSON.parse(text.slice(start, end + 1))
}

/**
 * Ask the LLM, in one batched call, what wrong answers this persona
 * would produce for the given questions. Returns a map questionId →
 * texture; questions the LLM flubs are simply absent (caller falls
 * back to statistical picks).
 */
export async function chooseWrongAnswers(
  config: LlmConfig,
  personaProfile: string,
  questions: TextureQuestion[],
): Promise<Map<string, TextureResult>> {
  const out = new Map<string, TextureResult>()
  if (questions.length === 0) return out

  const spec = questions
    .map((q, i) => {
      if (q.type === 'mcq') {
        const listed = q
          .options!.map((opt, j) => `    ${j}: ${opt}`)
          .join('\n')
        return `Q${i + 1} (id "${q.questionId}", multiple choice, correct index ${q.correctIndex} — never pick it):\n  "${q.prompt}"\n${listed}`
      }
      return `Q${i + 1} (id "${q.questionId}", fill in the blank):\n  "${q.prompt}"`
    })
    .join('\n')

  const reply = await chatCompletion(config, [
    {
      role: 'system',
      content:
        'You simulate the mistakes of a student who is ' +
        personaProfile +
        '. For each question, produce the MOST PLAUSIBLE WRONG answer this ' +
        'student would give — the distractor a typical misconception or ' +
        'careless slip leads to, not a random one. Reply with ONLY JSON: ' +
        '{"answers": [{"id": "<questionId>", "wrongIndex": <int>} for mcq, ' +
        'or {"id": "<questionId>", "wrongText": "<short wrong answer>"} for fill]}.',
    },
    { role: 'user', content: spec },
  ])

  try {
    const parsed = extractJson(reply) as {
      answers?: { id?: string; wrongIndex?: number; wrongText?: string }[]
    }
    const byId = new Map(questions.map((q) => [q.questionId, q]))
    for (const entry of parsed.answers ?? []) {
      if (!entry.id) continue
      const question = byId.get(entry.id)
      if (!question) continue
      if (
        question.type === 'mcq' &&
        typeof entry.wrongIndex === 'number' &&
        entry.wrongIndex >= 0 &&
        entry.wrongIndex < question.options!.length &&
        entry.wrongIndex !== question.correctIndex
      ) {
        out.set(entry.id, { kind: 'mcq', wrongIndex: entry.wrongIndex })
      } else if (
        question.type === 'fill' &&
        typeof entry.wrongText === 'string' &&
        entry.wrongText.trim().length > 0 &&
        entry.wrongText.length <= 200
      ) {
        out.set(entry.id, { kind: 'fill', wrongText: entry.wrongText.trim() })
      }
    }
  } catch {
    // Malformed LLM output: caller falls back per question.
  }
  return out
}
