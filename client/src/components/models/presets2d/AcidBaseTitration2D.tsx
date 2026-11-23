import { Interactive2DViewer } from '../Interactive2DViewer'
import {
  PALETTE_CSS,
  ParticleBox2D,
  drawCurve2D,
  drawPlotAxes2D,
  plotMapX,
  plotMapY,
  type Model2DDefinition,
  type PlotBox,
} from '../engine2d'

const VA = 25 // mL initial acid
const CA = 0.1 // M initial acid
const KW = 1e-14

function getKa(acidType: number): number | null {
  if (acidType === 0) return null // Strong HCl
  if (acidType === 1) return Math.pow(10, -4.76) // Acetic acid
  return Math.pow(10, -3.75) // Formic acid
}

/**
 * Exact charge-balance root solver for titration pH across [0..14].
 * [H+] + [Na+] = [OH-] + [A-]
 */
function solvePh(acidType: number, vb: number, cb: number): {
  ph: number
  vEq: number
  haFrac: number
  aFrac: number
  excessOhM: number
  pka: number | null
} {
  const vTot = VA + vb
  const caDil = (CA * VA) / vTot
  const cNa = (cb * vb) / vTot
  const ka = getKa(acidType)
  const vEq = (CA * VA) / cb

  let lo = 0
  let hi = 14
  for (let i = 0; i < 36; i += 1) {
    const mid = (lo + hi) * 0.5
    const h = Math.pow(10, -mid)
    const oh = KW / h
    const aMinus = ka === null ? caDil : caDil * (ka / (h + ka))
    // residual = positive charge - negative charge; decreases as pH rises
    const residual = h + cNa - oh - aMinus
    if (residual > 0) lo = mid
    else hi = mid
  }
  const ph = (lo + hi) * 0.5
  const h = Math.pow(10, -ph)
  const aFrac = ka === null ? 1 : ka / (h + ka)
  const haFrac = 1 - aFrac
  const pka = acidType === 1 ? 4.76 : acidType === 2 ? 3.75 : null
  return { ph, vEq, haFrac, aFrac, excessOhM: KW / h, pka }
}

function indicatorColor(ph: number, indicator: number): string {
  if (indicator === 0) {
    // Phenolphthalein: colorless (<8.2) -> magenta (>10)
    const t = Math.max(0, Math.min(1, (ph - 8.2) / 1.8))
    return t < 0.05 ? 'rgba(186, 230, 253, 0.24)' : `rgba(236, 72, 153, ${0.22 + t * 0.5})`
  }
  if (indicator === 1) {
    // Bromothymol blue: yellow (<6.0) -> green (6.8) -> blue (>7.6)
    if (ph < 6.0) return 'rgba(250, 204, 21, 0.38)'
    if (ph > 7.6) return 'rgba(59, 130, 246, 0.42)'
    return 'rgba(52, 211, 153, 0.42)'
  }
  // Methyl orange: red (<3.1) -> orange (3.7) -> yellow (>4.4)
  if (ph < 3.1) return 'rgba(244, 63, 94, 0.42)'
  if (ph > 4.4) return 'rgba(250, 204, 21, 0.35)'
  return 'rgba(251, 146, 60, 0.42)'
}

const TITRATION_BOX: PlotBox = { x: 300, y: 42, w: 394, h: 374, xMin: 0, xMax: 50, yMin: 0, yMax: 14 }

