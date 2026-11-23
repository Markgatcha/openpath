import { Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GRAPHICS_LABELS,
  GRAPHICS_PREFERENCES,
  setGraphicsPreference,
  useGraphicsQuality,
  type GraphicsPreference,
} from '@/lib/graphics'

/** Per-device graphics quality picker shared by Settings, the Model Lab and canvas games. */
export function GraphicsQualitySelect({
  variant = 'field',
  className,
}: {
  /** `overlay` sits on top of a dark canvas; `field` matches form inputs. */
  variant?: 'field' | 'overlay'
  className?: string
}) {
  const { preference, tier } = useGraphicsQuality()
  return (
    <label
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold',
        variant === 'overlay'
          ? 'h-9 rounded-xl border border-white/15 bg-ink-900/70 px-2 text-slate-200 backdrop-blur focus-within:ring-2 focus-within:ring-cyan-300'
          : 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
        className,
      )}
      title={GRAPHICS_LABELS[preference].hint}
    >
      <Gauge size={14} aria-hidden />
      <span className="sr-only">Graphics quality</span>
      <select
        value={preference}
        onChange={(event) => setGraphicsPreference(event.target.value as GraphicsPreference)}
        className="cursor-pointer bg-transparent outline-none [&>option]:text-slate-900"
      >
        {GRAPHICS_PREFERENCES.map((option) => (
          <option key={option} value={option}>
            {option === 'auto'
              ? `Auto (${GRAPHICS_LABELS[tier].label})`
              : GRAPHICS_LABELS[option].label}
          </option>
        ))}
      </select>
    </label>
  )
}
