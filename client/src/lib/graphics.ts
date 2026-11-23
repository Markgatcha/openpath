import { useSyncExternalStore } from 'react'

/**
 * Per-device graphics quality for the 3D Model Lab and canvas games.
 * No three.js import here: pages that only show the setting must not pull
 * the WebGL chunk.
 */

export const GRAPHICS_TIERS = ['low', 'medium', 'high', 'ultra'] as const
export type GraphicsTier = (typeof GRAPHICS_TIERS)[number]
export const GRAPHICS_PREFERENCES = ['auto', ...GRAPHICS_TIERS] as const
export type GraphicsPreference = (typeof GRAPHICS_PREFERENCES)[number]

export interface GraphicsProfile {
  tier: GraphicsTier
  /** Upper bound for the canvas backing-store scale. */
  pixelRatioCap: number
  antialias: boolean
  /** Fill/rim light in addition to ambient + key. */
  rimLight: boolean
  /** Image-based lighting and tone mapping. */
  environment: boolean
  /** Physical-material transmission (needs an extra scene pass). */
  transmission: boolean
  /** Multiplier for geometry segment counts. */
  detail: number
  /** Multiplier for particle and instance counts. */
  particles: number
  /** Frame-rate cap; null follows the display. */
  maxFps: number | null
}

export const GRAPHICS_PROFILES: Record<GraphicsTier, GraphicsProfile> = {
  low: {
    tier: 'low',
    pixelRatioCap: 0.75,
    antialias: false,
    rimLight: false,
    environment: false,
    transmission: false,
    detail: 0.4,
    particles: 0.3,
    maxFps: 30,
  },
  medium: {
    tier: 'medium',
    pixelRatioCap: 1,
    antialias: false,
    rimLight: true,
    environment: false,
    transmission: false,
    detail: 0.65,
    particles: 0.6,
    maxFps: 60,
  },
  high: {
    tier: 'high',
    pixelRatioCap: 1.5,
    antialias: true,
    rimLight: true,
    environment: true,
    transmission: true,
    detail: 1,
    particles: 1,
    maxFps: 60,
  },
  ultra: {
    tier: 'ultra',
    pixelRatioCap: 2,
    antialias: true,
    rimLight: true,
    environment: true,
    transmission: true,
    detail: 1.5,
    particles: 1.5,
    maxFps: null,
  },
}

export const GRAPHICS_LABELS: Record<GraphicsPreference, { label: string; hint: string }> = {
  auto: { label: 'Auto', hint: 'Picks a level for this device and lowers it if frames drop.' },
  low: { label: 'Low', hint: 'For older laptops: reduced resolution, 30 fps, fewer particles.' },
  medium: { label: 'Medium', hint: 'Native resolution, no antialiasing, lighter scenes.' },
  high: { label: 'High', hint: 'Antialiasing, environment lighting, full detail.' },
  ultra: { label: 'Ultra', hint: 'Highest resolution and detail, uncapped frame rate.' },
}

const PREFERENCE_KEY = 'openpath:graphics:quality'
const AUTO_TIER_KEY = 'openpath:graphics:auto-tier'

function isTier(value: unknown): value is GraphicsTier {
  return typeof value === 'string' && (GRAPHICS_TIERS as readonly string[]).includes(value)
}

function readPreference(): GraphicsPreference {
  try {
    const raw = localStorage.getItem(PREFERENCE_KEY)
    return raw === 'auto' || isTier(raw) ? raw : 'auto'
  } catch {
    return 'auto'
  }
}

export interface DeviceHints {
  cores?: number
  memoryGb?: number
  /** Unmasked WebGL renderer string; null when WebGL is unavailable. */
  renderer?: string | null
  coarsePointer?: boolean
}

/** Starting tier for Auto. Never returns `ultra`: that is an explicit opt-in. */
export function pickTier(hints: DeviceHints): GraphicsTier {
  const cores = hints.cores ?? 4
  const memory = hints.memoryGb ?? 8
  const renderer = (hints.renderer ?? '').toLowerCase()

  if (hints.renderer === null) return 'low'
  if (/swiftshader|llvmpipe|softpipe|software|basic render/.test(renderer)) return 'low'
  if (cores <= 2 || memory <= 2) return 'low'

  const legacyIntel =
    /intel/.test(renderer) && /hd graphics|gma|g33|g4[15]|q4[35]/.test(renderer) && !/uhd/.test(renderer)
  if (legacyIntel) return cores <= 4 || memory <= 4 ? 'low' : 'medium'

  const strongGpu =
    /nvidia|geforce|rtx|gtx|quadro|radeon rx|radeon pro|arc\(tm\)| arc |iris\(r\) xe|iris xe|apple m\d|apple gpu/.test(
      renderer,
    )
  if (hints.coarsePointer) return strongGpu && cores >= 6 ? 'high' : 'medium'
  if (cores <= 4 || memory <= 4) return 'medium'
  // Integrated, masked, or unidentified GPUs start at medium: Auto can step
  // down from a guess but never up.
  return strongGpu ? 'high' : 'medium'
}

