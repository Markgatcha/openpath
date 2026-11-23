import { Interactive2DViewer } from '../Interactive2DViewer'
import {
  PALETTE_CSS,
  type Model2DDefinition,
  type Params,
} from '../engine2d'

function computeBayes(p: Params) {
  const prev = (p.prevalence ?? 1.0) / 100
  const sens = (p.sensitivity ?? 95) / 100
  const fpr = (p.falsePos ?? 5) / 100
  const popN = (p.popSize ?? 0) >= 0.5 ? 10_000 : 1000
  const twoTests = (p.sequentialTest ?? 0) >= 0.5

  const sick = popN * prev
  const healthy = popN - sick

  const tp1 = sick * sens
  const fn1 = sick * (1 - sens)
  const fp1 = healthy * fpr
  const tn1 = healthy * (1 - fpr)

  const pos1 = tp1 + fp1
  const ppv1 = pos1 > 0 ? tp1 / pos1 : 0

  // Second independent test applied to positive bucket
  const tp2 = tp1 * sens
  const fp2 = fp1 * fpr
  const pos2 = tp2 + fp2
  const ppv2 = pos2 > 0 ? tp2 / pos2 : 0

  return {
    prev,
    sens,
    fpr,
    popN,
    twoTests,
    sick,
    healthy,
    tp1,
    fn1,
    fp1,
    tn1,
    pos1,
    ppv1,
    tp2,
    fp2,
    pos2,
    ppv2,
    activePPV: twoTests ? ppv2 : ppv1,
    activeTP: twoTests ? tp2 : tp1,
    activeFP: twoTests ? fp2 : fp1,
  }
}

