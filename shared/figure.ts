/**
 * Figure & equation questions — parametric geometry & STEM diagram engine (v2).
 *
 * A figure question stores a *template* plus *givens*; the answer key is
 * COMPUTED here (never typed by a teacher), and the same math produces
 * the drawing data the client renders as SVG. Teachers sanity-check a
 * computed answer in the builder; students never see it.
 */

// ── Spec ────────────────────────────────────────────────────────
export const FIGURE_TEMPLATES = [
  'triangle-sas',
  'triangle-sss',
  'triangle-asa',
  'right-triangle',
  'circle',
  'trapezoid',
  'coordinate-line',
  'parabola-vertex',
  'unit-circle',
  'vector-2d',
  'inclined-plane',
  'series-parallel-circuit',
  'supply-demand',
  'normal-curve',
] as const
export type FigureTemplate = (typeof FIGURE_TEMPLATES)[number]

export const ROUNDINGS = ['integer', 'tenth', 'hundredth', 'thousandth', 'exact'] as const
export type Rounding = (typeof ROUNDINGS)[number]

export const ASKS_BY_TEMPLATE: Record<FigureTemplate, string[]> = {
  'triangle-sas': ['a', 'area', 'angleB', 'angleC'],
  'triangle-sss': ['angleA', 'angleB', 'angleC', 'area'],
  'triangle-asa': ['a', 'c', 'angleB', 'area'],
  'right-triangle': ['a', 'b', 'c', 'angleA', 'angleB', 'area'],
  circle: ['radius', 'diameter', 'circumference', 'area'],
  trapezoid: ['area', 'midsegment'],
  'coordinate-line': ['slope', 'yIntercept', 'distance', 'midpointX', 'midpointY'],
  'parabola-vertex': ['vertexX', 'vertexY', 'discriminant', 'yIntercept', 'greaterRoot'],
  'unit-circle': ['sin', 'cos', 'tan', 'radians'],
  'vector-2d': ['resultantMag', 'dotProduct', 'resultantX', 'resultantY', 'angleBetween'],
  'inclined-plane': ['normalForce', 'gravityParallel', 'frictionForce', 'netForce', 'acceleration'],
  'series-parallel-circuit': [
    'parallelR',
    'equivR',
    'totalCurrent',
    'branchCurrent2',
    'totalPower',
  ],
  'supply-demand': [
    'eqQuantity',
    'eqPrice',
    'consumerSurplus',
    'taxQuantity',
    'deadweightLoss',
  ],
  'normal-curve': ['zScore', 'percentile', 'upperTail', 'twoTailed'],
}

export interface FigureSpec {
  template: FigureTemplate
  /** Numbers are lengths, coordinates, degrees, or physical quantities. */
  givens: Record<string, number>
  /** Which quantity the student must find. */
  ask: string
  rounding: Rounding
  /**
   * Optional per-given [min, max] pair making the question parameterized.
   * Each attempt samples fresh numbers inside the range (seeded by
   * question+attempt, see sampleFigure), so retakes never reuse the same
   * values. The fixed givens remain the prototype: they drive the
   * builder preview and act as the fallback if no sample is solvable.
   */
  ranges?: Record<string, [number, number]>
}

// ── Rounding & tolerance ───────────────────────────────────────
export function roundValue(value: number, rounding: Rounding): number {
  switch (rounding) {
    case 'integer':
      return Math.round(value)
    case 'tenth':
      return Math.round(value * 10) / 10
    case 'hundredth':
      return Math.round(value * 100) / 100
    case 'thousandth':
      return Math.round(value * 1000) / 1000
    case 'exact':
      return value
  }
}

export function toleranceFor(rounding: Rounding): number {
  switch (rounding) {
    case 'integer':
      return 0.51
    case 'tenth':
      return 0.051
    case 'hundredth':
      return 0.0051
    case 'thousandth':
      return 0.00051
    case 'exact':
      return 0.000001
  }
}

// ── Special functions (Normal CDF) ─────────────────────────────
/** Abramowitz & Stegun 7.1.26 rational approximation (max error 1.5e-7). */
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const p = 0.3275911
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const t = 1 / (1 + p * ax)
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t
  const y = 1 - poly * Math.exp(-ax * ax)
  return sign * y
}

/** Standard normal cumulative distribution Phi(z). */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

