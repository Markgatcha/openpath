import { Interactive2DViewer } from '../Interactive2DViewer'
import { PALETTE_CSS, type Hotspot2D, type Model2DDefinition, type Params } from '../engine2d'

const VIEW_W = 720
const VIEW_H = 460
const ORIGIN_X = 72
const GROUND_Y = 392
const PLOT_W = 620
const PLOT_H = 318
const VEC_PX = 2.2
const LAND_HOLD_S = 0.9

const GRAVITIES = [
  { name: 'Earth', g: 9.8 },
  { name: 'Moon', g: 1.62 },
  { name: 'Mars', g: 3.71 },
  { name: 'Jupiter', g: 24.8 },
] as const

const SPANS = [20, 50, 100, 200, 500, 1000, 2000] as const

function solve(p: Params, lockedSpan?: number) {
  const v0 = p.speed ?? 20
  const angleDeg = p.angleDeg ?? 45
  const h = p.height ?? 0
  const world = GRAVITIES[Math.round(p.gravity ?? 0)] ?? GRAVITIES[0]
  const g = world.g
  const rad = (angleDeg * Math.PI) / 180
  const vx = v0 * Math.cos(rad)
  const vy0 = v0 * Math.sin(rad)
  const flightTime = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h)) / g
  const range = vx * flightTime
  const apexTime = vy0 / g
  const maxHeight = h + (vy0 * vy0) / (2 * g)
  const impactVy = vy0 - g * flightTime
  const impactSpeed = Math.hypot(vx, impactVy)
  // One metre is the same number of pixels on both axes, so the drawn
  // launch angle is the real one.
  const need = Math.max(range * 1.1, (maxHeight * 1.15 * PLOT_W) / PLOT_H, 20)
  const span = lockedSpan ?? SPANS.find((s) => s >= need) ?? SPANS[SPANS.length - 1]
  const scale = PLOT_W / span
  return {
    v0,
    angleDeg,
    h,
    g,
    gravity: Math.round(p.gravity ?? 0),
    rad,
    vx,
    vy0,
    flightTime,
    range,
    apexTime,
    maxHeight,
    impactSpeed,
    span,
    scale,
  }
}

type Solution = ReturnType<typeof solve>

function worldToPx(s: Solution, x: number, y: number) {
  return { x: ORIGIN_X + x * s.scale, y: GROUND_Y - y * s.scale }
}

function positionAt(s: Solution, t: number) {
  const tc = Math.max(0, Math.min(t, s.flightTime))
  return {
    x: s.vx * tc,
    y: Math.max(0, s.h + s.vy0 * tc - 0.5 * s.g * tc * tc),
    vy: s.vy0 - s.g * tc,
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2.4,
  dashed = false,
) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 3) return
  const ang = Math.atan2(y2 - y1, x2 - x1)
  const head = Math.min(8, len * 0.45)
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  if (dashed) ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2 - Math.cos(ang) * head * 0.6, y2 - Math.sin(ang) * head * 0.6)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - Math.cos(ang - 0.42) * head, y2 - Math.sin(ang - 0.42) * head)
  ctx.lineTo(x2 - Math.cos(ang + 0.42) * head, y2 - Math.sin(ang + 0.42) * head)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  align: CanvasTextAlign = 'left',
) {
  ctx.save()
  ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = align
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)'
  ctx.strokeText(text, x, y)
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.restore()
}

function fmt(v: number, digits = 1): string {
  return v.toFixed(digits)
}

