import { Interactive2DViewer } from '../Interactive2DViewer'
import {
  PALETTE_CSS,
  drawCurve2D,
  drawPlotAxes2D,
  plotMapX,
  type Model2DDefinition,
  type Params,
  type PlotBox,
} from '../engine2d'

const POP_BOX: PlotBox = { x: 64, y: 40, w: 626, h: 155, xMin: 0, xMax: 100, yMin: 0, yMax: 1 }
const MEAN_BOX: PlotBox = { x: 64, y: 245, w: 626, h: 175, xMin: 0, xMax: 100, yMin: 0, yMax: 1 }
const BINS = 40

function popStats(shape: number): { mu: number; sigma: number; label: string } {
  if (shape === 0) return { mu: 50, sigma: 28.87, label: 'Uniform [0, 100]' }
  if (shape === 1) return { mu: 28.5, sigma: 20.6, label: 'Right-Skewed' }
  if (shape === 2) return { mu: 50, sigma: 35.8, label: 'Bimodal (U-shaped)' }
  return { mu: 50, sigma: 15.0, label: 'Normal (50, 15)' }
}

function drawFromPopulation(shape: number, rand: () => number): number {
  if (shape === 0) return rand() * 100
  if (shape === 1) {
    // Skewed right beta-like transform: x = 100 * u^2.5
    const u = rand()
    return 100 * Math.pow(u, 2.5)
  }
  if (shape === 2) {
    // Bimodal mixture around 16 and 84
    const center = rand() < 0.5 ? 16 : 84
    const u1 = Math.max(1e-6, rand())
    const u2 = rand()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return Math.max(0, Math.min(100, center + z * 8.5))
  }
  const u1 = Math.max(1e-6, rand())
  const u2 = rand()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(0, Math.min(100, 50 + z * 15))
}

function parentDensity(shape: number, x: number): number {
  if (x < 0 || x > 100) return 0
  if (shape === 0) return 0.45
  if (shape === 1) {
    const t = Math.max(0.01, x / 100)
    return 0.4 * Math.pow(t, -0.6)
  }
  if (shape === 2) {
    const g1 = Math.exp(-0.5 * Math.pow((x - 16) / 8.5, 2))
    const g2 = Math.exp(-0.5 * Math.pow((x - 84) / 8.5, 2))
    return 0.78 * (g1 + g2)
  }
  return 0.85 * Math.exp(-0.5 * Math.pow((x - 50) / 15, 2))
}