// ── Validation ──────────────────────────────────────────────────
/** Absolute per-key bounds every given (and every range edge) must respect. */
export const FIGURE_RANGE: Record<string, [number, number]> = {
  // Classic geometry (note: 'a', 'b', 'c' can be negative in parabola-vertex, handled per-template)
  r: [0.5, 100],
  d: [1, 200],
  b1: [0.5, 200],
  b2: [0.5, 200],
  h: [0.5, 200],
  angleA: [1, 179],
  angleB: [1, 179],
  angleC: [1, 179],
  // Coordinate line
  x1: [-50, 50],
  y1: [-50, 50],
  x2: [-50, 50],
  y2: [-50, 50],
  // Unit circle
  angleDeg: [0, 360],
  // Vector 2D
  ux: [-40, 40],
  uy: [-40, 40],
  vx: [-40, 40],
  vy: [-40, 40],
  // Inclined plane
  mass: [0.5, 200],
  angle: [5, 75],
  mu: [0, 0.95],
  // Series-parallel circuit
  voltage: [1, 240],
  r1: [1, 500],
  r2: [1, 500],
  r3: [1, 500],
  // Supply-demand
  demandIntercept: [10, 500],
  demandSlope: [0.2, 25],
  supplyIntercept: [0, 300],
  supplySlope: [0.2, 25],
  tax: [0, 200],
  // Normal curve
  mean: [-1000, 1000],
  sd: [0.1, 500],
  x: [-2000, 2000],
}

function boundsFor(template: FigureTemplate, key: string): [number, number] | undefined {
  if (template === 'parabola-vertex') {
    if (key === 'a') return [-20, 20]
    if (key === 'b') return [-60, 60]
    if (key === 'c') return [-100, 100]
  }
  if (key === 'a' || key === 'b' || key === 'c') {
    return [0.5, 200]
  }
  return FIGURE_RANGE[key]
}

export function getFigureBounds(template: FigureTemplate, key: string): [number, number] | undefined {
  return boundsFor(template, key)
}

function inRange(template: FigureTemplate, key: string, value: number): boolean {
  const bounds = boundsFor(template, key)
  if (!bounds) return true
  return value >= bounds[0] && value <= bounds[1]
}

const isDef = (v: number | undefined): v is number => v !== undefined && v !== null && Number.isFinite(v)

/**
 * Human-readable validation error, or null when the spec is solvable.
 * Runs on both server (authority) and client (live editor feedback).
 */
export function validateFigure(spec: FigureSpec): string | null {
  const { template, givens, ask } = spec

  if (!ASKS_BY_TEMPLATE[template]?.includes(ask)) {
    return 'That question is not available for this shape'
  }

  for (const [key, value] of Object.entries(givens)) {
    if (!Number.isFinite(value)) return `Given "${key}" must be a number`
    if (!inRange(template, key, value)) return `Given "${key}" is outside the supported range`
  }

  if (spec.ranges) {
    for (const [key, range] of Object.entries(spec.ranges)) {
      if (!Array.isArray(range) || range.length !== 2) {
        return `Range for "${key}" needs a min and a max`
      }
      const [min, max] = range
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return `Range for "${key}" must be numbers`
      }
      if (min > max) return `Range for "${key}" has its min above its max`
      if (!(key in givens)) return `Range for "${key}" has no matching given`
      if (!inRange(template, key, min) || !inRange(template, key, max)) {
        return `Range for "${key}" is outside the supported range`
      }
    }
  }

  const { a, b, c, angleA, angleB, angleC, r, d, b1, b2, h } = givens

  switch (template) {
    case 'triangle-sas': {
      if (!(b && c && angleA)) return 'Provide sides b, c and the included angle A'
      if (angleA >= 180) return 'Angle A must be less than 180°'
      return null
    }
    case 'triangle-sss': {
      if (!(a && b && c)) return 'Provide all three sides a, b and c'
      if (a + b <= c || a + c <= b || b + c <= a) {
        return 'These sides violate the triangle inequality'
      }
      return null
    }
    case 'triangle-asa': {
      if (!(angleA && b && angleC)) return 'Provide angles A, C and the side b between them'
      if (angleA + angleC >= 179) return 'Angles A + C must leave room for angle B'
      return null
    }
    case 'right-triangle': {
      const sides = [a, b, c].filter((value) => value !== undefined && value !== null)
      const angles = [angleA, angleB].filter((value) => value !== undefined && value !== null)
      if (angles.length > 1) return 'Right triangles need at most one given angle'
      if (sides.length + angles.length !== 2) {
        return 'Provide exactly two givens (two sides, or one side and one angle)'
      }
      if (sides.includes(c) && sides.length === 2) {
        const leg = sides.find((value) => value !== c)!
        if (leg >= c) return 'A leg cannot be longer than the hypotenuse'
      }
      if (angles.length === 1 && angles[0] >= 89) return 'Angle must be less than 90° in a right triangle'
      return null
    }
    case 'circle': {
      const given = [r, d].filter((value) => value !== undefined && value !== null)
      if (given.length !== 1) return 'Provide either the radius r or the diameter d'
      return null
    }
    case 'trapezoid': {
      if (!(b1 && b2 && h)) return 'Provide both bases (b1, b2) and the height h'
      return null
    }
    case 'coordinate-line': {
      const { x1, y1, x2, y2 } = givens
      if (!isDef(x1) || !isDef(y1) || !isDef(x2) || !isDef(y2)) {
        return 'Provide coordinates x1, y1, x2, and y2'
      }
      if (x1 === x2 && y1 === y2) return 'Points P1 and P2 must be distinct'
      if ((ask === 'slope' || ask === 'yIntercept') && x1 === x2) {
        return 'Vertical lines (x1 = x2) have an undefined slope'
      }
      return null
    }
    case 'parabola-vertex': {
      if (!isDef(a) || !isDef(b) || !isDef(c)) {
        return 'Provide quadratic coefficients a, b, and c'
      }
      if (Math.abs(a) < 0.05) return 'Leading coefficient a must be non-zero'
      const disc = b * b - 4 * a * c
      if (ask === 'greaterRoot' && disc < 0) {
        return 'Discriminant b² − 4ac must be ≥ 0 to ask for a real root'
      }
      return null
    }
    case 'unit-circle': {
      const { angleDeg } = givens
      if (!isDef(angleDeg)) return 'Provide angle θ in degrees (0°–360°)'
      if (ask === 'tan' && Math.abs(Math.cos(rad(angleDeg))) < 0.05) {
        return 'tan(θ) is undefined at 90° and 270°'
      }
      return null
    }
    case 'vector-2d': {
      const { ux, uy, vx, vy } = givens
      if (!isDef(ux) || !isDef(uy) || !isDef(vx) || !isDef(vy)) {
        return 'Provide components ux, uy, vx, and vy'
      }
      const magU = Math.hypot(ux, uy)
      const magV = Math.hypot(vx, vy)
      if (ask === 'angleBetween' && (magU < 0.01 || magV < 0.01)) {
        return 'Both vectors must be non-zero to compute the angle between them'
      }
      return null
    }
    case 'inclined-plane': {
      const { mass, angle, mu } = givens
      if (!isDef(mass) || !isDef(angle) || !isDef(mu)) {
        return 'Provide mass (kg), ramp angle (°), and friction coefficient μ'
      }
      return null
    }
    case 'series-parallel-circuit': {
      const { voltage, r1, r2, r3 } = givens
      if (!isDef(voltage) || !isDef(r1) || !isDef(r2) || !isDef(r3)) {
        return 'Provide source voltage V and resistors R1, R2, and R3'
      }
      return null
    }
    case 'supply-demand': {
      const { demandIntercept, demandSlope, supplyIntercept, supplySlope } = givens
      const tax = givens.tax ?? 0
      if (
        !isDef(demandIntercept) ||
        !isDef(demandSlope) ||
        !isDef(supplyIntercept) ||
        !isDef(supplySlope)
      ) {
        return 'Provide demand (a, b) and supply (c, d) parameters'
      }
      if (demandIntercept <= supplyIntercept + tax) {
        return 'Demand intercept must exceed supply intercept + tax for positive trade'
      }
      return null
    }
    case 'normal-curve': {
      const { mean, sd, x } = givens
      if (!isDef(mean) || !isDef(sd) || !isDef(x)) {
        return 'Provide mean μ, standard deviation σ, and value x'
      }
      if (sd <= 0) return 'Standard deviation σ must be positive'
      return null
    }
  }
}

