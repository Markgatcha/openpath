import dotenv from 'dotenv'

dotenv.config()

function str(name: string, fallback: string): string {
  const value = process.env[name]
  return value && value.length > 0 ? value : fallback
}

export const env = {
  PORT: Number(str('PORT', '8787')),
  JWT_SECRET: str('JWT_SECRET', 'dev-secret-change-me-in-production'),
  DATABASE_PATH: str('DATABASE_PATH', './data/openpath.db'),
  SEED_DEMO_DATA: str('SEED_DEMO_DATA', 'true') !== 'false',
  NODE_ENV: str('NODE_ENV', 'development'),
  AI: {
    provider: str('AI_PROVIDER', 'local') as 'openrouter' | 'local',
    openrouterApiKey: str('OPENROUTER_API_KEY', ''),
    openrouterModel: str('OPENROUTER_MODEL', 'deepseek/deepseek-chat'),
    localBaseUrl: str('LOCAL_AI_BASE_URL', 'http://localhost:11434/v1'),
    localModel: str('LOCAL_AI_MODEL', 'qwen3:8b'),
  },
}
