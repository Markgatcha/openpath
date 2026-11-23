import { Interactive2DViewer } from '../Interactive2DViewer'
import {
  PALETTE_CSS,
  drawPlotAxes2D,
  plotMapX,
  plotMapY,
  type Hotspot2D,
  type Model2DDefinition,
  type Params,
  type PlotBox,
} from '../engine2d'

const VIEW_W = 720
const VIEW_H = 460
const SCENE_W = 486
const SPACE_Y = 78
const BAND_TOP = 150
const BAND_BOTTOM = 232
const BAND_MID = (BAND_TOP + BAND_BOTTOM) / 2
const GROUND_Y = 384

const SIGMA = 5.670374e-8
const SOLAR_CONSTANT = 1361
/** Arbitrary heat capacity, chosen so the surface settles in a few seconds of screen time. */
const HEAT_CAPACITY = 12
const HISTORY_SPAN_S = 40
const HISTORY_STEP_S = 0.25

const X_SUN = 104
const X_REFLECT = 170
const X_SURFACE_IR = 268
const X_ATM_UP = 340
const X_BACK = 412

const SOLAR_COLOR = PALETTE_CSS.amber
const IR_COLOR = PALETTE_CSS.rose

function solve(p: Params) {
  const sunPct = p.sunPct ?? 100
  const albedo = p.albedo ?? 0.3
  const absorb = (p.absorbPct ?? 78) / 100
  const incoming = (SOLAR_CONSTANT * sunPct) / 100 / 4
  const reflected = incoming * albedo
  const absorbed = incoming - reflected
  // One-layer grey atmosphere: escaping infrared = (1 − ε/2) σ T⁴.
  const eqTemp = Math.pow(absorbed / (SIGMA * (1 - absorb / 2)), 0.25)
  return { sunPct, albedo, absorb, incoming, reflected, absorbed, eqTemp }
}

function fluxes(p: Params, temp: number) {
  const s = solve(p)
  const surfaceIr = SIGMA * Math.pow(temp, 4)
  const back = (s.absorb * surfaceIr) / 2
  const window = (1 - s.absorb) * surfaceIr
  const atmUp = back
  const toSpace = window + atmUp
  return { ...s, surfaceIr, back, window, atmUp, toSpace, imbalance: s.absorbed - toSpace }
}

function fmt(v: number, digits = 0): string {
  return v.toFixed(digits)
}

function celsius(k: number): string {
  const c = k - 273.15
  return `${c >= 0 ? '+' : '−'}${Math.abs(c).toFixed(1)} °C`
}

function mix(a: [number, number, number], b: [number, number, number], t: number): string {
  const k = Math.max(0, Math.min(1, t))
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * k))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

/** Ground tint: ice below freezing, green when temperate, dry ochre when hot. */
function groundColor(temp: number): string {
  const ice: [number, number, number] = [203, 225, 240]
  const green: [number, number, number] = [52, 140, 96]
  const ochre: [number, number, number] = [186, 128, 62]
  if (temp < 288) return mix(ice, green, (temp - 255) / 33)
  return mix(green, ochre, (temp - 288) / 22)
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  align: CanvasTextAlign = 'center',
  size = 10,
) {
  ctx.save()
  ctx.font = `bold ${size}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = align
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)'
  ctx.strokeText(text, x, y)
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.restore()
}

/** Vertical flux arrow whose width is proportional to the energy flow it carries. */
function fluxArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  yFrom: number,
  yTo: number,
  flux: number,
  color: string,
  alpha: number,
) {
  if (flux < 1) return
  const w = Math.max(2, Math.min(34, flux / 12))
  const dir = Math.sign(yTo - yFrom)
  const head = Math.min(Math.abs(yTo - yFrom) * 0.5, 9 + w * 0.5)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x - w / 2, yFrom)
  ctx.lineTo(x + w / 2, yFrom)
  ctx.lineTo(x + w / 2, yTo - dir * head)
  ctx.lineTo(x + w / 2 + 5, yTo - dir * head)
  ctx.lineTo(x, yTo)
  ctx.lineTo(x - w / 2 - 5, yTo - dir * head)
  ctx.lineTo(x - w / 2, yTo - dir * head)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function signed(v: number): string {
  const r = Math.round(v * 10) / 10
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r).toFixed(1)}`
}

