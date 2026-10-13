import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Coins,
  Gift,
  Pencil,
  Plus,
  Save,
  Store,
  Trash2,
} from 'lucide-react'
import { api } from '@/lib/api'
import {
  Button,
  Card,
  Chip,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
  Toggle,
  useToast,
} from '@/components/ui'
import {
  CATEGORY_LABELS,
  FONT_CATALOG,
  KIND_LABELS,
  KIND_MULTIPLIER,
  QUIZ_KINDS,
  type GradientDirection,
} from '@shared/economy'
import type { ShopItemDTO } from '@shared/types'

const DIRECTIONS: GradientDirection[] = [
  'south-north',
  'north-south',
  'west-east',
  'east-west',
  'diagonal',
]

const DIRECTION_LABELS: Record<GradientDirection, string> = {
  'south-north': 'South → North',
  'north-south': 'North → South',
  'west-east': 'West → East',
  'east-west': 'East → West',
  diagonal: 'Diagonal',
}

const MAX_IMAGE_BYTES = 300_000

export function Economy() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['economy'],
    queryFn: api.economy.mine,
  })
  const [editing, setEditing] = useState<ShopItemDTO | 'new' | null>(null)

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['economy'] })
  }

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const items = data.items

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          Classroom economy
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Your currency, your prices, your rewards. Students earn coins from
          points on graded work and spend them in the shop you curate.
        </p>
      </div>

      <CurrencyCard
        economy={data.economy}
        onSaved={() => {
          invalidate()
          toast('Economy settings saved.', 'success')
        }}
      />

      <LevelRewardsCard
        rewards={data.rewards}
        items={items}
        onSaved={() => {
          invalidate()
          toast('Level rewards saved.', 'success')
        }}
      />

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
              <Store size={17} className="text-brand-500" /> Shop items
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              What students can buy — backgrounds, nameplates, name colours,
              and fonts. Image nameplates are uploaded as data URLs and stay
              in your local database.
            </p>
          </div>
          <Button onClick={() => setEditing('new')}>
            <Plus size={16} /> New item
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="rounded-xl bg-slate-500/5 p-6 text-center text-sm text-slate-400">
            No items yet — create your first shop item above.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/5"
              >
                <ItemPreview item={item} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                    {item.name}
                    {!item.active && (
                      <span className="ml-2 text-xs font-medium text-slate-400">
                        (hidden)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {CATEGORY_LABELS[item.category]} · {item.purchaseCount} sold
                  </p>
                </div>
                <Chip color={item.active ? 'emerald' : 'slate'}>
                  {item.price} {data.economy.currencyIcon}
                </Chip>
                <Toggle
                  checked={item.active}
                  onChange={async (next) => {
                    await api.economy.updateItem(item.id, { active: next })
                    invalidate()
                  }}
                  label={item.active ? 'Listed' : 'Hidden'}
                />
                <button
                  onClick={() => setEditing(item)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-white"
                  aria-label="Edit item"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete “${item.name}”? Owners keep what they bought.`)) return
                    await api.economy.removeItem(item.id)
                    invalidate()
                    toast('Item deleted.', 'info')
                  }}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                  aria-label="Delete item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editing && (
        <ItemModal
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            invalidate()
          }}
        />
      )}
    </div>
  )
}

// ── Currency settings ──────────────────────────────────────────
function CurrencyCard({
  economy,
  onSaved,
}: {
  economy: { currencyName: string; currencyIcon: string; pointsPerCoin: number }
  onSaved: () => void
}) {
  const [form, setForm] = useState(economy)
  const [saving, setSaving] = useState(false)
  const dirty =
    form.currencyName !== economy.currencyName ||
    form.currencyIcon !== economy.currencyIcon ||
    form.pointsPerCoin !== economy.pointsPerCoin

  const save = async () => {
    setSaving(true)
    try {
      await api.economy.saveSettings(form)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
          <Coins size={17} className="text-gold-500" /> Currency
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          What your coins are called, and how many points make one. Changing
          the rate only affects future earnings.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Currency name">
          <Input
            value={form.currencyName}
            maxLength={40}
            onChange={(event) => setForm({ ...form, currencyName: event.target.value })}
            placeholder="Coins"
          />
        </Field>
        <Field label="Icon (emoji)">
          <Input
            value={form.currencyIcon}
            maxLength={8}
            onChange={(event) => setForm({ ...form, currencyIcon: event.target.value })}
            placeholder="🪙"
          />
        </Field>
        <Field label="Points per coin">
          <Input
            type="number"
            min={1}
            max={1000}
            value={form.pointsPerCoin}
            onChange={(event) =>
              setForm({ ...form, pointsPerCoin: Number(event.target.value) || 1 })
            }
          />
        </Field>
      </div>

      <div className="rounded-xl bg-slate-500/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Earning rates by work type
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUIZ_KINDS.map((kind) => (
            <div
              key={kind}
              className="rounded-lg bg-white/60 px-3 py-2 text-center dark:bg-white/5"
            >
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {KIND_LABELS[kind]}
              </p>
              <p className="font-display text-lg font-extrabold text-brand-500">
                ×{KIND_MULTIPLIER[kind]}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          A finished run pays{' '}
          <span className="font-semibold">
            points × multiplier ÷ {form.pointsPerCoin}
          </span>{' '}
          coins. Tests pay double — stakes matter.
        </p>
      </div>

      <Button className="self-start" loading={saving} disabled={!dirty} onClick={save}>
        <Save size={15} /> Save currency
      </Button>
    </Card>
  )
}

// ── Level rewards ──────────────────────────────────────────────
interface RewardRow {
  id: string
  level: number
  rewardType: 'coins' | 'item'
  coins: number
  itemId: string | null
  itemName: string | null
}

function LevelRewardsCard({
  rewards,
  items,
  onSaved,
}: {
  rewards: RewardRow[]
  items: ShopItemDTO[]
  onSaved: () => void
}) {
  const [rows, setRows] = useState<RewardRow[]>(rewards)
  const [saving, setSaving] = useState(false)

  const update = (index: number, patch: Partial<RewardRow>) => {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.economy.saveRewards({
        rewards: rows.map((row) => ({
          level: row.level,
          rewardType: row.rewardType,
          coins: row.coins,
          itemId: row.itemId,
        })),
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
          <Gift size={17} className="text-brand-500" /> Level rewards
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Granted automatically the first time a student reaches each level —
          coins straight to their wallet, or one of your shop items free.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No level rewards configured yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 p-3 dark:border-white/5"
            >
              <Chip color="brand">Lv {row.level}</Chip>
              <Select
                value={row.rewardType}
                onChange={(event) =>
                  update(index, { rewardType: event.target.value as 'coins' | 'item' })
                }
                className="max-w-36"
              >
                <option value="coins">Coins</option>
                <option value="item">Shop item</option>
              </Select>
              {row.rewardType === 'coins' ? (
                <Input
                  type="number"
                  min={1}
                  className="max-w-28"
                  value={row.coins}
                  onChange={(event) =>
                    update(index, { coins: Number(event.target.value) || 0 })
                  }
                />
              ) : (
                <Select
                  value={row.itemId ?? ''}
                  onChange={(event) => update(index, { itemId: event.target.value || null })}
                  className="max-w-56"
                >
                  <option value="">Pick an item…</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              )}
              <button
                onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                aria-label="Remove reward"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          onClick={() =>
            setRows((current) => [
              ...current,
              {
                id: `new-${current.length}-${Date.now()}`,
                level: (current.at(-1)?.level ?? 1) + 1,
                rewardType: 'coins' as const,
                coins: 25,
                itemId: null,
                itemName: null,
              },
            ])
          }
        >
          <Plus size={15} /> Add level
        </Button>
        <Button loading={saving} onClick={save}>
          <Save size={15} /> Save rewards
        </Button>
      </div>
    </Card>
  )
}

// ── Item create / edit modal ───────────────────────────────────
interface ItemForm {
  name: string
  description: string
  category: 'background' | 'nameplate' | 'name-style' | 'font'
  price: string
  paintKind: 'solid' | 'gradient' | 'image'
  color: string
  from: string
  to: string
  direction: GradientDirection
  image: string
  font: string
}

function ItemModal({
  item,
  onClose,
  onSaved,
}: {
  item: ShopItemDTO | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const initial = useMemo<ItemForm>(() => {
    const data = (item?.itemData ?? {}) as Record<string, unknown>
    return {
      name: item?.name ?? '',
      description: item?.description ?? '',
      category: item?.category ?? 'background',
      price: String(item?.price ?? 30),
      paintKind: (data.type as ItemForm['paintKind']) ?? 'solid',
      color: (data.color as string) ?? '#8b5cf6',
      from: (data.from as string) ?? '#f59e0b',
      to: (data.to as string) ?? '#8b5cf6',
      direction: (data.direction as GradientDirection) ?? 'north-south',
      image: (data.image as string) ?? '',
      font: (data.font as string) ?? FONT_CATALOG[0].id,
    }
  }, [item])
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  const itemData = (): Record<string, unknown> => {
    if (form.category === 'font') return { font: form.font }
    if (form.paintKind === 'image') return { type: 'image', image: form.image }
    if (form.paintKind === 'gradient') {
      return { type: 'gradient', from: form.from, to: form.to, direction: form.direction }
    }
    return { type: 'solid', color: form.color }
  }

  const submit = async () => {
    if (form.name.trim().length < 2) {
      toast('Give the item a name.', 'error')
      return
    }
    if (form.category !== 'font' && form.paintKind === 'image' && !form.image) {
      toast('Upload an image for this nameplate.', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price) || 0,
        itemData: itemData() as never,
      }
      if (item) {
        await api.economy.updateItem(item.id, payload)
      } else {
        await api.economy.createItem(payload)
      }
      toast(item ? 'Item updated.' : 'Item added to the shop.', 'success')
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save item', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showPaint = form.category !== 'font'
  const allowImage = form.category === 'nameplate'

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? 'Edit shop item' : 'New shop item'}
      className="max-w-lg"
    >
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input
              value={form.name}
              maxLength={80}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Sunset Climb"
            />
          </Field>
          <Field label="Price (coins)">
            <Input
              type="number"
              min={0}
              max={100000}
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </Field>
        </div>

        <Field label="Category">
          <Select
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value as ItemForm['category'] })
            }
          >
            {(Object.keys(CATEGORY_LABELS) as ItemForm['category'][]).map((key) => (
              <option key={key} value={key}>
                {CATEGORY_LABELS[key]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Description">
          <Textarea
            rows={2}
            value={form.description}
            maxLength={300}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="A calm, deep indigo background for long sessions."
          />
        </Field>

        {showPaint && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              {(allowImage
                ? (['solid', 'gradient', 'image'] as const)
                : (['solid', 'gradient'] as const)
              ).map((kind) => (
                <Button
                  key={kind}
                  variant={form.paintKind === kind ? 'primary' : 'ghost'}
                  onClick={() => setForm({ ...form, paintKind: kind })}
                >
                  {kind === 'solid' ? 'Solid' : kind === 'gradient' ? 'Gradient' : 'Image'}
                </Button>
              ))}
            </div>

            {form.paintKind === 'solid' && (
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="color"
                  value={form.color}
                  onChange={(event) => setForm({ ...form, color: event.target.value })}
                  className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200 dark:border-white/10"
                />
                <span className="font-mono text-xs text-slate-500">{form.color}</span>
              </label>
            )}

            {form.paintKind === 'gradient' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="color"
                      value={form.from}
                      onChange={(event) => setForm({ ...form, from: event.target.value })}
                      className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200 dark:border-white/10"
                    />
                    <span className="font-mono text-xs text-slate-500">{form.from}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="color"
                      value={form.to}
                      onChange={(event) => setForm({ ...form, to: event.target.value })}
                      className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200 dark:border-white/10"
                    />
                    <span className="font-mono text-xs text-slate-500">{form.to}</span>
                  </label>
                </div>
                <Field label="Direction">
                  <Select
                    value={form.direction}
                    onChange={(event) =>
                      setForm({ ...form, direction: event.target.value as GradientDirection })
                    }
                  >
                    {DIRECTIONS.map((direction) => (
                      <option key={direction} value={direction}>
                        {DIRECTION_LABELS[direction]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div
                  className="h-10 rounded-lg border border-slate-200 dark:border-white/10"
                  style={{
                    backgroundImage: `linear-gradient(${
                      form.direction === 'south-north'
                        ? '0deg'
                        : form.direction === 'north-south'
                          ? '180deg'
                          : form.direction === 'west-east'
                            ? '90deg'
                            : form.direction === 'east-west'
                              ? '270deg'
                              : '135deg'
                    }, ${form.from}, ${form.to})`,
                  }}
                />
              </div>
            )}

            {form.paintKind === 'image' && (
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    if (file.size > MAX_IMAGE_BYTES) {
                      toast('Images must be under 300 KB.', 'error')
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = () =>
                      setForm({
                        ...form,
                        image: typeof reader.result === 'string' ? reader.result : '',
                      })
                    reader.readAsDataURL(file)
                  }}
                  className="text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-600 dark:file:text-brand-300"
                />
                {form.image && (
                  <img
                    src={form.image}
                    alt="Nameplate preview"
                    className="h-14 w-full rounded-lg border border-slate-200 object-cover dark:border-white/10"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {form.category === 'font' && (
          <Field label="Font" hint="System fonts only — no web downloads, privacy intact">
            <Select
              value={form.font}
              onChange={(event) => setForm({ ...form, font: event.target.value })}
            >
              {FONT_CATALOG.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Button className="w-full" loading={saving} onClick={submit}>
          <Save size={16} /> {item ? 'Save changes' : 'Add to shop'}
        </Button>
      </div>
    </Modal>
  )
}

// ── Tiny previews for the item list ────────────────────────────
function gradientAngle(direction: unknown): string {
  if (direction === 'south-north') return '0deg'
  if (direction === 'north-south') return '180deg'
  if (direction === 'west-east') return '90deg'
  if (direction === 'east-west') return '270deg'
  return '135deg'
}

function ItemPreview({ item }: { item: ShopItemDTO }) {
  const data = item.itemData as Record<string, unknown>
  if (item.category === 'font') {
    return (
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-500/10 text-lg font-bold text-slate-500"
        style={{
          fontFamily: FONT_CATALOG.find((font) => font.id === data.font)?.stack,
        }}
      >
        Aa
      </span>
    )
  }
  if (data.type === 'image') {
    return (
      <img
        src={data.image as string}
        alt=""
        className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-white/10"
      />
    )
  }
  const background =
    data.type === 'gradient'
      ? `linear-gradient(${gradientAngle(data.direction)}, ${String(data.from)}, ${String(data.to)})`
      : String(data.color)
  return (
    <span
      className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 dark:border-white/10"
      style={{ background }}
    />
  )
}
