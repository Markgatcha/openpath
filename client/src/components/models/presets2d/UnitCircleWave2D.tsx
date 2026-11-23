import { Interactive2DViewer } from '../Interactive2DViewer'
import {
  PALETTE_CSS,
  drawCurve2D,
  drawPlotAxes2D,
  plotMapX,
  plotMapY,
  type Model2DDefinition,
  type Params,
  type PlotBox,
} from '../engine2d'

const CX = 165
const CY = 230
const BASE_R = 86

const WAVE_BOX: PlotBox = {
  x: 345,
  y: 62,
  w: 346,
  h: 336,
  xMin: 0,
  xMax: 720,
  yMin: -2.2,
  yMax: 2.2,
}

function solveTrig(p: Params) {
  const deg = p.angleDeg ?? 45
  const amp = p.amplitude ?? 1.0
  const rad = (deg * Math.PI) / 180
  const cosV = Math.cos(rad)
  const sinV = Math.sin(rad)
  const tanV = Math.abs(cosV) > 1e-4 ? sinV / cosV : Infinity
  const normDeg = ((deg % 360) + 360) % 360
  const quadrant = normDeg < 90 ? 1 : normDeg < 180 ? 2 : normDeg < 270 ? 3 : 4
  return { deg, amp, rad, cosV, sinV, tanV, quadrant, normDeg }
}

