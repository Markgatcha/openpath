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
const PANEL_X = SCENE_W
const PANEL_W = VIEW_W - SCENE_W

const TANK_L = 44
const TANK_R = 444
const MEM_X = (TANK_L + TANK_R) / 2
const TANK_TOP = 96
const TANK_BOTTOM = 408
/** Liquid depth on each side when both hold 1.00 L. One pixel is drawn as one millimetre. */
const BASE_DEPTH = 180
const MAX_SHIFT = 110
const SOLUTE_R = 5

/** Membrane pore pattern: `PORE_GAP` px open out of every `PORE_PITCH` px. */
const PORE_PITCH = 24
const PORE_GAP = 11

/** Osmotic drive per unit concentration difference, against 1 unit of head per pixel of level shift. */
const OSMOTIC_GAIN = 4
const FLOW_RATE = 0.16
const HISTORY_SPAN_S = 40
const HISTORY_STEP_S = 0.25
const STEP_S = 0.5
const MAX_FRAMES = 120

const LEFT_COLOR = PALETTE_CSS.violet
const RIGHT_COLOR = PALETTE_CSS.amber
const WATER_COLOR = PALETTE_CSS.cyan
const SOLUTE_COLOR = PALETTE_CSS.rose

interface Dot {
  x: number
  y: number
  vx: number
  vy: number
}

/** Saved simulation state, so the viewer's step-back button can rewind. */
interface Frame {
  clock: number
  shift: number
  flow: number
  dots: number[]
}

interface Sample {
  t: number
  left: number
  right: number
}

function fmt(v: number, digits = 0): string {
  return v.toFixed(digits)
}

