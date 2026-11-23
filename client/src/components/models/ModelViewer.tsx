import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Pause,
  Play,
  RotateCcw,
  Rotate3d,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isTypingTarget, usePrefersReducedMotion } from '@/lib/a11y'
import {
  PALETTE,
  disposeObject,
  type Hotspot,
  type ModelDefinition,
  type Params,
  type Readout,
  type SceneInstance,
} from './engine'
import {
  isParamLocked,
  mergeInitialParams,
  useModelRuntime,
  type ModelRuntimeConfig,
} from './shared-types'
import { ChallengeDrawer, ParamControl } from './ChallengeDrawer'

export type ModelViewerProps = {
  model: ModelDefinition
} & ModelRuntimeConfig

/**
 * Generic interactive viewer for a procedural ModelDefinition.
 *
 * - Orbit (drag), pan (right-drag / two-finger), zoom (wheel / pinch),
 *   keyboard orbit with arrow keys while the canvas is focused.
 * - Parameter sliders write into a ref read by the render loop, so
 *   dragging a slider never re-renders React per frame.
 * - Hotspot pins are real <button>s positioned by projecting their
 *   world position every frame — clickable, tabbable, and announced.
 * - Unmount tears down everything: rAF, ResizeObserver, controls, the
 *   scene graph's GPU buffers, and the WebGL context itself.
 */
