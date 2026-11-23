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

const HORIZON_DAYS = 60
const DECAY_BOX: PlotBox = {
  x: 64,
  y: 44,
  w: 626,
  h: 356,
  xMin: 0,
  xMax: HORIZON_DAYS,
  yMin: 0,
  yMax: 100,
}

/**
 * FSRS-4.5 power-law forgetting curve:
 * R(t, S) = (1 + (19/81) * (t / S))^(-0.5)  => R(S, S) = 90%.
 */
function fsrsRetrievability(elapsedDays: number, stability: number): number {
  const factor = 19 / 81
  return Math.pow(1 + factor * (elapsedDays / Math.max(0.1, stability)), -0.5)
}

function intervalForTarget(stability: number, targetRetentionFrac: number): number {
  const r = Math.max(0.5, Math.min(0.985, targetRetentionFrac))
  return (81 / 19) * stability * (Math.pow(r, -2) - 1)
}

function simulateSchedule(p: Params) {
  const targetR = (p.targetRetention ?? 90) / 100
  const s0 = p.initialStab ?? 2.0
  const grade = Math.round(p.gradeQuality ?? 2) // 0=Again, 1=Hard, 2=Good, 3=Easy
  const maxReps = Math.round(p.repCount ?? 4)
  const mult = grade === 0 ? 0.5 : grade === 1 ? 1.45 : grade === 2 ? 2.35 : 3.15

  const reviewDays: Array<{ day: number; stabBefore: number; stabAfter: number }> = []
  let day = 0
  let s = s0

  for (let r = 0; r < maxReps; r += 1) {
    const dt = Math.max(0.5, intervalForTarget(s, targetR))
    day += dt
    if (day > HORIZON_DAYS) break
    const nextS = grade === 0 ? Math.max(0.6, s * 0.5) : s * mult
    reviewDays.push({ day, stabBefore: s, stabAfter: nextS })
    s = nextS
  }

  const evalSpacedAt = (t: number): number => {
    let lastDay = 0
    let curS = s0
    for (const rev of reviewDays) {
      if (t < rev.day) break
      lastDay = rev.day
      curS = rev.stabAfter
    }
    return fsrsRetrievability(Math.max(0, t - lastDay), curS) * 100
  }

  // Cramming comparison: same number of reviews compressed across Day 0..1.5 (negligible spacing bonus)
  const crammedS = s0 * 1.35
  const evalCrammedAt = (t: number): number => fsrsRetrievability(Math.max(0, t - 1.5), crammedS) * 100

  const spacedDay40 = evalSpacedAt(40)
  const crammedDay40 = evalCrammedAt(40)
  const finalStab = reviewDays.length > 0 ? reviewDays[reviewDays.length - 1].stabAfter : s0

  // How many total reviews would be needed across 60 days to keep R >= targetR
  let needed60 = 0
  let simDay = 0
  let simS = s0
  while (needed60 < 50) {
    const dt = Math.max(0.4, intervalForTarget(simS, targetR))
    simDay += dt
    if (simDay > HORIZON_DAYS) break
    needed60 += 1
    simS = grade === 0 ? Math.max(0.6, simS * 0.5) : simS * mult
  }

  return {
    targetR,
    s0,
    mult,
    reviewDays,
    evalSpacedAt,
    evalCrammedAt,
    spacedDay40,
    crammedDay40,
    finalStab,
    needed60,
  }
}

