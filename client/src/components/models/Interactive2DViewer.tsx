import { createFrameLimiter, useGraphicsQuality } from '@/lib/graphics'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isTypingTarget, usePrefersReducedMotion } from '@/lib/a11y'
import {
  type Action2D,
  type DragHandle2D,
  type Hotspot2D,
  type Model2DDefinition,
  type Params,
  type Readout,
  type Scene2DInstance,
  makeScene2DQuality,
} from './engine2d'
import {
  isParamLocked,
  mergeInitialParams,
  useModelRuntime,
  type ModelRuntimeConfig,
} from './shared-types'
import { ChallengeDrawer, ParamControl } from './ChallengeDrawer'
import { GraphicsQualitySelect } from '@/components/GraphicsQualitySelect'

export type Interactive2DViewerProps = {
  model: Model2DDefinition
} & ModelRuntimeConfig

/**
 * Unified 2D simulation viewer combining a crisp HiDPI HTML5 Canvas
 * layer (60fps animation/curves/particles) and an aligned SVG overlay
 * layer (diagrams, interactive callouts, and accessible drag handles).
 * Zero `three` imports so 2D lessons/labs load with tiny bundle cost.
 */
export function Interactive2DViewer({ model, ...directConfig }: Interactive2DViewerProps) {
  const ctxConfig = useModelRuntime()
  const urlConfig = useMemo<ModelRuntimeConfig>(() => {
    if (typeof window === 'undefined') return {}
    const search = new URLSearchParams(window.location.search)
    const rawParams = search.get('params')
    const challengeId = search.get('challenge') ?? undefined
    let parsedParams: Record<string, number | boolean> | undefined
    if (rawParams) {
      try {
        const candidate = JSON.parse(rawParams) as unknown
        if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
          parsedParams = candidate as Record<string, number | boolean>
        }
      } catch {
        // Ignore malformed query params.
      }
    }
    return { initialParams: parsedParams, challengeId }
  }, [])

  const config = useMemo<ModelRuntimeConfig>(
    () => ({ ...urlConfig, ...ctxConfig, ...directConfig }),
    // Merge direct props over context over URL search defaults.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [urlConfig, ctxConfig, directConfig],
  )

  const reducedMotion = usePrefersReducedMotion()
  const { profile } = useGraphicsQuality()
  const viewWidth = model.viewWidth ?? 720
  const viewHeight = model.viewHeight ?? 460
  const initialParamsKey = config.initialParams ? JSON.stringify(config.initialParams) : ''

  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const instanceRef = useRef<Scene2DInstance | null>(null)
  const elapsedRef = useRef(0)

  const baselineParams = useMemo(
    () => mergeInitialParams(model.params, config.initialParams),
    // Rebuild baseline only on model or explicit external override change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, initialParamsKey],
  )

  const paramsRef = useRef<Params>(baselineParams)
  const pausedRef = useRef<boolean>(Boolean(model.initialPaused || reducedMotion))

  const [params, setParams] = useState<Params>(baselineParams)
  const [paused, setPaused] = useState<boolean>(Boolean(model.initialPaused || reducedMotion))
  const [hotspots, setHotspots] = useState<Hotspot2D[]>([])
  const [dragHandles, setDragHandles] = useState<DragHandle2D[]>([])
  const [actions, setActions] = useState<Action2D[]>([])
  const [hasUpdate, setHasUpdate] = useState(false)
  const [hasStep, setHasStep] = useState(false)
  const [active, setActive] = useState<Hotspot2D | null>(null)
  const [readouts, setReadouts] = useState<Readout[]>([])
  const [metrics, setMetrics] = useState<Record<string, number>>({})
  const [phaseLocked, setPhaseLocked] = useState(false)
  const [svgTick, setSvgTick] = useState(0)
  const [mode, setMode] = useState<'explore' | 'challenge'>(
    config.challengeId || config.defaultTab === 'challenge' ? 'challenge' : 'explore',
  )

  const onReadoutSnapshotRef = useRef(config.onReadoutSnapshot)
  onReadoutSnapshotRef.current = config.onReadoutSnapshot
  const onHotspotSelectRef = useRef(config.onHotspotSelect)
  onHotspotSelectRef.current = config.onHotspotSelect

  useEffect(() => {
    paramsRef.current = baselineParams
    setParams(baselineParams)
    setSvgTick((n) => n + 1)
  }, [baselineParams])

  useEffect(() => {
    if (config.challengeId || config.defaultTab === 'challenge') {
      setMode('challenge')
    }
  }, [config.challengeId, config.defaultTab])

  const selectHotspot = useCallback((spot: Hotspot2D | null) => {
    setActive(spot)
    if (spot) {
      onHotspotSelectRef.current?.({
        id: spot.id,
        label: spot.label,
        title: spot.title,
        body: spot.body,
      })
    }
  }, [])

  const syncStats = useCallback(() => {
    const instance = instanceRef.current
    if (!instance) return
    if (instance.readouts) {
      const nextReadouts = instance.readouts(paramsRef.current)
      setReadouts(nextReadouts)
      onReadoutSnapshotRef.current?.(nextReadouts, paramsRef.current)
    }
    if (instance.metrics) {
      setMetrics(instance.metrics(paramsRef.current))
    }
  }, [])

  // Build and drive 2D simulation instance.
  useEffect(() => {
    const initialPauseState = Boolean(model.initialPaused || reducedMotion)
    pausedRef.current = initialPauseState
    setPaused(initialPauseState)
    elapsedRef.current = 0
    setActive(null)

    const instance = model.build(
      {
        viewWidth,
        viewHeight,
        palette: {
          brand: '#818cf8',
          violet: '#a78bfa',
          cyan: '#22d3ee',
          emerald: '#34d399',
          amber: '#fbbf24',
          rose: '#fb7185',
          slate: '#94a3b8',
          white: '#f8fafc',
        },
        quality: makeScene2DQuality(profile),
      },
      paramsRef.current,
    )
    instanceRef.current = instance
    setHotspots(instance.hotspots ?? [])
    setDragHandles(instance.dragHandles ?? [])
    setActions(instance.actions ?? [])
    setHasUpdate(Boolean(instance.update))
    setHasStep(Boolean(model.supportsStep || instance.step))
    syncStats()
    setSvgTick((n) => n + 1)

    let lastTime = performance.now()
    let lastSvgSync = lastTime
    let frame = 0

    const shouldDraw = createFrameLimiter(profile.maxFps)
    const drawFrame = (now: number) => {
      frame = requestAnimationFrame(drawFrame)
      if (!shouldDraw(now)) return
      const rawDt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      const dt = pausedRef.current ? 0 : rawDt
      if (dt > 0) {
        elapsedRef.current += dt
        instance.update?.(paramsRef.current, dt, elapsedRef.current)
      }

      const canvas = canvasRef.current
      if (canvas && instance.renderCanvas) {
        // Never below 1: canvas text and thin curves blur when upscaled.
        const dpr = Math.min(window.devicePixelRatio || 1, Math.max(1, profile.pixelRatioCap))
        const targetW = Math.round(viewWidth * dpr)
        const targetH = Math.round(viewHeight * dpr)
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW
          canvas.height = targetH
        }
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx.clearRect(0, 0, viewWidth, viewHeight)
          instance.renderCanvas(ctx, paramsRef.current, elapsedRef.current, reducedMotion)
        }
      }

      if (dt > 0 && instance.renderSvg && !instance.renderCanvas && now - lastSvgSync > 45) {
        lastSvgSync = now
        setSvgTick((n) => (n + 1) % 1_000_000)
      }
    }

    frame = requestAnimationFrame(drawFrame)

    return () => {
      cancelAnimationFrame(frame)
      instance.dispose?.()
      instanceRef.current = null
    }
  }, [model, viewWidth, viewHeight, reducedMotion, syncStats, profile])

  // Periodic polling for live readouts and POE metrics.
  useEffect(() => {
    const id = window.setInterval(syncStats, 220)
    return () => window.clearInterval(id)
  }, [syncStats])

  // Keyboard shortcuts: Space pauses, Escape closes dialog, 1-9 opens hotspots.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) {
        if (!hasUpdate) return
        event.preventDefault()
        pausedRef.current = !pausedRef.current
        setPaused(pausedRef.current)
      } else if (event.key === 'Escape') {
        selectHotspot(null)
      } else if (event.key >= '1' && event.key <= '9') {
        const visible = hotspots.filter((spot) => spot.visible?.(paramsRef.current) ?? true)
        const picked = visible[Number(event.key) - 1]
        if (picked) {
          event.preventDefault()
          selectHotspot(picked)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasUpdate, hotspots, selectHotspot])

  const applyMergedParams = useCallback(
    (next: Params) => {
      const merged = mergeInitialParams(model.params, { ...paramsRef.current, ...next })
      paramsRef.current = merged
      setParams(merged)
      setSvgTick((n) => n + 1)
      syncStats()
    },
    [model.params, syncStats],
  )

  function setParam(id: string, value: number) {
    applyMergedParams({ [id]: value })
  }

  function togglePause() {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
  }

  function triggerStep(direction: 1 | -1, actionId?: string) {
    const instance = instanceRef.current
    if (!instance?.step) return
    if (!pausedRef.current && hasUpdate && !actionId) {
      pausedRef.current = true
      setPaused(true)
    }
    instance.step(paramsRef.current, direction, actionId)
    setParams({ ...paramsRef.current })
    setSvgTick((n) => n + 1)
    syncStats()
  }

  function resetSimulation() {
    const reset = mergeInitialParams(model.params, config.initialParams)
    paramsRef.current = reset
    setParams(reset)
    elapsedRef.current = 0
    instanceRef.current?.reset?.(reset)
    setSvgTick((n) => n + 1)
    syncStats()
  }

  const controlsLocked = config.lockedParams === true || phaseLocked
  const visibleHotspots = hotspots.filter((spot) => spot.visible?.(params) ?? true)
  const hasChallenges = Boolean(model.challenges && model.challenges.length > 0)
  const effectiveChallenges = model.challenges ?? []
  const isCompact = Boolean(config.compact)
  const hideLabels = Boolean(config.hideLabels)

  // Keep svgTick read cleanly so renderSvg always refreshes when bumped.
  const svgContent = useMemo(
    () => {
      void svgTick
      return instanceRef.current?.renderSvg?.(params, elapsedRef.current) ?? null
    },
    // Re-evaluate declarative SVG whenever params or svgTick advance.
    [params, svgTick],
  )

  return (
    <div
      className={cn(
        'grid gap-4',
        isCompact ? 'lg:grid-cols-[1fr_280px]' : 'lg:grid-cols-[1fr_310px]',
      )}
    >
      <div className="relative">
        <div
          className={cn(
            'relative flex items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-ink-800 to-ink-950 p-2 sm:p-4 dark:border-white/10',
            isCompact ? 'min-h-[300px]' : 'min-h-[380px] lg:min-h-[480px]',
          )}
        >
          {/* Aspect-locked stage so Canvas, SVG, Hotspots & DragHandles share exact coordinates */}
          <div
            ref={stageRef}
            className="relative w-full max-w-full overflow-hidden rounded-xl"
            style={{ aspectRatio: `${viewWidth} / ${viewHeight}`, maxHeight: isCompact ? '50vh' : '62vh' }}
            role="region"
            aria-label={`${model.title} interactive diagram`}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 block h-full w-full"
              aria-hidden="true"
            />
            {svgContent && (
              <svg
                viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
                role="img"
                aria-label={`${model.title} visualization`}
              >
                {svgContent}
              </svg>
            )}

            {/* Draggable points (mouse, touch, and arrow keys) */}
            {dragHandles.map((handle) => {
              const pos = handle.getPos(params)
              const disabled = controlsLocked
              return (
                <DragHandleButton
                  key={handle.id}
                  handle={handle}
                  pos={pos}
                  viewWidth={viewWidth}
                  viewHeight={viewHeight}
                  disabled={disabled}
                  valueText={handle.ariaValueText?.(params)}
                  stageRef={stageRef}
                  onCommit={(nx, ny) => {
                    const patch = handle.onDrag(nx, ny, paramsRef.current)
                    const clean: Params = {}
                    for (const [k, v] of Object.entries(patch)) {
                      if (typeof v === 'number' && !isParamLocked(k, config.lockedParams, phaseLocked)) {
                        clean[k] = v
                      }
                    }
                    if (Object.keys(clean).length > 0) applyMergedParams(clean)
                  }}
                />
              )
            })}

            {/* Clickable 2D hotspot callout pins */}
            {visibleHotspots.map((spot, idx) => {
              const highlighted = config.highlightHotspots?.includes(spot.id)
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => selectHotspot(spot)}
                  aria-label={hideLabels ? `Inspect region ${idx + 1}` : `Inspect ${spot.label}`}
                  aria-pressed={active?.id === spot.id}
                  style={{
                    left: `${(spot.x / viewWidth) * 100}%`,
                    top: `${(spot.y / viewHeight) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={cn(
                    'absolute flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold shadow-lg backdrop-blur transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300',
                    active?.id === spot.id
                      ? 'border-cyan-300 bg-cyan-400 text-ink-950'
                      : highlighted
                        ? 'border-amber-300 bg-amber-400/20 text-amber-200 ring-2 ring-amber-300/60 hover:bg-amber-400/30'
                        : 'border-white/30 bg-ink-900/85 text-white hover:bg-ink-700',
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  {hideLabels ? idx + 1 : spot.label}
                </button>
              )
            })}
          </div>

          {/* Viewport toolbar */}
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
            {hasUpdate && (
              <ToolbarButton
                label={paused ? 'Play simulation (Space)' : 'Pause simulation (Space)'}
                onClick={togglePause}
              >
                {paused ? <Play size={15} /> : <Pause size={15} />}
              </ToolbarButton>
            )}
            {hasStep && (
              <>
                <ToolbarButton label="Step backward" onClick={() => triggerStep(-1)}>
                  <ChevronLeft size={15} />
                </ToolbarButton>
                <ToolbarButton label="Step forward" onClick={() => triggerStep(1)}>
                  <ChevronRight size={15} />
                </ToolbarButton>
              </>
            )}
            <ToolbarButton label="Reset simulation" onClick={resetSimulation}>
              <RotateCcw size={15} />
            </ToolbarButton>
            <GraphicsQualitySelect variant="overlay" />
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={controlsLocked}
                onClick={() => triggerStep(1, action.id)}
                className="h-9 rounded-xl border border-white/15 bg-ink-900/80 px-3 text-xs font-bold text-slate-100 backdrop-blur transition hover:bg-ink-700 disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-slate-400">
            {dragHandles.length > 0
              ? 'Drag handles (or focus + arrow keys) · keys 1–9 inspect hotspots'
              : 'Adjust controls to probe relationships · keys 1–9 inspect hotspots'}
          </p>
        </div>

        <AnimatePresence>
          {active && (
            <motion.div
              key={active.id}
              role="dialog"
              aria-label={active.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: reducedMotion ? 0 : 0.18 }}
              className="absolute bottom-8 right-3 w-[min(320px,calc(100%-1.5rem))] rounded-2xl border border-cyan-300/40 bg-ink-900/95 p-4 text-slate-200 shadow-2xl backdrop-blur"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-white">
                  <Info size={14} className="text-cyan-300" />{' '}
                  {hideLabels ? 'Selected region' : active.title}
                </h3>
                <button
                  type="button"
                  onClick={() => selectHotspot(null)}
                  className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                  aria-label="Close callout"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{active.body}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls & Challenge panel */}
      <aside className="card flex flex-col gap-4 p-5" aria-label="Model controls">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {model.title}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {model.subtitle}
          </p>
        </div>

        {hasChallenges && (
          <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100/70 p-1 text-xs font-bold dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => {
                setMode('explore')
                setPhaseLocked(false)
              }}
              className={cn(
                'rounded-lg py-1.5 transition',
                mode === 'explore'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              Explore
            </button>
            <button
              type="button"
              onClick={() => setMode('challenge')}
              className={cn(
                'flex items-center justify-center gap-1 rounded-lg py-1.5 transition',
                mode === 'challenge'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              <Sparkles size={12} /> Challenge ({effectiveChallenges.length})
            </button>
          </div>
        )}

        {hasChallenges && mode === 'challenge' && (
          <ChallengeDrawer
            modelId={model.id}
            challenges={effectiveChallenges}
            activeChallengeId={config.challengeId}
            params={params}
            metrics={metrics}
            onApplyParams={applyMergedParams}
            onLockControlsChange={setPhaseLocked}
            onSolved={config.onChallengeSolved}
          />
        )}

        {model.params.map((def) => (
          <ParamControl
            key={def.id}
            def={def}
            value={params[def.id]}
            disabled={isParamLocked(def.id, config.lockedParams, phaseLocked)}
            onChange={(value) => setParam(def.id, value)}
          />
        ))}

        {readouts.length > 0 && (
          <dl
            className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3 text-xs dark:border-white/10"
            aria-live="polite"
          >
            {readouts.map((item) => (
              <div key={item.label} className="flex flex-col">
                <dt className="text-slate-500 dark:text-slate-400">{item.label}</dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-white">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {!hideLabels && visibleHotspots.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleHotspots.map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => selectHotspot(spot)}
                className="chip bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300"
              >
                {spot.label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={resetSimulation}
          disabled={controlsLocked}
          className="btn-ghost mt-auto disabled:opacity-50"
        >
          <RotateCcw size={14} /> Reset parameters
        </button>
      </aside>
    </div>
  )
}

function DragHandleButton({
  handle,
  pos,
  viewWidth,
  viewHeight,
  disabled,
  valueText,
  stageRef,
  onCommit,
}: {
  handle: DragHandle2D
  pos: { x: number; y: number }
  viewWidth: number
  viewHeight: number
  disabled: boolean
  valueText?: string
  stageRef: React.RefObject<HTMLDivElement | null>
  onCommit: (x: number, y: number) => void
}) {
  const draggingRef = useRef(false)

  function clientToLogical(clientX: number, clientY: number) {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return null
    const nx = Math.max(0, Math.min(viewWidth, ((clientX - rect.left) / rect.width) * viewWidth))
    const ny = Math.max(0, Math.min(viewHeight, ((clientY - rect.top) / rect.height) * viewHeight))
    return { nx, ny }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${handle.label}${valueText ? `: ${valueText}` : ''}. Drag or use arrow keys.`}
      style={{
        left: `${(pos.x / viewWidth) * 100}%`,
        top: `${(pos.y / viewHeight) * 100}%`,
        transform: 'translate(-50%, -50%)',
        borderColor: handle.color ?? '#22d3ee',
      }}
      onPointerDown={(event) => {
        if (disabled) return
        event.preventDefault()
        draggingRef.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        const next = clientToLogical(event.clientX, event.clientY)
        if (next) onCommit(next.nx, next.ny)
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current || disabled) return
        const next = clientToLogical(event.clientX, event.clientY)
        if (next) onCommit(next.nx, next.ny)
      }}
      onPointerUp={(event) => {
        if (!draggingRef.current) return
        draggingRef.current = false
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      }}
      onPointerCancel={() => {
        draggingRef.current = false
      }}
      onKeyDown={(event) => {
        if (disabled) return
        const step = (handle.stepPx ?? 10) * (event.shiftKey ? 2.5 : 1)
        let dx = 0
        let dy = 0
        if (event.key === 'ArrowLeft') dx = -step
        else if (event.key === 'ArrowRight') dx = step
        else if (event.key === 'ArrowUp') dy = -step
        else if (event.key === 'ArrowDown') dy = step
        else return
        event.preventDefault()
        onCommit(
          Math.max(0, Math.min(viewWidth, pos.x + dx)),
          Math.max(0, Math.min(viewHeight, pos.y + dy)),
        )
      }}
      className={cn(
        'absolute z-10 flex h-5 w-5 cursor-grab items-center justify-center rounded-full border-2 bg-ink-950/90 shadow-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 active:cursor-grabbing',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: handle.color ?? '#22d3ee' }}
        aria-hidden
      />
    </button>
  )
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-ink-900/75 text-slate-200 backdrop-blur transition hover:bg-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      {children}
    </button>
  )
}
