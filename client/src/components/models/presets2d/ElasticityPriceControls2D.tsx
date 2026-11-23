import { Interactive2DViewer } from '../Interactive2DViewer'
import {
  PALETTE_CSS,
  drawPlotAxes2D,
  plotMapX,
  plotMapY,
  plotUnmapY,
  type Model2DDefinition,
  type Params,
  type PlotBox,
} from '../engine2d'

function solveMarket(p: Params) {
  const aD = 100
  const bD = p.dSlope ?? 1.2
  const aS = 10
  const bS = p.sSlope ?? 1.0
  const mode = Math.round(p.policyMode ?? 0) // 0=free, 1=ceiling, 2=floor, 3=tax
  const level = p.policyLevel ?? 35

  const pDem = (q: number) => aD - bD * q
  const pSup = (q: number) => aS + bS * q
  const qDem = (pr: number) => Math.max(0, (aD - pr) / bD)
  const qSup = (pr: number) => Math.max(0, (pr - aS) / bS)

  const qEq = (aD - aS) / (bD + bS)
  const pEq = pDem(qEq)

  let qTraded = qEq
  let pBuyer = pEq
  let pSeller = pEq
  let taxPerUnit = 0
  let binding = false

  if (mode === 1) {
    // Price ceiling
    if (level < pEq) {
      binding = true
      pBuyer = level
      pSeller = level
      qTraded = qSup(level)
    }
  } else if (mode === 2) {
    // Price floor
    if (level > pEq) {
      binding = true
      pBuyer = level
      pSeller = level
      qTraded = qDem(level)
    }
  } else if (mode === 3) {
    // Per-unit tax wedge
    taxPerUnit = Math.min(level * 0.5, aD - aS)
    binding = taxPerUnit > 0
    qTraded = Math.max(0, (aD - aS - taxPerUnit) / (bD + bS))
    pBuyer = pDem(qTraded)
    pSeller = pSup(qTraded)
  }

  // Integrals over 0..qTraded
  const consumerSurplus = 0.5 * (aD + pDem(qTraded) - 2 * pBuyer) * qTraded
  const producerSurplus = 0.5 * (2 * pSeller - aS - pSup(qTraded)) * qTraded
  const taxRevenue = taxPerUnit * qTraded
  const maxSurplus = 0.5 * (aD - aS) * qEq
  const dwl = Math.max(0, maxSurplus - (consumerSurplus + producerSurplus + taxRevenue))

  const elasticityDemand = qTraded > 0 ? pBuyer / (bD * qTraded) : 0
  const consumerTaxShare =
    taxPerUnit > 0 ? Math.max(0, Math.min(100, ((pBuyer - pEq) / taxPerUnit) * 100)) : 50
  const shortageOrSurplus =
    mode === 1 && binding
      ? qDem(level) - qSup(level)
      : mode === 2 && binding
        ? qSup(level) - qDem(level)
        : 0

  return {
    aD,
    bD,
    aS,
    bS,
    mode,
    level,
    pDem,
    pSup,
    qDem,
    qSup,
    qEq,
    pEq,
    qTraded,
    pBuyer,
    pSeller,
    taxPerUnit,
    binding,
    consumerSurplus,
    producerSurplus,
    taxRevenue,
    dwl,
    elasticityDemand,
    consumerTaxShare,
    shortageOrSurplus,
  }
}

const MARKET_BOX: PlotBox = {
  x: 64,
  y: 44,
  w: 416,
  h: 356,
  xMin: 0,
  xMax: 100,
  yMin: 0,
  yMax: 105,
}

