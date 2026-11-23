import { Interactive2DViewer } from '../Interactive2DViewer'
import {
  PALETTE_CSS,
  drawPlotAxes2D,
  plotMapX,
  plotMapY,
  type Model2DDefinition,
  type Params,
  type PlotBox,
} from '../engine2d'

interface GenSnapshot {
  gen: number
  p: number
  q: number
  aaDom: number
  het: number
  aaRec: number
}

function simulatePopulation(params: Params): GenSnapshot[] {
  const p0 = params.p0 ?? 0.5
  const wAA = params.fitAA ?? 1.0
  const wAa = params.fitAa ?? 1.0
  const waa = params.fitaa ?? 1.0
  const popMode = Math.round(params.popSize ?? 0) // 0=infinite, 1=N=40 drift, 2=N=200 drift
  const gens = Math.max(1, Math.round(params.generations ?? 30))

  // Deterministic seed so drift trajectory is smooth & repeatable across slider drags
  let seed = Math.round(p0 * 1000) * 97 + Math.round(waa * 100) * 13 + popMode * 4999 + 71
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  const N = popMode === 1 ? 40 : popMode === 2 ? 200 : Infinity
  const out: GenSnapshot[] = []
  let p = p0

  for (let g = 0; g <= gens; g += 1) {
    const q = 1 - p
    const gAA = p * p
    const gAa = 2 * p * q
    const gaa = q * q
    out.push({ gen: g, p, q, aaDom: gAA, het: gAa, aaRec: gaa })

    const wBar = gAA * wAA + gAa * wAa + gaa * waa
    const pNext = wBar > 0 ? (gAA * wAA + 0.5 * gAa * wAa) / wBar : p

    if (!Number.isFinite(N)) {
      p = pNext
    } else {
      // Binomial sample of 2N alleles
      const draws = 2 * N
      let countA = 0
      for (let d = 0; d < draws; d += 1) {
        if (rand() < pNext) countA += 1
      }
      p = countA / draws
    }
  }
  return out
}

const TRAJ_BOX: PlotBox = { x: 315, y: 46, w: 376, h: 356, xMin: 0, xMax: 60, yMin: 0, yMax: 1 }