export const fsrsMemoryDecay2dModel: Model2DDefinition = {
  id: 'fsrs-memory-decay-2d',
  title: 'FSRS Spaced Repetition & Memory Stability',
  subtitle:
    'Visualize power-law forgetting R(t, S), optimal review timing at your target retention threshold, and why cramming collapses by Day 40.',
  viewWidth: 720,
  viewHeight: 460,
  params: [
    {
      kind: 'slider',
      id: 'targetRetention',
      label: 'Desired Retention (%)',
      min: 80,
      max: 97,
      step: 1,
      initial: 90,
      unit: '%',
    },
    {
      kind: 'slider',
      id: 'initialStab',
      label: 'Initial Stability S₀ (days)',
      min: 1,
      max: 7,
      step: 0.5,
      initial: 2.0,
      unit: ' d',
    },
    {
      kind: 'choice',
      id: 'gradeQuality',
      label: 'Review Grade',
      choices: ['Again (lapse)', 'Hard', 'Good', 'Easy'],
      initial: 2,
    },
    {
      kind: 'slider',
      id: 'repCount',
      label: 'Scheduled Reviews',
      min: 1,
      max: 6,
      step: 1,
      initial: 4,
    },
    {
      kind: 'toggle',
      id: 'showCram',
      label: 'Compare Cramming (Day 0–1.5)',
      initial: true,
    },
  ],
  challenges: [
    {
      id: 'spacing-vs-cramming-day40',
      title: 'Why Spacing Beats Cramming with Zero Extra Study Time',
      setupParams: { targetRetention: 90, initialStab: 2.0, gradeQuality: 2, repCount: 4, showCram: 1 },
      predict: {
        prompt:
          'You review a flashcard 4 times either CRAMMED inside 36 hours OR SPACED each time recall hits 90%. At Day 40, what holds true?',
        options: [
          'Spaced retrieval keeps recall > 80%, while Crammed drops below 35%',
          'Both end up identical at Day 40 because 4 reviews = 4 reviews',
          'Cramming scores higher because all 4 reviews were fresher',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'With Cramming overlay active and 4 Good reviews at 90% target, verify Spaced recall at Day 40 exceeds 80% while Crammed falls < 35%.',
        evaluate: (p, m) => ({
          passed: p.showCram === 1 && m.spacedDay40 >= 80 && m.crammedDay40 < 35,
          feedback: `Day 40 Retention: Spaced = ${m.spacedDay40.toFixed(1)}% vs Crammed = ${m.crammedDay40.toFixed(1)}%.`,
        }),
      },
      explain:
        'Retrieving near the desirable difficulty boundary (90%) triggers FSRS stability amplification each cycle (2d → 4.7d → 11d → 26d), flattening the decay curve dramatically without adding extra reviews.',
      misconceptionTag: 'cramming-equals-spaced-repetition',
    },
    {
      id: 'high-retention-workload-cost',
      title: 'The 97% Retention Workload Trap',
      setupParams: { targetRetention: 85, initialStab: 2.0, gradeQuality: 2, repCount: 6, showCram: 0 },
      predict: {
        prompt:
          'Raising Desired Retention from 85% up to 97% feels safer. What does it do to required reviews inside a 60-day window?',
        options: [
          'Intervals shrink drastically, multiplying required reviews many-fold',
          'Adds only 1 extra review over 60 days',
          'Makes stability grow faster without extra reviews',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Raise Desired Retention >= 96% and observe 60-day Reviews Needed jump >= 8 (up from 3 at 85%).',
        evaluate: (p, m) => ({
          passed: p.targetRetention >= 96 && m.needed60 >= 8,
          feedback: `At ${p.targetRetention}% target retention, 60-day reviews needed = ${m.needed60}.`,
        }),
      },
      explain:
        'Because forgetting decays fastest right after 100%, enforcing 97% forces reviews at ~25% of the interval length needed for 90% — creating massive review backlog for tiny recall gains.',
      misconceptionTag: 'higher-target-retention-always-better',
    },
  ],
  build: () => ({
    hotspots: [
      {
        id: 'threshold',
        label: 'Target Floor R',
        x: 560,
        y: 92,
        title: 'Desirable Difficulty Review Trigger',
        body: 'Reviewing right as recall crosses this dashed threshold maximizes stability gain per minute studied.',
      },
      {
        id: 'cram-curve',
        label: 'Cramming Collapse',
        x: 265,
        y: 300,
        visible: (p) => (p.showCram ?? 1) >= 0.5,
        title: 'Massed Practice Forgetting Curve',
        body: 'Four back-to-back reviews at near-100% recall create minimal memory consolidation — collapsing rapidly over weeks.',
      },
      {
        id: 'flattened-curve',
        label: 'Flattened Decay',
        x: 470,
        y: 120,
        title: 'Expanding Intervals (Exponential Stability)',
        body: 'Notice each sawtooth drop gets progressively flatter as memory Stability S doubles/triples after each successful recall.',
      },
    ],
    renderCanvas: (ctx, p) => {
      const sim = simulateSchedule(p)
      drawPlotAxes2D(ctx, DECAY_BOX, {
        title: `FSRS Recall Trajectory Across 60 Days (Final S = ${sim.finalStab.toFixed(1)} d)`,
        xLabel: 'Days elapsed t',
        yLabel: 'Recall R (%)',
        xTicks: 6,
        yTicks: 5,
        yFormat: (v) => `${Math.round(v)}%`,
      })

      // Target retention horizontal guide
      const ry = plotMapY(DECAY_BOX, sim.targetR * 100)
      ctx.save()
      ctx.strokeStyle = PALETTE_CSS.amber
      ctx.setLineDash([6, 4])
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(DECAY_BOX.x, ry)
      ctx.lineTo(DECAY_BOX.x + DECAY_BOX.w, ry)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = PALETTE_CSS.amber
      ctx.font = 'bold 10px ui-monospace, monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`Trigger: ${Math.round(sim.targetR * 100)}%`, DECAY_BOX.x + DECAY_BOX.w - 8, ry - 6)

      // Crammed curve (rose dashed)
      if ((p.showCram ?? 1) >= 0.5) {
        ctx.strokeStyle = PALETTE_CSS.rose
        ctx.setLineDash([5, 4])
        ctx.lineWidth = 2.2
        ctx.beginPath()
        for (let i = 0; i <= 180; i += 1) {
          const t = (HORIZON_DAYS * i) / 180
          const x = plotMapX(DECAY_BOX, t)
          const y = plotMapY(DECAY_BOX, sim.evalCrammedAt(t))
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Sawtooth spaced FSRS curve (cyan solid)
      ctx.strokeStyle = PALETTE_CSS.cyan
      ctx.lineWidth = 2.8
      ctx.beginPath()
      const totalPts = 360
      for (let i = 0; i <= totalPts; i += 1) {
        const t = (HORIZON_DAYS * i) / totalPts
        const x = plotMapX(DECAY_BOX, t)
        const y = plotMapY(DECAY_BOX, sim.evalSpacedAt(t))
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Review markers
      sim.reviewDays.forEach((rev, idx) => {
        const rx = plotMapX(DECAY_BOX, rev.day)
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'
        ctx.beginPath()
        ctx.moveTo(rx, DECAY_BOX.y + DECAY_BOX.h)
        ctx.lineTo(rx, DECAY_BOX.y + 18)
        ctx.stroke()
        ctx.fillStyle = PALETTE_CSS.emerald
        ctx.beginPath()
        ctx.arc(rx, ry, 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = 'bold 9px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`R${idx + 1}`, rx, DECAY_BOX.y + 14)
      })
      ctx.restore()
    },
    readouts: (p) => {
      const sim = simulateSchedule(p)
      return [
        { label: 'Spaced Day 40 Recall', value: `${sim.spacedDay40.toFixed(1)}%` },
        { label: 'Crammed Day 40 Recall', value: `${sim.crammedDay40.toFixed(1)}%` },
        { label: 'Final Stability S', value: `${sim.finalStab.toFixed(1)} days` },
        { label: '60-Day Reviews Needed', value: `${sim.needed60}` },
      ]
    },
    metrics: (p) => {
      const sim = simulateSchedule(p)
      return {
        spacedDay40: sim.spacedDay40,
        crammedDay40: sim.crammedDay40,
        finalStab: sim.finalStab,
        needed60: sim.needed60,
      }
    },
  }),
}

export default function FsrsMemoryDecay2D() {
  return <Interactive2DViewer model={fsrsMemoryDecay2dModel} />
}
