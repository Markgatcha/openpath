import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Shuffle, TriangleAlert, X } from 'lucide-react'
import { Chip, Field, Select } from '@/components/ui'
import { FigureCanvas } from '@/components/FigureCanvas'
import {
  ASKS_BY_TEMPLATE,
  FIGURE_RANGE,
  FIGURE_TEMPLATES,
  ROUNDINGS,
  buildFigureGeometry,
  computeAnswer,
  getFigureBounds,
  roundValue,
  sampleFigure,
  validateFigure,
  type FigureGeometry,
  type FigureSpec,
  type FigureTemplate,
  type Rounding,
} from '@shared/figure'

const TEMPLATE_LABELS: Record<FigureTemplate, string> = {
  'triangle-sas': 'Triangle — two sides + included angle (SAS)',
  'triangle-sss': 'Triangle — three sides (SSS)',
  'triangle-asa': 'Triangle — two angles + side (ASA)',
  'right-triangle': 'Right triangle',
  circle: 'Circle',
  trapezoid: 'Trapezoid',
  'coordinate-line': 'Coordinate Line — slope, intercept & distance',
  'parabola-vertex': 'Parabola — vertex, roots & discriminant',
  'unit-circle': 'Unit Circle — sin, cos, tan & radians',
  'vector-2d': '2D Vectors — resultant & dot product',
  'inclined-plane': 'Physics — Inclined Plane Free-Body Diagram',
  'series-parallel-circuit': 'Physics — Series-Parallel DC Circuit',
  'supply-demand': 'Economics — Supply, Demand & Tax Wedge',
  'normal-curve': 'Statistics — Normal Distribution & Z-Score',
}

const GIVEN_LABELS: Record<string, string> = {
  a: 'a',
  b: 'b',
  c: 'c',
  angleA: 'angle A (°)',
  angleB: 'angle B (°)',
  angleC: 'angle C (°)',
  r: 'radius r',
  d: 'diameter d',
  b1: 'base 1',
  b2: 'base 2',
  h: 'height',
  x1: 'P₁ x₁',
  y1: 'P₁ y₁',
  x2: 'P₂ x₂',
  y2: 'P₂ y₂',
  angleDeg: 'angle θ (°)',
  ux: 'uₓ',
  uy: 'uᵧ',
  vx: 'vₓ',
  vy: 'vᵧ',
  mass: 'mass m (kg)',
  angle: 'ramp angle θ (°)',
  mu: 'friction μ',
  voltage: 'source V (volts)',
  r1: 'series R₁ (Ω)',
  r2: 'parallel R₂ (Ω)',
  r3: 'parallel R₃ (Ω)',
  demandIntercept: 'demand intercept a',
  demandSlope: 'demand slope b',
  supplyIntercept: 'supply intercept c',
  supplySlope: 'supply slope d',
  tax: 'per-unit tax ($)',
  mean: 'mean μ',
  sd: 'std dev σ',
  x: 'cutoff x',
}

const ASK_LABELS: Record<string, string> = {
  a: 'side a',
  b: 'side b',
  c: 'side c (hypotenuse)',
  angleA: 'angle A',
  angleB: 'angle B',
  angleC: 'angleC',
  area: 'area',
  radius: 'radius',
  diameter: 'diameter',
  circumference: 'circumference',
  midsegment: 'midsegment',
  slope: 'slope m',
  yIntercept: 'y-intercept b',
  distance: 'distance d(P₁, P₂)',
  midpointX: 'midpoint x-coordinate',
  midpointY: 'midpoint y-coordinate',
  vertexX: 'vertex x-coordinate (h)',
  vertexY: 'vertex y-coordinate (k)',
  discriminant: 'discriminant (b² − 4ac)',
  greaterRoot: 'larger real root',
  sin: 'sin(θ)',
  cos: 'cos(θ)',
  tan: 'tan(θ)',
  radians: 'angle in radians',
  resultantMag: 'resultant magnitude |u + v|',
  dotProduct: 'dot product u · v',
  resultantX: 'resultant x-component',
  resultantY: 'resultant y-component',
  angleBetween: 'angle between u and v (°)',
  normalForce: 'normal force F_N (N)',
  gravityParallel: 'parallel gravity F_g∥ (N)',
  frictionForce: 'kinetic friction f_k (N)',
  netForce: 'net downslope force F_net (N)',
  acceleration: 'acceleration a (m/s²)',
  parallelR: 'parallel branch resistance (Ω)',
  equivR: 'total equivalent resistance (Ω)',
  totalCurrent: 'total source current I (A)',
  branchCurrent2: 'current through R₂ (A)',
  totalPower: 'total circuit power P (W)',
  eqQuantity: 'equilibrium quantity Q*',
  eqPrice: 'equilibrium price P*',
  consumerSurplus: 'consumer surplus CS',
  taxQuantity: 'post-tax quantity Q_tax',
  deadweightLoss: 'deadweight loss DWL',
  zScore: 'z-score',
  percentile: 'lower-tail percentile (%)',
  upperTail: 'upper-tail probability (%)',
  twoTailed: 'two-tailed probability (%)',
}

