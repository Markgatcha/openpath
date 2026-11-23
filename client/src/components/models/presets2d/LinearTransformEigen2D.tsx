import { Interactive2DViewer } from '../Interactive2DViewer'
import { PALETTE_CSS, type Model2DDefinition, type Params } from '../engine2d'

const ORIGIN_X = 245
const ORIGIN_Y = 230
const SCALE = 58 // pixels per math unit (grid range approx [-3.6..3.6])

function toPx(mx: number, my: number): { x: number; y: number } {
  return { x: ORIGIN_X + mx * SCALE, y: ORIGIN_Y - my * SCALE }
}

function toMath(px: number, py: number): { x: number; y: number } {
  return { x: (px - ORIGIN_X) / SCALE, y: (ORIGIN_Y - py) / SCALE }
}

function solveTransform(p: Params) {
  const a = p.a ?? 1.5
  const b = p.b ?? 0.5
  const c = p.c ?? 0.5
  const d = p.d ?? 1.5
  const vx = p.vx ?? 1.0
  const vy = p.vy ?? 1.0

  const det = a * d - b * c
  const trace = a + d
  const avx = a * vx + b * vy
  const avy = c * vx + d * vy

  const disc = trace * trace - 4 * det
  const eigenVals: number[] = []
  const eigenVecs: Array<{ x: number; y: number; lambda: number }> = []

  if (disc >= 0) {
    const root = Math.sqrt(disc)
    const l1 = (trace + root) / 2
    const l2 = (trace - root) / 2
    eigenVals.push(l1, l2)
    for (const lam of [l1, l2]) {
      // Solve (A - lam I) v = 0 -> [a-lam, b; c, d-lam]
      let ex = b
      let ey = lam - a
      if (Math.hypot(ex, ey) < 1e-4) {
        ex = lam - d
        ey = c
      }
      if (Math.hypot(ex, ey) < 1e-4) {
        ex = 1
        ey = 0
      }
      const len = Math.hypot(ex, ey) || 1
      eigenVecs.push({ x: ex / len, y: ey / len, lambda: lam })
    }
  }

  const vNorm = Math.hypot(vx, vy)
  const avNorm = Math.hypot(avx, avy)
  const cross = vx * avy - vy * avx
  const alignmentSin = vNorm > 1e-4 && avNorm > 1e-4 ? Math.abs(cross) / (vNorm * avNorm) : 0
  const angleDeg = Math.asin(Math.min(1, alignmentSin)) * (180 / Math.PI)

  return { a, b, c, d, vx, vy, avx, avy, det, trace, disc, eigenVals, eigenVecs, angleDeg }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  col: string,
  width = 2.6,
  dashed = false,
) {
  ctx.save()
  ctx.strokeStyle = col
  ctx.fillStyle = col
  ctx.lineWidth = width
  if (dashed) ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.setLineDash([])

  const ang = Math.atan2(y1 - y0, x1 - x0)
  const len = Math.hypot(x1 - x0, y1 - y0)
  if (len > 10) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1 - 9 * Math.cos(ang - 0.42), y1 - 9 * Math.sin(ang - 0.42))
    ctx.lineTo(x1 - 9 * Math.cos(ang + 0.42), y1 - 9 * Math.sin(ang + 0.42))
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

