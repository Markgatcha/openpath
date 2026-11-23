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

function computeSeries(p: Params) {
  const principal = p.principal ?? 5000
  const r = (p.rate ?? 7) / 100
  const years = Math.max(1, Math.round(p.years ?? 25))
  const contribYr = (p.contrib ?? 150) * 12
  const infl = (p.inflation ?? 2.5) / 100
  const disc = (p.discount ?? 8) / 100

  const balanceAt = (t: number) => {
    if (r === 0) return principal + contribYr * t
    return principal * Math.pow(1 + r, t) + contribYr * ((Math.pow(1 + r, t) - 1) / r)
  }

  const realAt = (t: number) => balanceAt(t) / Math.pow(1 + infl, t)
  const simpleAt = (t: number) => principal + principal * r * t + contribYr * t

  // Corporate / project NPV view: initial outlay `-principal`, followed by annual cash flow `contribYr + principal * r`
  // plus terminal recovery at `years` scaled gently so NPV crosses 0 naturally inside the discount slider range.
  const annualCf = principal * (r + 0.04) + contribYr * 0.6
  let pvInflows = 0
  for (let yr = 1; yr <= years; yr += 1) {
    pvInflows += annualCf / Math.pow(1 + disc, yr)
  }
  const initialOutlay = principal * 2.2
  const npv = pvInflows - initialOutlay

  const fvEnd = balanceAt(years)
  const realEnd = realAt(years)
  const totalContributed = principal + contribYr * years
  const doublingYears = r > 0 ? Math.log(2) / Math.log(1 + r) : Infinity

  return {
    principal,
    r,
    years,
    contribYr,
    infl,
    disc,
    balanceAt,
    realAt,
    simpleAt,
    fvEnd,
    realEnd,
    totalContributed,
    doublingYears,
    initialOutlay,
    pvInflows,
    npv,
  }
}

const CHART_BOX: PlotBox = {
  x: 68,
  y: 44,
  w: 410,
  h: 356,
  xMin: 0,
  xMax: 40,
  yMin: 0,
  yMax: 250_000,
}