const FIXED_GIVENS: Record<string, string[]> = {
  'triangle-sas': ['b', 'c', 'angleA'],
  'triangle-sss': ['a', 'b', 'c'],
  'triangle-asa': ['angleA', 'b', 'angleC'],
  circle: [],
  trapezoid: ['b1', 'b2', 'h'],
  'coordinate-line': ['x1', 'y1', 'x2', 'y2'],
  'parabola-vertex': ['a', 'b', 'c'],
  'unit-circle': ['angleDeg'],
  'vector-2d': ['ux', 'uy', 'vx', 'vy'],
  'inclined-plane': ['mass', 'angle', 'mu'],
  'series-parallel-circuit': ['voltage', 'r1', 'r2', 'r3'],
  'supply-demand': ['demandIntercept', 'demandSlope', 'supplyIntercept', 'supplySlope', 'tax'],
  'normal-curve': ['mean', 'sd', 'x'],
}

const RIGHT_TRIANGLE_KEYS = ['a', 'b', 'c', 'angleA', 'angleB']

function isAngleKey(key: string): boolean {
  return key.startsWith('angle')
}

/**
 * One given's editor: a fixed value by default, or a [min, max] range
 * that turns the question parameterized (every attempt draws fresh
 * numbers). The prototype value stays editable in both modes — it feeds
 * the live preview and acts as the fallback if a draw is unsolvable.
 */
function GivenValueInput({
  value,
  range,
  bounds,
  onValue,
  onRange,
}: {
  value: number | undefined
  range: [number, number] | undefined
  bounds: [number, number] | undefined
  onValue: (raw: string) => void
  onRange: (range: [number, number] | null) => void
}) {
  if (range) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          className="input max-w-24"
          min={bounds?.[0]}
          step="any"
          aria-label="minimum"
          value={range[0]}
          onChange={(event) =>
            onRange([Number(event.target.value), range[1]])
          }
        />
        <span className="text-xs font-semibold text-slate-400">to</span>
        <input
          type="number"
          className="input max-w-24"
          min={range[0]}
          max={bounds?.[1]}
          step="any"
          aria-label="maximum"
          value={range[1]}
          onChange={(event) =>
            onRange([range[0], Number(event.target.value)])
          }
        />
        <button
          type="button"
          title="Use one fixed value"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-200"
          onClick={() => onRange(null)}
        >
          <X size={14} />
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        className="input"
        min={bounds?.[0]}
        max={bounds?.[1]}
        step="any"
        value={value ?? ''}
        onChange={(event) => onValue(event.target.value)}
      />
      <button
        type="button"
        title="Randomize this value on every attempt"
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-200"
        onClick={() => {
          const base = value ?? bounds?.[0]
          if (base === undefined) return
          onRange([base, base])
        }}
      >
        <Shuffle size={14} />
      </button>
    </div>
  )
}

/**
 * Figure question editor: template + givens + ask. The answer key is
 * computed live and shown to the teacher as a sanity check — it is
 * never typed by hand.
 */