export const hardyWeinbergSelection2dModel: Model2DDefinition = {
  id: 'hardy-weinberg-selection-2d',
  title: 'Hardy-Weinberg Equilibrium, Selection & Drift',
  subtitle:
    'Watch Punnett-square genotype areas p² + 2pq + q² = 1 respond to natural selection, recessive masking, heterozygote advantage, and finite population drift.',
  viewWidth: 720,
  viewHeight: 460,
  params: [
    {
      kind: 'slider',
      id: 'p0',
      label: 'Initial A frequency (p₀)',
      min: 0.05,
      max: 0.95,
      step: 0.05,
      initial: 0.5,
      format: (v) => v.toFixed(2),
    },
    {
      kind: 'slider',
      id: 'fitAA',
      label: 'Fitness w(AA)',
      min: 0.2,
      max: 1.0,
      step: 0.05,
      initial: 1.0,
      format: (v) => v.toFixed(2),
    },
    {
      kind: 'slider',
      id: 'fitAa',
      label: 'Fitness w(Aa)',
      min: 0.2,
      max: 1.15,
      step: 0.05,
      initial: 1.0,
      format: (v) => v.toFixed(2),
    },
    {
      kind: 'slider',
      id: 'fitaa',
      label: 'Fitness w(aa)',
      min: 0.0,
      max: 1.0,
      step: 0.05,
      initial: 1.0,
      format: (v) => v.toFixed(2),
    },
    {
      kind: 'choice',
      id: 'popSize',
      label: 'Population Size',
      choices: ['Infinite (HW)', 'Small N = 40', 'Medium N = 200'],
      initial: 0,
    },
    {
      kind: 'slider',
      id: 'generations',
      label: 'Generations elapsed',
      min: 5,
      max: 60,
      step: 5,
      initial: 30,
    },
  ],
  challenges: [
    {
      id: 'dominant-does-not-take-over',
      title: 'Do Dominant Alleles Automatically Take Over?',
      setupParams: { p0: 0.3, fitAA: 1.0, fitAa: 1.0, fitaa: 1.0, popSize: 0, generations: 40 },
      predict: {
        prompt:
          'Allele A is dominant over a, starts at p₀ = 0.30 in a large random-mating population with equal fitness (1.0, 1.0, 1.0). After 40 generations, what is p?',
        options: [
          'Still 0.30 (dominance changes phenotype ratios, NOT allele frequency)',
          'At least 0.75 because A is dominant',
          'Drops to 0.00 because q = 0.70 dominates',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep equal fitness (w = 1.0) in an Infinite population and change p₀ to 0.25 to confirm p stays flat at 0.25 after 40 generations.',
        evaluate: (p, m) => ({
          passed:
            p.popSize === 0 &&
            p.fitAA === 1 &&
            p.fitAa === 1 &&
            p.fitaa === 1 &&
            Math.abs(p.p0 - 0.25) < 0.02 &&
            Math.abs(m.pFinal - 0.25) < 0.01,
          feedback: `Initial p₀ = ${p.p0.toFixed(2)}, Final p(${p.generations}) = ${m.pFinal.toFixed(3)}.`,
        }),
      },
      explain:
        'Under Hardy-Weinberg assumptions (no selection, drift, mutation, migration, or non-random mating), genetic dominance never alters allele frequencies — p stays constant forever.',
      misconceptionTag: 'dominant-alleles-increase-automatically',
    },
    {
      id: 'heterozygote-shelter',
      title: 'Can Selection Erase a Lethal Recessive?',
      setupParams: { p0: 0.5, fitAA: 1.0, fitAa: 1.0, fitaa: 0.0, popSize: 0, generations: 25 },
      predict: {
        prompt:
          'If homozygous recessive (aa) has fitness w(aa) = 0 (complete lethality), how fast is recessive allele a eliminated?',
        options: [
          'Slowly asymptotically — heterozygotes Aa shield a from selection (q > 0.03 after 25 gens)',
          'Completely gone (q = 0) in 1 generation',
          'Gone in 3 generations',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Set w(aa) = 0.00 and slide Generations to 25 (or raise w(Aa) > 1.0 for heterozygote advantage) and verify allele a persists.',
        evaluate: (p, m) => ({
          passed: p.fitaa === 0 && p.generations >= 25 && m.qFinal > 0.02 && m.hetFinal > 0.04,
          feedback: `After ${p.generations} gens with lethal aa: q = ${m.qFinal.toFixed(3)}, Carriers Aa = ${(m.hetFinal * 100).toFixed(1)}%.`,
        }),
      },
      explain:
        'When q becomes small, almost all remaining recessive alleles reside inside phenotypically fit Aa heterozygotes (2pq >> q²), shielding allele a from complete elimination.',
      misconceptionTag: 'lethal-recessive-eliminated-immediately',
    },
  ],
  build: () => ({
    hotspots: [
      {
        id: 'punnett-area',
        label: 'Punnett p²+2pq+q²',
        x: 155,
        y: 145,
        title: 'Geometric Punnett Square (Final Gen)',
        body: 'Top-left square has area p² (AA), top-right & bottom-left have combined area 2pq (Aa carriers), and bottom-right has area q² (aa).',
      },
      {
        id: 'allele-curves',
        label: 'p & q Trajectories',
        x: 505,
        y: 120,
        title: 'Allele Frequencies Over Time',
        body: 'Flat lines confirm Hardy-Weinberg equilibrium; converging interior lines appear under heterozygote advantage (w_Aa > w_AA, w_aa).',
      },
      {
        id: 'carrier-zone',
        label: 'Aa Carrier Shelter',
        x: 200,
        y: 230,
        title: 'Recessive Allele Reservoir',
        body: 'Because Aa individuals express the dominant phenotype, harmful recessive alleles hide safely inside carriers when q is small.',
      },
    ],
    renderCanvas: (ctx, p) => {
      const series = simulatePopulation(p)
      const last = series[series.length - 1]

      // Left: Geometric Punnett Square at final generation
      const px = 34
      const py = 46
      const side = 236
      ctx.save()
      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(`Final Gen ${last.gen} Genotype Mosaic`, px, py - 8)

      const wP = last.p * side
      const wQ = last.q * side

      // AA (top-left)
      ctx.fillStyle = PALETTE_CSS.cyan
      ctx.fillRect(px, py, wP, wP)
      // Aa (top-right & bottom-left)
      ctx.fillStyle = PALETTE_CSS.violet
      ctx.fillRect(px + wP, py, wQ, wP)
      ctx.fillRect(px, py + wP, wP, wQ)
      // aa (bottom-right)
      ctx.fillStyle = PALETTE_CSS.amber
      ctx.fillRect(px + wP, py + wP, wQ, wQ)

      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 2
      ctx.strokeRect(px, py, side, side)
      ctx.beginPath()
      ctx.moveTo(px + wP, py)
      ctx.lineTo(px + wP, py + side)
      ctx.moveTo(px, py + wP)
      ctx.lineTo(px + side, py + wP)
      ctx.stroke()

      // Clear labels on mosaic corners
      ctx.font = 'bold 10px ui-monospace, monospace'
      ctx.fillStyle = '#0f172a'
      ctx.textAlign = 'center'
      if (wP > 36) ctx.fillText(`AA ${(last.aaDom * 100).toFixed(0)}%`, px + wP / 2, py + wP / 2 + 3)
      if (wQ > 34) ctx.fillText(`aa ${(last.aaRec * 100).toFixed(0)}%`, px + wP + wQ / 2, py + wP + wQ / 2 + 3)
      if (wP > 28 && wQ > 28) ctx.fillText('Aa', px + wP + wQ / 2, py + wP / 2 + 3)

      // Breakdown bars under Punnett
      const barY = py + side + 26
      const bars: Array<[string, number, string]> = [
        ['AA (p²)', last.aaDom, PALETTE_CSS.cyan],
        ['Aa (2pq)', last.het, PALETTE_CSS.violet],
        ['aa (q²)', last.aaRec, PALETTE_CSS.amber],
      ]
      bars.forEach(([lbl, val, col], idx) => {
        const y = barY + idx * 30
        ctx.fillStyle = '#cbd5e1'
        ctx.textAlign = 'left'
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(lbl, px, y + 12)
        ctx.fillStyle = 'rgba(148, 163, 184, 0.16)'
        ctx.fillRect(px + 80, y, side - 80, 16)
        ctx.fillStyle = col
        ctx.fillRect(px + 80, y, (side - 80) * val, 16)
        ctx.fillStyle = '#f8fafc'
        ctx.textAlign = 'right'
        ctx.fillText(`${(val * 100).toFixed(1)}%`, px + side - 4, y + 12)
      })
      ctx.restore()

      // Right: Trajectory Plot
      const box: PlotBox = { ...TRAJ_BOX, xMax: Math.max(5, Math.round(p.generations ?? 30)) }
      drawPlotAxes2D(ctx, box, {
        title: 'Allele (p, q) & Heterozygote (Aa) Trajectory',
        xLabel: 'Generation',
        xTicks: 5,
        yTicks: 5,
      })

      const drawSeries = (getter: (s: GenSnapshot) => number, col: string, lw = 2.4, dashed = false) => {
        ctx.save()
        ctx.strokeStyle = col
        ctx.lineWidth = lw
        if (dashed) ctx.setLineDash([5, 4])
        ctx.beginPath()
        series.forEach((pt, idx) => {
          const x = plotMapX(box, pt.gen)
          const y = plotMapY(box, getter(pt))
          if (idx === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
        ctx.restore()
      }

      drawSeries((s) => s.p, PALETTE_CSS.cyan, 2.8)
      drawSeries((s) => s.q, PALETTE_CSS.amber, 2.8)
      drawSeries((s) => s.het, PALETTE_CSS.violet, 2.0, true)

      ctx.save()
      ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE_CSS.cyan
      ctx.fillText('— p (Allele A)', box.x + 12, box.y + 18)
      ctx.fillStyle = PALETTE_CSS.amber
      ctx.fillText('— q (Allele a)', box.x + 110, box.y + 18)
      ctx.fillStyle = PALETTE_CSS.violet
      ctx.fillText('-- Heterozygote 2pq', box.x + 208, box.y + 18)
      ctx.restore()
    },
    readouts: (p) => {
      const series = simulatePopulation(p)
      const last = series[series.length - 1]
      return [
        { label: `p(A) at Gen ${last.gen}`, value: last.p.toFixed(3) },
        { label: `q(a) at Gen ${last.gen}`, value: last.q.toFixed(3) },
        { label: 'Carriers Aa (2pq)', value: `${(last.het * 100).toFixed(1)}%` },
        { label: 'Recessive aa (q²)', value: `${(last.aaRec * 100).toFixed(1)}%` },
      ]
    },
    metrics: (p) => {
      const series = simulatePopulation(p)
      const last = series[series.length - 1]
      return {
        pFinal: last.p,
        qFinal: last.q,
        hetFinal: last.het,
        aaRecFinal: last.aaRec,
      }
    },
  }),
}

export default function HardyWeinbergSelection2D() {
  return <Interactive2DViewer model={hardyWeinbergSelection2dModel} />
}