export const cltSamplingInference2dModel: Model2DDefinition = {
  id: 'clt-sampling-inference-2d',
  title: 'Central Limit Theorem & Standard Error',
  subtitle:
    'Draw live samples of size n from skewed, bimodal, uniform, or normal populations and watch the sampling distribution converge to N(μ, σ/√n).',
  viewWidth: 720,
  viewHeight: 460,
  supportsStep: true,
  params: [
    {
      kind: 'choice',
      id: 'popShape',
      label: 'Parent Population',
      choices: ['Uniform', 'Right-Skewed', 'Bimodal', 'Normal'],
      initial: 1,
    },
    {
      kind: 'slider',
      id: 'sampleN',
      label: 'Sample size n',
      min: 1,
      max: 64,
      step: 1,
      initial: 4,
    },
    {
      kind: 'slider',
      id: 'speed',
      label: 'Samples / frame',
      min: 1,
      max: 30,
      step: 1,
      initial: 8,
    },
    {
      kind: 'toggle',
      id: 'showTheory',
      label: 'Overlay N(μ, σ/√n) theory',
      initial: true,
    },
  ],
  challenges: [
    {
      id: 'clt-skew-convergence',
      title: 'Taming a Skewed Population',
      setupParams: { popShape: 1, sampleN: 2, speed: 12, showTheory: 1 },
      predict: {
        prompt:
          'When the parent population is strongly Right-Skewed and n = 2, the histogram of sample means is still skewed. What happens when n increases to >= 30?',
        options: [
          'The sampling distribution of x̄ becomes symmetric and bell-shaped centered at μ',
          'It remains identical in shape to the right-skewed parent',
          'The peak shifts all the way to 0 as n grows',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Keep Right-Skewed parent, raise sampleN >= 30, and let >= 180 sample means accumulate.',
        evaluate: (p, m) => ({
          passed: p.popShape === 1 && p.sampleN >= 30 && m.count >= 180,
          feedback: `Current n=${p.sampleN}, samples=${m.count}. ${m.count >= 180 && p.sampleN >= 30 ? 'Empirical curve closely tracks N(μ, σ/√n)!' : 'Raise n >= 30 and gather at least 180 samples.'}`,
        }),
      },
      explain:
        'By the Central Limit Theorem, sums/averages of independent draws cancel individual asymmetry, approaching Normal(μ, σ/√n) regardless of parent skew.',
      misconceptionTag: 'parent-shape-equals-sampling-shape',
    },
    {
      id: 'sqrt-n-law',
      title: 'Halving the Standard Error',
      setupParams: { popShape: 0, sampleN: 4, speed: 8, showTheory: 1 },
      predict: {
        prompt:
          'At n = 4 on Uniform [0, 100], Standard Error σ/√n ≈ 14.43. To cut Standard Error in HALF (~7.22), what must n become?',
        options: ['n = 16 (4× sample size)', 'n = 8 (2× sample size)', 'n = 64 (16× sample size)'],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Adjust sample size n on Uniform [0, 100] until Theoretical SE reaches ~7.22 (±0.15).',
        evaluate: (p, m) => ({
          passed: p.popShape === 0 && Math.abs(m.theorySE - 7.22) <= 0.15,
          feedback: `At n = ${p.sampleN}, Theoretical SE = ${m.theorySE?.toFixed(2) ?? '?'}. (Target ≈ 7.22.)`,
        }),
      },
      explain:
        'Because Standard Error scales as 1/√n rather than 1/n, halving uncertainty requires quadrupling the sample size (from n = 4 to n = 16).',
      misconceptionTag: 'linear-se-vs-inverse-sqrt-n',
    },
  ],
  build: (_ctx, initial) => {
    let seed = 1337
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }

    let prevShape = Math.round(initial.popShape ?? 1)
    let prevN = Math.round(initial.sampleN ?? 4)
    const bins = new Float64Array(BINS)
    let count = 0
    let sumXBar = 0
    let sumSqXBar = 0
    let lastDraw: number[] = []
    let lastMean = 0

    const clearBins = () => {
      bins.fill(0)
      count = 0
      sumXBar = 0
      sumSqXBar = 0
      lastDraw = []
      lastMean = 0
    }

    const drawOneSample = (shape: number, n: number) => {
      const vals: number[] = []
      let tot = 0
      for (let i = 0; i < n; i += 1) {
        const v = drawFromPopulation(shape, rand)
        vals.push(v)
        tot += v
      }
      const mean = tot / n
      lastDraw = vals
      lastMean = mean
      const binIdx = Math.max(0, Math.min(BINS - 1, Math.floor((mean / 100) * BINS)))
      bins[binIdx] += 1
      count += 1
      sumXBar += mean
      sumSqXBar += mean * mean
    }

    const syncConfig = (p: Params) => {
      const shape = Math.round(p.popShape ?? 1)
      const n = Math.round(p.sampleN ?? 4)
      if (shape !== prevShape || n !== prevN) {
        prevShape = shape
        prevN = n
        clearBins()
      }
    }

    // Seed an initial sample for instant clarity
    drawOneSample(prevShape, prevN)

    const metricsObj = (p: Params) => {
      syncConfig(p)
      const stats = popStats(prevShape)
      const theorySE = stats.sigma / Math.sqrt(Math.max(1, prevN))
      const empMean = count > 0 ? sumXBar / count : stats.mu
      const variance = count > 1 ? Math.max(0, sumSqXBar / count - empMean * empMean) : 0
      const empSE = Math.sqrt(variance)
      return { count, theorySE, empSE, empMean, mu: stats.mu, sigma: stats.sigma }
    }

    return {
      actions: [
        { id: 'burst', label: '+200 Samples' },
        { id: 'clear', label: 'Clear' },
      ],
      update: (p, dt) => {
        if (dt <= 0) return
        syncConfig(p)
        const rate = Math.max(1, Math.round(p.speed ?? 8))
        for (let i = 0; i < rate; i += 1) {
          if (count < 6000) drawOneSample(prevShape, prevN)
        }
      },
      step: (p, dir, actionId) => {
        syncConfig(p)
        if (actionId === 'clear') {
          clearBins()
          return
        }
        if (actionId === 'burst') {
          for (let i = 0; i < 200; i += 1) drawOneSample(prevShape, prevN)
          return
        }
        if (dir > 0) drawOneSample(prevShape, prevN)
      },
      reset: (p) => {
        prevShape = Math.round(p.popShape ?? 1)
        prevN = Math.round(p.sampleN ?? 4)
        clearBins()
        drawOneSample(prevShape, prevN)
      },
      hotspots: [
        {
          id: 'parent',
          label: 'Parent shape',
          x: 215,
          y: 80,
          title: 'Parent Population vs Sample Size n',
          body: 'Parent shape only mirrors the histogram at n = 1. As n increases, extreme parent values average out.',
        },
        {
          id: 'se-spread',
          label: 'SE = σ / √n',
          x: 410,
          y: 280,
          title: 'Standard Error Shrinks as 1/√n',
          body: 'Quadrupling n cuts standard error in half, tightening the sampling distribution tightly around μ.',
        },
        {
          id: 'mean-anchor',
          label: 'Unbiased center μ',
          x: 345,
          y: 350,
          title: 'Expected Value E[x̄] = μ',
          body: 'The center of the sampling distribution stays anchored at the true population mean μ regardless of sample size.',
        },
      ],
      renderCanvas: (ctx, p) => {
        const m = metricsObj(p)
        const stats = popStats(prevShape)

        // Top: Parent population
        drawPlotAxes2D(ctx, POP_BOX, {
          title: `Parent Population: ${stats.label} (μ = ${stats.mu.toFixed(1)}, σ = ${stats.sigma.toFixed(1)})`,
          xTicks: 5,
          yTicks: 2,
          yFormat: () => '',
        })

        // Filled parent curve
        drawCurve2D(ctx, POP_BOX, (x) => parentDensity(prevShape, x), PALETTE_CSS.cyan, 2.5)
        // Parent mean line
        const muX = plotMapX(POP_BOX, stats.mu)
        ctx.save()
        ctx.strokeStyle = PALETTE_CSS.amber
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(muX, POP_BOX.y)
        ctx.lineTo(muX, POP_BOX.y + POP_BOX.h)
        ctx.stroke()
        ctx.setLineDash([])

        // Current single-sample draw points along parent axis
        for (const v of lastDraw.slice(0, 48)) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.85)'
          ctx.beginPath()
          ctx.arc(plotMapX(POP_BOX, v), POP_BOX.y + POP_BOX.h - 14, 3.2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()

        // Bottom: Sampling distribution histogram of x̄
        drawPlotAxes2D(ctx, MEAN_BOX, {
          title: `Sampling Distribution of Mean x̄ (n = ${prevN}, total samples = ${count})`,
          xLabel: 'Sample mean x̄',
          xTicks: 5,
          yTicks: 3,
          yFormat: (v) => `${Math.round(v * 100)}%`,
        })

        let maxBin = 1
        for (let i = 0; i < BINS; i += 1) {
          if (bins[i] > maxBin) maxBin = bins[i]
        }
        const binW = MEAN_BOX.w / BINS
        const binWidthVal = 100 / BINS

        ctx.save()
        for (let i = 0; i < BINS; i += 1) {
          if (bins[i] === 0) continue
          const fracH = bins[i] / maxBin
          const bh = fracH * (MEAN_BOX.h - 18)
          ctx.fillStyle = 'rgba(129, 140, 248, 0.72)'
          ctx.fillRect(
            MEAN_BOX.x + i * binW + 1,
            MEAN_BOX.y + MEAN_BOX.h - bh,
            Math.max(2, binW - 2),
            bh,
          )
        }

        // Latest x̄ drop pin
        if (count > 0) {
          const lx = plotMapX(MEAN_BOX, lastMean)
          ctx.fillStyle = PALETTE_CSS.amber
          ctx.beginPath()
          ctx.arc(lx, MEAN_BOX.y + MEAN_BOX.h - 6, 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()

        // Theoretical Normal PDF scaled cleanly to histogram peak
        if (p.showTheory === 1) {
          const se = m.theorySE
          const maxPdf = 1 / (se * Math.sqrt(2 * Math.PI))
          const expectedPeakFrac = count > 0 ? Math.min(0.95, (maxPdf * binWidthVal * count) / maxBin) : 0.88
          const normScale = expectedPeakFrac * 0.92
          drawCurve2D(
            ctx,
            MEAN_BOX,
            (x) => normScale * Math.exp(-0.5 * Math.pow((x - stats.mu) / se, 2)),
            PALETTE_CSS.emerald,
            2.4,
          )
        }
      },
      readouts: (p) => {
        const m = metricsObj(p)
        return [
          { label: 'Samples Drawn', value: `${m.count}` },
          { label: 'Empirical x̄ Mean', value: m.empMean.toFixed(2) },
          { label: 'Empirical SE', value: m.count > 1 ? m.empSE.toFixed(2) : '—' },
          { label: 'Theory σ/√n', value: m.theorySE.toFixed(2) },
        ]
      },
      metrics: metricsObj,
    }
  },
}

export default function CltSamplingInference2D() {
  return <Interactive2DViewer model={cltSamplingInference2dModel} />
}