function probeRenderer(): string | null {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return null
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return name
  } catch {
    return null
  }
}

function detectTier(): GraphicsTier {
  if (typeof window === 'undefined') return 'medium'
  const nav = navigator as Navigator & { deviceMemory?: number }
  return pickTier({
    cores: nav.hardwareConcurrency,
    memoryGb: nav.deviceMemory,
    renderer: probeRenderer(),
    coarsePointer: typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches,
  })
}

let preference: GraphicsPreference | null = null
let autoTier: GraphicsTier | null = null
const listeners = new Set<() => void>()

function currentPreference(): GraphicsPreference {
  preference ??= readPreference()
  return preference
}

function currentAutoTier(): GraphicsTier {
  if (autoTier) return autoTier
  let stored: string | null = null
  try {
    // Session-scoped so a lowered tier is re-evaluated on the next visit.
    stored = sessionStorage.getItem(AUTO_TIER_KEY)
  } catch {
    // Storage unavailable: detect every time.
  }
  autoTier = isTier(stored) ? stored : detectTier()
  return autoTier
}

function emit(): void {
  listeners.forEach((listener) => listener())
}

export function getGraphicsPreference(): GraphicsPreference {
  return currentPreference()
}

export function setGraphicsPreference(next: GraphicsPreference): void {
  preference = next
  try {
    localStorage.setItem(PREFERENCE_KEY, next)
  } catch {
    // Keep the in-memory choice for this page.
  }
  emit()
}

export function getGraphicsTier(): GraphicsTier {
  const pref = currentPreference()
  return pref === 'auto' ? currentAutoTier() : pref
}

/**
 * Called by render loops when frames are consistently slow. Only Auto reacts,
 * and only downward. Returns true when the tier changed.
 */
export function lowerAutoTier(): boolean {
  if (currentPreference() !== 'auto') return false
  const index = GRAPHICS_TIERS.indexOf(currentAutoTier())
  if (index <= 0) return false
  autoTier = GRAPHICS_TIERS[index - 1]!
  try {
    sessionStorage.setItem(AUTO_TIER_KEY, autoTier)
  } catch {
    // In-memory only.
  }
  emit()
  return true
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const serverPreference = (): GraphicsPreference => 'auto'
const serverTier = (): GraphicsTier => 'medium'

export function useGraphicsQuality(): {
  preference: GraphicsPreference
  tier: GraphicsTier
  profile: GraphicsProfile
} {
  const pref = useSyncExternalStore(subscribe, getGraphicsPreference, serverPreference)
  const tier = useSyncExternalStore(subscribe, getGraphicsTier, serverTier)
  return { preference: pref, tier, profile: GRAPHICS_PROFILES[tier] }
}

/** Scale a segment count, keeping shapes closed and recognisable. */
export function scaleSegments(profile: GraphicsProfile, base: number, min = 3): number {
  return Math.max(min, Math.round(base * profile.detail))
}

/** Scale a particle or instance count. */
export function scaleCount(profile: GraphicsProfile, base: number, min = 1): number {
  return Math.max(min, Math.round(base * profile.particles))
}
/**
 * Tracks frame times for the Auto step-down. Feed it the interval between
 * rendered frames; it returns true when the tier should drop.
 */
export function createFrameMonitor(profile: GraphicsProfile): (frameMs: number) => boolean {
  const target = 1000 / (profile.maxFps ?? 60)
  const slowMs = target * 1.6
  const WARMUP_MS = 2500
  const WINDOW_MS = 3000
  let warm = 0
  let windowTime = 0
  let frames = 0
  let slowWindows = 0
  return (frameMs) => {
    // Tab switches and debugger pauses are not a performance signal.
    if (frameMs > 500) return false
    if (warm < WARMUP_MS) {
      warm += frameMs
      return false
    }
    windowTime += frameMs
    frames += 1
    if (windowTime < WINDOW_MS) return false
    const average = windowTime / frames
    windowTime = 0
    frames = 0
    slowWindows = average > slowMs ? slowWindows + 1 : 0
    if (slowWindows < 2) return false
    slowWindows = 0
    return true
  }
}

/** Frame limiter for rAF loops: returns true when this frame should draw. */
export function createFrameLimiter(maxFps: number | null): (now: number) => boolean {
  if (!maxFps) return () => true
  const interval = 1000 / maxFps
  let last = -Infinity
  return (now) => {
    // 1 ms of slack absorbs vsync jitter when the cap equals the display rate.
    if (now - last < interval - 1) return false
    // Advance by whole intervals so the average rate holds on displays that
    // are not a multiple of the cap; resync after a stall.
    const next = last + interval
    last = now - next > interval ? now : next
    return true
  }
}
