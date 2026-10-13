import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, Coins, ShoppingBag, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Button, Chip, Spinner, useToast } from '@/components/ui'
import { EmptyState } from '@/components/ui'
import { CATEGORY_LABELS, paintToCss, type Paint } from '@shared/economy'
import type { ShopItemDTO } from '@shared/types'

const CATEGORY_ORDER = ['background', 'nameplate', 'name-style', 'font'] as const

export function Shop() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { user, setUser } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['shop'],
    queryFn: api.economy.shop,
  })

  const buy = async (item: ShopItemDTO) => {
    try {
      const result = await api.economy.buy(item.id)
      setUser({ ...user!, coins: result.coins, cosmetics: result.cosmetics })
      await queryClient.invalidateQueries({ queryKey: ['shop'] })
      toast(`Bought ${item.name} — and it is equipped!`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Purchase failed', 'error')
    }
  }

  const equip = async (item: ShopItemDTO) => {
    try {
      const result = await api.economy.equip(item.id)
      setUser({ ...user!, cosmetics: result.cosmetics })
      toast(`${item.name} equipped.`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not equip', 'error')
    }
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Reward shop
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Spend hard-earned coins on backgrounds, nameplates, name colours,
            and fonts. Buy once, wear forever.
          </p>
        </div>
        <Chip color="brand" className="px-4 py-2 text-base">
          <Coins size={16} /> {data.coins} coins
        </Chip>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title="The shelves are empty"
          description="Your teacher has not stocked the shop yet — finish quizzes to bank coins for when they do."
        />
      ) : (
        CATEGORY_ORDER.map((category) => {
          const group = items.filter((item) => item.category === category)
          if (group.length === 0) return null
          return (
            <section key={category} className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((item) => {
                  const affordable = data.coins >= item.price
                  return (
                    <motion.div key={item.id} layout className="card flex flex-col gap-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </h3>
                        {item.owned && <Chip color="emerald">owned</Chip>}
                      </div>

                      <ItemThumb item={item} />

                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {item.description || 'No description.'}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-display text-lg font-extrabold text-gold-500">
                          <Coins size={16} /> {item.price}
                        </span>
                        {item.owned ? (
                          <Button variant="ghost" onClick={() => void equip(item)}>
                            <Sparkles size={15} /> Equip
                          </Button>
                        ) : (
                          <Button
                            disabled={!affordable}
                            onClick={() => void buy(item)}
                          >
                            <ShoppingBag size={15} />
                            {affordable ? 'Buy' : 'Too pricey'}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}

function ItemThumb({ item }: { item: ShopItemDTO }) {
  const data = item.itemData as Record<string, unknown>
  if (item.category === 'font') {
    return (
      <div className="grid h-20 place-items-center rounded-xl border border-slate-200 bg-white text-2xl font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        Aa
      </div>
    )
  }
  if (data.type === 'image') {
    return (
      <img
        src={data.image as string}
        alt=""
        className="h-20 w-full rounded-xl border border-slate-200 object-cover dark:border-white/10"
      />
    )
  }
  const paint =
    data.type === 'solid' || data.type === 'gradient'
      ? (data as unknown as Paint)
      : null
  const background = paint ? paintToCss(paint) : undefined
  return (
    <div
      className="grid h-20 place-items-center rounded-xl border border-slate-200 dark:border-white/10"
      style={background ? { background } : undefined}
    >
      {item.category === 'nameplate' && paint && (
        <span
          className="rounded-full px-4 py-1 text-sm font-bold text-white"
          style={
            paint.type === 'gradient'
              ? { backgroundImage: paintToCss(paint) }
              : { backgroundColor: paint.color }
          }
        >
          Name
        </span>
      )}
      {item.category === 'name-style' && paint && (
        <span
          className="text-lg font-extrabold"
          style={
            paint.type === 'gradient'
              ? {
                  backgroundImage: paintToCss(paint),
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }
              : { color: paint.color }
          }
        >
          Name
        </span>
      )}
      {item.category === 'background' && <Check size={22} className="text-white/80" />}
    </div>
  )
}