export const elasticityPriceControls2dModel: Model2DDefinition = {
  id: 'elasticity-price-controls-2d',
  title: 'Supply, Demand, Elasticity & Deadweight Loss',
  subtitle:
    'Compare free-market equilibrium against price ceilings, price floors, and per-unit taxes across varying curve elasticities.',
  viewWidth: 720,
  viewHeight: 460,
  params: [
    {
      kind: 'choice',
      id: 'policyMode',
      label: 'Market Policy',
      choices: ['Free Market', 'Price Ceiling', 'Price Floor', 'Per-Unit Tax'],
      initial: 0,
    },
    {
      kind: 'slider',
      id: 'policyLevel',
      label: 'Cap / Floor Price or Tax Level',
      min: 10,
      max: 90,
      step: 1,
      initial: 36,
    },
    {
      kind: 'slider',
      id: 'dSlope',
      label: 'Demand Steepness (inelasticity)',
      min: 0.4,
      max: 3.2,
      step: 0.1,
      initial: 1.2,
    },
    {
      kind: 'slider',
      id: 'sSlope',
      label: 'Supply Steepness (inelasticity)',
      min: 0.4,
      max: 3.2,
      step: 0.1,
      initial: 1.0,
    },
  ],
  challenges: [
    {
      id: 'binding-price-ceiling',
      title: 'Why Price Ceilings Shrink Trades',
      setupParams: { policyMode: 1, policyLevel: 72, dSlope: 1.2, sSlope: 1.0 },
      predict: {
        prompt:
          'Equilibrium price here is ~$51. If you set a binding Price Ceiling at $32, what happens to actual quantity sold?',
        options: [
          'Quantity sold shrinks to Q_supplied ($32), creating a shortage and Deadweight Loss',
          'Quantity sold jumps up to Q_demanded because consumers want more at $32',
          'Nothing changes until the ceiling exceeds equilibrium',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Lower the Price Ceiling below equilibrium so a binding shortage (> 15 units) and DWL appear.',
        evaluate: (p, m) => ({
          passed: p.policyMode === 1 && m.binding === 1 && m.shortage > 15 && m.dwl > 40,
          feedback:
            m.binding === 1
              ? `Binding ceiling: shortage = ${m.shortage.toFixed(1)} units, DWL = ${Math.round(m.dwl)}.`
              : 'Lower policy level below equilibrium price to make the ceiling binding.',
        }),
      },
      explain:
        'At a binding ceiling below P*, firms refuse to supply the unprofitable marginal units. Market exchange is gated by min(Q_s, Q_d) = Q_s, stranding mutually beneficial trades.',
      misconceptionTag: 'price-ceiling-increases-quantity',
    },
    {
      id: 'tax-incidence-inelastic',
      title: 'Who Really Pays a Per-Unit Tax?',
      setupParams: { policyMode: 3, policyLevel: 50, dSlope: 1.0, sSlope: 1.0 },
      predict: {
        prompt:
          'Even if the government collects the excise tax from sellers, when Demand is much steeper (more inelastic) than Supply, who bears most of the tax burden?',
        options: [
          'Consumers bear most of the tax via higher P_buyer',
          'Producers always pay 100% because the law bills sellers',
          'It splits exactly 50/50 regardless of curve slopes',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep Per-Unit Tax active, make Demand steep (dSlope >= 2.2) and Supply flatter (sSlope <= 0.8) so Consumer Tax Share >= 70%.',
        evaluate: (p, m) => ({
          passed: p.policyMode === 3 && p.dSlope >= 2.2 && p.sSlope <= 0.8 && m.consumerTaxShare >= 70,
          feedback: `Consumer share of tax wedge = ${m.consumerTaxShare.toFixed(0)}%. (Target >= 70%.)`,
        }),
      },
      explain:
        'Economic tax incidence depends on relative elasticities, not statutory collection. The less elastic (steeper) side has fewer alternatives and absorbs most of the wedge.',
      misconceptionTag: 'statutory-vs-economic-tax-incidence',
    },
  ],
  build: () => ({
    dragHandles: [
      {
        id: 'policy-handle',
        label: 'Policy price / tax slider handle',
        color: PALETTE_CSS.amber,
        getPos: (p) => {
          const m = solveMarket(p)
          const yVal = m.mode === 3 ? m.pBuyer : m.mode === 0 ? m.pEq : m.level
          return {
            x: plotMapX(MARKET_BOX, m.qTraded),
            y: plotMapY(MARKET_BOX, yVal),
          }
        },
        onDrag: (_px, py, p) => {
          const val = Math.round(Math.max(10, Math.min(90, plotUnmapY(MARKET_BOX, py))))
          if (p.policyMode === 0) return { policyMode: val < 50 ? 1 : 2, policyLevel: val }
          return { policyLevel: val }
        },
        ariaValueText: (p) => `Policy level ${p.policyLevel}`,
      },
    ],
    hotspots: [
      {
        id: 'equilibrium',
        label: 'Equilibrium E*',
        x: 245,
        y: 215,
        title: 'Competitive Equilibrium (P*, Q*)',
        body: 'Where marginal willingness to pay equals marginal cost, maximizing Consumer + Producer Surplus with zero Deadweight Loss.',
      },
      {
        id: 'cs-region',
        label: 'Consumer Surplus',
        x: 135,
        y: 120,
        title: 'Consumer Surplus (Cyan)',
        body: 'The area below Demand and above the buyer price — net gain captured by buyers valuing units above market price.',
      },
      {
        id: 'dwl-triangle',
        label: 'Deadweight Loss',
        x: 225,
        y: 235,
        title: 'Deadweight Loss Triangle (Rose)',
        body: 'Surplus from mutually beneficial trades that no longer occur under binding price caps, floors, or tax wedges.',
      },
      {
        id: 'welfare-bars',
        label: 'Welfare Allocation',
        x: 605,
        y: 205,
        title: 'Surplus Redistribution vs Destruction',
        body: 'Policies transfer surplus between buyers, sellers, and government, while always shrinking total welfare via Deadweight Loss when Q < Q*.',
      },
    ],
    renderCanvas: (ctx, p) => {
      const m = solveMarket(p)
      drawPlotAxes2D(ctx, MARKET_BOX, {
        title: 'Market Graph (Price P vs Quantity Q)',
        xLabel: 'Quantity Q',
        yLabel: 'Price ($)',
        xTicks: 5,
        yTicks: 5,
      })

      const qX0 = plotMapX(MARKET_BOX, 0)
      const qXT = plotMapX(MARKET_BOX, m.qTraded)
      const qXEq = plotMapX(MARKET_BOX, m.qEq)

      // Consumer Surplus polygon: (0, aD) -> (qT, pDem(qT)) -> (qT, pBuyer) -> (0, pBuyer)
      if (m.qTraded > 0) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(qX0, plotMapY(MARKET_BOX, m.aD))
        ctx.lineTo(qXT, plotMapY(MARKET_BOX, m.pDem(m.qTraded)))
        ctx.lineTo(qXT, plotMapY(MARKET_BOX, m.pBuyer))
        ctx.lineTo(qX0, plotMapY(MARKET_BOX, m.pBuyer))
        ctx.closePath()
        ctx.fillStyle = 'rgba(34, 211, 238, 0.24)'
        ctx.fill()

        // Producer Surplus polygon: (0, aS) -> (qT, pSup(qT)) -> (qT, pSeller) -> (0, pSeller)
        ctx.beginPath()
        ctx.moveTo(qX0, plotMapY(MARKET_BOX, m.aS))
        ctx.lineTo(qXT, plotMapY(MARKET_BOX, m.pSup(m.qTraded)))
        ctx.lineTo(qXT, plotMapY(MARKET_BOX, m.pSeller))
        ctx.lineTo(qX0, plotMapY(MARKET_BOX, m.pSeller))
        ctx.closePath()
        ctx.fillStyle = 'rgba(52, 211, 153, 0.24)'
        ctx.fill()

        // Tax wedge box
        if (m.mode === 3 && m.taxPerUnit > 0) {
          ctx.fillStyle = 'rgba(129, 140, 248, 0.35)'
          const yTop = plotMapY(MARKET_BOX, m.pBuyer)
          const yBot = plotMapY(MARKET_BOX, m.pSeller)
          ctx.fillRect(qX0, yTop, qXT - qX0, yBot - yTop)
        }

        // DWL triangle
        if (m.qTraded < m.qEq - 0.1) {
          ctx.beginPath()
          ctx.moveTo(qXT, plotMapY(MARKET_BOX, m.pDem(m.qTraded)))
          ctx.lineTo(qXEq, plotMapY(MARKET_BOX, m.pEq))
          ctx.lineTo(qXT, plotMapY(MARKET_BOX, m.pSup(m.qTraded)))
          ctx.closePath()
          ctx.fillStyle = 'rgba(251, 113, 133, 0.45)'
          ctx.fill()
        }
        ctx.restore()
      }

      // Demand & Supply curves clipped inside plot
      ctx.save()
      ctx.beginPath()
      ctx.rect(MARKET_BOX.x, MARKET_BOX.y, MARKET_BOX.w, MARKET_BOX.h)
      ctx.clip()

      ctx.strokeStyle = PALETTE_CSS.cyan
      ctx.lineWidth = 2.6
      ctx.beginPath()
      ctx.moveTo(plotMapX(MARKET_BOX, 0), plotMapY(MARKET_BOX, m.pDem(0)))
      ctx.lineTo(plotMapX(MARKET_BOX, 100), plotMapY(MARKET_BOX, m.pDem(100)))
      ctx.stroke()

      ctx.strokeStyle = PALETTE_CSS.emerald
      ctx.beginPath()
      ctx.moveTo(plotMapX(MARKET_BOX, 0), plotMapY(MARKET_BOX, m.pSup(0)))
      ctx.lineTo(plotMapX(MARKET_BOX, 100), plotMapY(MARKET_BOX, m.pSup(100)))
      ctx.stroke()

      // Policy price line for ceiling/floor
      if (m.mode === 1 || m.mode === 2) {
        const py = plotMapY(MARKET_BOX, m.level)
        ctx.strokeStyle = m.binding ? PALETTE_CSS.amber : 'rgba(251, 191, 36, 0.4)'
        ctx.setLineDash([6, 4])
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(MARKET_BOX.x, py)
        ctx.lineTo(MARKET_BOX.x + MARKET_BOX.w, py)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = PALETTE_CSS.amber
        ctx.font = 'bold 10px ui-monospace, monospace'
        ctx.fillText(
          `${m.mode === 1 ? 'Ceiling' : 'Floor'} $${m.level}${m.binding ? '' : ' (non-binding)'}`,
          MARKET_BOX.x + MARKET_BOX.w - 8,
          py - 6,
        )
      }

      // Equilibrium dot
      ctx.fillStyle = '#e2e8f0'
      ctx.beginPath()
      ctx.arc(qXEq, plotMapY(MARKET_BOX, m.pEq), 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Right Panel: Welfare Breakdown Stack + Tax Incidence
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
      ctx.fillText('Total Surplus Allocation', px + 10, py - 7)

      const maxSurplus = Math.max(1, 0.5 * (m.aD - m.aS) * m.qEq)
      const stackX = px + 34
      const stackW = 48
      const stackTop = py + 30
      const stackH = 225

      const segments = [
        { val: m.consumerSurplus, col: PALETTE_CSS.cyan, label: 'CS' },
        { val: m.taxRevenue, col: PALETTE_CSS.brand, label: 'Tax' },
        { val: m.producerSurplus, col: PALETTE_CSS.emerald, label: 'PS' },
        { val: m.dwl, col: PALETTE_CSS.rose, label: 'DWL' },
      ]

      let yCursor = stackTop + stackH
      for (const seg of segments) {
        const h = (seg.val / maxSurplus) * stackH
        if (h < 1) continue
        yCursor -= h
        ctx.fillStyle = seg.col
        ctx.fillRect(stackX, yCursor, stackW, h)
        ctx.fillStyle = '#e2e8f0'
        ctx.font = '10px ui-monospace, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`${seg.label}: ${Math.round(seg.val)}`, stackX + stackW + 10, yCursor + h / 2 + 3)
      }

      ctx.fillStyle = '#cbd5e1'
      ctx.font = '10px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`|ε_D| at Q: ${m.elasticityDemand.toFixed(2)}`, px + 14, py + ph - 60)
      if (m.mode === 3 && m.taxPerUnit > 0) {
        ctx.fillStyle = PALETTE_CSS.cyan
        ctx.fillText(`Buyer tax share: ${m.consumerTaxShare.toFixed(0)}%`, px + 14, py + ph - 40)
        ctx.fillStyle = PALETTE_CSS.emerald
        ctx.fillText(
          `Seller tax share: ${(100 - m.consumerTaxShare).toFixed(0)}%`,
          px + 14,
          py + ph - 22,
        )
      } else if (m.shortageOrSurplus > 0) {
        ctx.fillStyle = PALETTE_CSS.amber
        ctx.fillText(
          `${m.mode === 1 ? 'Shortage' : 'Surplus'}: ${m.shortageOrSurplus.toFixed(1)} u`,
          px + 14,
          py + ph - 34,
        )
      } else {
        ctx.fillStyle = PALETTE_CSS.emerald
        ctx.fillText('Efficient equilibrium (0 DWL)', px + 14, py + ph - 34)
      }
      ctx.restore()
    },
    readouts: (p) => {
      const m = solveMarket(p)
      return [
        { label: 'Quantity Traded', value: `${m.qTraded.toFixed(1)} u` },
        { label: 'Buyer / Seller P', value: `$${m.pBuyer.toFixed(1)} / $${m.pSeller.toFixed(1)}` },
        { label: 'Deadweight Loss', value: `${Math.round(m.dwl)}` },
        {
          label: m.mode === 3 ? 'Buyer Tax Burden' : 'Elasticity |ε_D|',
          value: m.mode === 3 ? `${m.consumerTaxShare.toFixed(0)}%` : m.elasticityDemand.toFixed(2),
        },
      ]
    },
    metrics: (p) => {
      const m = solveMarket(p)
      return {
        qTraded: m.qTraded,
        binding: m.binding ? 1 : 0,
        shortage: m.mode === 1 && m.binding ? m.shortageOrSurplus : 0,
        dwl: m.dwl,
        consumerTaxShare: m.consumerTaxShare,
      }
    },
  }),
}

export default function ElasticityPriceControls2D() {
  return <Interactive2DViewer model={elasticityPriceControls2dModel} />
}