function signed(v: number, digits = 1): string {
  const r = Number(v.toFixed(digits))
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r).toFixed(digits)}`
}

function osmosisOnly(p: Params): boolean {
  return Math.round(p.membrane ?? 0) === 1
}

function inPore(y: number): boolean {
  return (((y - TANK_TOP) % PORE_PITCH) + PORE_PITCH) % PORE_PITCH < PORE_GAP
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

interface Snapshot {
  left: number
  right: number
  leftConc: number
  rightConc: number
  /** mL/s, positive toward the left side. */
  waterFlow: number
  levelDiffCm: number
  tempK: number
}

/** Right-hand panel: concentration bars and the concentration history of both sides. */
function drawPanel(
  ctx: CanvasRenderingContext2D,
  s: Snapshot,
  clock: number,
  history: Sample[],
  waterOnly: boolean,
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

  const left = PANEL_X + 16
  const barW = PANEL_W - 32
  const points: Sample[] = [...history, { t: clock, left: s.leftConc, right: s.rightConc }]
  const peak = Math.max(20, ...points.map((pt) => Math.max(pt.left, pt.right)))
  label(ctx, 'CONCENTRATION (particles/L)', left, 22, PALETTE_CSS.slate, 'left')
  const bars = [
    { name: 'Left side', value: s.leftConc, color: LEFT_COLOR },
    { name: 'Right side', value: s.rightConc, color: RIGHT_COLOR },
  ]
  bars.forEach((bar, i) => {
    const y = 34 + i * 40
    label(ctx, bar.name, left, y + 9, PALETTE_CSS.white, 'left')
    label(ctx, fmt(bar.value, 1), left + barW, y + 9, bar.color, 'right')
    ctx.fillStyle = 'rgba(148, 163, 184, 0.18)'
    ctx.fillRect(left, y + 15, barW, 10)
    ctx.save()
    if (glow) {
      ctx.shadowColor = bar.color
      ctx.shadowBlur = 10
    }
    ctx.fillStyle = bar.color
    ctx.fillRect(left, y + 15, (barW * Math.min(peak, bar.value)) / peak, 10)
    ctx.restore()
  })

  const gap = Math.abs(s.leftConc - s.rightConc)
  const flowing = Math.abs(s.waterFlow) >= 1
  let state = 'Concentrations equal'
  let steady = true
  if (!waterOnly) {
    // Counts fluctuate at equilibrium, so allow the same margin the challenge uses.
    steady = !flowing && Math.abs(s.left - s.right) <= 8
    state = steady ? 'Mixed: crossings balance' : 'Solute is diffusing'
  } else if (flowing) {
    steady = false
    state = 'Water is moving'
  } else if (gap >= 3) {
    state = 'Held apart by the level difference'
  }
  label(ctx, state, left, 132, steady ? PALETTE_CSS.emerald : WATER_COLOR, 'left', 11)

  const tEnd = Math.max(clock, HISTORY_SPAN_S)
  const box: PlotBox = {
    x: PANEL_X + 44,
    y: 176,
    w: PANEL_W - 60,
    h: 210,
    xMin: tEnd - HISTORY_SPAN_S,
    xMax: tEnd,
    yMin: 0,
    yMax: peak * 1.1,
  }
  drawPlotAxes2D(ctx, box, {
    title: 'Concentration over time',
    xLabel: 'time (s)',
    yLabel: 'particles/L',
    xTicks: 4,
    yTicks: 4,
    xFormat: (v) => v.toFixed(0),
    yFormat: (v) => v.toFixed(0),
  })
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.w, box.h)
  ctx.clip()
  const lines: { key: 'left' | 'right'; color: string }[] = [
    { key: 'left', color: LEFT_COLOR },
    { key: 'right', color: RIGHT_COLOR },
  ]
  for (const line of lines) {
    if (glow) {
      ctx.shadowColor = line.color
      ctx.shadowBlur = 8
    }
    ctx.strokeStyle = line.color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.beginPath()
    points.forEach((pt, i) => {
      const x = plotMapX(box, pt.t)
      const y = plotMapY(box, pt[line.key])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }
  ctx.restore()
}

/** The viewer evaluates a challenge once before the scene has reported metrics. */
const WAITING = { passed: false, feedback: 'Starting the simulation…' }

export const diffusionOsmosis2dModel: Model2DDefinition = {
  id: 'diffusion-osmosis-2d',
  title: 'Diffusion & Osmosis: Particles Across a Membrane',
  subtitle:
    'Random particle motion evens out a concentration difference. Block the solute and water moves instead, until the raised level pushes back.',
  viewWidth: VIEW_W,
  viewHeight: VIEW_H,
  params: [
    {
      kind: 'choice',
      id: 'membrane',
      label: 'Membrane',
      choices: ['Lets solute through (diffusion)', 'Water only (osmosis)'],
      initial: 0,
    },
    { kind: 'slider', id: 'soluteLeft', label: 'Solute added to the left', min: 0, max: 40, step: 1, initial: 30, unit: ' particles' },
    { kind: 'slider', id: 'soluteRight', label: 'Solute added to the right', min: 0, max: 40, step: 1, initial: 6, unit: ' particles' },
    { kind: 'slider', id: 'tempK', label: 'Temperature', min: 275, max: 350, step: 5, initial: 300, unit: ' K' },
  ],
  challenges: [
    {
      id: 'diffusion-equalises',
      title: 'Where Do the Particles End Up?',
      setupParams: { membrane: 0, soluteLeft: 36, soluteRight: 0, tempK: 300 },
      predict: {
        prompt:
          'All 36 solute particles start on the left of a membrane they can pass through. After a long time, what will you see?',
        options: [
          'All of them on the right, because they move away from the crowded side',
          'About half on each side, with particles still crossing both ways',
          'About half on each side, and then every particle stops moving',
        ],
        correctIndex: 1,
      },
      manipulate: {
        instruction:
          'Keep the membrane on “Lets solute through”, start with at least 30 particles on one side and none on the other, and run until the two sides are within 8 particles of each other.',
        evaluate: (p, m) => {
          if (m.leftCount === undefined) return WAITING
          const lopsided =
            ((p.soluteLeft ?? 0) >= 30 && (p.soluteRight ?? 0) === 0) ||
            ((p.soluteRight ?? 0) >= 30 && (p.soluteLeft ?? 0) === 0)
          return {
            passed: !osmosisOnly(p) && lopsided && Math.abs(m.leftCount - m.rightCount) <= 8,
            feedback: `${fmt(m.leftCount)} on the left, ${fmt(m.rightCount)} on the right.`,
          }
        },
      },
      explain:
        'No particle “knows” where the crowd is. Each one moves at random, but while the left holds more particles, more of them happen to hit a pore from the left than from the right. The net flow shrinks as the counts even out and reaches zero at equilibrium, although individual particles keep crossing in both directions.',
      misconceptionTag: 'diffusion-particles-stop-at-equilibrium',
    },
    {
      id: 'osmosis-direction',
      title: 'Which Way Does the Water Go?',
      setupParams: { membrane: 1, soluteLeft: 30, soluteRight: 10, tempK: 300 },
      predict: {
        prompt:
          'The membrane now lets only water through. The left side holds 30 solute particles and the right holds 10. Which way is the net flow of water?',
        options: [
          'Toward the right, the side with less solute',
          'Neither way, because the solute cannot cross',
          'Toward the left, the side with more solute',
        ],
        correctIndex: 2,
      },
      manipulate: {
        instruction:
          'On “Water only”, set the solute so the right-hand level settles at least 3 cm above the left-hand level.',
        evaluate: (p, m) => {
          if (m.levelDiffCm === undefined) return WAITING
          return {
            passed: osmosisOnly(p) && -m.levelDiffCm >= 3 && Math.abs(m.waterFlow) < 1,
            feedback: `Right level is ${signed(-m.levelDiffCm)} cm relative to the left; net water flow ${fmt(Math.abs(m.waterFlow))} mL/s.`,
          }
        },
      },
      explain:
        'Water moves toward the more concentrated solution, where water itself is less concentrated. As that side rises, the extra depth pushes water back through the membrane. The level stops rising when this pressure balances the osmotic pull: that balancing pressure is the osmotic pressure.',
      misconceptionTag: 'osmosis-water-moves-to-lower-solute',
    },
    {
      id: 'isotonic-balance',
      title: 'Equal Concentrations',
      setupParams: { membrane: 1, soluteLeft: 30, soluteRight: 10, tempK: 300 },
      predict: {
        prompt: 'With a water-only membrane and the same solute concentration on both sides, what happens?',
        options: [
          'Water crosses equally in both directions, so the levels stay put',
          'Water stops crossing the membrane entirely',
          'Water flows toward whichever side was filled first',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'On “Water only”, put the same amount of solute (10 particles or more) on each side and let the levels settle within 0.3 cm of each other.',
        evaluate: (p, m) => {
          if (m.levelDiffCm === undefined) return WAITING
          return {
            passed:
              osmosisOnly(p) &&
              (p.soluteLeft ?? 0) >= 10 &&
              (p.soluteLeft ?? 0) === (p.soluteRight ?? 0) &&
              Math.abs(m.levelDiffCm) < 0.3,
            feedback: `Level difference ${signed(m.levelDiffCm)} cm; concentrations ${fmt(m.leftConc, 1)} and ${fmt(m.rightConc, 1)} particles/L.`,
          }
        },
      },
      explain:
        'Two solutions with the same solute concentration are isotonic. Water molecules still cross constantly, but as many go one way as the other, so there is no net flow. This is why fluids given into a vein are made isotonic with blood.',
      misconceptionTag: 'equilibrium-means-no-movement',
    },
  ],
  build: (ctx, initial) => {
    const { quality } = ctx
    let seed = 11
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }

    /** Level shift in pixels: positive raises the left side and lowers the right. */
    let shift = 0
    let flow = 0
    let clock = 0
    let sinceSample = 0
    let seededLeft = -1
    let seededRight = -1
    const solute: Dot[] = []
    let history: Sample[] = []
    const water: Dot[] = []
    let frames: Frame[] = []
    const waterCount = quality.count(90)

    const surfaceY = (left: boolean) => TANK_BOTTOM - BASE_DEPTH - (left ? shift : -shift)
    const depth = (left: boolean) => BASE_DEPTH + (left ? shift : -shift)
    const isLeft = (d: Dot) => d.x < MEM_X
    const countLeft = () => solute.reduce((n, d) => n + (isLeft(d) ? 1 : 0), 0)
    const conc = (count: number, left: boolean) => (count * BASE_DEPTH) / depth(left)

    const spawn = (left: boolean, speed: number): Dot => {
      const angle = rand() * Math.PI * 2
      const x0 = left ? TANK_L : MEM_X
      return {
        x: x0 + 10 + rand() * (MEM_X - TANK_L - 20),
        y: surfaceY(left) + 10 + rand() * (depth(left) - 20),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      }
    }

    const saveFrame = () => {
      frames.push({ clock, shift, flow, dots: solute.flatMap((d) => [d.x, d.y, d.vx, d.vy]) })
      if (frames.length > MAX_FRAMES) frames.shift()
    }

    const reseed = (p: Params) => {
      seededLeft = Math.round(p.soluteLeft ?? 0)
      seededRight = Math.round(p.soluteRight ?? 0)
      shift = 0
      flow = 0
      clock = 0
      sinceSample = 0
      solute.length = 0
      for (let i = 0; i < seededLeft; i += 1) solute.push(spawn(true, 90))
      for (let i = 0; i < seededRight; i += 1) solute.push(spawn(false, 90))
      history = [{ t: 0, left: seededLeft, right: seededRight }]
      water.length = 0
      for (let i = 0; i < waterCount; i += 1) water.push(spawn(i % 2 === 0, 34))
      frames = []
      saveFrame()
    }
    reseed(initial)

    /** The viewer does not call `update` while paused, so every entry point checks the solute sliders. */
    const sync = (p: Params) => {
      if (Math.round(p.soluteLeft ?? 0) !== seededLeft || Math.round(p.soluteRight ?? 0) !== seededRight) {
        reseed(p)
      }
    }

    /** Move one particle; `crosses` says whether it may pass through a membrane pore. */
    const move = (d: Dot, dt: number, radius: number, crosses: boolean) => {
      const wasLeft = isLeft(d)
      d.x += d.vx * dt
      d.y += d.vy * dt
      const crossed = wasLeft ? d.x + radius > MEM_X : d.x - radius < MEM_X
      if (crossed) {
        const farSurface = surfaceY(!wasLeft)
        const allowed = crosses && inPore(d.y) && d.y - radius > farSurface
        if (allowed) {
          // Carry the particle clear of the membrane so it is counted on the far side.
          d.x = wasLeft ? MEM_X + radius + 0.5 : MEM_X - radius - 0.5
        } else {
          d.x = wasLeft ? MEM_X - radius : MEM_X + radius
          d.vx = -d.vx
        }
      }
      const left = isLeft(d)
      const minX = (left ? TANK_L : MEM_X) + radius
      const maxX = (left ? MEM_X : TANK_R) - radius
      if (!crossed) {
        if (d.x < minX) {
          d.x = minX
          d.vx = Math.abs(d.vx)
        } else if (d.x > maxX) {
          d.x = maxX
          d.vx = -Math.abs(d.vx)
        }
      }
      const top = surfaceY(left) + radius
      if (d.y < top) {
        d.y = top
        d.vy = Math.abs(d.vy)
      } else if (d.y > TANK_BOTTOM - radius) {
        d.y = TANK_BOTTOM - radius
        d.vy = -Math.abs(d.vy)
      }
    }

    const snapshot = (p: Params): Snapshot => {
      const left = countLeft()
      const right = solute.length - left
      return {
        left,
        right,
        leftConc: conc(left, true),
        rightConc: conc(right, false),
        // One side is 1.00 L at BASE_DEPTH; `flow` is in pixels of level per second.
        waterFlow: (flow / BASE_DEPTH) * 1000,
        levelDiffCm: (2 * shift) / 10,
        tempK: p.tempK ?? 300,
      }
    }

    const hotspots: Hotspot2D[] = [
      {
        id: 'membrane',
        label: 'Membrane',
        title: 'Selectively permeable membrane',
        body: 'A barrier with pores. Whether a particle crosses depends on its size and the pore: small water molecules pass, and larger solute particles pass only if the pores are wide enough. Cell membranes and dialysis tubing both work this way.',
        x: MEM_X,
        y: TANK_TOP + 14,
      },
      {
        id: 'solute',
        label: 'Solute',
        title: 'Solute particles',
        body: 'The dissolved substance, such as sugar or salt ions. Each particle moves in a straight line until it hits something, then heads off in a new direction. Concentration is the number of particles per litre of solution.',
        x: TANK_L + 70,
        y: TANK_BOTTOM - 60,
      },
      {
        id: 'level',
        label: 'Level',
        title: 'Liquid level and pressure',
        body: 'When water moves into one side its level rises. A taller column presses harder on the membrane, pushing water back. The level difference at balance measures the osmotic pressure.',
        x: TANK_R - 60,
        y: TANK_BOTTOM - BASE_DEPTH - 14,
      },
      {
        id: 'water',
        label: 'Water',
        title: 'Water molecules',
        body: 'The solvent. Water crosses the membrane in both directions all the time. Net flow is the difference between the two directions, and it points toward the side with the higher solute concentration.',
        x: MEM_X + 70,
        y: TANK_BOTTOM - 24,
      },
    ]

    const advance = (p: Params, step: number) => {
      if (step <= 0) return
      const temp = p.tempK ?? 300
      // Mean particle speed scales with the square root of absolute temperature.
      const speed = Math.sqrt(temp / 300)
      const waterOnly = osmosisOnly(p)
      for (const d of solute) move(d, step * speed, SOLUTE_R, !waterOnly)
      for (const d of water) move(d, step * speed, 1.6, true)

      const left = countLeft()
      const right = solute.length - left
      // A membrane the solute passes through cannot hold an osmotic difference.
      const pull = waterOnly ? OSMOTIC_GAIN * (conc(left, true) - conc(right, false)) : 0
      flow = FLOW_RATE * (temp / 300) * (pull - 2 * shift)
      const next = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, shift + flow * step))
      if (next === shift || Math.abs(next) === MAX_SHIFT) flow = 0
      shift = next

      clock += step
      sinceSample += step
      if (sinceSample >= HISTORY_STEP_S) {
        sinceSample = 0
        history.push({ t: clock, left: conc(left, true), right: conc(right, false) })
        while (history.length > 2 && history[0].t < clock - HISTORY_SPAN_S) history.shift()
      }
      if (clock - frames[frames.length - 1].clock >= STEP_S) saveFrame()
    }

    /** Step back to the last saved frame before the current instant. */
    const rewind = () => {
      while (frames.length > 1 && frames[frames.length - 1].clock >= clock - 1e-6) frames.pop()
      const frame = frames[frames.length - 1]
      solute.forEach((d, i) => {
        d.x = frame.dots[i * 4]
        d.y = frame.dots[i * 4 + 1]
        d.vx = frame.dots[i * 4 + 2]
        d.vy = frame.dots[i * 4 + 3]
      })
      shift = frame.shift
      flow = frame.flow
      clock = frame.clock
      sinceSample = 0
      while (history.length > 1 && history[history.length - 1].t > clock) history.pop()
    }

    return {
      hotspots,
      reset: (p) => reseed(p),
      actions: [{ id: 'restart', label: 'Restart run' }],
      update: (p, dt) => {
        sync(p)
        advance(p, Math.min(dt, 0.05))
      },
      step: (p, direction, actionId) => {
        sync(p)
        if (actionId === 'restart') {
          // Unlike Reset, this keeps the current sliders, so a run can be repeated at a new temperature.
          reseed(p)
        } else if (direction === 1) {
          for (let i = 0; i < 30; i += 1) advance(p, STEP_S / 30)
        } else {
          rewind()
        }
      },
      renderCanvas: (c, p, elapsed, reducedMotion) => {
        sync(p)
        const s = snapshot(p)
        const waterOnly = osmosisOnly(p)
        const yL = surfaceY(true)
        const yR = surfaceY(false)

        if (quality.rich) {
          const bg = c.createLinearGradient(0, 0, 0, VIEW_H)
          bg.addColorStop(0, '#0b1326')
          bg.addColorStop(1, '#020617')
          c.fillStyle = bg
        } else {
          c.fillStyle = '#0b1220'
        }
        c.fillRect(0, 0, SCENE_W, VIEW_H)
        c.fillStyle = 'rgba(148, 163, 184, 0.22)'
        c.fillRect(TANK_L - 24, TANK_BOTTOM + 3, TANK_R - TANK_L + 48, 5)

        // Liquid on each side, tinted by how concentrated it is.
        const sides: { x: number; y: number; concentration: number }[] = [
          { x: TANK_L, y: yL, concentration: s.leftConc },
          { x: MEM_X, y: yR, concentration: s.rightConc },
        ]
        for (const side of sides) {
          const w = MEM_X - TANK_L
          if (quality.rich) {
            const liquid = c.createLinearGradient(0, side.y, 0, TANK_BOTTOM)
            liquid.addColorStop(0, 'rgba(56, 189, 248, 0.34)')
            liquid.addColorStop(1, 'rgba(14, 116, 144, 0.5)')
            c.fillStyle = liquid
          } else {
            c.fillStyle = 'rgba(34, 150, 190, 0.4)'
          }
          c.fillRect(side.x, side.y, w, TANK_BOTTOM - side.y)
          c.fillStyle = `rgba(251, 113, 133, ${Math.min(0.3, side.concentration / 160)})`
          c.fillRect(side.x, side.y, w, TANK_BOTTOM - side.y)
          // Surface line, with a slow ripple when motion is allowed.
          c.strokeStyle = 'rgba(186, 230, 253, 0.9)'
          c.lineWidth = 2
          c.beginPath()
          if (quality.rich && !reducedMotion) {
            for (let x = 0; x <= w; x += 8) {
              const y = side.y + Math.sin(elapsed * 2 + (side.x + x) * 0.05) * 1.2
              if (x === 0) c.moveTo(side.x + x, y)
              else c.lineTo(side.x + x, y)
            }
          } else {
            c.moveTo(side.x, side.y)
            c.lineTo(side.x + w, side.y)
          }
          c.stroke()
        }

        // Starting level.
        c.save()
        c.strokeStyle = 'rgba(148, 163, 184, 0.6)'
        c.lineWidth = 1
        c.setLineDash([4, 5])
        c.beginPath()
        c.moveTo(TANK_L - 12, TANK_BOTTOM - BASE_DEPTH)
        c.lineTo(TANK_R + 12, TANK_BOTTOM - BASE_DEPTH)
        c.stroke()
        c.restore()

        c.fillStyle = WATER_COLOR
        c.globalAlpha = 0.5
        for (const d of water) c.fillRect(d.x - 1.2, d.y - 1.2, 2.4, 2.4)
        c.globalAlpha = 1

        c.save()
        if (quality.glow) {
          c.shadowColor = SOLUTE_COLOR
          c.shadowBlur = 9
        }
        c.fillStyle = SOLUTE_COLOR
        c.beginPath()
        for (const d of solute) {
          c.moveTo(d.x + SOLUTE_R, d.y)
          c.arc(d.x, d.y, SOLUTE_R, 0, Math.PI * 2)
        }
        c.fill()
        c.restore()
        if (quality.rich) {
          c.fillStyle = 'rgba(255, 241, 242, 0.75)'
          c.beginPath()
          for (const d of solute) {
            c.moveTo(d.x - 0.2, d.y - 1.7)
            c.arc(d.x - 1.6, d.y - 1.7, 1.4, 0, Math.PI * 2)
          }
          c.fill()
        }

        // Membrane: solid where it blocks, open at the pores.
        const memColor = waterOnly ? WATER_COLOR : PALETTE_CSS.amber
        c.save()
        if (quality.glow) {
          c.shadowColor = memColor
          c.shadowBlur = 8
        }
        c.strokeStyle = memColor
        c.lineWidth = 5
        c.lineCap = 'butt'
        c.beginPath()
        for (let y = TANK_TOP; y < TANK_BOTTOM; y += PORE_PITCH) {
          c.moveTo(MEM_X, Math.min(TANK_BOTTOM, y + PORE_GAP))
          c.lineTo(MEM_X, Math.min(TANK_BOTTOM, y + PORE_PITCH))
        }
        c.stroke()
        if (waterOnly) {
          // Narrow pores: drawn as a thin thread across each opening.
          c.lineWidth = 1.5
          c.globalAlpha = 0.7
          c.beginPath()
          c.moveTo(MEM_X, TANK_TOP)
          c.lineTo(MEM_X, TANK_BOTTOM)
          c.stroke()
        }
        c.restore()

        // Glass.
        c.save()
        c.strokeStyle = 'rgba(226, 232, 240, 0.7)'
        c.lineWidth = 3
        c.lineJoin = 'round'
        c.beginPath()
        c.moveTo(TANK_L, TANK_TOP - 8)
        c.lineTo(TANK_L, TANK_BOTTOM)
        c.lineTo(TANK_R, TANK_BOTTOM)
        c.lineTo(TANK_R, TANK_TOP - 8)
        c.stroke()
        if (quality.rich) {
          c.strokeStyle = 'rgba(255, 255, 255, 0.22)'
          c.lineWidth = 2
          c.beginPath()
          c.moveTo(TANK_L + 6, TANK_TOP)
          c.lineTo(TANK_L + 6, TANK_BOTTOM - 8)
          c.stroke()
        }
        c.restore()

        // Level difference bracket.
        if (Math.abs(shift) > 1.5) {
          const x = TANK_R + 16
          c.strokeStyle = PALETTE_CSS.emerald
          c.lineWidth = 1.5
          c.beginPath()
          c.moveTo(x - 5, yL)
          c.lineTo(x + 5, yL)
          c.moveTo(x, yL)
          c.lineTo(x, yR)
          c.moveTo(x - 5, yR)
          c.lineTo(x + 5, yR)
          c.stroke()
          label(c, `${fmt(Math.abs(s.levelDiffCm), 1)} cm`, x + 3, Math.min(yL, yR) - 8, PALETTE_CSS.emerald)
        }

        // Net water flow arrow across the membrane.
        if (Math.abs(s.waterFlow) >= 1) {
          const dir = s.waterFlow > 0 ? -1 : 1
          const len = Math.min(70, 18 + Math.abs(s.waterFlow) * 0.5)
          const y = TANK_BOTTOM - 34
          const tip = MEM_X + dir * len
          c.save()
          c.fillStyle = PALETTE_CSS.white
          c.globalAlpha = 0.9
          c.beginPath()
          c.moveTo(MEM_X - dir * len, y - 4)
          c.lineTo(tip - dir * 12, y - 4)
          c.lineTo(tip - dir * 12, y - 10)
          c.lineTo(tip, y)
          c.lineTo(tip - dir * 12, y + 10)
          c.lineTo(tip - dir * 12, y + 4)
          c.lineTo(MEM_X - dir * len, y + 4)
          c.closePath()
          c.fill()
          c.restore()
          label(c, 'net water flow', MEM_X, y - 16, PALETTE_CSS.white)
        }

        label(c, waterOnly ? 'WATER-ONLY MEMBRANE' : 'MEMBRANE LETS SOLUTE THROUGH', MEM_X, 26, memColor, 'center', 11)
        label(c, `LEFT  ${s.left} particles`, TANK_L, 56, LEFT_COLOR, 'left', 11)
        label(c, `${fmt(s.leftConc, 1)} particles/L`, TANK_L, 72, PALETTE_CSS.white, 'left')
        label(c, `RIGHT  ${s.right} particles`, TANK_R, 56, RIGHT_COLOR, 'right', 11)
        label(c, `${fmt(s.rightConc, 1)} particles/L`, TANK_R, 72, PALETTE_CSS.white, 'right')
        label(c, 'start level', TANK_L - 10, TANK_BOTTOM - BASE_DEPTH - 5, PALETTE_CSS.slate, 'left', 9)
        label(c, `${fmt(s.tempK)} K`, MEM_X, VIEW_H - 16, PALETTE_CSS.slate)

        drawPanel(c, s, clock, history, waterOnly, quality.rich, quality.glow)
      },
      readouts: (p) => {
        sync(p)
        const s = snapshot(p)
        const direction = Math.abs(s.waterFlow) < 1 ? 'none' : s.waterFlow > 0 ? 'toward the left' : 'toward the right'
        return [
          { label: 'Left concentration', value: `${fmt(s.leftConc, 1)} particles/L` },
          { label: 'Right concentration', value: `${fmt(s.rightConc, 1)} particles/L` },
          { label: 'Solute (left / right)', value: `${s.left} / ${s.right}` },
          { label: 'Left level − right level', value: `${signed(s.levelDiffCm)} cm` },
          { label: 'Net water flow', value: direction === 'none' ? 'none' : `${fmt(Math.abs(s.waterFlow))} mL/s ${direction}` },
        ]
      },
      metrics: (p) => {
        sync(p)
        const s = snapshot(p)
        return {
          leftCount: s.left,
          rightCount: s.right,
          leftConc: s.leftConc,
          rightConc: s.rightConc,
          levelDiffCm: s.levelDiffCm,
          waterFlow: s.waterFlow,
        }
      },
    }
  },
}

export default function DiffusionOsmosis2D() {
  return <Interactive2DViewer model={diffusionOsmosis2dModel} />
}