export function ModelViewer({ model, ...directConfig }: ModelViewerProps) {
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
    [urlConfig, ctxConfig, directConfig],
  )

  const reducedMotion = usePrefersReducedMotion()
  const hostRef = useRef<HTMLDivElement>(null)
  const hudCanvasRef = useRef<HTMLCanvasElement>(null)
  const pinRefs = useRef(new Map<string, HTMLButtonElement>())
  const initialParamsKey = config.initialParams ? JSON.stringify(config.initialParams) : ''

  const initialMerged = useMemo(
    () => mergeInitialParams(model.params, config.initialParams),
    // Rebuild baseline only on model or explicit external override change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, initialParamsKey],
  )

  const paramsRef = useRef<Params>(initialMerged)
  const pausedRef = useRef(false)
  const autoRotateRef = useRef(!reducedMotion)
  const controlsRef = useRef<OrbitControls | null>(null)
  const instanceRef = useRef<SceneInstance | null>(null)
  const elapsedRef = useRef(0)

  const [params, setParams] = useState<Params>(initialMerged)
  const [paused, setPaused] = useState(false)
  const [autoRotate, setAutoRotate] = useState(!reducedMotion)
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [active, setActive] = useState<Hotspot | null>(null)
  const [readouts, setReadouts] = useState<Readout[]>([])
  const [metrics, setMetrics] = useState<Record<string, number>>({})
  const [webglError, setWebglError] = useState(false)
  const [hasHudPlot, setHasHudPlot] = useState(false)
  const [hasStep, setHasStep] = useState(false)
  const [phaseLocked, setPhaseLocked] = useState(false)
  const [mode, setMode] = useState<'explore' | 'challenge'>(
    config.challengeId || config.defaultTab === 'challenge' ? 'challenge' : 'explore',
  )

  const onReadoutSnapshotRef = useRef(config.onReadoutSnapshot)
  onReadoutSnapshotRef.current = config.onReadoutSnapshot
  const onHotspotSelectRef = useRef(config.onHotspotSelect)
  onHotspotSelectRef.current = config.onHotspotSelect

  // Sync external initialParams updates when provided via context/props.
  useEffect(() => {
    paramsRef.current = initialMerged
    setParams(initialMerged)
  }, [initialMerged])

  // Sync external challengeId/defaultTab selection.
  useEffect(() => {
    if (config.challengeId || config.defaultTab === 'challenge') {
      setMode('challenge')
    }
  }, [config.challengeId, config.defaultTab])

  const selectHotspot = useCallback((spot: Hotspot | null) => {
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

  // ── Scene lifecycle (one per model) ──────────────────────────
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      queueMicrotask(() => setWebglError(true))
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.className = 'block h-full w-full outline-none'
    renderer.domElement.tabIndex = 0
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute(
      'aria-label',
      `${model.title} 3D model. Drag or use arrow keys to orbit, scroll to zoom.`,
    )
    host.prepend(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 500)
    camera.position.set(...model.camera)

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 1.6)
    key.position.set(5, 8, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x93c5fd, 0.6)
    rim.position.set(-6, -3, -5)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.screenSpacePanning = true
    controls.autoRotateSpeed = 1.2
    controls.listenToKeyEvents(renderer.domElement)
    controls.keyPanSpeed = 14
    controlsRef.current = controls

    const instance = model.build({ scene, camera, palette: PALETTE }, paramsRef.current)
    instanceRef.current = instance
    setHotspots(instance.hotspots)
    setHasHudPlot(Boolean(instance.hudPlot))
    setHasStep(Boolean(instance.step))
    setReadouts(instance.readouts ? instance.readouts(paramsRef.current) : [])
    setMetrics(instance.metrics ? instance.metrics(paramsRef.current) : {})

    const resize = () => {
      const { clientWidth, clientHeight } = host
      if (clientWidth === 0 || clientHeight === 0) return
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(host)

    const clock = new THREE.Clock()
    const scratch = new THREE.Vector3()
    let elapsed = 0
    let frame = 0
    const tick = () => {
      frame = requestAnimationFrame(tick)
      const raw = Math.min(clock.getDelta(), 0.05)
      const dt = pausedRef.current ? 0 : raw
      elapsed += dt
      elapsedRef.current = elapsed
      controls.autoRotate = autoRotateRef.current
      controls.update()
      instance.update(paramsRef.current, dt, elapsed)
      renderer.render(scene, camera)

      if (instance.hudPlot && hudCanvasRef.current) {
        const hudCanvas = hudCanvasRef.current
        const hudCtx = hudCanvas.getContext('2d')
        if (hudCtx) {
          instance.hudPlot(hudCtx, hudCanvas.width, hudCanvas.height, paramsRef.current, elapsed)
        }
      }

      // Project hotspot pins into screen space.
      const width = host.clientWidth
      const height = host.clientHeight
      for (const spot of instance.hotspots) {
        const pin = pinRefs.current.get(spot.id)
        if (!pin) continue
        spot.position(scratch).project(camera)
        const shown = (spot.visible?.() ?? true) && scratch.z < 1
        pin.style.display = shown ? '' : 'none'
        if (shown) {
          pin.style.transform = `translate(${((scratch.x + 1) / 2) * width}px, ${((1 - scratch.y) / 2) * height}px) translate(-50%, -50%)`
        }
      }
    }
    tick()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      instance.dispose?.()
      disposeObject(scene)
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      controlsRef.current = null
      instanceRef.current = null
    }
  }, [model])

  // Readouts & challenge metrics poll (cheap, a few Hz — the canvas itself never re-renders React).
  useEffect(() => {
    const id = window.setInterval(() => {
      const instance = instanceRef.current
      if (!instance) return
      if (instance.readouts) {
        const next = instance.readouts(paramsRef.current)
        setReadouts(next)
        onReadoutSnapshotRef.current?.(next, paramsRef.current)
      }
      if (instance.metrics) {
        setMetrics(instance.metrics(paramsRef.current))
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [model])

  // Space pauses, Escape closes hotspot dialog, 1-9 selects hotspots.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault()
        togglePause()
      } else if (event.key === 'Escape') {
        selectHotspot(null)
      } else if (event.key >= '1' && event.key <= '9') {
        const visible = hotspots.filter((spot) => spot.visible?.() ?? true)
        const picked = visible[Number(event.key) - 1]
        if (picked) {
          event.preventDefault()
          selectHotspot(picked)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hotspots, selectHotspot])

  const effectiveAutoRotate = !reducedMotion && autoRotate

  // Reduced motion turns auto-rotate off if the OS setting flips.
  useEffect(() => {
    autoRotateRef.current = effectiveAutoRotate
  }, [effectiveAutoRotate])

  function togglePause() {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
  }

  function stepScene(direction: 1 | -1) {
    const instance = instanceRef.current
    if (!instance?.step) return
    if (!pausedRef.current) {
      pausedRef.current = true
      setPaused(true)
    }
    instance.step(paramsRef.current, direction)
    setParams({ ...paramsRef.current })
    if (instance.readouts) setReadouts(instance.readouts(paramsRef.current))
    if (instance.metrics) setMetrics(instance.metrics(paramsRef.current))
  }

  function applyMergedParams(next: Params) {
    const merged = mergeInitialParams(model.params, { ...paramsRef.current, ...next })
    paramsRef.current = merged
    setParams(merged)
    const instance = instanceRef.current
    if (instance?.readouts) {
      const nextReadouts = instance.readouts(merged)
      setReadouts(nextReadouts)
      onReadoutSnapshotRef.current?.(nextReadouts, merged)
    }
    if (instance?.metrics) setMetrics(instance.metrics(merged))
  }

  function setParam(id: string, value: number) {
    applyMergedParams({ [id]: value })
  }

  function resetView() {
    const controls = controlsRef.current
    if (!controls) return
    controls.reset()
    controls.object.position.set(...model.camera)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  function resetParams() {
    const baseline = mergeInitialParams(model.params, config.initialParams)
    paramsRef.current = baseline
    setParams(baseline)
    const instance = instanceRef.current
    if (instance?.readouts) setReadouts(instance.readouts(baseline))
    if (instance?.metrics) setMetrics(instance.metrics(baseline))
  }

  const hasChallenges = Boolean(model.challenges && model.challenges.length > 0)
  const effectiveChallenges = model.challenges ?? []
  const isCompact = Boolean(config.compact)
  const hideLabels = Boolean(config.hideLabels)

  return (
    <div
      className={cn(
        'grid gap-4',
        isCompact ? 'lg:grid-cols-[1fr_280px]' : 'lg:grid-cols-[1fr_310px]',
      )}
    >
      <div className="relative">
        <div
          ref={hostRef}
          className={cn(
            'relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-ink-800 to-ink-950 dark:border-white/10',
            isCompact ? 'h-[46vh] min-h-[300px]' : 'h-[58vh] min-h-[360px]',
          )}
        >
          {webglError && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-slate-300">
              WebGL isn’t available in this browser, so the 3D model can’t render.
            </div>
          )}
          {/* Hotspot pins (positioned imperatively by the render loop). */}
          <div className="pointer-events-none absolute inset-0">
            {hotspots.map((spot, idx) => {
              const highlighted = config.highlightHotspots?.includes(spot.id)
              return (
                <button
                  key={spot.id}
                  ref={(node) => {
                    if (node) pinRefs.current.set(spot.id, node)
                    else pinRefs.current.delete(spot.id)
                  }}
                  type="button"
                  onClick={() => selectHotspot(spot)}
                  aria-label={hideLabels ? `Inspect region ${idx + 1}` : `Inspect ${spot.label}`}
                  aria-pressed={active?.id === spot.id}
                  className={cn(
                    'pointer-events-auto absolute left-0 top-0 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold shadow-lg backdrop-blur transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300',
                    active?.id === spot.id
                      ? 'border-cyan-300 bg-cyan-400 text-ink-950'
                      : highlighted
                        ? 'border-amber-300 bg-amber-400/20 text-amber-200 ring-2 ring-amber-300/60 hover:bg-amber-400/30'
                        : 'border-white/30 bg-ink-900/80 text-white hover:bg-ink-700',
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  {hideLabels ? idx + 1 : spot.label}
                </button>
              )
            })}
          </div>

          {/* Canvas toolbar */}
          <div className="absolute left-3 top-3 flex gap-2">
            <ToolbarButton
              label={paused ? 'Resume simulation (Space)' : 'Pause simulation (Space)'}
              onClick={togglePause}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </ToolbarButton>
            {hasStep && (
              <>
                <ToolbarButton label="Step backward" onClick={() => stepScene(-1)}>
                  <ChevronLeft size={15} />
                </ToolbarButton>
                <ToolbarButton label="Step forward" onClick={() => stepScene(1)}>
                  <ChevronRight size={15} />
                </ToolbarButton>
              </>
            )}
            <ToolbarButton
              label={autoRotate ? 'Stop auto-rotate' : 'Start auto-rotate'}
              pressed={autoRotate}
              onClick={() => {
                autoRotateRef.current = !autoRotateRef.current
                setAutoRotate(autoRotateRef.current)
              }}
            >
              <Rotate3d size={15} />
            </ToolbarButton>
            <ToolbarButton label="Reset camera" onClick={resetView}>
              <RotateCcw size={15} />
            </ToolbarButton>
          </div>

          {hasHudPlot && (
            <div className="pointer-events-none absolute right-3 top-3 rounded-xl border border-white/15 bg-ink-950/85 p-2 shadow-lg backdrop-blur">
              {model.hudTitle && (
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {model.hudTitle}
                </p>
              )}
              <canvas ref={hudCanvasRef} width={210} height={82} className="block rounded" />
            </div>
          )}

          <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-slate-400">
            Drag to orbit · right-drag to pan · scroll to zoom · Space to pause
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
                  <Info size={14} className="text-cyan-300" /> {hideLabels ? 'Selected region' : active.title}
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

      {/* Controls panel */}
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

        {!hideLabels && hotspots.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hotspots.map((spot) => (
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
          onClick={resetParams}
          disabled={config.lockedParams === true || phaseLocked}
          className="btn-ghost mt-auto disabled:opacity-50"
        >
          <RotateCcw size={14} /> Reset parameters
        </button>
      </aside>
    </div>
  )
}

function ToolbarButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string
  onClick: () => void
  pressed?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-xl border backdrop-blur transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300',
        pressed
          ? 'border-cyan-300/60 bg-cyan-400/20 text-cyan-200'
          : 'border-white/15 bg-ink-900/70 text-slate-200 hover:bg-ink-700',
      )}
    >
      {children}
    </button>
  )
}