export const unitCircleWave2dModel: Model2DDefinition = {
  id: 'unit-circle-wave-2d',
  title: 'Unit Circle & Unwrapped Sine/Cosine Waves',
  subtitle:
    'Drag the angle point around the unit circle and watch its signed y-height and x-projection unwrap continuously into sinusoidal waves.',
  viewWidth: 720,
  viewHeight: 460,
  initialPaused: true,
  params: [
    {
      kind: 'slider',
      id: 'angleDeg',
      label: 'Angle θ (degrees)',
      min: 0,
      max: 720,
      step: 5,
      initial: 45,
      unit: '°',
    },
    {
      kind: 'slider',
      id: 'amplitude',
      label: 'Radius / Amplitude A',
      min: 0.5,
      max: 2.0,
      step: 0.25,
      initial: 1.0,
    },
    {
      kind: 'toggle',
      id: 'showCos',
      label: 'Show cos(θ) wave & leg',
      initial: true,
    },
    {
      kind: 'toggle',
      id: 'showTan',
      label: 'Show tan(θ) vertical tangent',
      initial: false,
    },
  ],
  challenges: [
    {
      id: 'quadrant-3-both-negative',
      title: 'Where Are Both sin(θ) and cos(θ) Negative?',
      setupParams: { angleDeg: 45, amplitude: 1.0, showCos: 1 },
      predict: {
        prompt:
          'Starting at θ = 45° (Quadrant I), rotating into which quadrant makes BOTH x = cos(θ) < 0 and y = sin(θ) < 0?',
        options: [
          'Quadrant III (180° < θ < 270°), below and left of the origin',
          'Quadrant II (90° < θ < 180°)',
          'Quadrant IV (270° < θ < 360°)',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Drag the circle handle (or slide θ) into Quadrant III so cos(θ) < -0.3 and sin(θ) < -0.3.',
        evaluate: (_p, m) => ({
          passed: m.cosV < -0.3 && m.sinV < -0.3,
          feedback: `cos θ = ${m.cosV.toFixed(2)}, sin θ = ${m.sinV.toFixed(2)} (Quadrant ${m.quadrant}).`,
        }),
      },
      explain:
        'On the unit circle, cos(θ) is simply horizontal position x and sin(θ) is vertical height y. Only Quadrant III lies both left of 0 (x < 0) and below 0 (y < 0).',
      misconceptionTag: 'trig-signs-memorized-without-coordinates',
    },
    {
      id: 'sin-equals-cos-crossover',
      title: 'Matching sin(θ) and cos(θ)',
      setupParams: { angleDeg: 15, amplitude: 1.0, showCos: 1 },
      predict: {
        prompt:
          'At what acute angle θ ∈ (0°, 90°) do the sine and cosine curves cross with identical positive values (√2/2 ≈ 0.707)?',
        options: ['θ = 45° (π/4 radians)', 'θ = 30° (π/6 radians)', 'θ = 90° (π/2 radians)'],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Move θ in Quadrant I until |sin(θ) − cos(θ)| < 0.02 and both are positive.',
        evaluate: (_p, m) => ({
          passed: m.sinV > 0.5 && m.cosV > 0.5 && Math.abs(m.sinV - m.cosV) < 0.02,
          feedback: `At θ = ${m.deg}°, sin = ${m.sinV.toFixed(3)}, cos = ${m.cosV.toFixed(3)}.`,
        }),
      },
      explain:
        'At 45° (π/4), the terminal triangle is isosceles (equal opposite and adjacent legs), so sin(45°) = cos(45°) = √2/2 ≈ 0.707.',
      misconceptionTag: 'sine-cosine-phase-confusion',
    },
  ],
  build: () => ({
    dragHandles: [
      {
        id: 'terminal-point',
        label: 'Unit circle angle point',
        color: PALETTE_CSS.amber,
        getPos: (p) => {
          const t = solveTrig(p)
          const rPx = BASE_R * Math.min(1.5, Math.max(0.5, t.amp * 0.72))
          return { x: CX + rPx * t.cosV, y: CY - rPx * t.sinV }
        },
        onDrag: (px, py, p) => {
          const raw = Math.atan2(CY - py, px - CX)
          let deg = Math.round(((raw >= 0 ? raw : raw + Math.PI * 2) * 180) / Math.PI / 5) * 5
          if ((p.angleDeg ?? 0) > 360) deg += 360
          return { angleDeg: Math.max(0, Math.min(720, deg)) }
        },
        ariaValueText: (p) => `θ = ${p.angleDeg}°`,
      },
    ],
    update: (p, dt) => {
      if (dt <= 0) return
      p.angleDeg = ((p.angleDeg ?? 0) + dt * 36) % 720
    },
    hotspots: [
      {
        id: 'unit-radius',
        label: 'Terminal Point (cos, sin)',
        x: 225,
        y: 170,
        title: 'Coordinates (A cos θ, A sin θ)',
        body: 'Trigonometric values are signed Cartesian coordinates on the circle: cos θ is horizontal x; sin θ is vertical y.',
      },
      {
        id: 'projection-bridge',
        label: 'Height Projection',
        x: 345,
        y: 170,
        title: 'Unwrapping Vertical Height to Wave',
        body: 'The dashed emerald horizontal link projects the point’s exact y-height directly onto the sine wave at angle θ.',
      },
      {
        id: 'phase-shift',
        label: '90° Phase Shift',
        x: 470,
        y: 120,
        title: 'Why cos(θ) = sin(θ + 90°)',
        body: 'Cosine starts at its peak +A at θ = 0° while Sine starts at 0, putting them exactly a quarter-cycle (90° or π/2) out of phase.',
      },
    ],
    renderCanvas: (ctx, p) => {
      const t = solveTrig(p)
      const rPx = BASE_R * Math.min(1.5, Math.max(0.5, t.amp * 0.72))

      ctx.save()
      // Left Circle Frame
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
      ctx.fillRect(22, 46, 286, 368)
      ctx.strokeRect(22, 46, 286, 368)
      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(`Unit Circle (Q${t.quadrant}) — θ = ${Math.round(t.deg)}° (${(t.rad / Math.PI).toFixed(2)}π)`, 26, 34)

      // Axes & circle
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(34, CY)
      ctx.lineTo(296, CY)
      ctx.moveTo(CX, 66)
      ctx.lineTo(CX, 394)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(CX, CY, rPx, 0, Math.PI * 2)
      ctx.stroke()

      const px = CX + rPx * t.cosV
      const py = CY - rPx * t.sinV

      // Adjacent leg (cos θ)
      if (p.showCos === 1) {
        ctx.strokeStyle = PALETTE_CSS.cyan
        ctx.lineWidth = 3.2
        ctx.beginPath()
        ctx.moveTo(CX, CY)
        ctx.lineTo(px, CY)
        ctx.stroke()
      }

      // Opposite leg (sin θ)
      ctx.strokeStyle = PALETTE_CSS.emerald
      ctx.lineWidth = 3.2
      ctx.beginPath()
      ctx.moveTo(px, CY)
      ctx.lineTo(px, py)
      ctx.stroke()

      // Hypotenuse radius
      ctx.strokeStyle = PALETTE_CSS.amber
      ctx.lineWidth = 2.6
      ctx.beginPath()
      ctx.moveTo(CX, CY)
      ctx.lineTo(px, py)
      ctx.stroke()

      // Tangent segment at x = CX + rPx
      if (p.showTan === 1 && Number.isFinite(t.tanV) && Math.abs(t.tanV) < 4) {
        const ty = CY - rPx * t.tanV
        ctx.strokeStyle = PALETTE_CSS.rose
        ctx.lineWidth = 2.6
        ctx.beginPath()
        ctx.moveTo(CX + rPx, CY)
        ctx.lineTo(CX + rPx, ty)
        ctx.stroke()
      }
      ctx.restore()

      // Right Wave Unwrap Plot
      drawPlotAxes2D(ctx, WAVE_BOX, {
        title: `Unwrapped Waves (0° to 720°) — A = ${t.amp.toFixed(2)}`,
        xLabel: 'Angle θ (°)',
        xTicks: 4,
        yTicks: 4,
        xFormat: (v) => `${Math.round(v)}°`,
      })

      if (p.showCos === 1) {
        drawCurve2D(ctx, WAVE_BOX, (deg) => t.amp * Math.cos((deg * Math.PI) / 180), PALETTE_CSS.cyan, 2.2, true)
      }
      drawCurve2D(ctx, WAVE_BOX, (deg) => t.amp * Math.sin((deg * Math.PI) / 180), PALETTE_CSS.emerald, 2.8)

      // Horizontal link from circle terminal y to unwrapped sine wave dot
      const wx = plotMapX(WAVE_BOX, t.deg)
      const wySin = plotMapY(WAVE_BOX, t.amp * t.sinV)
      const wyCos = plotMapY(WAVE_BOX, t.amp * t.cosV)
      ctx.save()
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(wx, wySin)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = PALETTE_CSS.emerald
      ctx.beginPath()
      ctx.arc(wx, wySin, 5, 0, Math.PI * 2)
      ctx.fill()

      if (p.showCos === 1) {
        ctx.fillStyle = PALETTE_CSS.cyan
        ctx.beginPath()
        ctx.arc(wx, wyCos, 4.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    },
    readouts: (p) => {
      const t = solveTrig(p)
      return [
        { label: 'Angle (rad)', value: `${t.rad.toFixed(3)} rad (${(t.rad / Math.PI).toFixed(2)}π)` },
        { label: 'A · sin(θ)', value: (t.amp * t.sinV).toFixed(3) },
        { label: 'A · cos(θ)', value: (t.amp * t.cosV).toFixed(3) },
        { label: 'tan(θ)', value: Math.abs(t.tanV) > 99 ? 'Undefined' : t.tanV.toFixed(3) },
      ]
    },
    metrics: solveTrig,
  }),
}

export default function UnitCircleWave2D() {
  return <Interactive2DViewer model={unitCircleWave2dModel} />
}
