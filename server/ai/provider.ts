import { db } from '../db'
import { env } from '../env'
import { HttpError } from '../lib/http'
import type { AiSettingsInput } from '../../shared/schemas'
import type { AiStatusDTO } from '../../shared/types'

export type AiProvider = 'openrouter' | 'local'

export interface AiConfig {
  provider: AiProvider
  baseUrl: string
  model: string
  apiKey: string
  source: 'env' | 'app-settings'
  /** Master kill switch: when false, every AI surface is off. */
  enabled: boolean
}

interface AiSettingsRow {
  provider: string
  base_url: string
  model: string
  api_key: string
  enabled: number
}

/**
 * Resolution order: in-app settings (Settings → AI) win over .env,
 * so teachers can switch providers without restarting the server.
 */
export function getAiConfig(): AiConfig {
  const row = db
    .prepare(
      'SELECT provider, base_url, model, api_key, enabled FROM ai_settings WHERE id = 1',
    )
    .get() as AiSettingsRow | undefined

  if (row) {
    const provider = (row.provider === 'openrouter'
      ? 'openrouter'
      : 'local') as AiProvider
    const fallbackKey =
      provider === 'openrouter' ? env.AI.openrouterApiKey : ''
    return {
      provider,
      baseUrl: row.base_url,
      model: row.model,
      apiKey: row.api_key || fallbackKey,
      source: 'app-settings',
      enabled: row.enabled !== 0,
    }
  }

  if (env.AI.provider === 'openrouter') {
    return {
      provider: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: env.AI.openrouterModel,
      apiKey: env.AI.openrouterApiKey,
      source: 'env',
      enabled: true,
    }
  }
  return {
    provider: 'local',
    baseUrl: env.AI.localBaseUrl,
    model: env.AI.localModel,
    apiKey: '',
    source: 'env',
    enabled: true,
  }
}

export function isAiEnabled(): boolean {
  return getAiConfig().enabled
}

export function aiStatus(): AiStatusDTO {
  const config = getAiConfig()
  return {
    configured:
      config.provider === 'local' ? true : config.apiKey.length > 0,
    provider: config.provider,
    baseUrl: config.baseUrl,
    model: config.model,
    hasKey: config.apiKey.length > 0,
    source: config.source,
    enabled: config.enabled,
  }
}

export function saveAiSettings(input: AiSettingsInput): void {
  const existing = db
    .prepare('SELECT api_key FROM ai_settings WHERE id = 1')
    .get() as { api_key: string } | undefined
  const apiKey = input.apiKey?.trim()
    ? input.apiKey.trim()
    : (existing?.api_key ?? '')

  db.prepare(
    `INSERT INTO ai_settings (id, provider, base_url, model, api_key, enabled, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       provider = excluded.provider,
       base_url = excluded.base_url,
       model = excluded.model,
       api_key = excluded.api_key,
       enabled = excluded.enabled,
       updated_at = datetime('now')`,
  ).run(
    input.provider,
    input.baseUrl,
    input.model,
    apiKey,
    input.enabled === false ? 0 : 1,
  )
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Call any OpenAI-compatible /chat/completions endpoint. */
export async function chatCompletion(
  config: AiConfig,
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`
  }
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'http://localhost:8787'
    headers['X-Title'] = 'OpenPath'
  }

  const response = await fetch(
    `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.7,
        ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
      }),
    },
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new HttpError(
      502,
      `AI provider responded with ${response.status}: ${text.slice(0, 300)}`,
    )
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new HttpError(502, 'AI provider returned an empty response')
  }
  return content
}
