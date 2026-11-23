import { Interactive2DViewer } from '../Interactive2DViewer'
import {
  PALETTE_CSS,
  drawCurve2D,
  drawPlotAxes2D,
  plotMapX,
  plotMapY,
  plotUnmapX,
  type Model2DDefinition,
  type Params,
  type PlotBox,
} from '../engine2d'

function evalFn(kind: number, x: number): { f: number; df: number } {
  if (kind === 1) {
    return { f: 1.5 * Math.sin(1.4 * x), df: 2.1 * Math.cos(1.4 * x) }
  }
  if (kind === 2) {
    const f = 2.1 * Math.exp(-0.7 * x * x)
    const df = f * (-1.4 * x)
    return { f, df }
  }
  // Cubic: 0.35 x^3 - 1.2 x -> zeros of f' at +/- sqrt(1.2/1.05) ≈ +/- 1.07
  return { f: 0.35 * x * x * x - 1.2 * x, df: 1.05 * x * x - 1.2 }
}

function integrateFn(kind: number, a: number, x: number): number {
  const steps = 64
  const dx = (x - a) / steps
  let sum = 0
  for (let i = 0; i < steps; i += 1) {
    const mid = a + (i + 0.5) * dx
    sum += evalFn(kind, mid).f * dx
  }
  return sum
}

const BOX_F: PlotBox = { x: 64, y: 26, w: 626, h: 122, xMin: -3.2, xMax: 3.2, yMin: -3.0, yMax: 3.0 }
const BOX_DF: PlotBox = { x: 64, y: 174, w: 626, h: 110, xMin: -3.2, xMax: 3.2, yMin: -3.5, yMax: 3.5 }
const BOX_INT: PlotBox = { x: 64, y: 312, w: 626, h: 112, xMin: -3.2, xMax: 3.2, yMin: -3.5, yMax: 3.5 }

