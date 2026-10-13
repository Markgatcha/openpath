/**
 * Figure & equation questions — geometry engine (v1).
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
}

export interface FigureSpec {
  template: FigureTemplate
  /** Numbers are lengths or degrees (angles in degree units). */
  givens: Record<string, number>
  /** Which quantity the student must find. */
  ask: string
  rounding: Rounding
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

// ── Validation ──────────────────────────────────────────────────
const RANGE: Record<string, [number, number]> = {
  a: [0.5, 200],
  b: [0.5, 200],
  c: [0.5, 200],
  r: [0.5, 100],
  d: [1, 200],
  b1: [0.5, 200],
  b2: [0.5, 200],
  h: [0.5, 200],
  angleA: [1, 179],
  angleB: [1, 179],
  angleC: [1, 179],
}

function inRange(key: string, value: number): boolean {
  const bounds = RANGE[key]
  if (!bounds) return true
  return value >= bounds[0] && value <= bounds[1]
}

/**
 * Human-readable validation error, or null when the spec is solvable.
 * Runs on both server (authority) and client (live editor feedback).
 */
export function validateFigure(spec: FigureSpec): string | null {
  const { template, givens, ask } = spec

  if (!ASKS_BY_TEMPLATE[template].includes(ask)) {
    return 'That question is not available for this shape'
  }

  for (const [key, value] of Object.entries(givens)) {
    if (!Number.isFinite(value)) return `Given "${key}" must be a number`
    if (!inRange(key, value)) return `Given "${key}" is outside the supported range`
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
        // hypotenuse given with a leg: the other leg must be shorter
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
  }
}

// ── Answer computation ──────────────────────────────────────────
const rad = (deg: number): number => (deg * Math.PI) / 180
const deg = (value: number): number => (value * 180) / Math.PI

export function computeAnswer(spec: FigureSpec): number {
  const { template, givens, ask } = spec
  const { a, b, c, angleA, angleB, angleC, r, d, b1, b2, h } = givens

  switch (template) {
    case 'triangle-sas': {
      const A = rad(angleA!)
      if (ask === 'a') return Math.sqrt(b! * b! + c! * c! - 2 * b! * c! * Math.cos(A))
      if (ask === 'area') return 0.5 * b! * c! * Math.sin(A)
      // law of sines from side a
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
        // two legs known
        const A = deg(Math.atan2(a!, b!))
        if (ask === 'c') return Math.sqrt(a! * a! + b! * b!)
        if (ask === 'angleA') return A
        if (ask === 'angleB') return 90 - A
        return 0.5 * a! * b!
      }
      // one leg + hypotenuse
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
      // one leg + one angle
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
  }
}

// ── Drawing data ───────────────────────────────────────────────
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
}

function num(value: number, rounding: Rounding): string {
  const rounded = roundValue(value, rounding)
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '')
}

/**
 * Build renderable geometry. The asked quantity is always labeled "?",
 * so the same code path can safely run on the client.
 */
export function buildFigureGeometry(spec: FigureSpec): FigureGeometry {
  const { template, givens, ask, rounding } = spec
  const { a, b, c, angleA, angleB, angleC, r, d, b1, b2, h } = givens
  const asked = (key: string): boolean => key === ask
  const labelOr = (key: string, value: number | undefined): string | null => {
    if (asked(key)) return '?'
    return value === undefined ? null : num(value, rounding)
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
        label: asked('radius') ? '?' : num(radius, rounding),
        given: !asked('radius'),
      },
      radiusLine: {
        from: 0,
        to: 1,
        label: asked('radius') ? '?' : num(radius, rounding),
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
        { from: 0, to: 1, label: labelOr('b1', b1), given: !asked('b1') },
        { from: 1, to: 2, label: null, given: true },
        { from: 2, to: 3, label: labelOr('b2', b2), given: !asked('b2') },
        { from: 3, to: 0, label: null, given: true },
        // height marker on the right leg
        { from: 1, to: 2, label: labelOr('h', h), given: !asked('h') },
      ],
      angles: [],
      rightAngleAt: null,
      circle: null,
      radiusLine: null,
      units: 'units',
    }
  }

  // Triangles: place with side b on the x-axis where possible.
  if (template === 'triangle-sas') {
    // b = AC, c = AB, included angle A at origin
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
  if (a !== undefined && a !== null && (b !== undefined && b !== null || c !== undefined && c !== null)) {
    const legA = a
    const legB = b ?? Math.sqrt(c! * c! - a! * a!)
    return rightTriangleGeometry(legA, legB, labelOr('a', a), labelOr('b', b), labelOr('c', c), {
      a: a !== undefined,
      b: b !== undefined,
      c: c !== undefined,
    }, labelOr('angleA', angleA), labelOr('angleB', angleB), rounding)
  }
  if (b !== undefined && b !== null && c !== undefined && c !== null) {
    const legA = Math.sqrt(c! * c! - b! * b!)
    return rightTriangleGeometry(legA, b, labelOr('a', undefined), labelOr('b', b), labelOr('c', c), {
      a: false,
      b: b !== undefined,
      c: c !== undefined,
    }, labelOr('angleA', angleA), labelOr('angleB', angleB), rounding)
  }
  // leg + angle
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
  // Normalize into a 0..100 box with a little padding.
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
    y: (point.y * scale + offsetY) * 1,
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
  // y grows downward in SVG space; keep leg A vertical up from origin
  const vertices = [
    { name: 'A', x: 18, y: 88 - legA * scale }, // top (leg a above C)
    { name: 'B', x: 18 + legB * scale, y: 88 }, // bottom right
    { name: 'C', x: 18, y: 88 }, // right angle
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