// ── Answer computation ──────────────────────────────────────────
const rad = (degVal: number): number => (degVal * Math.PI) / 180
const deg = (value: number): number => (value * 180) / Math.PI
const GRAVITY = 9.8

export function computeAnswer(spec: FigureSpec): number {
  const { template, givens, ask } = spec
  const { a, b, c, angleA, angleB, angleC, r, d, b1, b2, h } = givens

  switch (template) {
    case 'triangle-sas': {
      const A = rad(angleA!)
      if (ask === 'a') return Math.sqrt(b! * b! + c! * c! - 2 * b! * c! * Math.cos(A))
      if (ask === 'area') return 0.5 * b! * c! * Math.sin(A)
      const sideA = Math.sqrt(b! * b! + c! * c! - 2 * b! * c! * Math.cos(A))
      if (ask === 'angleB') return deg(Math.asin((b! * Math.sin(A)) / sideA))
      return deg(Math.asin((c! * Math.sin(A)) / sideA))
    }
    case 'triangle-sss': {
      if (ask === 'angleA') return deg(Math.acos((b! * b! + c! * c! - a! * a!) / (2 * b! * c!)))
      if (ask === 'angleB') return deg(Math.acos((a! * a! + c! * c! - b! * b!) / (2 * a! * c!)))
      if (ask === 'angleC') return deg(Math.acos((a! * a! + b! * b! - c! * c!) / (2 * a! * b!)))
      const s = (a! + b! + c!) / 2
      return Math.sqrt(s * (s - a!) * (s - b!) * (s - c!))
    }
    case 'triangle-asa': {
      const B = 180 - angleA! - angleC!
      if (ask === 'angleB') return B
      const sideA = (b! * Math.sin(rad(angleA!))) / Math.sin(rad(B))
      const sideC = (b! * Math.sin(rad(angleC!))) / Math.sin(rad(B))
      if (ask === 'a') return sideA
      if (ask === 'c') return sideC
      return 0.5 * sideA * sideC * Math.sin(rad(B))
    }
    case 'right-triangle': {
      const legs = [a, b].filter((value) => value !== undefined && value !== null)
      if (legs.length === 2) {
        const A = deg(Math.atan2(a!, b!))
        if (ask === 'c') return Math.sqrt(a! * a! + b! * b!)
        if (ask === 'angleA') return A
        if (ask === 'angleB') return 90 - A
        return 0.5 * a! * b!
      }
      if (a !== undefined && a !== null && c !== undefined && c !== null) {
        const otherLeg = Math.sqrt(c! * c! - a! * a!)
        if (ask === 'b') return otherLeg
        if (ask === 'angleA') return deg(Math.asin(a! / c!))
        if (ask === 'angleB') return deg(Math.acos(a! / c!))
        return 0.5 * a! * otherLeg
      }
      if (b !== undefined && b !== null && c !== undefined && c !== null) {
        const otherLeg = Math.sqrt(c! * c! - b! * b!)
        if (ask === 'a') return otherLeg
        if (ask === 'angleB') return deg(Math.asin(b! / c!))
        if (ask === 'angleA') return deg(Math.acos(b! / c!))
        return 0.5 * b! * otherLeg
      }
      const A = angleA ?? (angleB !== undefined ? 90 - angleB : null)
      const leg = a ?? b ?? null
      const legIsA = a !== undefined && a !== null
      if (A === null || leg === null) throw new Error('unsolvable right triangle')
      const opposite = legIsA ? leg : leg * Math.tan(rad(A))
      const adjacent = legIsA ? leg / Math.tan(rad(A)) : leg
      const hyp = Math.sqrt(opposite * opposite + adjacent * adjacent)
      if (ask === 'a') return opposite
      if (ask === 'b') return adjacent
      if (ask === 'c') return hyp
      if (ask === 'angleA') return A
      if (ask === 'angleB') return 90 - A
      return 0.5 * opposite * adjacent
    }
    case 'circle': {
      const radius = r ?? d! / 2
      if (ask === 'radius') return radius
      if (ask === 'diameter') return radius * 2
      if (ask === 'circumference') return 2 * Math.PI * radius
      return Math.PI * radius * radius
    }
    case 'trapezoid': {
      if (ask === 'area') return 0.5 * (b1! + b2!) * h!
      return 0.5 * (b1! + b2!)
    }
    case 'coordinate-line': {
      const { x1, y1, x2, y2 } = givens
      if (ask === 'distance') return Math.hypot(x2 - x1, y2 - y1)
      if (ask === 'midpointX') return (x1 + x2) / 2
      if (ask === 'midpointY') return (y1 + y2) / 2
      const slope = (y2 - y1) / (x2 - x1)
      if (ask === 'slope') return slope
      return y1 - slope * x1
    }
    case 'parabola-vertex': {
      const vx = -b! / (2 * a!)
      const vy = a! * vx * vx + b! * vx + c!
      const disc = b! * b! - 4 * a! * c!
      if (ask === 'vertexX') return vx
      if (ask === 'vertexY') return vy
      if (ask === 'discriminant') return disc
      if (ask === 'yIntercept') return c!
      const sqrtDisc = Math.sqrt(Math.max(0, disc))
      const r1 = (-b! + sqrtDisc) / (2 * a!)
      const r2 = (-b! - sqrtDisc) / (2 * a!)
      return Math.max(r1, r2)
    }
    case 'unit-circle': {
      const theta = rad(givens.angleDeg)
      if (ask === 'sin') return Math.sin(theta)
      if (ask === 'cos') return Math.cos(theta)
      if (ask === 'tan') return Math.tan(theta)
      return theta
    }
    case 'vector-2d': {
      const { ux, uy, vx, vy } = givens
      const rx = ux + vx
      const ry = uy + vy
      if (ask === 'resultantX') return rx
      if (ask === 'resultantY') return ry
      if (ask === 'resultantMag') return Math.hypot(rx, ry)
      const dot = ux * vx + uy * vy
      if (ask === 'dotProduct') return dot
      const denom = Math.hypot(ux, uy) * Math.hypot(vx, vy)
      const cosTheta = Math.max(-1, Math.min(1, dot / (denom || 1)))
      return deg(Math.acos(cosTheta))
    }
    case 'inclined-plane': {
      const { mass, angle, mu } = givens
      const theta = rad(angle)
      const normal = mass * GRAVITY * Math.cos(theta)
      const parallel = mass * GRAVITY * Math.sin(theta)
      const friction = mu * normal
      const net = Math.max(0, parallel - friction)
      if (ask === 'normalForce') return normal
      if (ask === 'gravityParallel') return parallel
      if (ask === 'frictionForce') return friction
      if (ask === 'netForce') return net
      return net / mass
    }
    case 'series-parallel-circuit': {
      const { voltage, r1, r2, r3 } = givens
      const parallelR = (r2 * r3) / (r2 + r3)
      const equivR = r1 + parallelR
      const totalCurrent = voltage / equivR
      const vParallel = totalCurrent * parallelR
      const branchCurrent2 = vParallel / r2
      if (ask === 'parallelR') return parallelR
      if (ask === 'equivR') return equivR
      if (ask === 'totalCurrent') return totalCurrent
      if (ask === 'branchCurrent2') return branchCurrent2
      return (voltage * voltage) / equivR
    }
    case 'supply-demand': {
      const a0 = givens.demandIntercept
      const b0 = givens.demandSlope
      const c0 = givens.supplyIntercept
      const d0 = givens.supplySlope
      const tax = givens.tax ?? 0
      const eqQ = (a0 - c0) / (b0 + d0)
      const eqP = a0 - b0 * eqQ
      const cs = 0.5 * (a0 - eqP) * eqQ
      const taxQ = Math.max(0, (a0 - c0 - tax) / (b0 + d0))
      const dwl = 0.5 * tax * (eqQ - taxQ)
      if (ask === 'eqQuantity') return eqQ
      if (ask === 'eqPrice') return eqP
      if (ask === 'consumerSurplus') return cs
      if (ask === 'taxQuantity') return taxQ
      return dwl
    }
    case 'normal-curve': {
      const { mean, sd, x } = givens
      const z = (x - mean) / sd
      const p = normalCdf(z) * 100
      if (ask === 'zScore') return z
      if (ask === 'percentile') return p
      if (ask === 'upperTail') return (1 - normalCdf(z)) * 100
      return 2 * (1 - normalCdf(Math.abs(z))) * 100
    }
  }
}

