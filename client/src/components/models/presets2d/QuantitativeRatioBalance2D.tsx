import { Interactive2DViewer } from '../Interactive2DViewer'
import { PALETTE_CSS, type Model2DDefinition, type Params } from '../engine2d'

function computeState(p: Params) {
  const mode = Math.round(p.mode ?? 0) // 0=Double Number Line, 1=Equation Balance Scale
  const a = Math.round(p.partA ?? 2)
  const b = Math.round(p.partB ?? 3)
  const kOrX = p.scaleOrGuess ?? 2.5
  const targetRhs = Math.round(p.targetRhs ?? 11)

  const scaledA = a * kOrX
  const scaledB = b * kOrX

  const lhs = a * kOrX + b
  const diff = lhs - targetRhs
  const exactX = (targetRhs - b) / Math.max(1, a)

  return { mode, a, b, kOrX, targetRhs, scaledA, scaledB, lhs, diff, exactX }
}

export const quantitativeRatioBalance2dModel: Model2DDefinition = {
  id: 'quantitative-ratio-balance-2d',
  title: 'Proportional Double Number Line & Equation Balance',
  subtitle:
    'Contrast multiplicative ratio scaling k(a : b) against naive addition, and physically level two-step equations ax + b = c.',
  viewWidth: 720,
  viewHeight: 460,
  params: [
    {
      kind: 'choice',
      id: 'mode',
      label: 'Model Mode',
      choices: ['Double Number Line', 'Algebra Balance Scale'],
      initial: 0,
    },
    {
      kind: 'slider',
      id: 'partA',
      label: 'Ratio A (or coeff a in ax + b)',
      min: 1,
      max: 6,
      step: 1,
      initial: 2,
    },
    {
      kind: 'slider',
      id: 'partB',
      label: 'Ratio B (or constant b in ax + b)',
      min: 1,
      max: 10,
      step: 1,
      initial: 3,
    },
    {
      kind: 'slider',
      id: 'scaleOrGuess',
      label: 'Scale factor k (or x test value)',
      min: 0.5,
      max: 8,
      step: 0.5,
      initial: 2.5,
    },
    {
      kind: 'slider',
      id: 'targetRhs',
      label: 'Balance Right Pan (c)',
      min: 4,
      max: 25,
      step: 1,
      initial: 11,
    },
  ],
  challenges: [
    {
      id: 'multiplicative-vs-additive-ratio',
      title: 'Ratio Scaling Is Multiplicative, Not Additive',
      setupParams: { mode: 0, partA: 2, partB: 3, scaleOrGuess: 1.0 },
      predict: {
        prompt:
          'Paint is mixed in a 2 : 3 ratio (2 cyan : 3 amber). If you increase cyan from 2 to 6 (+4 parts), how many amber parts keep the exact same shade?',
        options: [
          '9 amber parts (multiplying both 2 and 3 by k = 3)',
          '7 amber parts (adding +4 to both numbers)',
          '6 amber parts (matching cyan)',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'In Double Number Line mode (base 2 : 3), drag Scale factor k until Cyan A reaches 6 and verify Amber B aligns at 9.',
        evaluate: (p, m) => ({
          passed: p.mode === 0 && p.partA === 2 && p.partB === 3 && Math.abs(m.scaledA - 6) < 0.05 && Math.abs(m.scaledB - 9) < 0.05,
          feedback: `Scaled pair = ${m.scaledA.toFixed(1)} : ${m.scaledB.toFixed(1)} (k = ${p.scaleOrGuess.toFixed(1)}). Target = 6 : 9.`,
        }),
      },
      explain:
        'Adding the same constant (+4) changes the fraction 2/3 into 6/7 ≠ 2/3! Equivalent ratios always multiply both parallel number lines by the same scale factor k.',
      misconceptionTag: 'additive-ratio-misconception',
    },
    {
      id: 'level-algebra-balance',
      title: 'Balancing 2x + 3 = 11',
      setupParams: { mode: 1, partA: 2, partB: 3, targetRhs: 11, scaleOrGuess: 2.0 },
      predict: {
        prompt:
          'On the scale, the left pan holds 2 mystery pouches of weight x plus 3 unit cubes, while the right pan holds 11 cubes. Which x levels the beam?',
        options: [
          'x = 4 (subtract 3 from both pans -> 2x = 8, then divide by 2)',
          'x = 7 (11 + 3 divided by 2)',
          'x = 5.5 (11 divided by 2 ignoring +3)',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep Balance Scale at 2x + 3 = 11 and slide x test value until the beam levels (diff = 0).',
        evaluate: (p, m) => ({
          passed: p.mode === 1 && p.partA === 2 && p.partB === 3 && p.targetRhs === 11 && Math.abs(m.diff) < 0.05,
          feedback: `Left Pan = ${m.lhs.toFixed(1)} vs Right Pan = ${p.targetRhs}. Tilt diff = ${m.diff.toFixed(1)}.`,
        }),
      },
      explain:
        'An equals sign is a physical balance beam. Subtracting 3 cubes from BOTH sides leaves 2x = 8, and halving both pans gives x = 4.',
      misconceptionTag: 'one-sided-equation-manipulation',
    },
  ],
  build: () => ({
    dragHandles: [
      {
        id: 'scale-slider-handle',
        label: 'Ratio k / Value x cursor',
        color: PALETTE_CSS.amber,
        getPos: (p) => {
          const s = computeState(p)
          const t = (s.kOrX - 0.5) / 7.5
          return { x: 80 + t * 560, y: s.mode === 0 ? 186 : 386 }
        },
        onDrag: (px) => {
          const raw = 0.5 + ((px - 80) / 560) * 7.5
          const snapped = Math.max(0.5, Math.min(8, Math.round(raw * 2) / 2))
          return { scaleOrGuess: snapped }
        },
        ariaValueText: (p) => `k or x = ${p.scaleOrGuess.toFixed(1)}`,
      },
    ],
    hotspots: [
      {
        id: 'unit-rate',
        label: 'Unit Rate (k = 1)',
        x: 165,
        y: 120,
        visible: (p) => Math.round(p.mode ?? 0) === 0,
        title: 'Base Ratio Anchor',
        body: 'The vertical tick alignment shows equivalent ratios: k × a directly above k × b preserves a : b.',
      },
      {
        id: 'beam-pivot',
        label: 'Equality Fulcrum',
        x: 360,
        y: 260,
        visible: (p) => Math.round(p.mode ?? 0) === 1,
        title: 'Equilibrium Fulcrum (=)',
        body: 'The beam sits perfectly horizontal ONLY when Left Value (ax + b) strictly equals Right Value (c).',
      },
    ],
    renderCanvas: (ctx, p) => {
      const s = computeState(p)
      ctx.save()

      if (s.mode === 0) {
        // Double Number Line Ratio Model
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.fillRect(28, 36, 664, 392)
        ctx.strokeRect(28, 36, 664, 392)

        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(`Double Number Line — Base Ratio ${s.a} : ${s.b}  (Scale k = ${s.kOrX.toFixed(1)}×)`, 46, 66)

        const x0 = 80
        const x1 = 640
        const yTop = 136
        const yBot = 236

        // Draw two number lines
        const drawLine = (y: number, col: string, label: string, mult: number) => {
          ctx.strokeStyle = col
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(x0, y)
          ctx.lineTo(x1, y)
          ctx.stroke()

          ctx.fillStyle = col
          ctx.font = 'bold 11px ui-monospace, monospace'
          ctx.textAlign = 'left'
          ctx.fillText(label, x0, y - 18)

          for (let k = 0; k <= 8; k += 1) {
            const tx = x0 + (k / 8) * (x1 - x0)
            ctx.beginPath()
            ctx.moveTo(tx, y - 7)
            ctx.lineTo(tx, y + 7)
            ctx.stroke()
            ctx.font = '10px ui-monospace, monospace'
            ctx.textAlign = 'center'
            ctx.fillText(`${k * mult}`, tx, y + 22)
          }
        }

        drawLine(yTop, PALETTE_CSS.cyan, `Part A (base ${s.a})`, s.a)
        drawLine(yBot, PALETTE_CSS.amber, `Part B (base ${s.b})`, s.b)

        // Vertical alignment beam at selected k
        const kx = x0 + (s.kOrX / 8) * (x1 - x0)
        ctx.strokeStyle = PALETTE_CSS.emerald
        ctx.lineWidth = 2.5
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(kx, yTop - 10)
        ctx.lineTo(kx, yBot + 28)
        ctx.stroke()
        ctx.setLineDash([])

        // Tape-diagram comparison vs wrong additive offset
        ctx.fillStyle = PALETTE_CSS.emerald
        ctx.font = 'bold 14px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(
          `Equivalent Ratio: ${s.scaledA.toFixed(1)} : ${s.scaledB.toFixed(1)}  (k = ${s.kOrX.toFixed(1)}×)`,
          360,
          310,
        )

        // Visual proportional unit blocks
        const blockW = 24
        const nA = Math.min(20, Math.round(s.scaledA))
        const nB = Math.min(20, Math.round(s.scaledB))
        for (let i = 0; i < nA; i += 1) {
          ctx.fillStyle = 'rgba(34, 211, 238, 0.78)'
          ctx.fillRect(80 + i * (blockW + 4), 342, blockW, 22)
        }
        for (let i = 0; i < nB; i += 1) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.78)'
          ctx.fillRect(80 + i * (blockW + 4), 374, blockW, 22)
        }
      } else {
        // Algebra Equation Balance Scale
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.fillRect(28, 36, 664, 392)
        ctx.strokeRect(28, 36, 664, 392)

        const balanced = Math.abs(s.diff) < 0.05
        ctx.fillStyle = balanced ? PALETTE_CSS.emerald : '#e2e8f0'
        ctx.font = 'bold 15px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(
          `${s.a}x + ${s.b}  ${balanced ? '=' : s.diff > 0 ? '>' : '<'}  ${s.targetRhs}    (testing x = ${s.kOrX.toFixed(1)})`,
          360,
          72,
        )

        const tiltRad = Math.max(-0.26, Math.min(0.26, -s.diff * 0.032))
        const cx = 360
        const cy = 240
        const arm = 175

        // Fulcrum pedestal
        ctx.fillStyle = '#475569'
        ctx.beginPath()
        ctx.moveTo(cx - 26, cy + 95)
        ctx.lineTo(cx + 26, cy + 95)
        ctx.lineTo(cx, cy)
        ctx.closePath()
        ctx.fill()

        // Tilted beam
        const lx = cx - Math.cos(tiltRad) * arm
        const ly = cy + Math.sin(tiltRad) * arm
        const rx = cx + Math.cos(tiltRad) * arm
        const ry = cy - Math.sin(tiltRad) * arm

        ctx.strokeStyle = balanced ? PALETTE_CSS.emerald : PALETTE_CSS.amber
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(lx, ly)
        ctx.lineTo(rx, ry)
        ctx.stroke()

        // Draw Left & Right Pans
        const drawPan = (px: number, py: number, label: string, col: string) => {
          ctx.fillStyle = '#1e293b'
          ctx.strokeStyle = col
          ctx.lineWidth = 2.5
          ctx.fillRect(px - 75, py - 52, 150, 48)
          ctx.strokeRect(px - 75, py - 52, 150, 48)
          ctx.fillStyle = '#f8fafc'
          ctx.font = 'bold 13px ui-monospace, monospace'
          ctx.textAlign = 'center'
          ctx.fillText(label, px, py - 24)
        }
        drawPan(lx, ly, `LHS = ${s.lhs.toFixed(1)}`, PALETTE_CSS.cyan)
        drawPan(rx, ry, `RHS = ${s.targetRhs}`, PALETTE_CSS.violet)

        // Show equation chips under fulcrum
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(
          `${s.a} × (${s.kOrX.toFixed(1)}) + ${s.b} = ${s.lhs.toFixed(1)}   |   Exact solution x = ${s.exactX.toFixed(2)}`,
          360,
          362,
        )
      }
      ctx.restore()
    },
    readouts: (p) => {
      const s = computeState(p)
      if (s.mode === 0) {
        return [
          { label: 'Scaled Pair (kA : kB)', value: `${s.scaledA.toFixed(1)} : ${s.scaledB.toFixed(1)}` },
          { label: 'Unit Rate B / A', value: (s.b / s.a).toFixed(3) },
          { label: 'Scale Factor k', value: `${s.kOrX.toFixed(1)}×` },
          { label: 'Sum k(A + B)', value: (s.scaledA + s.scaledB).toFixed(1) },
        ]
      }
      return [
        { label: 'Left Pan (ax + b)', value: s.lhs.toFixed(1) },
        { label: 'Right Pan (c)', value: `${s.targetRhs}` },
        { label: 'Imbalance (L − R)', value: s.diff.toFixed(1) },
        { label: 'Solved x', value: s.exactX.toFixed(2) },
      ]
    },
    metrics: computeState,
  }),
}

export default function QuantitativeRatioBalance2D() {
  return <Interactive2DViewer model={quantitativeRatioBalance2dModel} />
}
