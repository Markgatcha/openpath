import type { ReactNode } from 'react'
import { scaleCount, type GraphicsProfile } from '@/lib/graphics'
import {
  PALETTE,
  PALETTE_CSS,
  initialParams,
  type ChoiceParam,
  type ModelChallenge,
  type ModelHotspotInfo,
  type ParamDef,
  type Params,
  type Readout,
  type SliderParam,
  type ToggleParam,
} from './shared-types'

export {
  PALETTE,
  PALETTE_CSS,
  initialParams,
  type ChoiceParam,
  type ModelChallenge,
  type ModelHotspotInfo,
  type ParamDef,
  type Params,
  type Readout,
  type SliderParam,
  type ToggleParam,
}

/**
 * 2D Interactive Simulation Engine (SVG + HTML5 Canvas, zero `three` imports).
 * Designed for planar math, circuits, chemistry beakers, population genetics,
 * algorithms, economics, and radiative energy models where 2D minimizes
 * extraneous cognitive load (Mayer; Huk 2006).
 */

export interface Hotspot2D extends ModelHotspotInfo {
  /** Logical coordinate inside [0..viewWidth, 0..viewHeight]. */
  x: number
  y: number
  visible?: (params: Params) => boolean
}

export interface DragHandle2D {
  id: string
  label: string
  getPos: (params: Params) => { x: number; y: number }
  onDrag: (x: number, y: number, params: Params) => Partial<Params>
  stepPx?: number
  color?: string
  ariaValueText?: (params: Params) => string
}

export interface Action2D {
  id: string
  label: string
}

/**
 * Cosmetic detail for the active graphics tier. Scale decoration with it
 * (glow, trails, backdrop particles), never a quantity students read off.
 */
export interface Scene2DQuality {
  profile: GraphicsProfile
  /** Scaled count for decorative particles. */
  count: (base: number) => number
  /** Soft shadow-blur glows; off on Low and Medium. */
  glow: boolean
  /** Gradient fills and motion trails; off on Low. */
  rich: boolean
}

export function makeScene2DQuality(profile: GraphicsProfile): Scene2DQuality {
  return {
    profile,
    count: (base) => scaleCount(profile, base),
    glow: profile.environment,
    rich: profile.rimLight,
  }
}

export interface Scene2DContext {
  viewWidth: number
  viewHeight: number
  palette: typeof PALETTE_CSS
  quality: Scene2DQuality
}

export interface Scene2DInstance {
  update?: (params: Params, dt: number, elapsed: number) => void
  step?: (params: Params, direction: 1 | -1, actionId?: string) => void
  reset?: (params: Params) => void
  renderCanvas?: (
    ctx: CanvasRenderingContext2D,
    params: Params,
    elapsed: number,
    reducedMotion: boolean,
  ) => void
  renderSvg?: (params: Params, elapsed: number) => ReactNode
  hotspots?: Hotspot2D[]
  dragHandles?: DragHandle2D[]
  readouts?: (params: Params) => Readout[]
  metrics?: (params: Params) => Record<string, number>
  actions?: Action2D[]
  dispose?: () => void
}

export interface Model2DDefinition {
  id: string
  title: string
  subtitle: string
  viewWidth?: number
  viewHeight?: number
  params: ParamDef[]
  challenges?: ModelChallenge[]
  supportsStep?: boolean
  initialPaused?: boolean
  build: (ctx: Scene2DContext, params: Params) => Scene2DInstance
}

// ── Reusable 2D Canvas / SVG Primitives ──────────────────────────

export interface PlotBox {
  x: number
  y: number
  w: number
  h: number
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export function plotMapX(box: PlotBox, val: number): number {
  return box.x + ((val - box.xMin) / (box.xMax - box.xMin || 1)) * box.w
}

export function plotMapY(box: PlotBox, val: number): number {
  return box.y + box.h - ((val - box.yMin) / (box.yMax - box.yMin || 1)) * box.h
}

export function plotUnmapX(box: PlotBox, px: number): number {
  return box.xMin + ((px - box.x) / (box.w || 1)) * (box.xMax - box.xMin)
}

export function plotUnmapY(box: PlotBox, py: number): number {
  return box.yMin + ((box.y + box.h - py) / (box.h || 1)) * (box.yMax - box.yMin)
}

/** Draw axes, grid, labels, and zero-crosshairs onto a 2D canvas (`LinkedPlot2D`). */
export function drawPlotAxes2D(
  ctx: CanvasRenderingContext2D,
  box: PlotBox,
  opts: {
    title?: string
    xLabel?: string
    yLabel?: string
    xTicks?: number
    yTicks?: number
    xFormat?: (v: number) => string
    yFormat?: (v: number) => string
  } = {},
): void {
  const xTicks = opts.xTicks ?? 5
  const yTicks = opts.yTicks ?? 4

  ctx.save()
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
  ctx.lineWidth = 1
  ctx.fillRect(box.x, box.y, box.w, box.h)
  ctx.strokeRect(box.x, box.y, box.w, box.h)

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)'
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillStyle = '#94a3b8'