// ── Parameterized variants ──────────────────────────────────────
const SAMPLE_ATTEMPTS = 64

export function figureSeed(questionId: string, attemptId: string): number {
  let hash = 2166136261
  const input = `${questionId}:${attemptId}`
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function drawWithin(rand: () => number, min: number, max: number): number {
  const raw = min + rand() * (max - min)
  return Number.isInteger(min) && Number.isInteger(max)
    ? Math.round(raw)
    : Math.round(raw * 100) / 100
}

function stripRanges(spec: FigureSpec): FigureSpec {
  const concrete: FigureSpec = { ...spec }
  delete concrete.ranges
  return concrete
}

export function sampleFigure(spec: FigureSpec, seed: number): FigureSpec {
  const entries = Object.entries(spec.ranges ?? {})
  if (entries.length === 0) return stripRanges(spec)

  const rand = mulberry32(seed)
  for (let attempt = 0; attempt < SAMPLE_ATTEMPTS; attempt += 1) {
    const givens: Record<string, number> = { ...spec.givens }
    for (const [key, [min, max]] of entries) {
      givens[key] = drawWithin(rand, min, max)
    }
    const candidate: FigureSpec = { ...spec, givens }
    if (validateFigure(candidate) === null) return stripRanges(candidate)
  }
  return stripRanges(spec)
}

// ── Drawing data ───────────────────────────────────────────────
export type ParametricDiagram =
  | {
      kind: 'coordinate-line'
      x1: number
      y1: number
      x2: number
      y2: number
      ask: string
      targetLabel: string
    }
  | {
      kind: 'parabola-vertex'
      a: number
      b: number
      c: number
      equationLabel: string
      ask: string
      targetLabel: string
    }
  | {
      kind: 'unit-circle'
      angleDeg: number
      ask: string
      targetLabel: string
    }
  | {
      kind: 'vector-2d'
      ux: number
      uy: number
      vx: number
      vy: number
      ask: string
      targetLabel: string
    }
  | {
      kind: 'inclined-plane'
      mass: number
      angle: number
      mu: number
      ask: string
      targetLabel: string
    }
  | {
      kind: 'series-parallel-circuit'
      voltage: number
      r1: number
      r2: number
      r3: number
      ask: string
      targetLabel: string
    }
  | {
      kind: 'supply-demand'
      demandIntercept: number
      demandSlope: number
      supplyIntercept: number
      supplySlope: number
      tax: number
      ask: string
      targetLabel: string
    }
  | {
      kind: 'normal-curve'
      mean: number
      sd: number
      x: number
      ask: string
      targetLabel: string
    }

export interface FigureGeometry {
  /** Vertices of a polygon (triangles, trapezoids) in a 0..100 space. */
  vertices: { name: string; x: number; y: number }[]
  /** Edges reference vertices by index; label is the shown value or "?". */
  edges: { from: number; to: number; label: string | null; given: boolean }[]
  /** Angle labels anchored at a vertex. */
  angles: { vertex: number; label: string | null; given: boolean }[]
  /** Right-angle marker at a vertex. */
  rightAngleAt: number | null
  circle: { cx: number; cy: number; r: number; label: string | null; given: boolean } | null
  radiusLine: { from: number; to: number; label: string | null } | null
  units: string
  /** Rich SVG diagram payload for the 8 STEM/economics/statistics templates. */
  diagram?: ParametricDiagram | null
}

function num(value: number, rounding: Rounding): string {
  const rounded = roundValue(value, rounding)
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '')
}

