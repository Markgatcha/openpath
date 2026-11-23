import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import { makeTextSprite, polyline, type Hotspot, type ModelDefinition, type Params } from '../engine'

const SYNODIC_DAYS = 29.53
const ORBIT_R = 3.2
const EARTH_R = 0.55
const MOON_R = 0.2
/** The real tilt is about 5°. It is drawn larger because the scene is not to scale. */
const DRAWN_TILT_RAD = (16 * Math.PI) / 180
const SUN_DIR = new THREE.Vector3(1, 0, 0)

const PHASE_NAMES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const

function wrapDay(day: number): number {
  return ((day % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS
}

function phaseName(day: number): string {
  const frac = wrapDay(day) / SYNODIC_DAYS
  // The four named instants get a narrow window; the four phases between them fill the rest.
  const window = 0.035
  if (frac < window || frac > 1 - window) return PHASE_NAMES[0]
  if (Math.abs(frac - 0.25) < window) return PHASE_NAMES[2]
  if (Math.abs(frac - 0.5) < window) return PHASE_NAMES[4]
  if (Math.abs(frac - 0.75) < window) return PHASE_NAMES[6]
  if (frac < 0.25) return PHASE_NAMES[1]
  if (frac < 0.5) return PHASE_NAMES[3]
  if (frac < 0.75) return PHASE_NAMES[5]
  return PHASE_NAMES[7]
}

function formatClock(hours: number): string {
  const h = ((hours % 24) + 24) % 24
  const whole = Math.floor(h)
  const mins = Math.round((h - whole) * 60)
  const hh = mins === 60 ? (whole + 1) % 24 : whole
  const mm = mins === 60 ? 0 : mins
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function computeMoon(p: Params, dayOverride?: number) {
  const day = wrapDay(dayOverride ?? p.moonDay ?? 3)
  const theta = (day / SYNODIC_DAYS) * Math.PI * 2
  const tilted = (p.orbitTilt ?? 1) >= 0.5
  const tilt = tilted ? DRAWN_TILT_RAD : 0
  // New Moon sits between Earth and the Sun (+X); the Moon then moves anticlockwise seen from above.
  const x = ORBIT_R * Math.cos(theta) * Math.cos(tilt)
  const y = -ORBIT_R * Math.cos(theta) * Math.sin(tilt)
  const z = -ORBIT_R * Math.sin(theta)
  const illum = ((1 - Math.cos(theta)) / 2) * 100
  // Earth's shadow is drawn as a cylinder pointing away from the Sun.
  const eclipsed = x < 0 && Math.hypot(y, z) < EARTH_R - MOON_R * 0.5 ? 1 : 0
  // A new Moon rises with the Sun (about 06:00); each day it rises roughly 49 minutes later.
  const riseHour = 6 + (day / SYNODIC_DAYS) * 24
  return { day, theta, tilted, x, y, z, illum, eclipsed, riseHour, waxing: theta < Math.PI }
}

function makeRockTexture(size: number, base: string, spots: string[], count: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size * 2
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // A fixed seed keeps the surface identical on every rebuild.
    let seed = 1337
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < count; i += 1) {
      const r = (0.01 + rand() * 0.05) * size
      const cx = rand() * canvas.width
      const cy = (0.1 + rand() * 0.8) * size
      ctx.fillStyle = spots[i % spots.length]
      ctx.globalAlpha = 0.25 + rand() * 0.4
      ctx.beginPath()
      ctx.ellipse(cx, cy, r * 1.3, r, rand() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Lit by the Sun direction only, so the viewer's own lights cannot wash out the phases. */
function makeSunlitMaterial(map: THREE.Texture, nightColor: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uSunDir: { value: SUN_DIR.clone() },
      uNight: { value: new THREE.Color(nightColor) },
      uTint: { value: new THREE.Color(1, 1, 1) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uSunDir;
      uniform vec3 uNight;
      uniform vec3 uTint;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vec3 base = texture2D(uMap, vUv).rgb;
        float lit = smoothstep(-0.04, 0.12, dot(normalize(vWorldNormal), uSunDir));
        vec3 day = base * uTint;
        vec3 night = base * uNight;
        gl_FragColor = vec4(mix(night, day, lit), 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
}

export const moonPhases3dModel: ModelDefinition = {
  id: 'moon-phases-3d',
  title: 'Moon Phases & Eclipses',
  subtitle:
    'Follow the Moon round the Earth and watch the view from the ground change from new to full and back, then find out why there is not an eclipse every month.',
  camera: [0, 5.2, 7.4],
  hudTitle: 'The Moon as seen from Earth',
  params: [
    {
      kind: 'slider',
      id: 'moonDay',
      label: 'Days since new Moon',
      min: 0,
      max: 29.5,
      step: 0.1,
      initial: 3,
      format: (v) => `${v.toFixed(1)} d`,
    },
    {
      kind: 'slider',
      id: 'orbitRate',
      label: 'Orbit speed',
      min: 0,
      max: 6,
      step: 0.5,
      initial: 1.5,
      format: (v) => `${v} d/s`,
    },
    {
      kind: 'toggle',
      id: 'orbitTilt',
      label: 'Tilt the Moon’s orbit (5° in reality, drawn larger)',
      initial: true,
    },
    {
      kind: 'toggle',
      id: 'showRays',
      label: 'Show sunlight and Earth’s shadow',
      initial: true,
    },
  ],
  challenges: [
    {
      id: 'phases-are-not-earths-shadow',
      title: 'Is It Earth’s Shadow?',
      setupParams: { moonDay: 3, orbitRate: 0, orbitTilt: 1, showRays: 1 },
      predict: {
        prompt: 'A crescent Moon is mostly dark. What makes the dark part dark?',
        options: [
          'It is the Moon’s own night side: the half facing away from the Sun, turned partly towards us',
          'Earth’s shadow is covering that part of the Moon',
          'Clouds in Earth’s atmosphere hide that part',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep the orbit paused and drag "Days since new Moon" to the full Moon (at least 98% lit). Check that Earth’s shadow passes below the Moon and misses it.',
        evaluate: (_p, m) => ({
          passed: m.illum >= 98 && m.eclipsed === 0,
          feedback: m.eclipsed
            ? `Day ${m.day.toFixed(1)}: the Moon is passing through Earth’s shadow (a lunar eclipse).`
            : `Day ${m.day.toFixed(1)}: ${m.illum.toFixed(0)}% lit, outside Earth’s shadow.`,
        }),
      },
      explain:
        'The Sun always lights half of the Moon. A phase is simply how much of that lit half is turned towards Earth. At full Moon the Moon is on the far side of Earth from the Sun, where the shadow points, and it is still fully lit because the tilted orbit usually carries it above or below the shadow.',
      misconceptionTag: 'moon-phases-caused-by-earth-shadow',
    },
    {
      id: 'no-eclipse-every-month',
      title: 'Why Is There No Eclipse Every Month?',
      setupParams: { moonDay: 10, orbitRate: 0, orbitTilt: 1, showRays: 1 },
      predict: {
        prompt: 'Suppose the Moon’s orbit were not tilted at all. How often would the Moon pass through Earth’s shadow?',
        options: [
          'At every full Moon, about once a month',
          'Never',
          'Exactly once a year',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Switch off the orbit tilt, then move to the full Moon (about day 14.8) and watch the Moon enter Earth’s shadow and turn dark red.',
        evaluate: (p, m) => ({
          passed: (p.orbitTilt ?? 1) < 0.5 && m.eclipsed === 1,
          feedback: `Tilt ${(p.orbitTilt ?? 1) >= 0.5 ? 'on' : 'off'}, day ${m.day.toFixed(1)}: ${m.eclipsed ? 'the Moon is in Earth’s shadow (lunar eclipse).' : 'the Moon is outside Earth’s shadow.'}`,
        }),
      },
      explain:
        'With no tilt, the Sun, Earth and Moon would line up exactly at every full Moon, giving a lunar eclipse every month. The real orbit is tilted by about 5°, so most months the Moon passes above or below the shadow. Eclipses happen only when a full or new Moon falls close to the points where the two orbits cross, which is roughly twice a year.',
      misconceptionTag: 'eclipse-every-month',
    },
  ],
  build: ({ scene, quality }, initial) => {
    const texSize = quality.profile.detail >= 1 ? 512 : 256
    const moonTex = makeRockTexture(texSize, '#b8bcc4', ['#8b9099', '#9da2ab', '#d5d8de'], quality.count(160))
    const earthTex = makeRockTexture(texSize, '#1d4ed8', ['#15803d', '#166534', '#a16207', '#e2e8f0'], quality.count(90))

    const earthMat = makeSunlitMaterial(earthTex, 0x0b1026)
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_R, quality.segments(48), quality.segments(32)),
      earthMat,
    )
    scene.add(earth)

    // Earthshine keeps the Moon's night side faintly visible, as it is in the real sky.
    const moonMat = makeSunlitMaterial(moonTex, 0x1a1d24)
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_R, quality.segments(40), quality.segments(28)),
      moonMat,
    )
    scene.add(moon)

    const orbitPoints = (tilted: number): THREE.Vector3[] => {
      const pts: THREE.Vector3[] = []
      const n = quality.segments(96)
      for (let i = 0; i <= n; i += 1) {
        const m = computeMoon({ orbitTilt: tilted }, (i / n) * SYNODIC_DAYS)
        pts.push(new THREE.Vector3(m.x, m.y, m.z))
      }
      return pts
    }
    const tiltedOrbit = polyline(orbitPoints(1), 0x94a3b8, 0.55)
    const flatOrbit = polyline(orbitPoints(0), 0x94a3b8, 0.55)
    scene.add(tiltedOrbit, flatOrbit)

    const lightGroup = new THREE.Group()
    for (let i = -2; i <= 2; i += 1) {
      const z = i * 1.15
      lightGroup.add(
        polyline([new THREE.Vector3(6.6, 0, z), new THREE.Vector3(4.3, 0, z)], 0xfbbf24, 0.6),
        polyline(
          [new THREE.Vector3(4.6, 0, z - 0.14), new THREE.Vector3(4.3, 0, z), new THREE.Vector3(4.6, 0, z + 0.14)],
          0xfbbf24,
          0.6,
        ),
      )
    }
    const sunLabel = makeTextSprite('Sunlight', '#fde68a', 0.6)
    sunLabel.position.set(5.5, 0.55, 0)
    lightGroup.add(sunLabel)

    const shadowLength = 4.6
    const shadow = new THREE.Mesh(
      new THREE.CylinderGeometry(EARTH_R, EARTH_R, shadowLength, quality.segments(32), 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    shadow.rotation.z = Math.PI / 2
    shadow.position.set(-shadowLength / 2, 0, 0)
    lightGroup.add(shadow)
    scene.add(lightGroup)

    const starCount = quality.count(500)
    const starPositions = new Float32Array(starCount * 3)
    let seed = 4242
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < starCount; i += 1) {
      const u = rand() * 2 - 1
      const a = rand() * Math.PI * 2
      const r = 26 + rand() * 6
      const s = Math.sqrt(1 - u * u)
      starPositions.set([r * s * Math.cos(a), r * u, r * s * Math.sin(a)], i * 3)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.8 }),
      ),
    )

    const markers: Array<[string, number]> = [
      ['New', 0],
      ['First quarter', SYNODIC_DAYS / 4],
      ['Full', SYNODIC_DAYS / 2],
      ['Last quarter', (SYNODIC_DAYS * 3) / 4],
    ]
    const markerSprites = markers.map(([text, day]) => {
      const sprite = makeTextSprite(text, '#cbd5e1', 0.5)
      scene.add(sprite)
      return { sprite, day }
    })

    const LIT = new THREE.Color(1, 1, 1)
    const ECLIPSED = new THREE.Color(0.5, 0.15, 0.08)
    let simDay = initial.moonDay ?? 3
    let lastSliderDay = simDay
    let spin = 0

    const applyGeometry = (p: Params) => {
      const m = computeMoon(p, simDay)
      moon.position.set(m.x, m.y, m.z)
      // Tidal locking: the same face always points at Earth.
      moon.rotation.y = m.theta
      tiltedOrbit.visible = m.tilted
      flatOrbit.visible = !m.tilted
      lightGroup.visible = (p.showRays ?? 1) >= 0.5
      const depth = m.x < 0 ? THREE.MathUtils.clamp((EARTH_R - Math.hypot(m.y, m.z)) / MOON_R, 0, 1) : 0
      ;(moonMat.uniforms.uTint.value as THREE.Color).copy(LIT).lerp(ECLIPSED, depth)
      for (const { sprite, day } of markerSprites) {
        const at = computeMoon(p, day)
        sprite.position.set(at.x * 1.22, at.y * 1.22 + 0.3, at.z * 1.22)
      }
    }
    applyGeometry(initial)

    const hotspots: Hotspot[] = [
      {
        id: 'lit-half',
        label: 'Always half lit',
        title: 'The Sun Always Lights Half the Moon',
        body: 'Whatever the phase, the half of the Moon facing the Sun is in daylight and the other half is in night. Orbit the camera to check: the bright half always faces the sunlight arrows.',
        position: (t) => t.copy(moon.position).add(new THREE.Vector3(0, 0.42, 0)),
      },
      {
        id: 'observer',
        label: 'View from Earth',
        title: 'A Phase Is a Viewing Angle',
        body: 'From Earth we look at the Moon from a different direction each night. At new Moon we face its night side; at full Moon we face its day side; in between we see part of each. The panel shows the view from the ground.',
        position: (t) => t.set(0, EARTH_R + 0.3, 0),
      },
      {
        id: 'shadow',
        label: 'Earth’s shadow',
        title: 'The Shadow Points Away from the Sun',
        body: 'Earth’s shadow only reaches the Moon when the Moon is directly behind Earth, which can only happen at full Moon. That is a lunar eclipse, and it is rare. The shadow has nothing to do with ordinary phases.',
        position: (t) => t.set(-2.2, EARTH_R + 0.2, 0),
        visible: () => lightGroup.visible,
      },
      {
        id: 'tilt',
        label: 'Tilted orbit',
        title: 'Why Eclipses Are Rare',
        body: 'The Moon’s orbit is tilted about 5° to Earth’s orbit around the Sun (drawn larger here). At most full Moons the Moon passes above or below Earth’s shadow, and at most new Moons its own shadow misses Earth.',
        position: (t) => {
          const at = computeMoon({ orbitTilt: 1 }, SYNODIC_DAYS / 2)
          return t.set(at.x, at.y + 0.35, at.z)
        },
        visible: () => tiltedOrbit.visible,
      },
    ]

    const drawPhaseDisc = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, p: Params) => {
      const m = computeMoon(p, simDay)
      ctx.fillStyle = '#1f2937'
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      // Seen from the northern hemisphere the waxing Moon is lit on the right.
      const side = m.waxing ? 1 : -1
      const k = Math.cos(m.theta)
      ctx.fillStyle = m.eclipsed ? '#7f1d1d' : '#f1f5f9'
      ctx.beginPath()
      ctx.moveTo(cx, cy - r)
      for (let i = 1; i <= 24; i += 1) {
        const a = -Math.PI / 2 + (i / 24) * Math.PI
        ctx.lineTo(cx + side * r * Math.cos(a), cy + r * Math.sin(a))
      }
      for (let i = 1; i <= 24; i += 1) {
        const a = Math.PI / 2 - (i / 24) * Math.PI
        ctx.lineTo(cx + side * r * k * Math.cos(a), cy + r * Math.sin(a))
      }
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
      return m
    }

    return {
      hotspots,
      update: (p, dt) => {
        if ((p.moonDay ?? 3) !== lastSliderDay) {
          simDay = p.moonDay ?? 3
          lastSliderDay = simDay
        }
        if (dt > 0) {
          const rate = p.orbitRate ?? 1.5
          if (rate > 0) {
            simDay = wrapDay(simDay + dt * rate)
            p.moonDay = Math.min(29.5, Math.round(simDay * 10) / 10)
            lastSliderDay = p.moonDay
          }
          spin += dt * 0.9
          earth.rotation.y = spin
        }
        applyGeometry(p)
      },
      step: (p, dir) => {
        simDay = wrapDay(simDay + (dir * SYNODIC_DAYS) / 8)
        p.moonDay = Math.min(29.5, Math.round(simDay * 10) / 10)
        lastSliderDay = p.moonDay
        applyGeometry(p)
      },
      hudPlot: (ctx, w, h, p) => {
        ctx.clearRect(0, 0, w, h)
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'
        ctx.fillRect(0, 0, w, h)
        const r = Math.min(w * 0.22, h * 0.36)
        const m = drawPhaseDisc(ctx, w * 0.3, h * 0.5, r, p)
        ctx.fillStyle = '#e2e8f0'
        ctx.font = '600 12px system-ui, sans-serif'
        ctx.textBaseline = 'middle'
        const textX = w * 0.3 + r + 14
        ctx.fillText(m.eclipsed ? 'Lunar eclipse' : phaseName(simDay), textX, h * 0.5 - 16)
        ctx.fillStyle = '#94a3b8'
        ctx.font = '11px system-ui, sans-serif'
        ctx.fillText(m.eclipsed ? 'In Earth’s shadow' : `${m.illum.toFixed(0)}% lit`, textX, h * 0.5 + 2)
        ctx.fillText(`Day ${m.day.toFixed(1)}`, textX, h * 0.5 + 18)
      },
      readouts: (p) => {
        const m = computeMoon(p, simDay)
        return [
          { label: 'Phase', value: m.eclipsed ? 'Full Moon (eclipsed)' : phaseName(simDay) },
          // During an eclipse the face turned to us gets no direct sunlight, so a percentage would mislead.
          { label: 'Lit part we see', value: m.eclipsed ? 'In Earth’s shadow' : `${m.illum.toFixed(0)}%` },
          { label: 'Days since new Moon', value: `${m.day.toFixed(1)} of ${SYNODIC_DAYS}` },
          { label: 'Moonrise (approx.)', value: formatClock(m.riseHour) },
        ]
      },
      metrics: (p) => {
        const m = computeMoon(p, simDay)
        return { day: m.day, illum: m.illum, eclipsed: m.eclipsed, tilted: m.tilted ? 1 : 0 }
      },
      dispose: () => {
        moonTex.dispose()
        earthTex.dispose()
      },
    }
  },
}

export default function MoonPhases3D() {
  return <ModelViewer model={moonPhases3dModel} />
}