export const compoundGrowthNpv2dModel: Model2DDefinition = {
  id: 'compound-growth-npv-2d',
  title: 'Compound Growth, Inflation & NPV',
  subtitle:
    'Contrast exponential compounding against linear saving, inflation drag, and discounted Net Present Value.',
  viewWidth: 720,
  viewHeight: 460,
  params: [
    {
      kind: 'slider',
      id: 'principal',
      label: 'Initial principal ($)',
      min: 1000,
      max: 25000,
      step: 500,
      initial: 5000,
      format: (v) => `$${v.toLocaleString()}`,
    },
    {
      kind: 'slider',
      id: 'rate',
      label: 'Annual return r (%)',
      min: 1,
      max: 15,
      step: 0.5,
      initial: 7,
      unit: '%',
    },
    {
      kind: 'slider',
      id: 'contrib',
      label: 'Monthly deposit ($)',
      min: 0,
      max: 500,
      step: 25,
      initial: 150,
      format: (v) => `$${v}/mo`,
    },
    {
      kind: 'slider',
      id: 'years',
      label: 'Horizon (years)',
      min: 5,
      max: 40,
      step: 1,
      initial: 25,
      unit: ' yr',
    },
    {
      kind: 'slider',
      id: 'inflation',
      label: 'Inflation (%)',
      min: 0,
      max: 6,
      step: 0.5,
      initial: 2.5,
      unit: '%',
    },
    {
      kind: 'slider',
      id: 'discount',
      label: 'NPV discount rate (%)',
      min: 1,
      max: 18,
      step: 0.5,
      initial: 9,
      unit: '%',
    },
  ],
  challenges: [
    {
      id: 'rule-of-72-doubling',
      title: 'Halving the Doubling Time',
      setupParams: { principal: 5000, rate: 5, contrib: 0, years: 30, inflation: 0 },
      predict: {
        prompt:
          'At 5% annual return with $0 monthly deposits, $5,000 doubles in ~14.2 years. If you raise r to 10%, roughly when does $5,000 reach $10,000?',
        options: [
          'Around year 7.2 (doubling r halves doubling time)',
          'Around year 10.0 (saves 4 years linearly)',
          'Around year 3.6 (quarter of the time)',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Set Annual return r = 10% (keep $0/mo deposit) to verify the Rule of 72 marker.',
        evaluate: (p, m) => ({
          passed: p.rate >= 9.9 && p.rate <= 10.1 && p.contrib === 0 && m.doublingYears <= 7.4,
          feedback:
            p.contrib > 0
              ? 'Keep Monthly deposit at $0 to isolate pure compounding doubling time.'
              : `Doubling time = ${m.doublingYears?.toFixed(1) ?? '?'} yrs (Rule of 72 ≈ 7.2 yrs at r = 10%).`,
        }),
      },
      explain:
        'Because (1 + r)^t = 2 solves to t = ln(2)/ln(1+r) ≈ 72 / (100r), doubling the interest rate cuts doubling time nearly in half (~7.3 yrs vs ~14.2 yrs).',
      misconceptionTag: 'linear-extrapolation-of-exponentials',
    },
    {
      id: 'npv-discount-crossover',
      title: 'Flipping Project NPV Positive',
      setupParams: { principal: 10000, rate: 6, contrib: 100, years: 12, discount: 15 },
      predict: {
        prompt:
          'At a 15% hurdle rate (discount rate), this project has negative NPV despite positive total cash inflows. What lowers the hurdle so NPV turns positive?',
        options: [
          'Lower the NPV discount rate below the project IRR',
          'Raise the NPV discount rate above 18%',
          'Inflation automatically makes future nominal dollars worth more today',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Lower the NPV discount rate until Net Present Value turns >= $0.',
        evaluate: (_p, m) => ({
          passed: m.npv >= 0,
          feedback:
            m.npv >= 0
              ? `NPV is positive ($${Math.round(m.npv).toLocaleString()}) — PV of inflows exceeds the upfront outlay.`
              : `Current NPV = -$${Math.abs(Math.round(m.npv)).toLocaleString()}. Future inflows are still discounted too steeply.`,
        }),
      },
      explain:
        'Each future dollar is worth 1/(1+d)^t today. When the discount rate exceeds the Internal Rate of Return (IRR), discounted inflows fall short of the initial capital outlay.',
      misconceptionTag: 'ignoring-time-value-discounting',
    },
  ],
  build: () => {
    let inspectYear = 18

    const boxFor = (p: Params): PlotBox => {
      const s = computeSeries(p)
      const peak = Math.max(25_000, s.fvEnd * 1.12)
      const roundedMax = Math.ceil(peak / 25_000) * 25_000
      return {
        ...CHART_BOX,
        xMax: s.years,
        yMax: roundedMax,
      }
    }

    return {
      dragHandles: [
        {
          id: 'year-cursor',
          label: 'Year cursor',
          color: PALETTE_CSS.amber,
          getPos: (p) => {
            const s = computeSeries(p)
            const box = boxFor(p)
            const t = Math.max(0, Math.min(s.years, inspectYear))
            return {
              x: plotMapX(box, t),
              y: plotMapY(box, s.balanceAt(t)),
            }
          },
          onDrag: (px, _py, p) => {
            const s = computeSeries(p)
            const box = boxFor(p)
            inspectYear = Math.max(0, Math.min(s.years, Math.round(plotUnmapX(box, px))))
            return {}
          },
          ariaValueText: () => `Year ${inspectYear}`,
        },
      ],
      hotspots: [
        {
          id: 'doubling',
          label: 'Rule of 72',
          x: 185,
          y: 255,
          title: 'Rule of 72 Doubling Marker',
          body: 'Pure exponential growth doubles every t ≈ 72 / r% years. Raising r from 5% to 10% compresses doubling from 14.2 yrs to 7.3 yrs.',
        },
        {
          id: 'compound-gap',
          label: 'Compound divergence',
          x: 390,
          y: 120,
          title: 'Exponential vs Linear Divergence',
          body: 'Early years look nearly straight, tempting people into linear guessing. Over 20–40 years, earning interest-on-interest dominates total wealth.',
        },
        {
          id: 'real-drag',
          label: 'Inflation erosion',
          x: 410,
          y: 230,
          title: 'Real Purchasing Power',
          body: 'Inflation divides future purchasing power by (1 + i)^t. Subtracting ~inflation from nominal return gives approximate real growth.',
        },
        {
          id: 'npv-stack',
          label: 'NPV present value',
          x: 605,
          y: 195,
          title: 'Net Present Value Comparison',
          body: 'Positive nominal cash flows can still destroy economic value if their discounted Present Value is below the initial capital outlay.',
        },
      ],
      renderCanvas: (ctx, p) => {
        const s = computeSeries(p)
        const box = boxFor(p)
        const cursorT = Math.max(0, Math.min(s.years, inspectYear))

        drawPlotAxes2D(ctx, box, {
          title: 'Growth Trajectory ($ Nominal vs Real vs Deposits)',
          xLabel: 'Years (t)',
          xTicks: 5,
          yTicks: 5,
          yFormat: (v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`),
        })

        // Shaded compounding bonus area between nominal balance and deposits
        ctx.save()
        ctx.beginPath()
        for (let i = 0; i <= 60; i += 1) {
          const t = (s.years * i) / 60
          const x = plotMapX(box, t)
          const y = plotMapY(box, s.balanceAt(t))
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        for (let i = 60; i >= 0; i -= 1) {
          const t = (s.years * i) / 60
          ctx.lineTo(plotMapX(box, t), plotMapY(box, s.principal + s.contribYr * t))
        }
        ctx.closePath()
        ctx.fillStyle = 'rgba(52, 211, 153, 0.14)'
        ctx.fill()
        ctx.restore()

        drawCurve2D(ctx, box, (t) => s.principal + s.contribYr * t, PALETTE_CSS.slate, 1.8, true)
        drawCurve2D(ctx, box, s.simpleAt, '#64748b', 1.6, true)
        drawCurve2D(ctx, box, s.realAt, PALETTE_CSS.cyan, 2.3)
        drawCurve2D(ctx, box, s.balanceAt, PALETTE_CSS.emerald, 3)

        // Rule of 72 doubling marker (pure principal doubling)
        if (s.doublingYears <= s.years) {
          const dx = plotMapX(box, s.doublingYears)
          const dy = plotMapY(box, s.balanceAt(s.doublingYears))
          ctx.save()
          ctx.strokeStyle = PALETTE_CSS.amber
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(dx, box.y + box.h)
          ctx.lineTo(dx, dy)
          ctx.stroke()
          ctx.fillStyle = PALETTE_CSS.amber
          ctx.font = 'bold 10px ui-monospace, monospace'
          ctx.textAlign = 'center'
          ctx.fillText(`2× at ${s.doublingYears.toFixed(1)}y`, dx, Math.max(box.y + 14, dy - 10))
          ctx.restore()
        }

        // Cursor vertical guide + values
        const cx = plotMapX(box, cursorT)
        const cyNom = plotMapY(box, s.balanceAt(cursorT))
        const cyReal = plotMapY(box, s.realAt(cursorT))
        ctx.save()
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(cx, box.y)
        ctx.lineTo(cx, box.y + box.h)
        ctx.stroke()
        ctx.fillStyle = PALETTE_CSS.cyan
        ctx.beginPath()
        ctx.arc(cx, cyReal, 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = PALETTE_CSS.amber
        ctx.font = 'bold 10px ui-monospace, monospace'
        ctx.textAlign = cursorT > s.years * 0.65 ? 'right' : 'left'
        const tx = cursorT > s.years * 0.65 ? cx - 8 : cx + 8
        ctx.fillText(
          `t=${cursorT}y: $${Math.round(s.balanceAt(cursorT)).toLocaleString()}`,
          tx,
          Math.max(box.y + 18, cyNom - 8),
        )
        ctx.restore()

        // Legend strip inside chart top-left
        const legends: Array<[string, string]> = [
          ['Nominal FV', PALETTE_CSS.emerald],
          ['Real (Infl-adj)', PALETTE_CSS.cyan],
          ['Cash Deposits', PALETTE_CSS.slate],
        ]
        ctx.save()
        ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
        legends.forEach(([lbl, col], idx) => {
          const ly = box.y + 16 + idx * 14
          ctx.fillStyle = col
          ctx.fillRect(box.x + 12, ly - 5, 10, 3)
          ctx.fillStyle = '#cbd5e1'
          ctx.textAlign = 'left'
          ctx.fillText(lbl, box.x + 28, ly)
        })
        ctx.restore()

        // Right panel: Discounted NPV Outlay vs PV of Cash Flows
        const px = 508
        const py = 44
        const pw = 190
        const ph = 356
        ctx.save()
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.fillRect(px, py, pw, ph)
        ctx.strokeRect(px, py, pw, ph)

        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText('Discounted NPV Check', px + 10, py - 7)

        const maxVal = Math.max(s.initialOutlay, s.pvInflows, 1) * 1.15
        const barBase = py + ph - 58
        const maxBarH = ph - 108

        const outlayH = (s.initialOutlay / maxVal) * maxBarH
        const pvH = (s.pvInflows / maxVal) * maxBarH

        // Outlay bar
        ctx.fillStyle = 'rgba(251, 113, 133, 0.85)'
        ctx.fillRect(px + 28, barBase - outlayH, 46, outlayH)
        ctx.fillStyle = '#fda4af'
        ctx.font = '10px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Outlay', px + 51, barBase + 14)
        ctx.fillText(`-$${Math.round(s.initialOutlay / 1000)}k`, px + 51, barBase - outlayH - 6)

        // PV Inflows bar
        ctx.fillStyle = s.npv >= 0 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(251, 191, 36, 0.85)'
        ctx.fillRect(px + 114, barBase - pvH, 46, pvH)
        ctx.fillStyle = s.npv >= 0 ? '#6ee7b7' : '#fde68a'
        ctx.fillText('PV In', px + 137, barBase + 14)
        ctx.fillText(`$${Math.round(s.pvInflows / 1000)}k`, px + 137, barBase - pvH - 6)

        // NPV banner
        ctx.fillStyle = s.npv >= 0 ? 'rgba(52, 211, 153, 0.16)' : 'rgba(251, 113, 133, 0.16)'
        ctx.fillRect(px + 14, py + ph - 36, pw - 28, 26)
        ctx.fillStyle = s.npv >= 0 ? PALETTE_CSS.emerald : PALETTE_CSS.rose
        ctx.font = 'bold 11px ui-monospace, monospace'
        const sign = s.npv >= 0 ? '+' : '-'
        ctx.fillText(
          `NPV: ${sign}$${Math.abs(Math.round(s.npv)).toLocaleString()}`,
          px + pw / 2,
          py + ph - 19,
        )
        ctx.restore()
      },
      readouts: (p) => {
        const s = computeSeries(p)
        return [
          { label: `Final FV (${s.years}y)`, value: `${Math.round(s.fvEnd)} USD` },
          { label: 'Real Value (today $)', value: `${Math.round(s.realEnd)} USD` },
          {
            label: 'Doubling Time',
            value: Number.isFinite(s.doublingYears) ? `${s.doublingYears.toFixed(1)} yr` : 'Never',
          },
          { label: 'Project NPV', value: `${Math.round(s.npv)} USD` },
        ]
      },
      metrics: (p) => {
        const s = computeSeries(p)
        return {
          fvEnd: s.fvEnd,
          realEnd: s.realEnd,
          doublingYears: s.doublingYears,
          npv: s.npv,
        }
      },
    }
  },
}

export default function CompoundGrowthNpv2D() {
  return <Interactive2DViewer model={compoundGrowthNpv2dModel} />
}