const TARGET_BADGE_LABELS: Record<string, string> = {
  slope: 'm = ?',
  yIntercept: 'b (y-int) = ?',
  distance: 'd(P₁, P₂) = ?',
  midpointX: 'Mₓ = ?',
  midpointY: 'Mᵧ = ?',
  vertexX: 'h (vertex x) = ?',
  vertexY: 'k (vertex y) = ?',
  discriminant: 'Δ = b² − 4ac = ?',
  greaterRoot: 'x₊ (larger root) = ?',
  sin: 'sin(θ) = ?',
  cos: 'cos(θ) = ?',
  tan: 'tan(θ) = ?',
  radians: 'θ (rad) = ?',
  resultantMag: '|u + v| = ?',
  dotProduct: 'u · v = ?',
  resultantX: '(u + v)ₓ = ?',
  resultantY: '(u + v)ᵧ = ?',
  angleBetween: 'θ(u, v)° = ?',
  normalForce: 'F_N (N) = ?',
  gravityParallel: 'F_g∥ (N) = ?',
  frictionForce: 'f_k (N) = ?',
  netForce: 'F_net (N) = ?',
  acceleration: 'a (m/s²) = ?',
  parallelR: 'R_parallel (Ω) = ?',
  equivR: 'R_eq (Ω) = ?',
  totalCurrent: 'I_total (A) = ?',
  branchCurrent2: 'I₂ through R₂ (A) = ?',
  totalPower: 'P_total (W) = ?',
  eqQuantity: 'Q* = ?',
  eqPrice: 'P* = ?',
  consumerSurplus: 'CS = ?',
  taxQuantity: 'Q_tax = ?',
  deadweightLoss: 'DWL = ?',
  zScore: 'z = ?',
  percentile: 'P(X ≤ x) % = ?',
  upperTail: 'P(X ≥ x) % = ?',
  twoTailed: '2·P(|Z| ≥ |z|) % = ?',
}