export const linearTransformEigen2dModel: Model2DDefinition = {
  id: 'linear-transform-eigen-2d',
  title: 'Linear Transformations, Determinant & Eigenvectors',
  subtitle:
    'Drag basis images Aî, Aĵ, and test vector v directly on the plane to see grid warping, signed area det(A), and invariant eigenlines.',
  viewWidth: 720,
  viewHeight: 460,
  params: [
    { kind: 'slider', id: 'a', label: 'Aî x (entry a)', min: -2.5, max: 2.5, step: 0.1, initial: 1.5 },
    { kind: 'slider', id: 'c', label: 'Aî y (entry c)', min: -2.5, max: 2.5, step: 0.1, initial: 0.5 },
    { kind: 'slider', id: 'b', label: 'Aĵ x (entry b)', min: -2.5, max: 2.5, step: 0.1, initial: 0.5 },
    { kind: 'slider', id: 'd', label: 'Aĵ y (entry d)', min: -2.5, max: 2.5, step: 0.1, initial: 1.5 },
    { kind: 'slider', id: 'vx', label: 'Vector v_x', min: -2.5, max: 2.5, step: 0.1, initial: 1.0 },
    { kind: 'slider', id: 'vy', label: 'Vector v_y', min: -2.5, max: 2.5, step: 0.1, initial: 0.2 },
    { kind: 'toggle', id: 'showEigen', label: 'Show real eigenlines', initial: true },
  ],
  challenges: [
    {
      id: 'determinant-zero-collapse',
      title: 'Collapsing 2D Space (det A = 0)',
      setupParams: { a: 1.5, c: 0.5, b: 0.0, d: 1.5, vx: 1.0, vy: 1.0 },
      predict: {
        prompt:
          'When Aĵ becomes a scalar multiple of Aî (collinear vectors), what happens to ALL 2D shapes in the plane and det(A)?',
        options: [
          'The whole 2D grid flattens onto a 1D line and area factor det(A) = 0',
          'Only the unit square shrinks while det(A) stays 1',
          'The matrix flips orientation cleanly without collapsing area',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Drag basis handle Aĵ (or tune entries b, d) until |det(A)| < 0.08 so the matrix becomes singular.',
        evaluate: (_p, m) => ({
          passed: Math.abs(m.det) < 0.08,
          feedback: `det(A) = ${m.det.toFixed(2)}. Align Aĵ parallel to Aî (e.g., b = 1.5, d = 0.5) to flatten the parallelogram!`,
        }),
      },
      explain:
        'A linear transformation is singular (non-invertible) precisely when its basis columns lose linear independence, squashing 2D area to zero (rank <= 1).',
      misconceptionTag: 'det-zero-means-zero-matrix',
    },
    {
      id: 'align-eigenvector-span',
      title: 'Pinning an Invariant Eigenvector (Av = λv)',
      setupParams: { a: 2.0, c: 1.0, b: 1.0, d: 2.0, vx: 1.5, vy: 0.0, showEigen: 1 },
      predict: {
        prompt:
          'For symmetric matrix A = [[2, 1], [1, 2]], starting vector v = (1.5, 0) gets pulled toward (3.0, 1.5). Which direction v stays on its OWN line after A transforms it?',
        options: [
          'Along v = (1, 1) (or (1, −1)), where Av simply scales v without rotating',
          'Only the zero vector stays on its line',
          'Any vector parallel to the x-axis (1, 0)',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Drag the amber vector v handle onto one of the dashed eigenlines so angle(v, Av) < 3°.',
        evaluate: (_p, m) => ({
          passed: m.vNorm > 0.4 && m.angleDeg < 3.0,
          feedback: `Angle between v and Av = ${m.angleDeg.toFixed(1)}°. Target < 3° (try v_x = 1, v_y = 1)!`,
        }),
      },
      explain:
        'Most vectors rotate off their original span line under A. Eigenvectors are the special invariant axes where Av = λv — A stretches or flips v purely along its own line.',
      misconceptionTag: 'all-vectors-rotate-under-matrix',
    },
  ],
  build: () => {
    const clamp25 = (n: number) => Math.max(-2.5, Math.min(2.5, Math.round(n * 10) / 10))
    return {
      dragHandles: [
        {
          id: 'i-hat',
          label: 'Transformed basis Aî',
          color: PALETTE_CSS.cyan,
          getPos: (p) => toPx(p.a ?? 1.5, p.c ?? 0.5),
          onDrag: (px, py) => {
            const m = toMath(px, py)
            return { a: clamp25(m.x), c: clamp25(m.y) }
          },
          ariaValueText: (p) => `Aî = (${p.a.toFixed(1)}, ${p.c.toFixed(1)})`,
        },
        {
          id: 'j-hat',
          label: 'Transformed basis Aĵ',
          color: PALETTE_CSS.emerald,
          getPos: (p) => toPx(p.b ?? 0.5, p.d ?? 1.5),
          onDrag: (px, py) => {
            const m = toMath(px, py)
            return { b: clamp25(m.x), d: clamp25(m.y) }
          },
          ariaValueText: (p) => `Aĵ = (${p.b.toFixed(1)}, ${p.d.toFixed(1)})`,
        },
        {
          id: 'vec-v',
          label: 'Test vector v',
          color: PALETTE_CSS.amber,
          getPos: (p) => toPx(p.vx ?? 1.0, p.vy ?? 0.2),
          onDrag: (px, py) => {
            const m = toMath(px, py)
            return { vx: clamp25(m.x), vy: clamp25(m.y) }
          },
          ariaValueText: (p) => `v = (${p.vx.toFixed(1)}, ${p.vy.toFixed(1)})`,
        },
      ],
      hotspots: [
        {
          id: 'unit-area',
          label: 'Determinant Area',
          x: 295,
          y: 185,
          title: 'Signed Area Scaling |det(A)|',
          body: 'The shaded parallelogram spanned by Aî and Aĵ has area |ad − bc|. When det(A) < 0 (rose), space is mirror-flipped!',
        },
        {
          id: 'eigen-axis',
          label: 'Eigenlines',
          x: 345,
          y: 130,
          title: 'Invariant Eigenvalue Directions',
          body: 'Dashed lines are invariant spans: when test vector v lands on an eigenline, Av aligns strictly collinear with v.',
        },
        {
          id: 'matrix-card',
          label: 'Columns = Basis',
          x: 590,
          y: 140,
          title: 'Columns Tell You Where î and ĵ Land',
          body: 'Column 1 [a, c] is literally Aî, and Column 2 [b, d] is literally Aĵ. Linearity makes every vector follow A(xî + yĵ) = xAî + yAĵ.',
        },
      ],
      renderCanvas: (ctx, p) => {
        const s = solveTransform(p)
        const gx = 24
        const gy = 26
        const gw = 444
        const gh = 408

        ctx.save()
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.fillRect(gx, gy, gw, gh)
        ctx.strokeRect(gx, gy, gw, gh)

        ctx.save()
        ctx.beginPath()
        ctx.rect(gx, gy, gw, gh)
        ctx.clip()

        // Undeformed gray grid
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)'
        ctx.lineWidth = 1
        for (let k = -4; k <= 4; k += 1) {
          const h0 = toPx(-4, k)
          const h1 = toPx(4, k)
          ctx.beginPath()
          ctx.moveTo(h0.x, h0.y)
          ctx.lineTo(h1.x, h1.y)
          ctx.stroke()

          const v0 = toPx(k, -4)
          const v1 = toPx(k, 4)
          ctx.beginPath()
          ctx.moveTo(v0.x, v0.y)
          ctx.lineTo(v1.x, v1.y)
          ctx.stroke()
        }

        // Transformed grid lines in faint violet
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.22)'
        for (let k = -4; k <= 4; k += 1) {
          const p1 = toPx(s.a * -4 + s.b * k, s.c * -4 + s.d * k)
          const p2 = toPx(s.a * 4 + s.b * k, s.c * 4 + s.d * k)
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()

          const q1 = toPx(s.a * k + s.b * -4, s.c * k + s.d * -4)
          const q2 = toPx(s.a * k + s.b * 4, s.c * k + s.d * 4)
          ctx.beginPath()
          ctx.moveTo(q1.x, q1.y)
          ctx.lineTo(q2.x, q2.y)
          ctx.stroke()
        }

        // Principal Cartesian axes
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(gx, ORIGIN_Y)
        ctx.lineTo(gx + gw, ORIGIN_Y)
        ctx.moveTo(ORIGIN_X, gy)
        ctx.lineTo(ORIGIN_X, gy + gh)
        ctx.stroke()

        // Shaded unit parallelogram spanned by Aî & Aĵ
        const oPx = toPx(0, 0)
        const iPx = toPx(s.a, s.c)
        const jPx = toPx(s.b, s.d)
        const ijPx = toPx(s.a + s.b, s.c + s.d)
        ctx.fillStyle = s.det >= 0 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 113, 133, 0.24)'
        ctx.beginPath()
        ctx.moveTo(oPx.x, oPx.y)
        ctx.lineTo(iPx.x, iPx.y)
        ctx.lineTo(ijPx.x, ijPx.y)
        ctx.lineTo(jPx.x, jPx.y)
        ctx.closePath()
        ctx.fill()

        // Eigenlines
        if ((p.showEigen ?? 1) >= 0.5 && s.eigenVecs.length > 0) {
          s.eigenVecs.forEach((ev, idx) => {
            const pNeg = toPx(-ev.x * 5, -ev.y * 5)
            const pPos = toPx(ev.x * 5, ev.y * 5)
            ctx.strokeStyle = idx === 0 ? 'rgba(251, 191, 36, 0.45)' : 'rgba(244, 114, 182, 0.45)'
            ctx.setLineDash([6, 5])
            ctx.lineWidth = 1.6
            ctx.beginPath()
            ctx.moveTo(pNeg.x, pNeg.y)
            ctx.lineTo(pPos.x, pPos.y)
            ctx.stroke()
            ctx.setLineDash([])
          })
        }

        // Vectors: Aî, Aĵ, v, and Av
        const vPx = toPx(s.vx, s.vy)
        const avPx = toPx(s.avx, s.avy)
        drawArrow(ctx, oPx.x, oPx.y, iPx.x, iPx.y, PALETTE_CSS.cyan, 2.8)
        drawArrow(ctx, oPx.x, oPx.y, jPx.x, jPx.y, PALETTE_CSS.emerald, 2.8)
        drawArrow(ctx, oPx.x, oPx.y, vPx.x, vPx.y, PALETTE_CSS.amber, 2.4, true)
        drawArrow(ctx, oPx.x, oPx.y, avPx.x, avPx.y, PALETTE_CSS.rose, 2.8)

        ctx.font = 'bold 11px ui-monospace, monospace'
        ctx.fillStyle = PALETTE_CSS.cyan
        ctx.fillText('Aî', iPx.x + 8, iPx.y - 6)
        ctx.fillStyle = PALETTE_CSS.emerald
        ctx.fillText('Aĵ', jPx.x + 8, jPx.y - 6)
        ctx.fillStyle = PALETTE_CSS.amber
        ctx.fillText('v', vPx.x + 8, vPx.y + 12)
        ctx.fillStyle = PALETTE_CSS.rose
        ctx.fillText('Av', avPx.x + 8, avPx.y - 6)

        ctx.restore()

        // Right algebra card
        const rx = 488
        const ry = 26
        const rw = 208
        const rh = 408
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.fillRect(rx, ry, rw, rh)
        ctx.strokeRect(rx, ry, rw, rh)

        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText('Matrix & Eigen Analysis', rx + 14, ry + 26)

        // Draw [a b; c d] matrix bracket
        ctx.font = 'bold 15px ui-monospace, monospace'
        ctx.fillStyle = PALETTE_CSS.cyan
        ctx.fillText(s.a.toFixed(1), rx + 36, ry + 66)
        ctx.fillText(s.c.toFixed(1), rx + 36, ry + 94)
        ctx.fillStyle = PALETTE_CSS.emerald
        ctx.fillText(s.b.toFixed(1), rx + 110, ry + 66)
        ctx.fillText(s.d.toFixed(1), rx + 110, ry + 94)

        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(rx + 28, ry + 48)
        ctx.lineTo(rx + 20, ry + 48)
        ctx.lineTo(rx + 20, ry + 104)
        ctx.lineTo(rx + 28, ry + 104)
        ctx.moveTo(rx + 156, ry + 48)
        ctx.lineTo(rx + 164, ry + 48)
        ctx.lineTo(rx + 164, ry + 104)
        ctx.lineTo(rx + 156, ry + 104)
        ctx.stroke()

        ctx.font = '11px ui-monospace, monospace'
        ctx.fillStyle = Math.abs(s.det) < 0.08 ? PALETTE_CSS.rose : '#f8fafc'
        ctx.fillText(`det(A) = ${s.det.toFixed(2)}`, rx + 16, ry + 142)
        ctx.fillStyle = '#94a3b8'
        ctx.fillText(
          Math.abs(s.det) < 0.08
            ? 'Singular (area = 0)'
            : s.det < 0
              ? 'Orientation flipped'
              : 'Orientation preserved',
          rx + 16,
          ry + 160,
        )

        ctx.fillStyle = PALETTE_CSS.rose
        ctx.fillText(`Av = (${s.avx.toFixed(2)}, ${s.avy.toFixed(2)})`, rx + 16, ry + 196)
        ctx.fillStyle = s.angleDeg < 3 ? PALETTE_CSS.emerald : PALETTE_CSS.amber
        ctx.fillText(`∠(v, Av) = ${s.angleDeg.toFixed(1)}°`, rx + 16, ry + 216)

        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText('Eigenvalues λ:', rx + 16, ry + 256)
        ctx.font = '11px ui-monospace, monospace'
        if (s.disc >= 0) {
          ctx.fillStyle = PALETTE_CSS.amber
          ctx.fillText(`λ₁ = ${s.eigenVals[0].toFixed(2)}`, rx + 16, ry + 278)
          ctx.fillStyle = '#f472b6'
          ctx.fillText(`λ₂ = ${s.eigenVals[1].toFixed(2)}`, rx + 16, ry + 298)
        } else {
          const re = s.trace / 2
          const im = Math.sqrt(-s.disc) / 2
          ctx.fillStyle = PALETTE_CSS.violet
          ctx.fillText(`${re.toFixed(2)} ± ${im.toFixed(2)}i`, rx + 16, ry + 278)
          ctx.fillStyle = '#94a3b8'
          ctx.fillText('(Pure rotation/spiral)', rx + 16, ry + 298)
        }
        ctx.restore()
      },
      readouts: (p) => {
        const s = solveTransform(p)
        return [
          { label: 'Determinant det(A)', value: s.det.toFixed(2) },
          { label: 'Transformed Av', value: `(${s.avx.toFixed(2)}, ${s.avy.toFixed(2)})` },
          { label: 'Angle ∠(v, Av)', value: `${s.angleDeg.toFixed(1)}°` },
          {
            label: 'Eigenvalues',
            value:
              s.disc >= 0
                ? `${s.eigenVals[0].toFixed(2)}, ${s.eigenVals[1].toFixed(2)}`
                : 'Complex (rotates)',
          },
        ]
      },
      metrics: (p) => {
        const s = solveTransform(p)
        return {
          det: s.det,
          angleDeg: s.angleDeg,
          vNorm: Math.hypot(s.vx, s.vy),
        }
      },
    }
  },
}

export default function LinearTransformEigen2D() {
  return <Interactive2DViewer model={linearTransformEigen2dModel} />
}