export const derivativeIntegralFtc2dModel: Model2DDefinition = {
  id: 'derivative-integral-ftc-2d',
  title: 'Derivative, Secant Limit & Fundamental Theorem',
  subtitle:
    'Synchronized plots of f(x), slope f′(x), and signed area A(x) = ∫ₐˣ f(t) dt along a draggable cursor.',
  viewWidth: 720,
  viewHeight: 460,
  params: [
    {
      kind: 'choice',
      id: 'fnKind',
      label: 'Function f(x)',
      choices: ['Cubic', 'Sine Wave', 'Gaussian Bell'],
      initial: 0,
    },
    {
      kind: 'slider',
      id: 'xCursor',
      label: 'Cursor x',
      min: -2.8,
      max: 2.8,
      step: 0.05,
      initial: 1.05,
    },
    {
      kind: 'slider',
      id: 'aBound',
      label: 'Lower bound a',
      min: -2.8,
      max: 2.0,
      step: 0.1,
      initial: -2.0,
    },
    {
      kind: 'slider',
      id: 'secantH',
      label: 'Secant step h',
      min: 0.05,
      max: 1.5,
      step: 0.05,
      initial: 0.7,
    },
    {
      kind: 'toggle',
      id: 'showRiemann',
      label: 'Show Riemann rectangles',
      initial: true,
    },
  ],
  challenges: [
    {
      id: 'ftc-local-max-of-area',
      title: 'Maximum of the Area Function A(x)',
      setupParams: { fnKind: 1, aBound: -2.0, xCursor: -0.8, secantH: 0.3, showRiemann: 1 },
      predict: {
        prompt:
          'On the Sine Wave f(x) = 1.5 sin(1.4x), where does the accumulation function A(x) = ∫ₐˣ f(t) dt attain a local maximum?',
        options: [
          'Where f(x) crosses zero from positive to negative (around x ≈ 2.24 or -2.24)',
          'Where f(x) itself hits its highest peak (around x ≈ 1.12)',
          'Where f′(x) equals zero regardless of sign',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep Sine Wave and drag/slide Cursor x near the positive zero-crossing x ≈ 2.24 (within ±0.12) where f changes + to −.',
        evaluate: (p) => ({
          passed: p.fnKind === 1 && Math.abs(p.xCursor - Math.PI / 1.4) <= 0.12,
          feedback: `At x = ${p.xCursor.toFixed(2)}, f(x) = ${evalFn(p.fnKind, p.xCursor).f.toFixed(2)} = A'(x). Target x ≈ 2.24.`,
        }),
      },
      explain:
        'By FTC Part 1, A′(x) = f(x). As long as f(x) > 0 you are still adding positive area to A(x); accumulation peaks the instant f(x) crosses from positive to negative.',
      misconceptionTag: 'confusing-f-peak-with-integral-peak',
    },
    {
      id: 'secant-to-tangent-limit',
      title: 'Shrinking the Difference Quotient',
      setupParams: { fnKind: 0, xCursor: 0.8, secantH: 1.2 },
      predict: {
        prompt:
          'At x = 0.8 on the Cubic, secant step h = 1.2 overestimates the true instantaneous slope f′(0.8). What brings the secant slope within 0.10 of f′(x)?',
        options: [
          'Shrink h toward 0 (h <= 0.10) so the secant chord aligns with the tangent',
          'Move lower bound a closer to x',
          'Increase h so the chord covers more curve',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Shrink Secant step h until |secant − f′(x)| < 0.10.',
        evaluate: (_p, m) => ({
          passed: Math.abs(m.secantSlope - m.df) < 0.1,
          feedback: `Secant = ${m.secantSlope.toFixed(2)} vs f′(x) = ${m.df.toFixed(2)} (diff = ${Math.abs(m.secantSlope - m.df).toFixed(2)}).`,
        }),
      },
      explain:
        'A derivative is the limit of average rates [f(x+h) − f(x)] / h as h → 0, completely independent of the lower integral bound a.',
      misconceptionTag: 'secant-independent-of-step-h',
    },
  ],
  build: () => {
    const compute = (p: Params) => {
      const kind = Math.round(p.fnKind ?? 0)
      const x = p.xCursor ?? 1.05
      const a = p.aBound ?? -2.0
      const h = Math.max(0.02, p.secantH ?? 0.7)
      const { f, df } = evalFn(kind, x)
      const fh = evalFn(kind, x + h).f
      const secantSlope = (fh - f) / h
      const integral = integrateFn(kind, a, x)
      return { kind, x, a, h, f, df, fh, secantSlope, integral }
    }

    return {
      dragHandles: [
        {
          id: 'x-cursor-handle',
          label: 'Draggable x cursor',
          color: PALETTE_CSS.amber,
          getPos: (p) => {
            const c = compute(p)
            return { x: plotMapX(BOX_F, c.x), y: plotMapY(BOX_F, c.f) }
          },
          onDrag: (px) => ({
            xCursor: Math.max(-2.8, Math.min(2.8, Math.round(plotUnmapX(BOX_F, px) * 20) / 20)),
          }),
          ariaValueText: (p) => `x = ${p.xCursor.toFixed(2)}`,
        },
      ],
      hotspots: [
        {
          id: 'tangent',
          label: 'Tangent vs Secant',
          x: 425,
          y: 62,
          title: 'Secant Chord Approaching Tangent',
          body: 'Amber line shows true instantaneous slope f′(x). Dashed violet chord spans (x, x+h) and converges to f′(x) as h → 0.',
        },
        {
          id: 'riemann',
          label: 'Signed Area',
          x: 245,
          y: 95,
          title: 'Signed Riemann Accumulation',
          body: 'Cyan boxes above the x-axis add positive area; rose boxes below subtract area. Reversing x < a flips the integral sign.',
        },
        {
          id: 'ftc-link',
          label: 'A′(x) = f(x)',
          x: 425,
          y: 350,
          title: 'Fundamental Theorem of Calculus',
          body: 'Notice the slope of the bottom curve A(x) at any vertical line equals the height of the top curve f(x)!',
        },
      ],
      renderCanvas: (ctx, p) => {
        const c = compute(p)

        drawPlotAxes2D(ctx, BOX_F, { title: 'f(x): Tangent Slope & Signed Area [a, x]', xTicks: 6, yTicks: 2 })
        drawPlotAxes2D(ctx, BOX_DF, { title: 'f′(x): Instantaneous Slope vs Secant Difference Quotient', xTicks: 6, yTicks: 2 })
        drawPlotAxes2D(ctx, BOX_INT, {
          title: 'A(x) = ∫ₐˣ f(t) dt (Accumulation Function)',
          xLabel: 'x',
          xTicks: 6,
          yTicks: 2,
        })

        // Shaded signed area + optional Riemann boxes on top plot
        ctx.save()
        ctx.beginPath()
        ctx.rect(BOX_F.x, BOX_F.y, BOX_F.w, BOX_F.h)
        ctx.clip()

        const bars = 12
        const span = c.x - c.a
        const dx = span / bars
        const zeroY = plotMapY(BOX_F, 0)
        for (let i = 0; i < bars; i += 1) {
          const x0 = c.a + i * dx
          const x1 = x0 + dx
          const midVal = evalFn(c.kind, (x0 + x1) / 2).f
          const px0 = plotMapX(BOX_F, Math.min(x0, x1))
          const px1 = plotMapX(BOX_F, Math.max(x0, x1))
          const pyVal = plotMapY(BOX_F, midVal)
          const positiveContribution = midVal * dx >= 0
          ctx.fillStyle = positiveContribution
            ? 'rgba(34, 211, 238, 0.25)'
            : 'rgba(251, 113, 133, 0.28)'
          const top = Math.min(zeroY, pyVal)
          const hPx = Math.abs(zeroY - pyVal)
          ctx.fillRect(px0, top, Math.max(1, px1 - px0), hPx)
          if (p.showRiemann === 1) {
            ctx.strokeStyle = positiveContribution
              ? 'rgba(34, 211, 238, 0.55)'
              : 'rgba(251, 113, 133, 0.55)'
            ctx.lineWidth = 1
            ctx.strokeRect(px0, top, Math.max(1, px1 - px0), hPx)
          }
        }
        ctx.restore()

        // Curves
        drawCurve2D(ctx, BOX_F, (t) => evalFn(c.kind, t).f, PALETTE_CSS.cyan, 2.5)
        drawCurve2D(ctx, BOX_DF, (t) => evalFn(c.kind, t).df, PALETTE_CSS.amber, 2.2)
        drawCurve2D(ctx, BOX_INT, (t) => integrateFn(c.kind, c.a, t), PALETTE_CSS.emerald, 2.5, false, 60)

        // Tangent & secant lines on top plot
        ctx.save()
        ctx.beginPath()
        ctx.rect(BOX_F.x, BOX_F.y, BOX_F.w, BOX_F.h)
        ctx.clip()
        const tLen = 1.0
        ctx.strokeStyle = PALETTE_CSS.amber
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(plotMapX(BOX_F, c.x - tLen), plotMapY(BOX_F, c.f - c.df * tLen))
        ctx.lineTo(plotMapX(BOX_F, c.x + tLen), plotMapY(BOX_F, c.f + c.df * tLen))
        ctx.stroke()

        // Secant line
        ctx.strokeStyle = PALETTE_CSS.violet
        ctx.setLineDash([5, 4])
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(plotMapX(BOX_F, c.x), plotMapY(BOX_F, c.f))
        ctx.lineTo(plotMapX(BOX_F, c.x + c.h), plotMapY(BOX_F, c.fh))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = PALETTE_CSS.violet
        ctx.beginPath()
        ctx.arc(plotMapX(BOX_F, c.x + c.h), plotMapY(BOX_F, c.fh), 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Vertical sync line across all 3 charts
        const vx = plotMapX(BOX_F, c.x)
        const ax = plotMapX(BOX_F, c.a)
        ctx.save()
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(vx, BOX_F.y)
        ctx.lineTo(vx, BOX_INT.y + BOX_INT.h)
        ctx.stroke()

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(ax, BOX_F.y)
        ctx.lineTo(ax, BOX_INT.y + BOX_INT.h)
        ctx.stroke()
        ctx.setLineDash([])

        // Dots on middle & bottom charts
        ctx.fillStyle = PALETTE_CSS.amber
        ctx.beginPath()
        ctx.arc(vx, plotMapY(BOX_DF, c.df), 4.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = PALETTE_CSS.violet
        ctx.beginPath()
        ctx.arc(vx, plotMapY(BOX_DF, c.secantSlope), 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = PALETTE_CSS.emerald
        ctx.beginPath()
        ctx.arc(vx, plotMapY(BOX_INT, c.integral), 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      },
      readouts: (p) => {
        const c = compute(p)
        return [
          { label: 'f(x)', value: c.f.toFixed(3) },
          { label: 'f′(x) Tangent', value: c.df.toFixed(3) },
          { label: 'Secant [x, x+h]', value: c.secantSlope.toFixed(3) },
          { label: `Area ∫[${c.a.toFixed(1)}, ${c.x.toFixed(1)}]`, value: c.integral.toFixed(3) },
        ]
      },
      metrics: compute,
    }
  },
}

export default function DerivativeIntegralFtc2D() {
  return <Interactive2DViewer model={derivativeIntegralFtc2dModel} />
}