function emptyClassicGeometry(units: string, diagram: ParametricDiagram): FigureGeometry {
  return {
    vertices: [],
    edges: [],
    angles: [],
    rightAngleAt: null,
    circle: null,
    radiusLine: null,
    units,
    diagram,
  }
}

function formatSignedTerm(coeff: number, variable: string, first = false): string {
  if (coeff === 0) return ''
  const abs = Math.abs(coeff)
  const absText = abs === 1 && variable ? '' : String(Math.round(abs * 100) / 100)
  if (first) return `${coeff < 0 ? '−' : ''}${absText}${variable}`
  return ` ${coeff < 0 ? '−' : '+'} ${absText}${variable}`
}

/**
 * Build renderable geometry. The asked quantity is always labeled "?",
 * so the same code path can safely run on the client without leaking the answer.
 */
export function buildFigureGeometry(spec: FigureSpec): FigureGeometry {
  const { template, givens, ask, rounding } = spec
  const { a, b, c, angleA, angleB, angleC, r, d, b1, b2, h } = givens
  const isAsked = (key: string): boolean => key === ask
  const labelOr = (key: string, value: number | undefined): string | null => {
    if (isAsked(key)) return '?'
    return value === undefined ? null : num(value, rounding)
  }
  const targetLabel = TARGET_BADGE_LABELS[ask] ?? `${ask} = ?`

  switch (template) {
    case 'coordinate-line':
      return emptyClassicGeometry('units', {
        kind: 'coordinate-line',
        x1: givens.x1,
        y1: givens.y1,
        x2: givens.x2,
        y2: givens.y2,
        ask,
        targetLabel,
      })
    case 'parabola-vertex': {
      const eq = `y = ${formatSignedTerm(a!, 'x²', true)}${formatSignedTerm(b!, 'x')}${
        c === 0 ? '' : ` ${c! < 0 ? '−' : '+'} ${Math.abs(Math.round(c! * 100) / 100)}`
      }`
      return emptyClassicGeometry('units', {
        kind: 'parabola-vertex',
        a: a!,
        b: b!,
        c: c!,
        equationLabel: eq,
        ask,
        targetLabel,
      })
    }
    case 'unit-circle':
      return emptyClassicGeometry('rad', {
        kind: 'unit-circle',
        angleDeg: givens.angleDeg,
        ask,
        targetLabel,
      })
    case 'vector-2d':
      return emptyClassicGeometry('units', {
        kind: 'vector-2d',
        ux: givens.ux,
        uy: givens.uy,
        vx: givens.vx,
        vy: givens.vy,
        ask,
        targetLabel,
      })
    case 'inclined-plane':
      return emptyClassicGeometry(ask === 'acceleration' ? 'm/s²' : 'N', {
        kind: 'inclined-plane',
        mass: givens.mass,
        angle: givens.angle,
        mu: givens.mu,
        ask,
        targetLabel,
      })
    case 'series-parallel-circuit':
      return emptyClassicGeometry(
        ask.includes('Current') ? 'A' : ask === 'totalPower' ? 'W' : 'Ω',
        {
          kind: 'series-parallel-circuit',
          voltage: givens.voltage,
          r1: givens.r1,
          r2: givens.r2,
          r3: givens.r3,
          ask,
          targetLabel,
        },
      )
    case 'supply-demand':
      return emptyClassicGeometry(
        ask.includes('Price') ? '$' : ask.includes('Quantity') ? 'units' : '$',
        {
          kind: 'supply-demand',
          demandIntercept: givens.demandIntercept,
          demandSlope: givens.demandSlope,
          supplyIntercept: givens.supplyIntercept,
          supplySlope: givens.supplySlope,
          tax: givens.tax ?? 0,
          ask,
          targetLabel,
        },
      )
    case 'normal-curve':
      return emptyClassicGeometry(ask === 'zScore' ? 'σ' : '%', {
        kind: 'normal-curve',
        mean: givens.mean,
        sd: givens.sd,
        x: givens.x,
        ask,
        targetLabel,
      })
    default:
      break
  }

  if (template === 'circle') {
    const radius = r ?? d! / 2
    return {
      vertices: [],
      edges: [],
      angles: [],
      rightAngleAt: null,
      circle: {
        cx: 50,
        cy: 50,
        r: 32,
        label: isAsked('radius') ? '?' : num(radius, rounding),
        given: !isAsked('radius'),
      },
      radiusLine: {
        from: 0,
        to: 1,
        label: isAsked('radius') ? '?' : num(radius, rounding),
      },
      units: 'units',
    }
  }

  if (template === 'trapezoid') {
    const scale = 78 / Math.max(b1!, h!)
    const pts = [
      { name: 'A', x: 50 - (b1! * scale) / 2, y: 88 },
      { name: 'B', x: 50 + (b1! * scale) / 2, y: 88 },
      { name: 'C', x: 50 + (b2! * scale) / 2, y: 88 - h! * scale },
      { name: 'D', x: 50 - (b2! * scale) / 2, y: 88 - h! * scale },
    ]
    return {
      vertices: pts,
      edges: [
        { from: 0, to: 1, label: labelOr('b1', b1), given: !isAsked('b1') },
        { from: 1, to: 2, label: null, given: true },
        { from: 2, to: 3, label: labelOr('b2', b2), given: !isAsked('b2') },
        { from: 3, to: 0, label: null, given: true },
        { from: 1, to: 2, label: labelOr('h', h), given: !isAsked('h') },
      ],
      angles: [],
      rightAngleAt: null,
      circle: null,
      radiusLine: null,
      units: 'units',
    }
  }

  if (template === 'triangle-sas') {
    const A = rad(angleA!)
    const rawA = { name: 'A', x: 0, y: 0 }
    const rawB = { name: 'B', x: c! * Math.cos(A), y: c! * Math.sin(A) }
    const rawC = { name: 'C', x: b!, y: 0 }
    return triangleGeometry(
      [rawA, rawB, rawC],
      {
        edgeAB: labelOr('c', c),
        edgeBC: labelOr('a', undefined),
        edgeCA: labelOr('b', b),
        angleA: labelOr('angleA', angleA),
        angleB: labelOr('angleB', undefined),
        angleC: labelOr('angleC', undefined),
        givens: { c: c !== undefined, b: b !== undefined, angleA: angleA !== undefined },
      },
      ask,
    )
  }

  if (template === 'triangle-sss') {
    const xB = (c! * c! + b! * b! - a! * a!) / (2 * b!)
    const yB = Math.sqrt(Math.max(0, c! * c! - xB * xB))
    return triangleGeometry(
      [
        { name: 'A', x: 0, y: 0 },
        { name: 'B', x: xB, y: yB },
        { name: 'C', x: b!, y: 0 },
      ],
      {
        edgeAB: labelOr('c', c),
        edgeBC: labelOr('a', a),
        edgeCA: labelOr('b', b),
        angleA: labelOr('angleA', angleA),
        angleB: labelOr('angleB', angleB),
        angleC: labelOr('angleC', angleC),
        givens: { a: a !== undefined, b: b !== undefined, c: c !== undefined },
      },
      ask,
    )
  }

  if (template === 'triangle-asa') {
    const B = 180 - angleA! - angleC!
    const s = (b! * Math.sin(rad(angleA!))) / Math.sin(rad(B))
    const bx = b! - s * Math.cos(rad(angleC!))
    const by = s * Math.sin(rad(angleC!))
    return triangleGeometry(
      [
        { name: 'A', x: 0, y: 0 },
        { name: 'B', x: bx, y: by },
        { name: 'C', x: b!, y: 0 },
      ],
      {
        edgeAB: labelOr('c', undefined),
        edgeBC: labelOr('a', undefined),
        edgeCA: labelOr('b', b),
        angleA: labelOr('angleA', angleA),
        angleB: labelOr('angleB', undefined),
        angleC: labelOr('angleC', angleC),
        givens: { angleA: angleA !== undefined, b: b !== undefined, angleC: angleC !== undefined },
      },
      ask,
    )
  }

  // right-triangle: right angle at C; legs a (vertical) and b (horizontal); hypotenuse c
  if (
    a !== undefined &&
    a !== null &&
    ((b !== undefined && b !== null) || (c !== undefined && c !== null))
  ) {
    const legA = a
    const legB = b ?? Math.sqrt(c! * c! - a! * a!)
    return rightTriangleGeometry(
      legA,
      legB,
      labelOr('a', a),
      labelOr('b', b),
      labelOr('c', c),
      {
        a: a !== undefined,
        b: b !== undefined,
        c: c !== undefined,
      },
      labelOr('angleA', angleA),
      labelOr('angleB', angleB),
      rounding,
    )
  }
  if (b !== undefined && b !== null && c !== undefined && c !== null) {
    const legA = Math.sqrt(c! * c! - b! * b!)
    return rightTriangleGeometry(
      legA,
      b,
      labelOr('a', undefined),
      labelOr('b', b),
      labelOr('c', c),
      {
        a: false,
        b: b !== undefined,
        c: c !== undefined,
      },
      labelOr('angleA', angleA),
      labelOr('angleB', angleB),
      rounding,
    )
  }
  const A = angleA ?? (angleB !== undefined ? 90 - angleB : 0)
  const legIsA = a !== undefined && a !== null
  const leg = legIsA ? a! : b!
  const opposite = legIsA ? leg : leg * Math.tan(rad(A))
  const adjacent = legIsA ? leg / Math.tan(rad(A)) : leg
  return rightTriangleGeometry(
    opposite,
    adjacent,
    labelOr('a', legIsA ? a : undefined),
    labelOr('b', legIsA ? undefined : b),
    labelOr('c', undefined),
    { a: legIsA, b: !legIsA, c: false },
    labelOr('angleA', angleA),
    labelOr('angleB', angleB),
    rounding,
  )
}