export const projectileMotion2dModel: Model2DDefinition = {
  id: 'projectile-motion-2d',
  title: 'Projectile Motion: Range, Apex & Independent Components',
  subtitle:
    'Aim the launcher and watch constant horizontal velocity combine with constant downward acceleration into a parabola.',
  viewWidth: VIEW_W,
  viewHeight: VIEW_H,
  supportsStep: true,
  params: [
    { kind: 'slider', id: 'speed', label: 'Launch speed v₀', min: 5, max: 30, step: 0.5, initial: 20, unit: ' m/s' },
    { kind: 'slider', id: 'angleDeg', label: 'Launch angle θ', min: 5, max: 85, step: 1, initial: 45, unit: '°' },
    { kind: 'slider', id: 'height', label: 'Launch height h', min: 0, max: 20, step: 1, initial: 0, unit: ' m' },
    { kind: 'choice', id: 'gravity', label: 'Gravity', choices: GRAVITIES.map((w) => `${w.name} (${w.g} m/s²)`), initial: 0 },
    { kind: 'toggle', id: 'showComponents', label: 'Show vₓ and v_y components', initial: true },
    { kind: 'toggle', id: 'showStrobe', label: 'Strobe marks at equal time steps', initial: false },
  ],
  challenges: [
    {
      id: 'max-range-angle',
      title: 'Which Angle Throws Farthest?',
      setupParams: { speed: 20, angleDeg: 20, height: 0, gravity: 0 },
      predict: {
        prompt:
          'On level ground with a fixed launch speed and no air resistance, which launch angle gives the greatest range?',
        options: ['45°', '30°, because a flatter shot keeps more horizontal speed', '60°, because it stays in the air longer'],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Keep h = 0 and change only the angle until the range is within 0.5% of its maximum v₀²/g.',
        evaluate: (p) => {
          const m = solve(p)
          const best = (m.v0 * m.v0) / m.g
          return {
            passed: (p.height ?? 0) === 0 && m.range >= best * 0.995,
            feedback: `Range ${fmt(m.range)} m at ${m.angleDeg}° (maximum possible ${fmt(best)} m).`,
          }
        },
      },
      explain:
        'Range on level ground is R = v₀² sin(2θ) / g. sin(2θ) peaks at 1 when 2θ = 90°, so θ = 45° balances horizontal speed against time in the air.',
      misconceptionTag: 'projectile-flatter-is-farther',
    },
    {
      id: 'complementary-angles',
      title: 'Two Angles, One Landing Spot',
      setupParams: { speed: 20, angleDeg: 30, height: 0, gravity: 0 },
      predict: {
        prompt: 'A 30° shot lands at some distance. Which other angle, at the same speed, lands at the same spot?',
        options: ['60°', '45°', '75°'],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Keep h = 0 and raise the angle above 45° until the range matches the 30° shot again.',
        evaluate: (p) => {
          const m = solve(p)
          const target = (m.v0 * m.v0 * Math.sin(Math.PI / 3)) / m.g
          return {
            passed: (p.height ?? 0) === 0 && m.angleDeg > 45 && Math.abs(m.range - target) < 0.6,
            feedback: `Range ${fmt(m.range)} m at ${m.angleDeg}°; the 30° shot reaches ${fmt(target)} m.`,
          }
        },
      },
      explain:
        'sin(2θ) is the same for θ and 90° − θ, so complementary angles share a range. The steep shot flies higher and longer; the flat shot is faster across the ground.',
      misconceptionTag: 'projectile-range-unique-angle',
    },
    {
      id: 'gravity-scales-range',
      title: 'The Same Throw on the Moon',
      setupParams: { speed: 20, angleDeg: 45, height: 0, gravity: 0 },
      predict: {
        prompt: 'The Moon’s gravity is about one sixth of Earth’s. With the same launch, the range on the Moon is…',
        options: ['About 6 times longer', 'About 2.4 times longer (√6)', 'The same, because the launch speed is unchanged'],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Keep h = 0, switch gravity to the Moon and launch at 20 m/s or more so the range passes 240 m.',
        evaluate: (p) => {
          const m = solve(p)
          return {
            passed: m.gravity === 1 && m.v0 >= 20 && m.h === 0 && m.range > 240,
            feedback: `Range ${fmt(m.range)} m with g = ${m.g} m/s².`,
          }
        },
      },
      explain:
        'Both the time of flight (2v₀ sin θ / g) and the range (v₀² sin 2θ / g) are proportional to 1/g. Horizontal speed is untouched; the projectile simply stays up six times longer.',
      misconceptionTag: 'projectile-gravity-affects-horizontal-speed',
    },
  ],
  build: (ctx, initial) => {
    const { quality } = ctx
    let t = 0
    // The zoom is held while the aim handle is dragged; otherwise a zoom
    // change would move an elevated launcher out from under the pointer.
    let dragSpan: number | undefined
    const view = (p: Params) => solve(p, dragSpan)
    let cur = view(initial)

    const starCount = quality.count(70)
    const stars = Array.from({ length: starCount }, (_, i) => ({
      x: (i * 197 + 43) % VIEW_W,
      y: 18 + ((i * 53) % 190),
      r: 0.5 + ((i * 17) % 10) / 12,
      phase: i * 1.7,
    }))
    const dustCount = quality.count(16)

    const apexPx = () => {
      const tA = Math.max(0, cur.apexTime)
      const pos = positionAt(cur, tA)
      return worldToPx(cur, pos.x, pos.y)
    }

    const hotspots: Hotspot2D[] = [
      {
        id: 'launch',
        label: 'Launch',
        get x() {
          return ORIGIN_X + 4
        },
        get y() {
          return Math.max(70, GROUND_Y - cur.h * cur.scale + 26)
        },
        title: 'Launch velocity splits into two components',
        body: 'vₓ = v₀ cos θ carries the projectile sideways and v_y = v₀ sin θ carries it up. From here on the two never affect each other.',
      },
      {
        id: 'apex',
        label: 'Apex',
        get x() {
          return Math.min(VIEW_W - 40, apexPx().x)
        },
        get y() {
          return Math.max(64, apexPx().y - 20)
        },
        title: 'At the apex only v_y is zero',
        body: 'The projectile is still moving sideways at vₓ, and its acceleration is still g downward. It is never "at rest" at the top.',
      },
      {
        id: 'landing',
        label: 'Landing',
        get x() {
          return Math.min(VIEW_W - 44, ORIGIN_X + cur.range * cur.scale)
        },
        get y() {
          return GROUND_Y + 20
        },
        title: 'Range = horizontal speed × time of flight',
        body: 'R = vₓ · T. Gravity sets T by acting on the vertical motion alone; the horizontal motion just keeps going until the ground interrupts it.',
      },
    ]

    return {
      hotspots,
      dragHandles: [
        {
          id: 'aim',
          label: 'Launcher aim: angle and speed',
          color: PALETTE_CSS.amber,
          getPos: (p) => {
            const s = view(p)
            const len = 40 + s.v0 * VEC_PX
            const o = worldToPx(s, 0, s.h)
            return { x: o.x + Math.cos(s.rad) * len, y: o.y - Math.sin(s.rad) * len }
          },
          onDrag: (px, py, p) => {
            const s = view(p)
            dragSpan = s.span
            const o = worldToPx(s, 0, s.h)
            const deg = (Math.atan2(o.y - py, px - o.x) * 180) / Math.PI
            const dist = Math.hypot(px - o.x, py - o.y)
            return {
              angleDeg: Math.max(5, Math.min(85, Math.round(deg))),
              speed: Math.max(5, Math.min(30, Math.round(((dist - 40) / VEC_PX) * 2) / 2)),
            }
          },
          onDragEnd: () => {
            dragSpan = undefined
          },
          ariaValueText: (p) => `${p.angleDeg}° at ${p.speed} m/s`,
        },
      ],
      update: (p, dt) => {
        cur = view(p)
        t += dt
        if (t > cur.flightTime + LAND_HOLD_S) t = 0
      },
      step: (p, direction) => {
        cur = view(p)
        t = Math.max(0, Math.min(cur.flightTime, t + (direction * cur.flightTime) / 12))
      },
      reset: (p) => {
        cur = view(p)
        t = 0
      },
      renderCanvas: (c, p, elapsed, reducedMotion) => {
        cur = view(p)
        const s = cur
        if (t > s.flightTime + LAND_HOLD_S) t = 0
        const showComponents = p.showComponents === 1
        const showStrobe = p.showStrobe === 1

        // Sky
        if (quality.rich) {
          const sky = c.createLinearGradient(0, 0, 0, GROUND_Y)
          sky.addColorStop(0, '#060b1f')
          sky.addColorStop(0.55, '#141c44')
          sky.addColorStop(1, '#3b2a63')
          c.fillStyle = sky
        } else {
          c.fillStyle = '#0d1430'
        }
        c.fillRect(0, 0, VIEW_W, GROUND_Y)

        c.fillStyle = '#e2e8f0'
        for (const star of stars) {
          const twinkle = reducedMotion ? 0.7 : 0.55 + 0.45 * Math.sin(elapsed * 1.3 + star.phase)
          c.globalAlpha = twinkle * (1 - star.y / 260)
          c.beginPath()
          c.arc(star.x, star.y, star.r, 0, Math.PI * 2)
          c.fill()
        }
        c.globalAlpha = 1

        if (quality.rich) {
          for (const [base, amp, color] of [
            [GROUND_Y - 58, 30, 'rgba(49, 46, 129, 0.55)'],
            [GROUND_Y - 26, 20, 'rgba(30, 27, 75, 0.85)'],
          ] as const) {
            c.fillStyle = color
            c.beginPath()
            c.moveTo(0, GROUND_Y)
            for (let x = 0; x <= VIEW_W; x += 12) {
              const ridge = Math.sin(x * 0.013 + base) * amp + Math.sin(x * 0.041 + base * 2) * amp * 0.35
              c.lineTo(x, base - Math.abs(ridge))
            }
            c.lineTo(VIEW_W, GROUND_Y)
            c.closePath()
            c.fill()
          }
        }

        // Ground
        if (quality.rich) {
          const soil = c.createLinearGradient(0, GROUND_Y, 0, VIEW_H)
          soil.addColorStop(0, '#14532d')
          soil.addColorStop(1, '#052e16')
          c.fillStyle = soil
        } else {
          c.fillStyle = '#14532d'
        }
        c.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y)
        c.strokeStyle = PALETTE_CSS.emerald
        c.lineWidth = 2
        c.beginPath()
        c.moveTo(0, GROUND_Y)
        c.lineTo(VIEW_W, GROUND_Y)
        c.stroke()

        // Distance ticks
        c.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
        c.textAlign = 'center'
        const tick = s.span / 5
        for (let i = 0; i <= 5; i += 1) {
          const x = ORIGIN_X + i * tick * s.scale
          c.strokeStyle = 'rgba(226, 232, 240, 0.08)'
          c.lineWidth = 1
          c.beginPath()
          c.moveTo(x, 52)
          c.lineTo(x, GROUND_Y)
          c.stroke()
          c.strokeStyle = 'rgba(226, 232, 240, 0.7)'
          c.beginPath()
          c.moveTo(x, GROUND_Y)
          c.lineTo(x, GROUND_Y + 6)
          c.stroke()
          c.fillStyle = '#cbd5e1'
          c.fillText(`${Math.round(i * tick)} m`, x, GROUND_Y + 48)
        }

        const origin = worldToPx(s, 0, s.h)
        const landing = worldToPx(s, s.range, 0)
        const apex = apexPx()

        // Launch platform
        if (s.h > 0) {
          c.fillStyle = '#334155'
          c.fillRect(ORIGIN_X - 20, origin.y, 30, GROUND_Y - origin.y)
          c.strokeStyle = 'rgba(148, 163, 184, 0.6)'
          c.strokeRect(ORIGIN_X - 20, origin.y, 30, GROUND_Y - origin.y)
        }

        // Predicted path
        c.save()
        c.beginPath()
        c.rect(0, 40, VIEW_W, GROUND_Y - 40)
        c.clip()
        c.strokeStyle = 'rgba(226, 232, 240, 0.4)'
        c.lineWidth = 1.4
        c.setLineDash([4, 6])
        c.beginPath()
        for (let i = 0; i <= 60; i += 1) {
          const pos = positionAt(s, (s.flightTime * i) / 60)
          const px = worldToPx(s, pos.x, pos.y)
          if (i === 0) c.moveTo(px.x, px.y)
          else c.lineTo(px.x, px.y)
        }
        c.stroke()
        c.setLineDash([])

        // Flown path
        const flown = Math.min(t, s.flightTime)
        const segs = 48
        c.lineCap = 'round'
        c.lineWidth = 3
        if (quality.glow) {
          c.shadowColor = PALETTE_CSS.amber
          c.shadowBlur = 10
        }
        for (let i = 0; i < segs; i += 1) {
          const a = positionAt(s, (flown * i) / segs)
          const b = positionAt(s, (flown * (i + 1)) / segs)
          const pa = worldToPx(s, a.x, a.y)
          const pb = worldToPx(s, b.x, b.y)
          c.strokeStyle = PALETTE_CSS.amber
          c.globalAlpha = quality.rich ? 0.25 + (0.75 * (i + 1)) / segs : 1
          c.beginPath()
          c.moveTo(pa.x, pa.y)
          c.lineTo(pb.x, pb.y)
          c.stroke()
        }
        c.globalAlpha = 1
        c.shadowBlur = 0
        c.restore()

        // Strobe: equal time steps give equal horizontal gaps.
        if (showStrobe) {
          for (let i = 1; i <= 12; i += 1) {
            const ts = (s.flightTime * i) / 12
            if (ts > flown + 1e-6) break
            const pos = positionAt(s, ts)
            const px = worldToPx(s, pos.x, pos.y)
            c.strokeStyle = 'rgba(34, 211, 238, 0.35)'
            c.lineWidth = 1
            c.beginPath()
            c.moveTo(px.x, px.y)
            c.lineTo(px.x, GROUND_Y)
            c.stroke()
            c.fillStyle = PALETTE_CSS.cyan
            c.beginPath()
            c.arc(px.x, px.y, 3, 0, Math.PI * 2)
            c.fill()
            c.beginPath()
            c.arc(px.x, GROUND_Y, 2.2, 0, Math.PI * 2)
            c.fill()
          }
        }

        // Apex and range guides
        c.strokeStyle = 'rgba(167, 139, 250, 0.7)'
        c.lineWidth = 1.2
        c.setLineDash([3, 4])
        c.beginPath()
        c.moveTo(apex.x, apex.y)
        c.lineTo(apex.x, GROUND_Y)
        c.stroke()
        c.setLineDash([])
        label(c, `H = ${fmt(s.maxHeight)} m`, apex.x + 6, Math.min(GROUND_Y - 8, (apex.y + GROUND_Y) / 2), PALETTE_CSS.violet)

        c.strokeStyle = PALETTE_CSS.emerald
        c.lineWidth = 2
        c.beginPath()
        c.moveTo(ORIGIN_X, GROUND_Y + 14)
        c.lineTo(landing.x, GROUND_Y + 14)
        c.moveTo(ORIGIN_X, GROUND_Y + 9)
        c.lineTo(ORIGIN_X, GROUND_Y + 19)
        c.moveTo(landing.x, GROUND_Y + 9)
        c.lineTo(landing.x, GROUND_Y + 19)
        c.stroke()
        label(c, `R = ${fmt(s.range)} m`, (ORIGIN_X + landing.x) / 2, GROUND_Y + 30, PALETTE_CSS.emerald, 'center')

        // Launcher
        c.save()
        c.translate(origin.x, origin.y)
        c.rotate(-s.rad)
        c.fillStyle = '#64748b'
        c.strokeStyle = '#cbd5e1'
        c.lineWidth = 1.5
        c.beginPath()
        c.roundRect(-6, -7, 40, 14, 5)
        c.fill()
        c.stroke()
        c.restore()
        c.fillStyle = '#475569'
        c.beginPath()
        c.arc(origin.x, origin.y, 10, 0, Math.PI * 2)
        c.fill()
        c.strokeStyle = '#cbd5e1'
        c.stroke()

        // Angle arc
        c.strokeStyle = 'rgba(251, 191, 36, 0.8)'
        c.lineWidth = 1.5
        c.beginPath()
        c.arc(origin.x, origin.y, 26, -s.rad, 0)
        c.stroke()
        label(c, `${Math.round(s.angleDeg)}°`, origin.x + 30, origin.y - 6, PALETTE_CSS.amber)

        // Impact
        const sinceLanding = t - s.flightTime
        if (sinceLanding > 0) {
          const k = Math.min(1, sinceLanding / LAND_HOLD_S)
          c.strokeStyle = `rgba(251, 191, 36, ${0.8 * (1 - k)})`
          c.lineWidth = 2
          c.beginPath()
          c.ellipse(landing.x, GROUND_Y, 6 + 34 * k, 2 + 8 * k, 0, 0, Math.PI * 2)
          c.stroke()
          if (!reducedMotion) {
            c.fillStyle = `rgba(187, 247, 208, ${0.9 * (1 - k)})`
            for (let i = 0; i < dustCount; i += 1) {
              const ang = (Math.PI * (i + 0.5)) / dustCount
              const sp = 34 + ((i * 37) % 26)
              const dx = Math.cos(ang) * sp * sinceLanding
              const dy = -Math.sin(ang) * sp * sinceLanding + 70 * sinceLanding * sinceLanding
              if (dy > 0) continue
              c.beginPath()
              c.arc(landing.x + dx, GROUND_Y + dy, 1.6, 0, Math.PI * 2)
              c.fill()
            }
          }
        }

        // Projectile and velocity vectors
        const pos = positionAt(s, t)
        const ball = worldToPx(s, pos.x, pos.y)
        if (sinceLanding <= 0) {
          const tipX = ball.x + s.vx * VEC_PX
          const tipY = ball.y - pos.vy * VEC_PX
          if (showComponents) {
            drawArrow(c, ball.x, ball.y, tipX, ball.y, PALETTE_CSS.cyan, 2, true)
            drawArrow(c, ball.x, ball.y, ball.x, tipY, PALETTE_CSS.rose, 2, true)
            label(c, `vₓ ${fmt(s.vx)}`, tipX + 4, ball.y + 14, PALETTE_CSS.cyan)
            label(c, `v_y ${fmt(pos.vy)}`, ball.x - 6, tipY + (pos.vy >= 0 ? -6 : 14), PALETTE_CSS.rose, 'right')
          }
          drawArrow(c, ball.x, ball.y, tipX, tipY, PALETTE_CSS.white, 2.6)
        }
        if (quality.glow) {
          c.shadowColor = PALETTE_CSS.amber
          c.shadowBlur = 16
        }
        if (quality.rich) {
          const shade = c.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, 8)
          shade.addColorStop(0, '#fef3c7')
          shade.addColorStop(1, PALETTE_CSS.amber)
          c.fillStyle = shade
        } else {
          c.fillStyle = PALETTE_CSS.amber
        }
        c.beginPath()
        c.arc(ball.x, ball.y, 7, 0, Math.PI * 2)
        c.fill()
        c.shadowBlur = 0

        // Header
        const world = GRAVITIES[s.gravity] ?? GRAVITIES[0]
        label(
          c,
          `${world.name}: g = ${world.g} m/s²   ·   t = ${fmt(Math.min(t, s.flightTime), 2)} s of ${fmt(s.flightTime, 2)} s`,
          VIEW_W - 14,
          62,
          '#e2e8f0',
          'right',
        )
      },
      readouts: (p) => {
        const s = view(p)
        return [
          { label: 'Range R', value: `${fmt(s.range)} m` },
          { label: 'Max height H', value: `${fmt(s.maxHeight)} m` },
          { label: 'Time of flight T', value: `${fmt(s.flightTime, 2)} s` },
          { label: 'vₓ (constant)', value: `${fmt(s.vx)} m/s` },
          { label: 'v_y at launch', value: `${fmt(s.vy0)} m/s` },
          { label: 'Impact speed', value: `${fmt(s.impactSpeed)} m/s` },
        ]
      },
      metrics: (p) => {
        const s = view(p)
        return {
          v0: s.v0,
          angleDeg: s.angleDeg,
          g: s.g,
          range: s.range,
          maxHeight: s.maxHeight,
          flightTime: s.flightTime,
          vx: s.vx,
          vy0: s.vy0,
          impactSpeed: s.impactSpeed,
        }
      },
    }
  },
}

export default function ProjectileMotion2D() {
  return <Interactive2DViewer model={projectileMotion2dModel} />
}
