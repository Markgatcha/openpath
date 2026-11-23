import { Suspense, useMemo } from 'react'
import { Box } from 'lucide-react'
import { cn } from '@/lib/utils'
import { findLabModel } from './catalog'
import {
  ModelRuntimeContext,
  type ModelHotspotInfo,
  type ModelRuntimeConfig,
  type Readout,
} from './shared-types'

export type { ModelHotspotInfo, ModelRuntimeConfig, Readout }

/** Converts `Readout[]` from `onReadoutSnapshot` into a keyed map for `evaluateModelChallenge`. */
export function readoutRecord(readouts: Readout[]): Record<string, string | number> {
  const map: Record<string, string | number> = {}
  for (const item of readouts) {
    map[item.label] = item.value
  }
  return map
}

export interface ModelEmbedProps extends ModelRuntimeConfig {
  /** Model ID from `LAB_MODELS` (2D or 3D). */
  modelId: string
  className?: string
}

/**
 * Zero-three embeddable wrapper for any interactive 2D or 3D lab model.
 * Lazily loads the target preset bundle chunk (isolating `three-vendor`
 * strictly to 3D models) and passes runtime constraints/hooks through
 * `ModelRuntimeContext`.
 *
 * Defaults `compact` to `true` so inline lesson/question embeds fit cleanly;
 * pass `compact={false}` for full viewport sizing.
 */
export function ModelEmbed({
  modelId,
  className,
  initialParams,
  lockedParams,
  highlightHotspots,
  hideLabels,
  compact = true,
  challengeId,
  defaultTab,
  onChallengeSolved,
  onHotspotSelect,
  onReadoutSnapshot,
}: ModelEmbedProps) {
  const entry = findLabModel(modelId)

  const runtime = useMemo<ModelRuntimeConfig>(
    () => ({
      initialParams,
      lockedParams,
      highlightHotspots,
      hideLabels,
      compact,
      challengeId,
      defaultTab,
      onChallengeSolved,
      onHotspotSelect,
      onReadoutSnapshot,
    }),
    [
      initialParams,
      lockedParams,
      highlightHotspots,
      hideLabels,
      compact,
      challengeId,
      defaultTab,
      onChallengeSolved,
      onHotspotSelect,
      onReadoutSnapshot,
    ],
  )

  if (!entry) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
          className,
        )}
      >
        <Box size={16} className="shrink-0 text-slate-400" aria-hidden />
        <span>Interactive simulation &ldquo;{modelId}&rdquo; could not be found.</span>
      </div>
    )
  }

  const Component = entry.Component

  return (
    <div className={cn('w-full', className)}>
      <ModelRuntimeContext.Provider value={runtime}>
        <Suspense
          fallback={
            <div
              className={cn(
                'grid place-items-center rounded-2xl border border-slate-200 bg-ink-900/60 text-xs text-slate-400 dark:border-white/10',
                compact ? 'h-[300px]' : 'h-[420px]',
              )}
              aria-busy="true"
            >
              Loading {entry.title}…
            </div>
          }
        >
          <Component key={entry.id} />
        </Suspense>
      </ModelRuntimeContext.Provider>
    </div>
  )
}