function triangleGeometry(
  raw: { name: string; x: number; y: number }[],
  labels: {
    edgeAB: string | null
    edgeBC: string | null
    edgeCA: string | null
    angleA: string | null
    angleB: string | null
    angleC: string | null
    givens: Record<string, boolean>
  },
  ask: string,
): FigureGeometry {
  const xs = raw.map((p) => p.x)
  const ys = raw.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = Math.max(maxX - minX, 0.001)
  const spanY = Math.max(maxY - minY, 0.001)
  const scale = Math.min(80 / spanX, 72 / spanY)
  const offsetX = (100 - spanX * scale) / 2 - minX * scale
  const offsetY = (100 - spanY * scale) / 2 - minY * scale

  const vertices = raw.map((point) => ({
    name: point.name,
    x: point.x * scale + offsetX,
    y: point.y * scale + offsetY,
  }))

  return {
    vertices,
    edges: [
      { from: 0, to: 1, label: labels.edgeAB, given: !asked('c', ask) },
      { from: 1, to: 2, label: labels.edgeBC, given: !asked('a', ask) },
      { from: 2, to: 0, label: labels.edgeCA, given: !asked('b', ask) },
    ],
    angles: [
      { vertex: 0, label: labels.angleA, given: !asked('angleA', ask) },
      { vertex: 1, label: labels.angleB, given: !asked('angleB', ask) },
      { vertex: 2, label: labels.angleC, given: !asked('angleC', ask) },
    ],
    rightAngleAt: null,
    circle: null,
    radiusLine: null,
    units: 'units',
  }
}

function asked(key: string, ask: string): boolean {
  return key === ask
}

function rightTriangleGeometry(
  legA: number,
  legB: number,
  labelA: string | null,
  labelB: string | null,
  labelC: string | null,
  givenFlags: { a: boolean; b: boolean; c: boolean },
  labelAngleA: string | null,
  labelAngleB: string | null,
  _rounding: Rounding,
): FigureGeometry {
  const scale = Math.min(70 / legA, 70 / legB)
  const vertices = [
    { name: 'A', x: 18, y: 88 - legA * scale },
    { name: 'B', x: 18 + legB * scale, y: 88 },
    { name: 'C', x: 18, y: 88 },
  ]
  return {
    vertices,
    edges: [
      { from: 0, to: 1, label: labelC, given: givenFlags.c },
      { from: 1, to: 2, label: labelB, given: givenFlags.b },
      { from: 2, to: 0, label: labelA, given: givenFlags.a },
    ],
    angles: [
      { vertex: 0, label: labelAngleA, given: labelAngleA !== '?' },
      { vertex: 1, label: labelAngleB, given: labelAngleB !== '?' },
    ],
    rightAngleAt: 2,
    circle: null,
    radiusLine: null,
    units: 'units',
  }
}