export const bayesNaturalFrequency2dModel: Model2DDefinition = {
  id: 'bayes-natural-frequency-2d',
  title: 'Bayesian Reasoning & Natural Frequencies',
  subtitle:
    'Translate abstract conditional probabilities P(+|D) into a concrete population grid to defeat the Base-Rate Fallacy.',
  viewWidth: 720,
  viewHeight: 460,
  params: [
    {
      kind: 'slider',
      id: 'prevalence',
      label: 'Disease prevalence P(D)',
      min: 0.2,
      max: 25,
      step: 0.2,
      initial: 1.0,
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      kind: 'slider',
      id: 'sensitivity',
      label: 'Sensitivity P(+ | D)',
      min: 60,
      max: 99,
      step: 1,
      initial: 95,
      unit: '%',
    },
    {
      kind: 'slider',
      id: 'falsePos',
      label: 'False positive rate P(+ | ¬D)',
      min: 0.5,
      max: 20,
      step: 0.5,
      initial: 5.0,
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      kind: 'choice',
      id: 'popSize',
      label: 'Sample Cohort',
      choices: ['1,000 people', '10,000 people'],
      initial: 0,
    },
    {
      kind: 'toggle',
      id: 'sequentialTest',
      label: 'Apply 2nd independent + test',
      initial: false,
    },
  ],
  challenges: [
    {
      id: 'base-rate-trap',
      title: 'Beating the Base-Rate Fallacy',
      setupParams: { prevalence: 1.0, sensitivity: 95, falsePos: 5.0, popSize: 0, sequentialTest: 0 },
      predict: {
        prompt:
          'A test has 95% sensitivity and 5% false-positive rate. If disease prevalence is 1% (10 in 1,000), and you test positive ONCE, roughly what is P(Disease | +)?',
        options: [
          'Only ~16% (False positives outnumber True positives ~50 to 9.5!)',
          '95% (matching sensitivity)',
          '50% (equal chance either way)',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep 1 test active and lower the False Positive Rate (or raise Prevalence) until Posterior P(D | +) reaches >= 50%.',
        evaluate: (p, m) => ({
          passed: p.sequentialTest === 0 && m.posteriorPct >= 50,
          feedback: `Posterior P(D | +) = ${m.posteriorPct.toFixed(1)}% (${m.activeTP.toFixed(1)} TP vs ${m.activeFP.toFixed(1)} FP). Target >= 50%.`,
        }),
      },
      explain:
        'At 1% prevalence in 1,000 people, 990 are healthy. A 5% false-positive rate produces 49.5 false alarms versus only 9.5 true positives, making P(D|+) = 9.5 / 59 = 16.1%.',
      misconceptionTag: 'base-rate-fallacy-sensitivity-confusion',
    },
    {
      id: 'sequential-bayes-update',
      title: 'Two Independent Positive Tests',
      setupParams: { prevalence: 1.0, sensitivity: 95, falsePos: 5.0, popSize: 1, sequentialTest: 0 },
      predict: {
        prompt:
          'Starting from a 1% rare disease (P(D|+) = 16.1% after test 1), what does a 2nd independent positive test achieve?',
        options: [
          'Uses 16.1% as the new prior, jumping posterior probability above 75%',
          'Leaves posterior stuck at 16.1%',
          'Drops probability because two tests multiply errors',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep Prevalence = 1.0%, Sensitivity = 95%, False Pos = 5.0%, and toggle ON the 2nd independent test.',
        evaluate: (p, m) => ({
          passed: p.sequentialTest === 1 && p.prevalence <= 1.2 && m.posteriorPct >= 75,
          feedback: `After ${p.sequentialTest === 1 ? '2 tests' : '1 test'}, P(D | ++) = ${m.posteriorPct.toFixed(1)}%.`,
        }),
      },
      explain:
        'Yesterday’s posterior becomes today’s prior! Feeding the 16.1% post-test cohort into a second independent 95%/5% screen elevates certainty to ~78.5%.',
      misconceptionTag: 'forgetting-bayes-prior-updating',
    },
  ],
  build: () => ({
    hotspots: [
      {
        id: 'cohort-grid',
        label: 'Cohort Grid',
        x: 195,
        y: 120,
        title: '1,000-Person Natural Frequency Array',
        body: 'Each tile represents 2 people (out of 1,000). Most tiles are healthy ¬D, which is why even a small false-positive percentage generates a large crowd of false alarms.',
      },
      {
        id: 'positive-bucket',
        label: 'All Positive Results',
        x: 565,
        y: 145,
        title: 'Conditioning on "+" Restricts the Universe',
        body: 'Once a test returns positive, you live inside THIS smaller bucket: Posterior P(D|+) = True Positives / (True + False Positives).',
      },
      {
        id: 'tree-flow',
        label: 'Frequency Tree',
        x: 345,
        y: 350,
        title: 'Natural Frequency Branch Counts',
        body: 'Thinking in whole counts ("9.5 true sick vs 49.5 healthy false alarms") eliminates 80%+ of Bayesian inversion errors compared to raw % formulas.',
      },
    ],
    renderCanvas: (ctx, p) => {
      const b = computeBayes(p)

      ctx.save()
      // Left panel: 500-tile grid representing the cohort
      const gx = 28
      const gy = 48
      const gw = 380
      const gh = 212
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
      ctx.fillRect(gx, gy, gw, gh)
      ctx.strokeRect(gx, gy, gw, gh)

      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(`Population Grid (N = ${b.popN.toLocaleString()})`, gx + 4, gy - 8)

      const cols = 25
      const rows = 20
      const totalCells = cols * rows
      const cellW = (gw - 20) / cols
      const cellH = (gh - 20) / rows

      const nTP = Math.round((b.activeTP / b.popN) * totalCells)
      const nFN = Math.round(((b.sick - b.activeTP) / b.popN) * totalCells)
      const nFP = Math.round((b.activeFP / b.popN) * totalCells)

      let idx = 0
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          let fill = '#334155' // TN
          if (idx < nTP) fill = PALETTE_CSS.emerald
          else if (idx < nTP + nFN) fill = PALETTE_CSS.amber
          else if (idx < nTP + nFN + nFP) fill = PALETTE_CSS.rose
          ctx.fillStyle = fill
          ctx.fillRect(gx + 10 + c * cellW + 1.5, gy + 10 + r * cellH + 1.5, cellW - 3, cellH - 3)
          idx += 1
        }
      }

      // Right panel: Positive Result Magnifier Bucket
      const bx = 432
      const by = 48
      const bw = 260
      const bh = 212
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
      ctx.fillRect(bx, by, bw, bh)
      ctx.strokeRect(bx, by, bw, bh)

      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(
        b.twoTests ? 'Filtered to 2× Positive (++):' : 'Filtered to Test Positive (+):',
        bx + 8,
        by - 8,
      )

      const totPos = Math.max(1e-4, b.activeTP + b.activeFP)
      const tpFrac = b.activeTP / totPos
      const barX = bx + 20
      const barY = by + 28
      const barW = bw - 40
      const barH = 38

      ctx.fillStyle = PALETTE_CSS.emerald
      ctx.fillRect(barX, barY, barW * tpFrac, barH)
      ctx.fillStyle = PALETTE_CSS.rose
      ctx.fillRect(barX + barW * tpFrac, barY, barW * (1 - tpFrac), barH)

      ctx.fillStyle = '#f8fafc'
      ctx.font = 'bold 18px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`P(D | +) = ${(b.activePPV * 100).toFixed(1)}%`, bx + bw / 2, by + 105)

      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE_CSS.emerald
      ctx.fillText(`True Positives:  ${b.activeTP.toFixed(1)}`, bx + 22, by + 138)
      ctx.fillStyle = PALETTE_CSS.rose
      ctx.fillText(`False Positives: ${b.activeFP.toFixed(1)}`, bx + 22, by + 158)
      ctx.fillStyle = PALETTE_CSS.amber
      ctx.fillText(`False Negatives: ${(b.sick - b.activeTP).toFixed(1)}`, bx + 22, by + 178)
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(`Total Positive:  ${totPos.toFixed(1)}`, bx + 22, by + 198)

      // Bottom natural frequency tree
      const tx = 28
      const ty = 280
      const tw = 664
      const th = 152
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
      ctx.fillRect(tx, ty, tw, th)
      ctx.strokeRect(tx, ty, tw, th)

      const drawNode = (x: number, y: number, title: string, val: string, col: string) => {
        ctx.fillStyle = '#0f172a'
        ctx.strokeStyle = col
        ctx.lineWidth = 1.6
        ctx.fillRect(x - 68, y - 18, 136, 36)
        ctx.strokeRect(x - 68, y - 18, 136, 36)
        ctx.fillStyle = col
        ctx.font = 'bold 10px ui-sans-serif, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(title, x, y - 3)
        ctx.fillStyle = '#f8fafc'
        ctx.font = 'bold 11px ui-monospace, monospace'
        ctx.fillText(val, x, y + 12)
      }

      const drawLink = (x1: number, y1: number, x2: number, y2: number, col: string) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      drawLink(120, ty + 76, 280, ty + 42, PALETTE_CSS.emerald)
      drawLink(120, ty + 76, 280, ty + 110, PALETTE_CSS.slate)
      drawLink(320, ty + 42, 540, ty + 28, PALETTE_CSS.emerald)
      drawLink(320, ty + 42, 540, ty + 62, PALETTE_CSS.amber)
      drawLink(320, ty + 110, 540, ty + 96, PALETTE_CSS.rose)
      drawLink(320, ty + 110, 540, ty + 130, PALETTE_CSS.slate)

      drawNode(110, ty + 76, 'Cohort N', `${b.popN.toLocaleString()}`, PALETTE_CSS.cyan)
      drawNode(310, ty + 42, `Sick (${(b.prev * 100).toFixed(1)}%)`, `${b.sick.toFixed(1)}`, PALETTE_CSS.emerald)
      drawNode(310, ty + 110, `Healthy`, `${b.healthy.toFixed(1)}`, PALETTE_CSS.slate)

      drawNode(570, ty + 28, 'True Positives', `${b.activeTP.toFixed(1)}`, PALETTE_CSS.emerald)
      drawNode(570, ty + 62, 'False Negatives', `${(b.sick - b.activeTP).toFixed(1)}`, PALETTE_CSS.amber)
      drawNode(570, ty + 96, 'False Positives', `${b.activeFP.toFixed(1)}`, PALETTE_CSS.rose)
      drawNode(570, ty + 130, 'True Negatives', `${(b.healthy - b.activeFP).toFixed(1)}`, PALETTE_CSS.slate)
      ctx.restore()
    },
    readouts: (p) => {
      const b = computeBayes(p)
      return [
        { label: b.twoTests ? 'Posterior P(D | ++)' : 'Posterior P(D | +)', value: `${(b.activePPV * 100).toFixed(1)}%` },
        { label: 'True Positives', value: `${b.activeTP.toFixed(1)}` },
        { label: 'False Positives', value: `${b.activeFP.toFixed(1)}` },
        { label: 'Odds TP : FP', value: `1 : ${(b.activeFP / Math.max(0.01, b.activeTP)).toFixed(2)}` },
      ]
    },
    metrics: (p) => {
      const b = computeBayes(p)
      return {
        posteriorPct: b.activePPV * 100,
        activeTP: b.activeTP,
        activeFP: b.activeFP,
      }
    },
  }),
}

export default function BayesNaturalFrequency2D() {
  return <Interactive2DViewer model={bayesNaturalFrequency2dModel} />
}
