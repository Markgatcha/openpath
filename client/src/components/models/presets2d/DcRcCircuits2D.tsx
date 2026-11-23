import { Interactive2DViewer } from '../Interactive2DViewer'
import {
  PALETTE_CSS,
  drawCurve2D,
  drawPlotAxes2D,
  type Model2DDefinition,
  type Params,
  type PlotBox,
} from '../engine2d'

interface CircuitState {
  mode: number // 0=Series, 1=Parallel, 2=RC Transient
  V: number
  R1: number
  R2: number
  C_F: number
  closed: boolean
  rEq: number
  iTotal: number
  i1: number
  i2: number
  v1: number
  v2: number
  tau: number
  vCap: number
}

function solveCircuit(p: Params, rcTime: number, vcSnapshot: number): CircuitState {
  const mode = Math.round(p.mode ?? 0)
  const V = p.voltage ?? 12
  const R1 = p.r1 ?? 100
  const R2 = p.r2 ?? 200
  const C_F = (p.capUf ?? 500) * 1e-6
  const closed = (p.switchClosed ?? 1) >= 0.5

  if (mode === 0) {
    const rEq = R1 + R2
    const iTotal = closed ? V / rEq : 0
    return {
      mode,
      V,
      R1,
      R2,
      C_F,
      closed,
      rEq,
      iTotal,
      i1: iTotal,
      i2: iTotal,
      v1: iTotal * R1,
      v2: iTotal * R2,
      tau: 0,
      vCap: 0,
    }
  }
  if (mode === 1) {
    const rEq = (R1 * R2) / (R1 + R2)
    const iTotal = closed ? V / rEq : 0
    const i1 = closed ? V / R1 : 0
    const i2 = closed ? V / R2 : 0
    return {
      mode,
      V,
      R1,
      R2,
      C_F,
      closed,
      rEq,
      iTotal,
      i1,
      i2,
      v1: closed ? V : 0,
      v2: closed ? V : 0,
      tau: 0,
      vCap: 0,
    }
  }
  // RC circuit (charges through R1 when closed; discharges through R2 when open)
  const tau = closed ? R1 * C_F : R2 * C_F
  const vCap = vcSnapshot
  const i1 = closed ? (V - vCap) / R1 : -vCap / R2
  void rcTime
  return {
    mode,
    V,
    R1,
    R2,
    C_F,
    closed,
    rEq: R1,
    iTotal: Math.abs(i1),
    i1,
    i2: 0,
    v1: closed ? V - vCap : vCap,
    v2: vCap,
    tau,
    vCap,
  }
}

function drawAmmeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  amps: number,
  col: string,
) {
  ctx.save()
  ctx.fillStyle = '#0f172a'
  ctx.strokeStyle = col
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 20, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = col
  ctx.font = 'bold 9px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(label, x, y - 4)
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 10px ui-monospace, monospace'
  ctx.fillText(`${(amps * 1000).toFixed(0)}mA`, x, y + 9)
  ctx.restore()
}

function drawResistor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string) {
  ctx.save()
  ctx.fillStyle = '#1e293b'
  ctx.strokeStyle = PALETTE_CSS.amber
  ctx.lineWidth = 2
  ctx.fillRect(x, y - 12, w, 24)
  ctx.strokeRect(x, y - 12, w, 24)
  ctx.fillStyle = '#fde68a'
  ctx.font = 'bold 11px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(label, x + w / 2, y + 4)
  ctx.restore()
}

const SCOPE_BOX: PlotBox = { x: 80, y: 292, w: 580, h: 126, xMin: 0, xMax: 0.4, yMin: 0, yMax: 24 }