export function FigureSection({
  figure,
  onChange,
}: {
  figure: FigureSpec
  onChange: (figure: FigureSpec) => void
}) {
  const problem = validateFigure(figure)

  const [rightRows, setRightRows] = useState<{ key: string; value: string }[]>(
    () => {
      if (figure.template !== 'right-triangle') return []
      return Object.entries(figure.givens).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    },
  )

  const preview = useMemo(() => {
    if (problem) return null
    try {
      const geometry = buildFigureGeometry(figure)
      const answer = roundValue(computeAnswer(figure), figure.rounding)
      return { geometry, answer }
    } catch {
      return null
    }
  }, [figure, problem])

  const askOptions = ASKS_BY_TEMPLATE[figure.template].filter((ask) => {
    // Don't offer to ask for something that's given.
    if (figure.template === 'circle') {
      return !(ask === 'radius' && figure.givens.r) && !(ask === 'diameter' && figure.givens.d)
    }
    return true
  })

  const setTemplate = (template: FigureTemplate) => {
    const firstAsk = ASKS_BY_TEMPLATE[template][0]
    const givens: Record<string, number> = {}
    if (template === 'triangle-sas') {
      givens.b = 7
      givens.c = 5
      givens.angleA = 40
    } else if (template === 'triangle-sss') {
      givens.a = 5
      givens.b = 6
      givens.c = 7
    } else if (template === 'triangle-asa') {
      givens.angleA = 40
      givens.b = 8
      givens.angleC = 60
    } else if (template === 'right-triangle') {
      givens.a = 3
      givens.b = 4
    } else if (template === 'circle') {
      givens.r = 6
    } else if (template === 'trapezoid') {
      givens.b1 = 10
      givens.b2 = 6
      givens.h = 4
    } else if (template === 'coordinate-line') {
      givens.x1 = -2
      givens.y1 = 1
      givens.x2 = 4
      givens.y2 = 10
    } else if (template === 'parabola-vertex') {
      givens.a = 1
      givens.b = -6
      givens.c = 5
    } else if (template === 'unit-circle') {
      givens.angleDeg = 60
    } else if (template === 'vector-2d') {
      givens.ux = 4
      givens.uy = 2
      givens.vx = 2
      givens.vy = 6
    } else if (template === 'inclined-plane') {
      givens.mass = 10
      givens.angle = 30
      givens.mu = 0.2
    } else if (template === 'series-parallel-circuit') {
      givens.voltage = 24
      givens.r1 = 4
      givens.r2 = 6
      givens.r3 = 12
    } else if (template === 'supply-demand') {
      givens.demandIntercept = 100
      givens.demandSlope = 2
      givens.supplyIntercept = 20
      givens.supplySlope = 2
      givens.tax = 8
    } else if (template === 'normal-curve') {
      givens.mean = 100
      givens.sd = 15
      givens.x = 130
    }
    setRightRows(
      template === 'right-triangle'
        ? Object.entries(givens).map(([key, value]) => ({ key, value: String(value) }))
        : [],
    )
    // A different template has a different given set, so old ranges go.
    onChange({ ...figure, template, givens, ask: firstAsk, ranges: undefined })
  }

  const setGiven = (key: string, raw: string) => {
    const value = Number(raw)
    const givens = { ...figure.givens }
    if (raw === '' || !Number.isFinite(value)) {
      delete givens[key]
    } else {
      givens[key] = value
    }
    onChange({ ...figure, givens })
  }

  /** Attach, update, or remove the [min, max] range of one given. */
  const setRange = (key: string, range: [number, number] | null) => {
    const ranges = { ...figure.ranges }
    if (range === null) {
      delete ranges[key]
    } else {
      ranges[key] = range
    }
    onChange({
      ...figure,
      ranges: Object.keys(ranges).length > 0 ? ranges : undefined,
    })
  }

  const hasRanges = Object.keys(figure.ranges ?? {}).length > 0

  // "Draw a sample" previews what a randomized attempt could look like.
  const [sample, setSample] = useState<{
    geometry: FigureGeometry
    answer: number
  } | null>(null)
  const drawSample = () => {
    try {
      const drawn = sampleFigure(figure, Math.floor(Math.random() * 0x7fffffff))
      setSample({
        geometry: buildFigureGeometry(drawn),
        answer: roundValue(computeAnswer(drawn), figure.rounding),
      })
    } catch {
      setSample(null)
    }
  }

  const setAsk = (ask: string) => onChange({ ...figure, ask })
  const setRounding = (rounding: Rounding) => onChange({ ...figure, rounding })

  const updateRightRow = (
    rowIndex: number,
    patch: { key?: string; value?: string },
  ) => {
    const next = [...rightRows]
    const row = next[rowIndex] ?? { key: '', value: '' }
    next[rowIndex] = { ...row, ...patch }
    setRightRows(next)
    const givens: Record<string, number> = {}
    for (const entry of next) {
      const value = Number(entry.value)
      if (entry.key && entry.value !== '' && Number.isFinite(value)) {
        givens[entry.key] = value
      }
    }
    // When a row switches keys, carry its parameter range to the new key
    // so ranges never dangle without a matching given.
    let ranges = figure.ranges
    if (patch.key !== undefined && patch.key !== row.key && figure.ranges?.[row.key]) {
      const carried = { ...figure.ranges }
      const range = carried[row.key]
      delete carried[row.key]
      if (patch.key) carried[patch.key] = range
      ranges = Object.keys(carried).length > 0 ? carried : undefined
    }
    onChange({ ...figure, givens, ranges })
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
      <div className="flex items-center justify-between">
        <span className="label mb-0">Figure</span>
        {problem ? (
          <Chip color="rose">
            <TriangleAlert size={11} /> needs input
          </Chip>
        ) : (
          <Chip color="emerald">
            <Check size={11} /> solvable
          </Chip>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Shape template">
          <Select
            value={figure.template}
            onChange={(event) => setTemplate(event.target.value as FigureTemplate)}
          >
            {FIGURE_TEMPLATES.map((template) => (
              <option key={template} value={template}>
                {TEMPLATE_LABELS[template]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ask the student for">
          <Select value={figure.ask} onChange={(event) => setAsk(event.target.value)}>
            {askOptions.map((ask) => (
              <option key={ask} value={ask}>
                {ASK_LABELS[ask] ?? ask}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Givens */}
      <div>
        <span className="label">Givens (shown on the figure)</span>
        {figure.template === 'circle' ? (
          <div className="flex items-center gap-3">
            <Select
              value={figure.givens.r ? 'r' : 'd'}
              onChange={(event) => {
                const key = event.target.value
                const givens: Record<string, number> = { [key]: 6 }
                // The given set changed, so ranges on the old key go away.
                onChange({
                  ...figure,
                  givens,
                  ranges: undefined,
                  ask: key === 'r' ? 'area' : 'radius',
                })
              }}
              className="max-w-40"
            >
              <option value="r">radius r</option>
              <option value="d">diameter d</option>
            </Select>
            <GivenValueInput
              value={figure.givens.r ?? figure.givens.d}
              range={figure.ranges?.[figure.givens.r ? 'r' : 'd']}
              bounds={FIGURE_RANGE[figure.givens.r ? 'r' : 'd']}
              onValue={(raw) => setGiven(figure.givens.r ? 'r' : 'd', raw)}
              onRange={(range) => setRange(figure.givens.r ? 'r' : 'd', range)}
            />
          </div>
        ) : figure.template === 'right-triangle' ? (
          <div className="flex flex-col gap-2">
            {[0, 1].map((rowIndex) => {
              const row = rightRows[rowIndex] ?? { key: '', value: '' }
              return (
                <div key={rowIndex} className="flex items-center gap-2">
                  <Select
                    value={row.key}
                    onChange={(event) =>
                      updateRightRow(rowIndex, { key: event.target.value })
                    }
                    className="max-w-44"
                  >
                    <option value="">pick a given…</option>
                    {RIGHT_TRIANGLE_KEYS.map((key) => (
                      <option
                        key={key}
                        value={key}
                        disabled={rightRows.some((other, i) => i !== rowIndex && other.key === key)}
                      >
                        {GIVEN_LABELS[key]}
                      </option>
                    ))}
                  </Select>
                  <GivenValueInput
                    value={row.value === '' ? undefined : Number(row.value)}
                    range={figure.ranges?.[row.key]}
                    bounds={row.key ? FIGURE_RANGE[row.key] : undefined}
                    onValue={(raw) => updateRightRow(rowIndex, { value: raw })}
                    onRange={(range) => setRange(row.key, range)}
                  />
                </div>
              )
            })}
            <p className="text-xs text-slate-400">
              Exactly two givens: two sides, or one side and one angle.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {FIXED_GIVENS[figure.template]?.map((key) => (
              <label key={key} className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {GIVEN_LABELS[key]}
                </span>
                <GivenValueInput
                  value={figure.givens[key]}
                  range={figure.ranges?.[key]}
                  bounds={getFigureBounds(figure.template, key)}
                  onValue={(raw) => setGiven(key, raw)}
                  onRange={(range) => setRange(key, range)}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Rounding">
          <Select
            value={figure.rounding}
            onChange={(event) => setRounding(event.target.value as Rounding)}
          >
            {ROUNDINGS.map((rounding) => (
              <option key={rounding} value={rounding}>
                {rounding === 'exact' ? 'exact' : `nearest ${rounding}`}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Live preview + computed answer */}
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
        >
          <FigureCanvas geometry={preview.geometry} size={170} />
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Answer key (computed)
            </span>
            <span className="font-display text-3xl font-extrabold text-emerald-500">
              {preview.answer}
            </span>
            <p className="max-w-56 text-xs text-slate-400">
              Students are graded with tolerance for the {figure.rounding} rounding.
              Grader: {isAngleKey(figure.ask) ? 'degrees (°)' : 'units'}.
            </p>
          </div>
        </motion.div>
      )}

      {/* Randomized-variation preview */}
      {hasRanges && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-brand-500/40 p-4">
          <button type="button" onClick={drawSample} className="btn-ghost">
            <Shuffle size={14} /> Draw a sample
          </button>
          {sample && (
            <>
              <FigureCanvas geometry={sample.geometry} size={140} />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Sample answer key
                </span>
                <span className="font-display text-2xl font-extrabold text-brand-500">
                  {sample.answer}
                </span>
              </div>
            </>
          )}
          <p className="max-w-64 text-xs text-slate-400">
            Every attempt draws fresh numbers inside your ranges — students
            can't copy answers from each other. Retakes stay solvable
            because impossible draws are rejected.
          </p>
        </div>
      )}

      {problem && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-300">
          {problem}
        </p>
      )}
    </div>
  )
}