export const acidBaseTitration2dModel: Model2DDefinition = {
  id: 'acid-base-titration-2d',
  title: 'Acid-Base Titration, Buffers & Equivalence pH',
  subtitle:
    'Titrate strong or weak acids with NaOH while tracking exact charge-balance pH, half-equivalence buffering (pH = pKa), and indicator endpoints.',
  viewWidth: 720,
  viewHeight: 460,
  supportsStep: true,
  params: [
    {
      kind: 'choice',
      id: 'acidType',
      label: 'Analyte (25 mL, 0.10 M)',
      choices: ['Strong HCl', 'Acetic (pKa 4.76)', 'Formic (pKa 3.75)'],
      initial: 1,
    },
    {
      kind: 'slider',
      id: 'baseVol',
      label: 'NaOH added (mL)',
      min: 0,
      max: 50,
      step: 0.25,
      initial: 12.5,
      unit: ' mL',
    },
    {
      kind: 'slider',
      id: 'baseMolarity',
      label: 'Titrant [NaOH] (M)',
      min: 0.05,
      max: 0.2,
      step: 0.01,
      initial: 0.1,
      format: (v) => `${v.toFixed(2)} M`,
    },
    {
      kind: 'choice',
      id: 'indicator',
      label: 'Color Indicator',
      choices: ['Phenolphthalein (8.2–10)', 'Bromothymol (6.0–7.6)', 'Methyl Orange (3.1–4.4)'],
      initial: 0,
    },
  ],
  challenges: [
    {
      id: 'weak-acid-eq-above-7',
      title: 'Why Is Equivalence Above pH 7?',
      setupParams: { acidType: 1, baseVol: 0, baseMolarity: 0.1, indicator: 0 },
      predict: {
        prompt:
          'When 25.0 mL of 0.10 M weak acetic acid is neutralized at exact equivalence (25.0 mL of 0.10 M NaOH), what is the flask pH?',
        options: [
          'Above 7.0 (~8.72) because conjugate base CH₃COO⁻ hydrolyzes water',
          'Exactly 7.00 because acid and base moles are equal',
          'Below 7.0 because acetic acid is still acidic',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep Acetic acid + 0.10 M NaOH and advance NaOH added right to equivalence (25.0 mL ± 0.25 mL).',
        evaluate: (p, m) => ({
          passed: p.acidType === 1 && Math.abs(p.baseVol - m.vEq) <= 0.25 && m.ph > 8.4,
          feedback: `At ${p.baseVol.toFixed(2)} mL (V_eq = ${m.vEq.toFixed(1)} mL), pH = ${m.ph.toFixed(2)}.`,
        }),
      },
      explain:
        'Neutralizing all HA produces a solution of weak base A⁻ (CH₃COO⁻), which reacts with water (A⁻ + H₂O ⇌ HA + OH⁻) to make equivalence pH clearly basic (~8.72) — matching Phenolphthalein!',
      misconceptionTag: 'equivalence-always-ph-7',
    },
    {
      id: 'half-equivalence-buffer',
      title: 'Pinpointing the Buffer Region (pH = pKa)',
      setupParams: { acidType: 1, baseVol: 22, baseMolarity: 0.1, indicator: 1 },
      predict: {
        prompt:
          'How much NaOH (0.10 M) brings 25.0 mL of 0.10 M Acetic acid (pKa = 4.76) to [HA] = [A⁻] where pH = pKa?',
        options: [
          '12.5 mL (half the equivalence volume V_eq / 2)',
          '25.0 mL (the full equivalence volume)',
          '5.0 mL (where indicator first flashes)',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Slide NaOH added to the half-equivalence point so pH matches pKa (4.76 ± 0.10) and [A⁻]/[HA] ≈ 1.0.',
        evaluate: (p, m) => ({
          passed: p.acidType === 1 && Math.abs(m.ph - 4.76) <= 0.1 && Math.abs(m.aFrac - 0.5) <= 0.08,
          feedback: `pH = ${m.ph.toFixed(2)}, A⁻ share = ${(m.aFrac * 100).toFixed(0)}%, HA share = ${(m.haFrac * 100).toFixed(0)}%.`,
        }),
      },
      explain:
        'By Henderson-Hasselbalch (pH = pKa + log([A⁻]/[HA])), neutralizing half the acid yields [A⁻] = [HA], making log(1) = 0 so pH = pKa and the curve hits its flattest buffer plateau.',
      misconceptionTag: 'ignoring-half-equivalence-buffer',
    },
  ],
  build: () => {
    const box = new ParticleBox2D(46, 178, 196, 175)
    box.seed(36, (i) => (i % 2 === 0 ? 0 : 1), 38, 4.5)
    let dropY = 128

    return {
      update: (_p, dt, _elapsed) => {
        if (dt <= 0) return
        box.step(dt, 0.9)
        dropY += dt * 42
        if (dropY > 195) dropY = 128
      },
      hotspots: [
        {
          id: 'beaker',
          label: 'Flask Solution',
          x: 145,
          y: 280,
          title: 'Molecular Species & Indicator',
          body: 'Violet particles represent intact weak acid HA; cyan particles represent conjugate base A⁻; rose highlights excess OH⁻ beyond equivalence.',
        },
        {
          id: 'half-eq',
          label: 'Buffer Plateau',
          x: 400,
          y: 280,
          title: 'Half-Equivalence Buffer (V = ½ V_eq)',
          body: 'Notice how flat the weak-acid curve stays around pH = pKa: added OH⁻ converts HA → A⁻ with minimal pH shift.',
        },
        {
          id: 'eq-point',
          label: 'Equivalence Point',
          x: 495,
          y: 165,
          title: 'Stoichiometric Equivalence',
          body: 'All initial HA has reacted with added OH⁻. For weak acids, conjugate base A⁻ drives pH > 7, making Phenolphthalein ideal.',
        },
      ],
      renderCanvas: (ctx, p, _elapsed, reducedMotion) => {
        const acidType = Math.round(p.acidType ?? 1)
        const vb = p.baseVol ?? 12.5
        const cb = p.baseMolarity ?? 0.1
        const ind = Math.round(p.indicator ?? 0)
        const sol = solvePh(acidType, vb, cb)

        ctx.save()
        // Left: Burette + Dripping Flask
        ctx.fillStyle = '#0f172a'
        ctx.strokeStyle = '#64748b'
        ctx.lineWidth = 2
        ctx.fillRect(132, 34, 24, 86)
        ctx.strokeRect(132, 34, 24, 86)
        const buretteFill = Math.max(4, (1 - vb / 50) * 78)
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)'
        ctx.fillRect(134, 118 - buretteFill, 20, buretteFill)

        // Drip drop
        if (!reducedMotion && vb > 0) {
          ctx.fillStyle = PALETTE_CSS.cyan
          ctx.beginPath()
          ctx.arc(144, dropY, 3, 0, Math.PI * 2)
          ctx.fill()
        }

        // Beaker body
        ctx.fillStyle = indicatorColor(sol.ph, ind)
        const fillTop = 225 - Math.min(48, vb * 0.9)
        ctx.fillRect(44, fillTop, 200, 362 - fillTop)
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(42, 165)
        ctx.lineTo(42, 362)
        ctx.lineTo(246, 362)
        ctx.lineTo(246, 165)
        ctx.stroke()

        // Particles proportioned to HA vs A- vs excess OH-
        const nTotal = box.particles.length
        const nA = Math.round(nTotal * Math.min(1, sol.aFrac))
        const excessFrac = Math.max(0, Math.min(0.45, (vb - sol.vEq) / 30))
        const nOh = Math.round(nTotal * excessFrac)

        box.particles.forEach((pt, idx) => {
          let col: string = PALETTE_CSS.violet // HA
          if (idx < nOh) col = PALETTE_CSS.rose // excess OH-
          else if (idx < nOh + nA) col = PALETTE_CSS.cyan // A-
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(pt.x, Math.max(fillTop + 5, pt.y), 4.2, 0, Math.PI * 2)
          ctx.fill()
        })

        // Species legend under beaker
        ctx.font = '10px ui-monospace, monospace'
        ctx.textAlign = 'left'
        ctx.fillStyle = PALETTE_CSS.violet
        ctx.fillText(`HA: ${(sol.haFrac * 100).toFixed(0)}%`, 46, 388)
        ctx.fillStyle = PALETTE_CSS.cyan
        ctx.fillText(`A⁻: ${(sol.aFrac * 100).toFixed(0)}%`, 116, 388)
        ctx.fillStyle = '#e2e8f0'
        ctx.fillText(`pH ${sol.ph.toFixed(2)}`, 188, 388)
        ctx.fillStyle = '#94a3b8'
        ctx.fillText(`V_eq = ${sol.vEq.toFixed(1)} mL`, 46, 408)
        ctx.restore()

        // Right: Titration curve plot
        drawPlotAxes2D(ctx, TITRATION_BOX, {
          title: 'Titration Curve (pH vs Volume NaOH)',
          xLabel: 'Volume NaOH added (mL)',
          xTicks: 5,
          yTicks: 7,
        })

        // Indicator active pH transition band
        const [bandLow, bandHigh, bandCol] =
          ind === 0
            ? [8.2, 10.0, 'rgba(236, 72, 153, 0.14)']
            : ind === 1
              ? [6.0, 7.6, 'rgba(52, 211, 153, 0.14)']
              : [3.1, 4.4, 'rgba(251, 146, 60, 0.14)']
        const yB1 = plotMapY(TITRATION_BOX, bandHigh)
        const yB2 = plotMapY(TITRATION_BOX, bandLow)
        ctx.save()
        ctx.fillStyle = bandCol
        ctx.fillRect(TITRATION_BOX.x, yB1, TITRATION_BOX.w, yB2 - yB1)

        // pH 7 neutral dashed line
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(TITRATION_BOX.x, plotMapY(TITRATION_BOX, 7))
        ctx.lineTo(TITRATION_BOX.x + TITRATION_BOX.w, plotMapY(TITRATION_BOX, 7))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()

        drawCurve2D(ctx, TITRATION_BOX, (v) => solvePh(acidType, v, cb).ph, PALETTE_CSS.cyan, 2.8, false, 160)

        // Equivalence point marker
        if (sol.vEq <= 50) {
          const eqSol = solvePh(acidType, sol.vEq, cb)
          const ex = plotMapX(TITRATION_BOX, sol.vEq)
          const ey = plotMapY(TITRATION_BOX, eqSol.ph)
          ctx.save()
          ctx.strokeStyle = PALETTE_CSS.emerald
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(ex, ey, 6, 0, Math.PI * 2)
          ctx.stroke()
          ctx.fillStyle = PALETTE_CSS.emerald
          ctx.font = 'bold 10px ui-monospace, monospace'
          ctx.textAlign = sol.vEq > 32 ? 'right' : 'left'
          ctx.fillText(`Eq (${sol.vEq.toFixed(1)}, ${eqSol.ph.toFixed(2)})`, ex + (sol.vEq > 32 ? -10 : 10), ey - 4)
          ctx.restore()
        }

        // Half-equivalence marker for weak acids
        if (sol.pka !== null && sol.vEq * 0.5 <= 50) {
          const hx = plotMapX(TITRATION_BOX, sol.vEq * 0.5)
          const hy = plotMapY(TITRATION_BOX, sol.pka)
          ctx.save()
          ctx.fillStyle = PALETTE_CSS.violet
          ctx.beginPath()
          ctx.arc(hx, hy, 4.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.font = 'bold 10px ui-monospace, monospace'
          ctx.fillText(`½Eq pH=${sol.pka.toFixed(2)}`, hx + 8, hy + 14)
          ctx.restore()
        }

        // Current titration dot
        ctx.save()
        ctx.fillStyle = PALETTE_CSS.amber
        ctx.beginPath()
        ctx.arc(plotMapX(TITRATION_BOX, vb), plotMapY(TITRATION_BOX, sol.ph), 5.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      },
      readouts: (p) => {
        const sol = solvePh(Math.round(p.acidType ?? 1), p.baseVol ?? 12.5, p.baseMolarity ?? 0.1)
        return [
          { label: 'Flask pH', value: sol.ph.toFixed(2) },
          { label: 'Equivalence V_eq', value: `${sol.vEq.toFixed(1)} mL` },
          { label: '[A⁻] / [HA] Buffer', value: `${(sol.aFrac * 100).toFixed(0)}% / ${(sol.haFrac * 100).toFixed(0)}%` },
          { label: 'Acid pKa', value: sol.pka !== null ? sol.pka.toFixed(2) : 'Strong (~−7)' },
        ]
      },
      metrics: (p) => {
        const sol = solvePh(Math.round(p.acidType ?? 1), p.baseVol ?? 12.5, p.baseMolarity ?? 0.1)
        return {
          ph: sol.ph,
          vEq: sol.vEq,
          aFrac: sol.aFrac,
          haFrac: sol.haFrac,
        }
      },
    }
  },
}

export default function AcidBaseTitration2D() {
  return <Interactive2DViewer model={acidBaseTitration2dModel} />
}