export const dcRcCircuits2dModel: Model2DDefinition = {
  id: 'dc-rc-circuits-2d',
  title: 'DC Circuits & RC Transient Simulator',
  subtitle:
    'Observe charge conservation across series/parallel branches, Kirchhoff voltage drops, and exponential RC charging τ = RC.',
  viewWidth: 720,
  viewHeight: 460,
  supportsStep: true,
  params: [
    {
      kind: 'choice',
      id: 'mode',
      label: 'Topology',
      choices: ['Series', 'Parallel', 'RC Transient'],
      initial: 0,
    },
    {
      kind: 'slider',
      id: 'voltage',
      label: 'Battery EMF (V)',
      min: 3,
      max: 24,
      step: 1,
      initial: 12,
      unit: ' V',
    },
    {
      kind: 'slider',
      id: 'r1',
      label: 'Resistor R₁ (Ω)',
      min: 50,
      max: 500,
      step: 10,
      initial: 100,
      unit: ' Ω',
    },
    {
      kind: 'slider',
      id: 'r2',
      label: 'Resistor R₂ (Ω)',
      min: 50,
      max: 500,
      step: 10,
      initial: 200,
      unit: ' Ω',
    },
    {
      kind: 'slider',
      id: 'capUf',
      label: 'Capacitance C (RC)',
      min: 100,
      max: 1000,
      step: 100,
      initial: 500,
      unit: ' μF',
    },
    {
      kind: 'toggle',
      id: 'switchClosed',
      label: 'Switch closed (charge / flow)',
      initial: true,
    },
  ],
  challenges: [
    {
      id: 'current-conservation-series',
      title: 'Is Current Used Up by R₁?',
      setupParams: { mode: 0, voltage: 12, r1: 100, r2: 300, switchClosed: 1 },
      predict: {
        prompt:
          'In Series with R₁ = 100 Ω and R₂ = 300 Ω, compare Ammeter A_out leaving R₁/R₂ back to the battery with Ammeter A_in entering R₁.',
        options: [
          'A_in equals A_out identically (charge is conserved; only voltage potential drops)',
          'A_out is smaller because R₁ consumes current',
          'A_out is zero after passing through R₂',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep Series closed and set Battery EMF = 18 V, R₁ = 150 Ω, R₂ = 300 Ω so steady current is 40 mA throughout.',
        evaluate: (p, m) => ({
          passed: p.mode === 0 && p.switchClosed === 1 && Math.abs(m.iInMa - 40) <= 1 && Math.abs(m.iInMa - m.iOutMa) < 0.01,
          feedback: `A_in = ${m.iInMa.toFixed(0)} mA, A_out = ${m.iOutMa.toFixed(0)} mA. Target = 40 mA in Series.`,
        }),
      },
      explain:
        'Resistors dissipate electrical potential energy (voltage drops ΔV₁ = I·R₁, ΔV₂ = I·R₂), NOT electrons. Steady current is strictly uniform everywhere in a series loop.',
      misconceptionTag: 'current-gets-used-up-in-resistor',
    },
    {
      id: 'parallel-resistance-drops',
      title: 'The Parallel Branch Paradox',
      setupParams: { mode: 1, voltage: 12, r1: 200, r2: 400, switchClosed: 1 },
      predict: {
        prompt:
          'In a Parallel circuit, you decrease R₂ from 400 Ω down to 100 Ω alongside R₁ = 200 Ω. What happens to equivalent resistance R_eq and total battery current?',
        options: [
          'R_eq drops below either branch (< 100 Ω) and total battery current increases',
          'R_eq increases because there are two resistors now',
          'Branch I₁ changes even though V across R₁ stayed 12 V',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'In Parallel mode (closed), tune R₂ so equivalent resistance R_eq <= 67 Ω while keeping R₁ = 200 Ω.',
        evaluate: (p, m) => ({
          passed: p.mode === 1 && p.switchClosed === 1 && p.r1 === 200 && m.rEq <= 67,
          feedback: `R_eq = ${m.rEq.toFixed(1)} Ω (always smaller than min(R₁, R₂)). Battery I = ${m.iInMa.toFixed(0)} mA.`,
        }),
      },
      explain:
        'Opening a second parallel highway gives charge an additional path at the same full voltage V, increasing total conductance (1/R_eq = 1/R₁ + 1/R₂) and raising source current.',
      misconceptionTag: 'adding-parallel-resistor-raises-R',
    },
  ],
  build: () => {
    let phase = 0
    let vc = 0
    let rcTime = 0
    let prevClosed = true

    return {
      actions: [{ id: 'discharge', label: 'Discharge C to 0V' }],
      update: (p, dt) => {
        if (dt <= 0) return
        const closed = (p.switchClosed ?? 1) >= 0.5
        if (closed !== prevClosed) {
          prevClosed = closed
          rcTime = 0
        }
        const V = p.voltage ?? 12
        const R1 = p.r1 ?? 100
        const R2 = p.r2 ?? 200
        const C = (p.capUf ?? 500) * 1e-6
        const tau = Math.max(0.005, (closed ? R1 : R2) * C)
        const target = closed ? V : 0
        vc += (target - vc) * (1 - Math.exp(-(dt * 0.2) / tau))
        rcTime += dt * 0.2
        const s = solveCircuit(p, rcTime, vc)
        phase = (phase + dt * Math.min(220, s.iTotal * 900)) % 1000
      },
      step: (p, _dir, actionId) => {
        if (actionId === 'discharge') {
          vc = 0
          rcTime = 0
          return
        }
        const V = p.voltage ?? 12
        const R1 = p.r1 ?? 100
        const R2 = p.r2 ?? 200
        const C = (p.capUf ?? 500) * 1e-6
        const closed = (p.switchClosed ?? 1) >= 0.5
        const tau = Math.max(0.005, (closed ? R1 : R2) * C)
        vc += ((closed ? V : 0) - vc) * (1 - Math.exp(-0.02 / tau))
        rcTime += 0.02
      },
      reset: () => {
        vc = 0
        rcTime = 0
        phase = 0
      },
      hotspots: [
        {
          id: 'ammeter-in',
          label: 'Source Ammeter',
          x: 205,
          y: 78,
          title: 'Pre-Load Current A_in',
          body: 'Measures total charge per second leaving the positive battery terminal.',
        },
        {
          id: 'r1-spot',
          label: 'Load R₁',
          x: 370,
          y: 78,
          title: 'Potential Drop Across R₁',
          body: 'Converts electrical energy into heat (ΔV₁ = I₁·R₁), dropping wire potential from high (rose) toward ground (cyan).',
        },
        {
          id: 'ammeter-out',
          label: 'Return Ammeter',
          x: 370,
          y: 232,
          title: 'Return Current A_out = A_in',
          body: 'Total current returning to the battery negative terminal strictly equals A_in — electrons are never consumed.',
        },
        {
          id: 'rc-scope',
          label: 'RC Scope τ = RC',
          x: 360,
          y: 350,
          visible: (p) => Math.round(p.mode ?? 0) === 2,
          title: 'Exponential Time Constant τ = R₁C',
          body: 'At t = τ, capacitor voltage reaches 63.2% of V_battery (or falls to 36.8% during discharge).',
        },
      ],
      renderCanvas: (ctx, p, _elapsed, reducedMotion) => {
        const s = solveCircuit(p, rcTime, vc)
        const loopTop = s.mode === 2 ? 64 : 78
        const loopBot = s.mode === 2 ? 220 : 250
        const loopLeft = 120
        const loopRight = 590

        ctx.save()
        // Outer loop wires
        ctx.lineWidth = 4
        ctx.strokeStyle = s.closed ? PALETTE_CSS.rose : '#475569'
        ctx.beginPath()
        ctx.moveTo(loopLeft, loopTop + 55)
        ctx.lineTo(loopLeft, loopTop)
        ctx.lineTo(loopLeft + 140, loopTop)
        ctx.stroke()

        // Switch indicator
        ctx.strokeStyle = PALETTE_CSS.amber
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(loopLeft + 140, loopTop)
        if (s.closed) ctx.lineTo(loopLeft + 185, loopTop)
        else ctx.lineTo(loopLeft + 180, loopTop - 20)
        ctx.stroke()

        // Top right wire + return ground wire
        ctx.strokeStyle = PALETTE_CSS.amber
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(loopLeft + 185, loopTop)
        ctx.lineTo(loopRight, loopTop)
        ctx.lineTo(loopRight, loopBot)
        ctx.stroke()

        ctx.strokeStyle = PALETTE_CSS.cyan
        ctx.beginPath()
        ctx.moveTo(loopRight, loopBot)
        ctx.lineTo(loopLeft, loopBot)
        ctx.lineTo(loopLeft, loopTop + 95)
        ctx.stroke()

        // Battery symbol on left
        ctx.strokeStyle = PALETTE_CSS.rose
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(loopLeft - 18, loopTop + 55)
        ctx.lineTo(loopLeft + 18, loopTop + 55)
        ctx.stroke()
        ctx.strokeStyle = PALETTE_CSS.cyan
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(loopLeft - 10, loopTop + 72)
        ctx.lineTo(loopLeft + 10, loopTop + 72)
        ctx.stroke()
        ctx.fillStyle = '#f8fafc'
        ctx.font = 'bold 12px ui-monospace, monospace'
        ctx.textAlign = 'right'
        ctx.fillText(`${s.V}V`, loopLeft - 24, loopTop + 69)

        if (s.mode === 0) {
          // Series: R1 & R2 on top & right
          drawResistor(ctx, 325, loopTop, 88, `R₁=${s.R1}Ω`)
          drawResistor(ctx, 470, loopTop, 88, `R₂=${s.R2}Ω`)
          drawAmmeter(ctx, 220, loopTop, 'A_in', s.iTotal, PALETTE_CSS.emerald)
          drawAmmeter(ctx, 370, loopBot, 'A_out', s.iTotal, PALETTE_CSS.emerald)
        } else if (s.mode === 1) {
          // Parallel middle bridge
          const midY = (loopTop + loopBot) / 2
          ctx.strokeStyle = PALETTE_CSS.amber
          ctx.lineWidth = 3.5
          ctx.beginPath()
          ctx.moveTo(310, loopTop)
          ctx.lineTo(310, loopBot)
          ctx.moveTo(590, loopTop)
          ctx.moveTo(310, midY)
          ctx.lineTo(590, midY)
          ctx.stroke()
          drawResistor(ctx, 395, loopTop, 92, `R₁=${s.R1}Ω`)
          drawResistor(ctx, 395, midY, 92, `R₂=${s.R2}Ω`)
          drawAmmeter(ctx, 215, loopTop, 'A_tot', s.iTotal, PALETTE_CSS.emerald)
          drawAmmeter(ctx, 370, loopBot, 'A_ret', s.iTotal, PALETTE_CSS.emerald)
          ctx.fillStyle = PALETTE_CSS.cyan
          ctx.font = 'bold 10px ui-monospace, monospace'
          ctx.textAlign = 'left'
          ctx.fillText(`I₁=${(s.i1 * 1000).toFixed(0)}mA`, 505, loopTop - 8)
          ctx.fillText(`I₂=${(s.i2 * 1000).toFixed(0)}mA`, 505, midY - 8)
        } else {
          // RC Transient: R1 on top, Capacitor plates on right leg
          drawResistor(ctx, 345, loopTop, 92, `R₁=${s.R1}Ω`)
          drawAmmeter(ctx, 215, loopTop, 'I(t)', Math.abs(s.i1), PALETTE_CSS.emerald)
          const cy = (loopTop + loopBot) / 2
          ctx.fillStyle = '#0f172a'
          ctx.fillRect(loopRight - 22, cy - 12, 44, 24)
          ctx.strokeStyle = PALETTE_CSS.cyan
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(loopRight - 20, cy - 10)
          ctx.lineTo(loopRight + 20, cy - 10)
          ctx.moveTo(loopRight - 20, cy + 10)
          ctx.lineTo(loopRight + 20, cy + 10)
          ctx.stroke()
          ctx.fillStyle = '#e2e8f0'
          ctx.font = 'bold 11px ui-monospace, monospace'
          ctx.textAlign = 'left'
          ctx.fillText(`C=${p.capUf}μF`, loopRight + 28, cy)
          ctx.fillStyle = PALETTE_CSS.cyan
          ctx.fillText(`Vc=${s.vCap.toFixed(1)}V`, loopRight + 28, cy + 16)

          // Oscilloscope Vc(t) curve
          const box: PlotBox = { ...SCOPE_BOX, xMax: Math.max(0.25, s.tau * 5), yMax: Math.max(6, s.V * 1.1) }
          drawPlotAxes2D(ctx, box, {
            title: `Capacitor Transient V_C(t) — Time Constant τ = R·C = ${(s.tau * 1000).toFixed(1)} ms`,
            xLabel: 'Time t (s)',
            xTicks: 5,
            yTicks: 3,
          })
          drawCurve2D(
            ctx,
            box,
            (t) => (s.closed ? s.V * (1 - Math.exp(-t / Math.max(0.005, s.tau))) : s.V * Math.exp(-t / Math.max(0.005, s.tau))),
            PALETTE_CSS.cyan,
            2.6,
          )
        }

        // Animated charge dots when active & motion allowed
        if (!reducedMotion && s.iTotal > 0.002) {
          const dots = 12
          const span = loopRight - loopLeft
          ctx.fillStyle = '#fef08a'
          for (let i = 0; i < dots; i += 1) {
            const d = ((i / dots) * span + phase) % span
            ctx.beginPath()
            ctx.arc(loopLeft + d, loopTop, 3.3, 0, Math.PI * 2)
            ctx.arc(loopRight - d, loopBot, 3.3, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        ctx.restore()
      },
      readouts: (p) => {
        const s = solveCircuit(p, rcTime, vc)
        return [
          { label: 'Equivalent R_eq', value: `${s.rEq.toFixed(1)} Ω` },
          { label: 'Source Current I', value: `${(s.iTotal * 1000).toFixed(1)} mA` },
          {
            label: s.mode === 2 ? 'Capacitor V_C' : 'Drop ΔV₁ / ΔV₂',
            value: s.mode === 2 ? `${s.vCap.toFixed(2)} V` : `${s.v1.toFixed(1)}V / ${s.v2.toFixed(1)}V`,
          },
          {
            label: s.mode === 2 ? 'Time constant τ' : 'Return Current',
            value: s.mode === 2 ? `${(s.tau * 1000).toFixed(1)} ms` : `${(s.iTotal * 1000).toFixed(1)} mA`,
          },
        ]
      },
      metrics: (p) => {
        const s = solveCircuit(p, rcTime, vc)
        return {
          rEq: s.rEq,
          iInMa: s.iTotal * 1000,
          iOutMa: s.iTotal * 1000,
          vCap: s.vCap,
          tauMs: s.tau * 1000,
        }
      },
    }
  },
}

export default function DcRcCircuits2D() {
  return <Interactive2DViewer model={dcRcCircuits2dModel} />
}