const PANEL_X = SCENE_W
const PANEL_W = VIEW_W - SCENE_W

/** Right-hand panel: energy budget bars and the surface-temperature history. */
function drawPanel(
  ctx: CanvasRenderingContext2D,
  f: ReturnType<typeof fluxes>,
  temp: number,
  clock: number,
  history: { t: number; temp: number }[],
  rich: boolean,
  glow: boolean,
) {
  ctx.save()
  if (rich) {
    const bg = ctx.createLinearGradient(PANEL_X, 0, PANEL_X, VIEW_H)
    bg.addColorStop(0, '#0f172a')
    bg.addColorStop(1, '#020617')
    ctx.fillStyle = bg
  } else {
    ctx.fillStyle = '#0b1220'
  }
  ctx.fillRect(PANEL_X, 0, PANEL_W, VIEW_H)
  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.fillRect(PANEL_X, 0, 1, VIEW_H)

  // Energy budget: what the planet absorbs against what it sends to space.
  const left = PANEL_X + 16
  const barW = PANEL_W - 32
  const scaleMax = 420
  label(ctx, 'ENERGY BUDGET (W/m²)', left, 22, PALETTE_CSS.slate, 'left')
  const bars: { name: string; value: number; color: string }[] = [
    { name: 'Absorbed sunlight', value: f.absorbed, color: SOLAR_COLOR },
    { name: 'Infrared to space', value: f.toSpace, color: IR_COLOR },
  ]
  bars.forEach((bar, i) => {
    const y = 34 + i * 40
    label(ctx, bar.name, left, y + 9, PALETTE_CSS.white, 'left')
    label(ctx, fmt(bar.value), left + barW, y + 9, bar.color, 'right')
    ctx.fillStyle = 'rgba(148, 163, 184, 0.18)'
    ctx.fillRect(left, y + 15, barW, 10)
    ctx.save()
    if (glow) {
      ctx.shadowColor = bar.color
      ctx.shadowBlur = 10
    }
    ctx.fillStyle = bar.color
    ctx.fillRect(left, y + 15, (barW * Math.max(0, Math.min(scaleMax, bar.value))) / scaleMax, 10)
    ctx.restore()
  })

  const state =
    Math.abs(f.imbalance) < 1 ? 'In balance' : f.imbalance > 0 ? 'Gaining energy: warming' : 'Losing energy: cooling'
  const stateColor =
    Math.abs(f.imbalance) < 1 ? PALETTE_CSS.emerald : f.imbalance > 0 ? PALETTE_CSS.amber : PALETTE_CSS.cyan
  label(ctx, `${state}  (${signed(f.imbalance)})`, left, 132, stateColor, 'left', 11)

  // Temperature history with the balance temperature as a dashed target.
  const temps = history.map((h) => h.temp)
  const lo = Math.min(temp, f.eqTemp, ...temps)
  const hi = Math.max(temp, f.eqTemp, ...temps)
  const pad = Math.max(4, (hi - lo) * 0.2)
  const tEnd = Math.max(clock, HISTORY_SPAN_S)
  const box: PlotBox = {
    x: PANEL_X + 44,
    y: 176,
    w: PANEL_W - 60,
    h: 210,
    xMin: tEnd - HISTORY_SPAN_S,
    xMax: tEnd,
    yMin: lo - pad,
    yMax: hi + pad,
  }
  drawPlotAxes2D(ctx, box, {
    title: 'Surface temperature',
    xLabel: 'time (s)',
    yLabel: 'K',
    xTicks: 4,
    yTicks: 4,
    xFormat: (v) => v.toFixed(0),
    yFormat: (v) => v.toFixed(0),
  })

  ctx.beginPath()
  ctx.rect(box.x, box.y, box.w, box.h)
  ctx.clip()

  const eqY = plotMapY(box, f.eqTemp)
  ctx.strokeStyle = PALETTE_CSS.emerald
  ctx.lineWidth = 1.2
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(box.x, eqY)
  ctx.lineTo(box.x + box.w, eqY)
  ctx.stroke()
  ctx.setLineDash([])

  const points = [...history, { t: clock, temp }]
  if (rich && points.length > 1) {
    const fill = ctx.createLinearGradient(0, box.y, 0, box.y + box.h)
    fill.addColorStop(0, 'rgba(251, 113, 133, 0.32)')
    fill.addColorStop(1, 'rgba(251, 113, 133, 0)')
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.moveTo(plotMapX(box, points[0].t), box.y + box.h)
    for (const pt of points) ctx.lineTo(plotMapX(box, pt.t), plotMapY(box, pt.temp))
    ctx.lineTo(plotMapX(box, clock), box.y + box.h)
    ctx.closePath()
    ctx.fill()
  }
  if (glow) {
    ctx.shadowColor = IR_COLOR
    ctx.shadowBlur = 8
  }
  ctx.strokeStyle = IR_COLOR
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  points.forEach((pt, i) => {
    const x = plotMapX(box, pt.t)
    const y = plotMapY(box, pt.temp)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  ctx.fillStyle = PALETTE_CSS.white
  ctx.beginPath()
  ctx.arc(plotMapX(box, clock), plotMapY(box, temp), 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  label(ctx, `Balance ${fmt(f.eqTemp, 1)} K`, PANEL_X + PANEL_W - 14, 164, PALETTE_CSS.emerald, 'right')
  label(ctx, `Now ${fmt(temp, 1)} K  (${celsius(temp)})`, left, VIEW_H - 14, PALETTE_CSS.white, 'left', 11)
}

/** The viewer evaluates a challenge once before the scene has reported metrics. */
const WAITING = { passed: false, feedback: 'Starting the simulation…' }

interface Photon {
  x: number
  y: number
  vy: number
  solar: boolean
  /** Infrared photons meet the absorbing layer once. */
  checked: boolean
  phase: number
}

export const greenhouseEffect2dModel: Model2DDefinition = {
  id: 'greenhouse-effect-2d',
  title: 'Greenhouse Effect: Planetary Energy Balance',
  subtitle:
    'Sunlight in, infrared out. Change how much infrared the atmosphere absorbs and watch the surface warm until the planet is back in balance.',
  viewWidth: VIEW_W,
  viewHeight: VIEW_H,
  params: [
    {
      kind: 'slider',
      id: 'absorbPct',
      label: 'Infrared absorbed by the atmosphere',
      min: 0,
      max: 100,
      step: 1,
      initial: 78,
      unit: '%',
    },
    { kind: 'slider', id: 'albedo', label: 'Albedo (sunlight reflected)', min: 0.05, max: 0.7, step: 0.01, initial: 0.3 },
    { kind: 'slider', id: 'sunPct', label: 'Sun brightness', min: 80, max: 120, step: 1, initial: 100, unit: '%' },
    { kind: 'toggle', id: 'showFlows', label: 'Show energy-flow arrows (W/m²)', initial: true },
  ],
  challenges: [
    {
      id: 'no-greenhouse-gases',
      title: 'Earth With No Greenhouse Gases',
      setupParams: { absorbPct: 78, albedo: 0.3, sunPct: 100 },
      predict: {
        prompt:
          'With Earth’s sunlight and albedo unchanged but an atmosphere that absorbs no infrared, where would the average surface temperature settle?',
        options: ['About −18 °C', 'About +15 °C, the same as now', 'Close to absolute zero'],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Set infrared absorption to 0% (keep albedo 0.30 and the Sun at 100%) and let the surface settle to within 1 K of balance.',
        evaluate: (p, m) => {
          if (m.tempK === undefined) return WAITING
          return {
            passed:
              (p.absorbPct ?? 78) === 0 &&
              Math.abs((p.albedo ?? 0.3) - 0.3) < 0.005 &&
              (p.sunPct ?? 100) === 100 &&
              Math.abs(m.tempK - m.eqTempK) < 1,
            feedback: `Surface ${fmt(m.tempK, 1)} K (${celsius(m.tempK)}); balance is at ${fmt(m.eqTempK, 1)} K.`,
          }
        },
      },
      explain:
        'The surface must radiate away the 238 W/m² it absorbs. With nothing absorbing infrared, σT⁴ = 238 W/m² gives T ≈ 255 K, about −18 °C. The natural greenhouse effect is the roughly 33 K difference between that and Earth’s actual average.',
      misconceptionTag: 'greenhouse-effect-is-only-harmful',
    },
    {
      id: 'balance-restored',
      title: 'More Absorption, Then Balance Again',
      setupParams: { absorbPct: 78, albedo: 0.3, sunPct: 100 },
      predict: {
        prompt:
          'The atmosphere starts absorbing more infrared and the surface warms. Once the temperature has settled, how does the infrared leaving for space compare with the sunlight absorbed?',
        options: ['They are equal again', 'Less leaves than is absorbed, permanently', 'More leaves than is absorbed'],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Raise infrared absorption to 90% or more, then wait until the imbalance is under 1 W/m².',
        evaluate: (p, m) => {
          if (m.tempK === undefined) return WAITING
          return {
            passed: (p.absorbPct ?? 78) >= 90 && Math.abs(m.imbalance) < 1,
            feedback: `Absorbed ${fmt(m.absorbed)} W/m², leaving ${fmt(m.toSpace)} W/m², imbalance ${fmt(m.imbalance, 1)} W/m² at ${fmt(m.tempK, 1)} K.`,
          }
        },
      },
      explain:
        'Extra absorption first cuts the infrared escaping to space, so the planet gains energy and warms. A warmer surface radiates more, and warming stops when outgoing infrared again equals absorbed sunlight. The balance is the same; the surface temperature needed to reach it is higher.',
      misconceptionTag: 'greenhouse-traps-heat-forever',
    },
    {
      id: 'albedo-cooling',
      title: 'A Brighter Planet',
      setupParams: { absorbPct: 78, albedo: 0.3, sunPct: 100 },
      predict: {
        prompt: 'Ice and cloud cover grow so the planet reflects 40% of sunlight instead of 30%. What happens to the surface temperature?',
        options: ['It falls', 'It rises, because reflected light heats the air', 'It stays the same'],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Set albedo to 0.40 or higher (absorption 78%, Sun 100%) and let the surface settle to within 1 K of balance.',
        evaluate: (p, m) => {
          if (m.tempK === undefined) return WAITING
          return {
            passed:
              (p.albedo ?? 0.3) >= 0.4 &&
              (p.absorbPct ?? 78) === 78 &&
              (p.sunPct ?? 100) === 100 &&
              Math.abs(m.tempK - m.eqTempK) < 1,
            feedback: `Surface ${fmt(m.tempK, 1)} K (${celsius(m.tempK)}) with ${fmt(m.absorbed)} W/m² absorbed.`,
          }
        },
      },
      explain:
        'Reflected sunlight leaves without being absorbed, so less energy comes in and the surface cools until it radiates less to match. Because ice is bright, cooling that grows ice raises albedo and cools further: the ice-albedo feedback. It runs in reverse when ice melts.',
      misconceptionTag: 'albedo-reflected-light-warms',
    },
  ],
  build: (ctx, initial) => {
    const { quality } = ctx
    let temp = solve(initial).eqTemp
    let clock = 0
    let sinceSample = 0
    let history: { t: number; temp: number }[] = [{ t: 0, temp }]
    const photons: Photon[] = []
    let solarDebt = 0
    let irDebt = 0
    let seed = 7

    // Small deterministic generator: the photon shower looks the same on every run.
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }

    const photonRate = Math.max(4, quality.count(16))
    const maxPhotons = Math.max(30, quality.count(150))
    const stars = Array.from({ length: quality.count(60) }, (_, i) => ({
      x: (i * 151 + 29) % SCENE_W,
      y: 4 + ((i * 37) % (SPACE_Y - 8)),
      r: 0.5 + ((i * 13) % 10) / 14,
      phase: i * 2.1,
    }))
    const molecules = Array.from({ length: quality.count(46) }, (_, i) => ({
      x: 8 + ((i * 89 + 17) % (SCENE_W - 16)),
      y: BAND_TOP + 8 + ((i * 47) % (BAND_BOTTOM - BAND_TOP - 16)),
      phase: i * 1.3,
    }))

    const resetState = (p: Params) => {
      temp = solve(p).eqTemp
      clock = 0
      sinceSample = 0
      history = [{ t: 0, temp }]
      photons.length = 0
      solarDebt = 0
      irDebt = 0
    }

    const hotspots: Hotspot2D[] = [
      {
        id: 'sunlight',
        label: 'Sunlight',
        title: 'Incoming sunlight',
        body: 'Averaged over the whole spinning globe, about 340 W/m² of sunlight arrives. It is mostly visible light, which the atmosphere’s greenhouse gases let through.',
        x: X_SUN,
        y: 112,
      },
      {
        id: 'albedo',
        label: 'Reflected',
        title: 'Albedo',
        body: 'Clouds, ice and bright surfaces reflect part of the sunlight straight back to space. Earth’s albedo is about 0.3. Reflected light is never absorbed, so it does not warm the planet.',
        x: X_REFLECT,
        y: 300,
      },
      {
        id: 'surface',
        label: 'Surface',
        title: 'The surface radiates infrared',
        body: 'A warm surface emits infrared radiation at a rate σT⁴. Raising the temperature a little raises the emission a lot, which is what lets the planet find a new balance.',
        x: X_SURFACE_IR,
        y: GROUND_Y + 30,
      },
      {
        id: 'atmosphere',
        label: 'Atmosphere',
        title: 'Greenhouse gases absorb and re-emit',
        body: 'Water vapour, carbon dioxide and methane absorb infrared and re-emit it in all directions. Half of what this layer emits heads back down, so the surface receives more energy than sunlight alone provides.',
        x: 56,
        y: BAND_MID,
      },
      {
        id: 'space',
        label: 'To space',
        title: 'Infrared leaving for space',
        body: 'The only way a planet loses energy is by radiating to space. When this outflow equals the absorbed sunlight, the temperature holds steady.',
        x: X_ATM_UP,
        y: 40,
      },
    ]

    return {
      hotspots,
      reset: (p) => resetState(p),
      update: (p, dt) => {
        const step = Math.min(dt, 0.1)
        if (step <= 0) return
        const f = fluxes(p, temp)
        temp = Math.max(150, Math.min(400, temp + (f.imbalance / HEAT_CAPACITY) * step))
        clock += step
        sinceSample += step
        if (sinceSample >= HISTORY_STEP_S) {
          sinceSample = 0
          history.push({ t: clock, temp })
          while (history.length > 2 && history[0].t < clock - HISTORY_SPAN_S) history.shift()
        }

        solarDebt += (photonRate * step * f.incoming) / 340
        irDebt += (photonRate * step * f.surfaceIr) / 340
        while (solarDebt >= 1) {
          solarDebt -= 1
          if (photons.length < maxPhotons) {
            photons.push({ x: 70 + rand() * 140, y: -4, vy: 190, solar: true, checked: true, phase: rand() * 6 })
          }
        }
        while (irDebt >= 1) {
          irDebt -= 1
          if (photons.length < maxPhotons) {
            photons.push({ x: 232 + rand() * 216, y: GROUND_Y, vy: -130, solar: false, checked: false, phase: rand() * 6 })
          }
        }
        for (let i = photons.length - 1; i >= 0; i -= 1) {
          const ph = photons[i]
          ph.y += ph.vy * step
          if (ph.solar) {
            if (ph.vy > 0 && ph.y >= GROUND_Y) {
              if (rand() < f.albedo) {
                ph.vy = -190
                ph.y = GROUND_Y
              } else {
                photons.splice(i, 1)
              }
            } else if (ph.y < -8) {
              photons.splice(i, 1)
            }
            continue
          }
          if (!ph.checked && ph.y <= BAND_MID) {
            ph.checked = true
            if (rand() < f.absorb && rand() < 0.5) ph.vy = 130
          }
          if (ph.y < -8 || (ph.vy > 0 && ph.y >= GROUND_Y)) photons.splice(i, 1)
        }
      },
      renderCanvas: (c, p, elapsed, reducedMotion) => {
        const f = fluxes(p, temp)
        const showFlows = (p.showFlows ?? 1) >= 0.5

        // Sky: space above, air below.
        if (quality.rich) {
          const sky = c.createLinearGradient(0, 0, 0, GROUND_Y)
          sky.addColorStop(0, '#020617')
          sky.addColorStop(0.22, '#0b1b3a')
          sky.addColorStop(0.6, '#1d4f7a')
          sky.addColorStop(1, '#5b9fc4')
          c.fillStyle = sky
          c.fillRect(0, 0, SCENE_W, GROUND_Y)
        } else {
          c.fillStyle = '#12304f'
          c.fillRect(0, 0, SCENE_W, GROUND_Y)
          c.fillStyle = '#020617'
          c.fillRect(0, 0, SCENE_W, SPACE_Y)
        }
        c.fillStyle = PALETTE_CSS.white
        for (const star of stars) {
          const tw = reducedMotion ? 0.7 : 0.5 + 0.5 * Math.sin(elapsed * 1.2 + star.phase)
          c.globalAlpha = 0.35 + 0.5 * tw
          c.fillRect(star.x, star.y, star.r * 1.6, star.r * 1.6)
        }
        c.globalAlpha = 1

        // Sun.
        c.save()
        if (quality.glow) {
          c.shadowColor = SOLAR_COLOR
          c.shadowBlur = 34
        }
        if (quality.rich) {
          const sun = c.createRadialGradient(34, 30, 4, 34, 30, 30)
          sun.addColorStop(0, '#fffbeb')
          sun.addColorStop(0.55, '#fcd34d')
          sun.addColorStop(1, '#f59e0b')
          c.fillStyle = sun
        } else {
          c.fillStyle = '#fcd34d'
        }
        c.beginPath()
        c.arc(34, 30, 20 + (f.sunPct - 100) * 0.2, 0, Math.PI * 2)
        c.fill()
        c.restore()

        // Absorbing layer: more opaque as it absorbs more infrared.
        const bandAlpha = 0.08 + 0.42 * f.absorb
        if (quality.rich) {
          const band = c.createLinearGradient(0, BAND_TOP, 0, BAND_BOTTOM)
          band.addColorStop(0, 'rgba(251, 113, 133, 0)')
          band.addColorStop(0.5, `rgba(251, 113, 133, ${bandAlpha})`)
          band.addColorStop(1, 'rgba(251, 113, 133, 0)')
          c.fillStyle = band
        } else {
          c.fillStyle = `rgba(251, 113, 133, ${bandAlpha * 0.6})`
        }
        c.fillRect(0, BAND_TOP, SCENE_W, BAND_BOTTOM - BAND_TOP)
        const shown = Math.round(molecules.length * f.absorb)
        for (let i = 0; i < shown; i += 1) {
          const m = molecules[i]
          const wob = reducedMotion ? 0 : Math.sin(elapsed * 2.2 + m.phase) * 2
          c.fillStyle = 'rgba(254, 205, 211, 0.85)'
          c.beginPath()
          c.arc(m.x + wob, m.y, 2.6, 0, Math.PI * 2)
          c.fill()
          c.fillStyle = 'rgba(253, 164, 175, 0.85)'
          c.beginPath()
          c.arc(m.x + wob - 4, m.y + 1, 1.8, 0, Math.PI * 2)
          c.arc(m.x + wob + 4, m.y + 1, 1.8, 0, Math.PI * 2)
          c.fill()
        }

        // Ground, tinted by temperature.
        const tint = groundColor(temp)
        if (quality.rich) {
          const ground = c.createLinearGradient(0, GROUND_Y, 0, VIEW_H)
          ground.addColorStop(0, tint)
          ground.addColorStop(1, '#0f172a')
          c.fillStyle = ground
        } else {
          c.fillStyle = tint
        }
        c.beginPath()
        c.moveTo(0, GROUND_Y)
        for (let x = 0; x <= SCENE_W; x += 18) {
          c.lineTo(x, GROUND_Y - 5 - 5 * Math.sin(x * 0.021) - 3 * Math.sin(x * 0.057 + 1))
        }
        c.lineTo(SCENE_W, VIEW_H)
        c.lineTo(0, VIEW_H)
        c.closePath()
        c.fill()

        // Energy flows. Arrow width is proportional to W/m².
        if (showFlows) {
          const a = quality.rich ? 0.5 : 0.62
          fluxArrow(c, X_SUN, 58, GROUND_Y - 12, f.incoming, SOLAR_COLOR, a)
          fluxArrow(c, X_REFLECT, GROUND_Y - 12, 14, f.reflected, SOLAR_COLOR, a * 0.8)
          fluxArrow(c, X_SURFACE_IR, GROUND_Y - 12, BAND_MID + 6, f.surfaceIr, IR_COLOR, a)
          fluxArrow(c, X_SURFACE_IR, BAND_MID - 6, 14, f.window, IR_COLOR, a)
          fluxArrow(c, X_ATM_UP, BAND_MID - 6, 14, f.atmUp, IR_COLOR, a)
          fluxArrow(c, X_BACK, BAND_MID + 6, GROUND_Y - 12, f.back, IR_COLOR, a)
        }

        // Photons: yellow sunlight, red infrared.
        if (!reducedMotion) {
          c.save()
          if (quality.glow) c.shadowBlur = 8
          for (const ph of photons) {
            const color = ph.solar ? SOLAR_COLOR : IR_COLOR
            const freq = ph.solar ? 0.16 : 0.08
            const amp = ph.solar ? 2.5 : 4
            const wig = Math.sin(ph.y * freq + ph.phase) * amp
            if (quality.glow) c.shadowColor = color
            if (quality.rich) {
              const tail = ph.vy > 0 ? -12 : 12
              c.strokeStyle = color
              c.globalAlpha = 0.5
              c.lineWidth = 1.4
              c.beginPath()
              c.moveTo(ph.x + wig, ph.y)
              c.lineTo(ph.x + Math.sin((ph.y + tail) * freq + ph.phase) * amp, ph.y + tail)
              c.stroke()
              c.globalAlpha = 1
            }
            c.fillStyle = color
            c.beginPath()
            c.arc(ph.x + wig, ph.y, 2.4, 0, Math.PI * 2)
            c.fill()
          }
          c.restore()
        }

        if (showFlows) {
          label(c, `Sunlight ${fmt(f.incoming)}`, X_SUN, 132, '#fde68a')
          label(c, `Reflected ${fmt(f.reflected)}`, X_REFLECT + 4, 322, '#fde68a')
          label(c, `Surface emits ${fmt(f.surfaceIr)}`, X_SURFACE_IR, 300, '#fecdd3')
          if (f.window >= 1) label(c, `Through ${fmt(f.window)}`, X_SURFACE_IR, 100, '#fecdd3')
          if (f.atmUp >= 1) label(c, `Air to space ${fmt(f.atmUp)}`, X_ATM_UP + 22, 124, '#fecdd3')
          if (f.back >= 1) label(c, `Back to surface ${fmt(f.back)}`, X_BACK, 268, '#fecdd3')
        }
        label(c, 'SPACE', SCENE_W - 8, 16, PALETTE_CSS.slate, 'right')
        label(c, `ATMOSPHERE absorbs ${fmt(f.absorb * 100)}% of infrared`, 8, BAND_TOP - 5, '#fda4af', 'left')
        label(c, `SURFACE  ${fmt(temp, 1)} K  (${celsius(temp)})`, 10, VIEW_H - 14, PALETTE_CSS.white, 'left', 12)

        drawPanel(c, f, temp, clock, history, quality.rich, quality.glow)
      },
      readouts: (p) => {
        const f = fluxes(p, temp)
        return [
          { label: 'Surface temperature', value: `${fmt(temp, 1)} K (${celsius(temp)})` },
          { label: 'Balance temperature', value: `${fmt(f.eqTemp, 1)} K (${celsius(f.eqTemp)})` },
          { label: 'Sunlight absorbed', value: `${fmt(f.absorbed)} W/m²` },
          { label: 'Infrared to space', value: `${fmt(f.toSpace)} W/m²` },
          { label: 'Back-radiation to surface', value: `${fmt(f.back)} W/m²` },
          { label: 'Imbalance (in − out)', value: `${signed(f.imbalance)} W/m²` },
        ]
      },
      metrics: (p) => {
        const f = fluxes(p, temp)
        return {
          tempK: temp,
          eqTempK: f.eqTemp,
          absorbed: f.absorbed,
          toSpace: f.toSpace,
          back: f.back,
          surfaceIr: f.surfaceIr,
          imbalance: f.imbalance,
        }
      },
    }
  },
}

export default function GreenhouseEffect2D() {
  return <Interactive2DViewer model={greenhouseEffect2dModel} />
}