  for (let i = 0; i <= xTicks; i += 1) {
    const xv = box.xMin + ((box.xMax - box.xMin) * i) / xTicks
    const px = plotMapX(box, xv)
    ctx.beginPath()
    ctx.moveTo(px, box.y)
    ctx.lineTo(px, box.y + box.h)
    ctx.stroke()
    const lbl = opts.xFormat ? opts.xFormat(xv) : String(Math.round(xv * 10) / 10)
    ctx.textAlign = 'center'
    ctx.fillText(lbl, px, box.y + box.h + 13)
  }

  for (let i = 0; i <= yTicks; i += 1) {
    const yv = box.yMin + ((box.yMax - box.yMin) * i) / yTicks
    const py = plotMapY(box, yv)
    ctx.beginPath()
    ctx.moveTo(box.x, py)
    ctx.lineTo(box.x + box.w, py)
    ctx.stroke()
    const lbl = opts.yFormat ? opts.yFormat(yv) : String(Math.round(yv * 10) / 10)
    ctx.textAlign = 'right'
    ctx.fillText(lbl, box.x - 6, py + 3)
  }

  // Zero crosshairs if in range
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
  ctx.lineWidth = 1.2
  if (box.yMin < 0 && box.yMax > 0) {
    const zy = plotMapY(box, 0)
    ctx.beginPath()
    ctx.moveTo(box.x, zy)
    ctx.lineTo(box.x + box.w, zy)
    ctx.stroke()
  }
  if (box.xMin < 0 && box.xMax > 0) {
    const zx = plotMapX(box, 0)
    ctx.beginPath()
    ctx.moveTo(zx, box.y)
    ctx.lineTo(zx, box.y + box.h)
    ctx.stroke()
  }

  if (opts.title) {
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(opts.title, box.x + 6, box.y - 7)
  }
  if (opts.xLabel) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(opts.xLabel, box.x + box.w, box.y + box.h + 24)
  }
  if (opts.yLabel) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(opts.yLabel, box.x + 6, box.y + 13)
  }
  ctx.restore()
}

export function drawCurve2D(
  ctx: CanvasRenderingContext2D,
  box: PlotBox,
  fn: (x: number) => number,
  color: string,
  lineWidth = 2.4,
  dashed = false,
  samples = 120,
): void {
  ctx.save()
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.w, box.h)
  ctx.clip()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  if (dashed) ctx.setLineDash([6, 4])
  ctx.beginPath()
  for (let i = 0; i <= samples; i += 1) {
    const x = box.xMin + ((box.xMax - box.xMin) * i) / samples
    const y = fn(x)
    const px = plotMapX(box, x)
    const py = plotMapY(box, y)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.restore()
}

export interface Particle2D {
  x: number
  y: number
  vx: number
  vy: number
  kind: number
  radius: number
  energy: number
}

/**
 * Reusable 2D elastic-wall particle container for molecular chemistry,
 * enzyme catalysis, population grids, and photon-atmosphere transport.
 */
export class ParticleBox2D {
  readonly particles: Particle2D[] = []
  x: number
  y: number
  w: number
  h: number

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }

  seed(count: number, kindFn: (idx: number) => number, speed = 80, radius = 4.5): void {
    this.particles.length = 0
    for (let i = 0; i < count; i += 1) {
      const rx = ((i * 73 + 19) % 100) / 100
      const ry = ((i * 41 + 37) % 100) / 100
      const ang = i * 2.39996
      this.particles.push({
        x: this.x + radius + rx * Math.max(4, this.w - radius * 2),
        y: this.y + radius + ry * Math.max(4, this.h - radius * 2),
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        kind: kindFn(i),
        radius,
        energy: 0.5 + ((i * 29) % 100) / 100,
      })
    }
  }

  step(dt: number, speedMultiplier = 1): void {
    if (dt <= 0) return
    for (const p of this.particles) {
      p.x += p.vx * dt * speedMultiplier
      p.y += p.vy * dt * speedMultiplier
      if (p.x - p.radius < this.x) {
        p.x = this.x + p.radius
        p.vx = Math.abs(p.vx)
      } else if (p.x + p.radius > this.x + this.w) {
        p.x = this.x + this.w - p.radius
        p.vx = -Math.abs(p.vx)
      }
      if (p.y - p.radius < this.y) {
        p.y = this.y + p.radius
        p.vy = Math.abs(p.vy)
      } else if (p.y + p.radius > this.y + this.h) {
        p.y = this.y + this.h - p.radius
        p.vy = -Math.abs(p.vy)
      }
    }
  }
}
