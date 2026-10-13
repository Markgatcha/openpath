import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BrainCircuit,
  Check,
  KeyRound,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
  UserCog,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth, useTheme } from '@/store/auth'
import {
  Avatar,
  Button,
  Card,
  Chip,
  CopyCode,
  Field,
  Input,
  Select,
  Spinner,
  useToast,
} from '@/components/ui'
import { NameplateBadge, StyledName } from '@/components/Cosmetics'
import { cn } from '@/lib/utils'
import { AVATAR_COLORS } from '@shared/game'
import {
  CATEGORY_LABELS,
  DIRECTION_LABELS,
  GRADIENT_DIRECTIONS,
  paintToCss,
  type Cosmetics,
  type GradientDirection,
} from '@shared/economy'
import type { ShopItemDTO } from '@shared/types'

export function Settings() {
  const { user, setUser, logout } = useAuth()
  const [theme, toggleTheme] = useTheme()
  const toast = useToast()

  const [name, setName] = useState(user?.name ?? '')
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0])
  const [dailyGoal, setDailyGoal] = useState(user?.dailyGoalMinutes ?? 20)
  const [savingProfile, setSavingProfile] = useState(false)

  const [ai, setAi] = useState({
    provider: 'local' as 'openrouter' | 'local',
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen3:8b',
    apiKey: '',
  })
  const [savingAi, setSavingAi] = useState(false)
  const [aiSourceKey, setAiSourceKey] = useState<string | null>(null)

  const { data: aiStatus, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-status'],
    queryFn: api.ai.status,
  })

  // Adopt server-side AI settings into the form the first time they load
  // (React's sanctioned "adjust state during render" pattern — once).
  const status = aiStatus?.status ?? null
  const sourceKey = status
    ? `${status.provider}|${status.baseUrl}|${status.model}`
    : null
  if (sourceKey && sourceKey !== aiSourceKey && status) {
    const incoming = status
    setAiSourceKey(sourceKey)
    setAi((current) => ({
      ...current,
      provider: incoming.provider,
      baseUrl: incoming.baseUrl,
      model: incoming.model,
    }))
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const result = await api.updateProfile({ name, avatarColor, dailyGoalMinutes: dailyGoal })
      setUser(result.user)
      toast('Profile updated.', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const saveAi = async () => {
    setSavingAi(true)
    try {
      await api.ai.settings({
        provider: ai.provider,
        baseUrl: ai.baseUrl,
        model: ai.model,
        apiKey: ai.apiKey || undefined,
      })
      setAi((current) => ({ ...current, apiKey: '' }))
      toast('AI provider settings saved.', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSavingAi(false)
    }
  }

  if (!user) return null

  const isTeacher = user.role === 'teacher'

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your account, your look, your AI.
        </p>
      </div>

      {/* Profile */}
      <Card className="flex flex-col gap-5 p-6">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <UserCog size={15} /> Profile
        </h2>

        <div className="flex items-center gap-4">
          <Avatar name={name || user.name} color={avatarColor} size="lg" />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{user.email}</p>
            <Chip color="brand" className="mt-1 capitalize">
              {user.role}
            </Chip>
          </div>
        </div>

        <Field label="Display name">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>

        <div>
          <span className="label">Avatar colour</span>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setAvatarColor(color)}
                className={cn(
                  'h-8 w-8 rounded-full transition',
                  avatarColor === color
                    ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-ink-900'
                    : 'hover:scale-110',
                )}
                style={{ backgroundColor: color }}
                aria-label={`Pick color ${color}`}
              />
            ))}
          </div>
        </div>

        {user.role === 'student' && (
          <Field
            label="Daily learning goal (minutes)"
            hint="Used by the dashboard ring and parent reports"
          >
            <Input
              type="number"
              min={5}
              max={240}
              value={dailyGoal}
              onChange={(event) => setDailyGoal(Number(event.target.value))}
            />
          </Field>
        )}

        {/* Link code (students) */}
        {user.role === 'student' && user.linkCode && (
          <div className="rounded-xl bg-brand-500/10 p-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Your parent link code
            </p>
            <p className="mt-1 mb-3 text-xs text-slate-500 dark:text-slate-400">
              Share this with a parent or educator so they can follow your
              progress. They see summaries only — never your answers.
            </p>
            <CopyCode code={user.linkCode} />
          </div>
        )}

        <Button className="self-start" loading={savingProfile} onClick={saveProfile}>
          <Save size={15} /> Save profile
        </Button>
      </Card>

      {/* Appearance */}
      <Card className="flex items-center justify-between p-6">
        <div>
          <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Palette size={15} /> Theme
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Currently using the {theme} theme.
          </p>
        </div>
        <Button variant="ghost" onClick={toggleTheme}>
          <RefreshCw size={15} /> Switch to {theme === 'dark' ? 'light' : 'dark'}
        </Button>
      </Card>

      {/* Purchased look */}
      {user.role === 'student' && <LookEditor />}

      {/* AI providers */}
      <Card className="flex flex-col gap-5 p-6">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <BrainCircuit size={15} /> AI question forge
        </h2>

        {aiLoading ? (
          <Spinner className="h-6 w-6" />
        ) : (
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold',
              aiStatus?.status.configured
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                aiStatus?.status.configured ? 'bg-emerald-500' : 'bg-amber-500',
              )}
            />
            {aiStatus?.status.configured
              ? `Connected via ${aiStatus.status.source === 'app-settings' ? 'app settings' : '.env'} — ${aiStatus.status.provider} · ${aiStatus.status.model}`
              : aiStatus?.status.provider === 'openrouter'
                ? 'OpenRouter selected but no API key set'
                : 'Local model selected — make sure your server is running'}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {([
            {
              id: 'openrouter' as const,
              title: 'OpenRouter',
              desc: 'Hosted models via one key — openrouter.ai/keys',
            },
            {
              id: 'local' as const,
              title: 'Local model',
              desc: 'Ollama or llama.cpp — fully offline, no key',
            },
          ]).map((option) => (
            <button
              key={option.id}
              disabled={!isTeacher}
              onClick={() =>
                setAi((current) => ({
                  ...current,
                  provider: option.id,
                  baseUrl:
                    option.id === 'local'
                      ? 'http://localhost:11434/v1'
                      : 'https://openrouter.ai/api/v1',
                  model:
                    option.id === 'local'
                      ? 'qwen3:8b'
                      : 'deepseek/deepseek-chat',
                }))
              }
              className={cn(
                'rounded-xl border p-4 text-left transition disabled:opacity-50',
                ai.provider === option.id
                  ? 'border-brand-500 bg-brand-500/5'
                  : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20',
              )}
            >
              <p className="font-display text-sm font-bold text-slate-900 dark:text-white">
                {option.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {option.desc}
              </p>
            </button>
          ))}
        </div>

        {!isTeacher && (
          <p className="text-xs text-slate-400">
            Only teachers can change AI settings.
          </p>
        )}

        {isTeacher && (
          <>
            <Field label="Base URL">
              <Input
                value={ai.baseUrl}
                onChange={(event) =>
                  setAi((current) => ({ ...current, baseUrl: event.target.value }))
                }
                placeholder="http://localhost:11434/v1"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Model">
                <Input
                  value={ai.model}
                  onChange={(event) =>
                    setAi((current) => ({ ...current, model: event.target.value }))
                  }
                  placeholder="qwen3:8b"
                />
              </Field>
              <Field
                label={ai.provider === 'openrouter' ? 'API key' : 'API key (optional)'}
                hint="Stored locally in SQLite — never committed"
              >
                <div className="relative">
                  <KeyRound
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    type="password"
                    className="pl-9"
                    value={ai.apiKey}
                    onChange={(event) =>
                      setAi((current) => ({ ...current, apiKey: event.target.value }))
                    }
                    placeholder={ai.provider === 'local' ? 'sk-or-… (not needed)' : 'sk-or-…'}
                  />
                </div>
              </Field>
            </div>
            <Button className="self-start" loading={savingAi} onClick={saveAi}>
              <Check size={15} /> Save AI settings
            </Button>
          </>
        )}
      </Card>

      {/* Danger zone */}
      <Card className="flex items-center justify-between border-rose-500/30 p-6">
        <div>
          <h2 className="font-display text-sm font-bold text-rose-500">Session</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Log out of OpenPath on this device.
          </p>
        </div>
        <Button variant="danger" onClick={logout}>
          Log out
        </Button>
      </Card>
    </div>
  )
}

// ── Purchased look ─────────────────────────────────────────────
function LookEditor() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const { data } = useQuery({ queryKey: ['shop'], queryFn: api.economy.shop })

  const owned = (data?.items ?? []).filter((item) => item.owned)
  const cosmetics = user?.cosmetics

  const equip = async (itemId: string) => {
    try {
      const result = await api.economy.equip(itemId)
      setUser({ ...user!, cosmetics: result.cosmetics })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not equip', 'error')
    }
  }

  const unequip = async (
    category: 'background' | 'name-style' | 'nameplate' | 'font',
  ) => {
    try {
      const result = await api.economy.unequip(category)
      setUser({ ...user!, cosmetics: result.cosmetics })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not reset', 'error')
    }
  }

  // Students can re-aim a gradient they own without buying anything new.
  const setDirection = async (
    slot: 'background' | 'nameStyle',
    direction: GradientDirection,
  ) => {
    if (!cosmetics) return
    const current = cosmetics[slot]
    if (current.type !== 'gradient') return
    try {
      const next: Cosmetics = {
        ...cosmetics,
        [slot]: { ...current, direction },
      }
      const result = await api.updateProfile({ cosmetics: next })
      setUser({ ...user!, cosmetics: result.user.cosmetics })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update', 'error')
    }
  }

  if (!cosmetics) return null

  const gradientSlots: { slot: 'background' | 'nameStyle'; label: string }[] = [
    { slot: 'background', label: 'Background flow' },
    { slot: 'nameStyle', label: 'Name flow' },
  ]

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div>
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Sparkles size={15} /> Your look
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Everything you bought in the reward shop, worn exactly how you like
          it. Grab more in the{' '}
          <Link to="/student/shop" className="font-semibold text-brand-500">
            shop
          </Link>
          .
        </p>
      </div>

      {/* Live preview */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 p-4 dark:border-white/5">
        <NameplateBadge nameplate={cosmetics.nameplate}>
          <StyledName
            name={user?.name ?? 'You'}
            paint={cosmetics.nameStyle}
            font={cosmetics.font}
            className="text-lg font-extrabold"
          />
        </NameplateBadge>
        <span className="text-xs text-slate-400">leaderboard preview</span>
      </div>

      {(['background', 'name-style', 'nameplate', 'font'] as const).map(
        (category) => {
          const options = owned.filter((item) => item.category === category)
          const isEquipped = (item: ShopItemDTO): boolean => {
            if (category === 'background') {
              return (
                JSON.stringify(cosmetics.background) ===
                JSON.stringify(item.itemData)
              )
            }
            if (category === 'name-style') {
              return (
                JSON.stringify(cosmetics.nameStyle) ===
                JSON.stringify(item.itemData)
              )
            }
            if (category === 'nameplate') {
              return (
                JSON.stringify(cosmetics.nameplate) ===
                JSON.stringify(item.itemData)
              )
            }
            return cosmetics.font === (item.itemData as { font: string }).font
          }
          return (
            <div key={category}>
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">{CATEGORY_LABELS[category]}</span>
                {options.length > 0 && (
                  <button
                    onClick={() => void unequip(category)}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-500"
                  >
                    reset
                  </button>
                )}
              </div>
              {options.length === 0 ? (
                <p className="text-xs text-slate-400">Nothing owned here yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {options.map((item) => {
                    const active = isEquipped(item)
                    const data = item.itemData as Record<string, unknown>
                    const swatch =
                      data.type === 'solid' || data.type === 'gradient'
                        ? paintToCss(data as never)
                        : undefined
                    return (
                      <button
                        key={item.id}
                        onClick={() => void equip(item.id)}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                          active
                            ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300',
                        )}
                      >
                        {swatch && (
                          <span
                            className="h-5 w-5 rounded-md border border-black/10"
                            style={{ background: swatch }}
                          />
                        )}
                        {item.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        },
      )}

      {/* Gradient direction overrides */}
      {gradientSlots.map(({ slot, label }) => {
        const paint = cosmetics[slot]
        if (paint.type !== 'gradient') return null
        return (
          <Field key={slot} label={label}>
            <Select
              value={paint.direction}
              onChange={(event) =>
                void setDirection(slot, event.target.value as GradientDirection)
              }
            >
              {GRADIENT_DIRECTIONS.map((direction) => (
                <option key={direction} value={direction}>
                  {DIRECTION_LABELS[direction]}
                </option>
              ))}
            </Select>
          </Field>
        )
      })}
    </Card>
  )
}
