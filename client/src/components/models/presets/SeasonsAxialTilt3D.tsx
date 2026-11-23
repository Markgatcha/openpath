import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import {
  PALETTE,
  arcPoints,
  makeTextSprite,
  polyline,
  setPolyline,
  type Hotspot,
  type ModelDefinition,
  type Params,
} from '../engine'

const A_ORBIT = 5.4
const DAYS_PER_YEAR = 365

function computeSeasons(p: Params) {
  const tiltDeg = p.axialTilt ?? 23.5
  const tiltRad = (tiltDeg * Math.PI) / 180
  const day = ((p.orbitalDay ?? 172) % DAYS_PER_YEAR + DAYS_PER_YEAR) % DAYS_PER_YEAR
  const ecc = (p.eccentric ?? 0) >= 0.5 ? 0.26 : 0.017
  const latDeg = p.latDeg ?? 40

  // Jan 3 (day 3) = Perihelion (angle = 0)
  const theta = ((day - 3) / DAYS_PER_YEAR) * Math.PI * 2
  const bOrbit = A_ORBIT * Math.sqrt(1 - ecc * ecc)
  const earthX = -A_ORBIT * Math.cos(theta) + A_ORBIT * ecc
  const earthZ = bOrbit * Math.sin(theta)
  const distAu = Math.hypot(earthX, earthZ) / A_ORBIT

  // Solstice anchor at day 172 (June 21)
  const thetaSol = ((172 - 3) / DAYS_PER_YEAR) * Math.PI * 2
  const sx172 = -A_ORBIT * Math.cos(thetaSol) + A_ORBIT * ecc
  const sz172 = bOrbit * Math.sin(thetaSol)
  const len172 = Math.hypot(sx172, sz172) || 1
  const dirToSun172X = -sx172 / len172
  const dirToSun172Z = -sz172 / len172

  const nHat = new THREE.Vector3(
    dirToSun172X * Math.sin(tiltRad),
    Math.cos(tiltRad),
    dirToSun172Z * Math.sin(tiltRad),
  ).normalize()

  const toSun = new THREE.Vector3(-earthX, 0, -earthZ).normalize()
  const sinDecl = Math.max(-1, Math.min(1, toSun.dot(nHat)))
  const declDeg = (Math.asin(sinDecl) * 180) / Math.PI

  // Solar noon intensity at observer latitude phi: cos(zenith angle) = cos(phi - delta) / dist^2
  const zenithDeg = Math.abs(latDeg - declDeg)
  const beamCos = Math.max(0.05, Math.cos((zenithDeg * Math.PI) / 180))
  const relFlux = (beamCos / (distAu * distAu)) * 100
  const dayLengthHrs = Math.max(
    0,
    Math.min(
      24,
      (24 / Math.PI) *
        Math.acos(
          Math.max(
            -1,
            Math.min(1, -Math.tan((latDeg * Math.PI) / 180) * Math.tan((declDeg * Math.PI) / 180)),
          ),
        ),
    ),
  )

  return {
    tiltDeg,
    tiltRad,
    day,
    ecc,
    bOrbit,
    latDeg,
    earthX,
    earthZ,
    distAu,
    nHat,
    toSun,
    declDeg,
    beamCos,
    relFlux,
    dayLengthHrs,
  }
}

function makeEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Deep ocean
    ctx.fillStyle = '#0c4a6e'
    ctx.fillRect(0, 0, 512, 256)
    // Stylized continents
    ctx.fillStyle = '#22c55e'
    const blobs: Array<[number, number, number, number]> = [
      [115, 78, 44, 30],
      [140, 155, 28, 42],
      [270, 72, 65, 32],
      [285, 130, 32, 46],
      [395, 165, 26, 22],
    ]
    for (const [bx, by, rx, ry] of blobs) {
      ctx.beginPath()
      ctx.ellipse(bx, by, rx, ry, 0.2, 0, Math.PI * 2)
      ctx.fill()
    }
    // Polar ice caps
    ctx.fillStyle = '#e2e8f0'
    ctx.fillRect(0, 0, 512, 18)
    ctx.fillRect(0, 238, 512, 18)
    // Equator + Tropics lines
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 128)
    ctx.lineTo(512, 128)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)'
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(0, 95)
    ctx.lineTo(512, 95)
    ctx.moveTo(0, 161)
    ctx.lineTo(512, 161)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export const seasonsAxialTilt3dModel: ModelDefinition = {
  id: 'seasons-axial-tilt-3d',
  title: 'Seasons, Axial Tilt & Lunar Geometry',
  subtitle:
    'Explore why Earth is closest to the Sun in January yet cold in the north, how axial tilt spreads solar beam energy, and why Moon phases differ from eclipses.',
  camera: [0, 7.2, 10.5],
  hudTitle: 'Noon Insolation vs Day of Year',
  params: [
    {
      kind: 'slider',
      id: 'axialTilt',
      label: 'Axial tilt ε (°)',
      min: 0,
      max: 45,
      step: 0.5,
      initial: 23.5,
      unit: '°',
    },
    {
      kind: 'slider',
      id: 'orbitalDay',
      label: 'Day of Year (0 = Jan 1)',
      min: 0,
      max: 364,
      step: 2,
      initial: 172,
    },
    {
      kind: 'slider',
      id: 'latDeg',
      label: 'Observer Latitude (°)',
      min: -66,
      max: 66,
      step: 2,
      initial: 40,
      format: (v) => `${Math.abs(v)}°${v >= 0 ? 'N' : 'S'}`,
    },
    {
      kind: 'slider',
      id: 'orbitSpeed',
      label: 'Orbital animation rate',
      min: 0,
      max: 60,
      step: 5,
      initial: 10,
      format: (v) => `${v} d/s`,
    },
    {
      kind: 'toggle',
      id: 'eccentric',
      label: 'Exaggerate eccentricity (e = 0.26)',
      initial: false,
    },
    {
      kind: 'toggle',
      id: 'showMoon',
      label: 'Show Moon orbit & Earth umbra',
      initial: true,
    },
  ],
  challenges: [
    {
      id: 'perihelion-winter-paradox',
      title: 'The Perihelion Winter Paradox',
      setupParams: { axialTilt: 23.5, orbitalDay: 3, latDeg: 40, orbitSpeed: 0, eccentric: 1 },
      predict: {
        prompt:
          'Even with orbit eccentricity exaggerated, Earth is CLOSEST to the Sun on Day 3 (Jan 3 Perihelion). Why is 40°N experiencing winter anyway?',
        options: [
          'The Northern axis leans away from the Sun, spreading solar beams thinly over oblique ground',
          'Earth spins slower in January, generating less friction heat',
          'The Moon blocks solar radiation across January',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction:
          'Keep orbit paused and advance Day of Year from Perihelion (Day 3) to June Solstice (~Day 172 ± 6) where Earth is FARTHER from the Sun yet Northern noon flux peaks >= 85.',
        evaluate: (_p, m) => ({
          passed: Math.abs(m.day - 172) <= 8 && m.relFlux >= 85 && m.distAu > 1.0,
          feedback: `Day ${Math.round(m.day)}: distance = ${m.distAu.toFixed(2)} AU, Noon Flux = ${m.relFlux.toFixed(0)}%.`,
        }),
      },
      explain:
        'Orbital distance varies by only ±1.7% (tiny ~6% flux swing), whereas a 23.5° tilt shifts Northern sun elevation by 47° between winter and summer — changing beam concentration AND day length dramatically!',
      misconceptionTag: 'seasons-caused-by-earth-sun-distance',
    },
    {
      id: 'zero-tilt-no-seasons',
      title: 'What If Axial Tilt Were 0°?',
      setupParams: { axialTilt: 23.5, orbitalDay: 172, latDeg: 40, orbitSpeed: 0, eccentric: 0 },
      predict: {
        prompt:
          'If you straighten Earth’s spin axis to 0° (perpendicular to the orbital plane), what happens to day length and seasonal solar angle across the whole year?',
        options: [
          'Every latitude gets eternal equinox: 12.0 h days year-round with zero seasonal change',
          'Equator freezes and poles stay hot',
          'Seasons still reverse between January and July because of orbit motion',
        ],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Slide Axial tilt ε to 0° and verify Declination stays 0.0° and Day Length = 12.0 h.',
        evaluate: (p, m) => ({
          passed: p.axialTilt <= 0.5 && Math.abs(m.declDeg) < 0.5 && Math.abs(m.dayLengthHrs - 12) < 0.2,
          feedback: `Tilt = ${p.axialTilt.toFixed(1)}°, Sun Declination = ${m.declDeg.toFixed(1)}°, Day = ${m.dayLengthHrs.toFixed(1)} h.`,
        }),
      },
      explain:
        'With 0° obliquity, the subsolar ray stays locked onto the Equator year-round, producing perpetual equinox (12 h days everywhere) and eliminating tilt-driven seasons.',
      misconceptionTag: 'seasons-without-axial-tilt',
    },
  ],
  build: ({ scene }, initial) => {
    // Sun at origin
    const sunGeo = new THREE.SphereGeometry(0.68, 32, 32)
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfde047 })
    const sunMesh = new THREE.Mesh(sunGeo, sunMat)
    scene.add(sunMesh)

    const sunLight = new THREE.PointLight(0xfffbeb, 4.5, 40, 0.4)
    scene.add(sunLight)

    const sunLabel = makeTextSprite('Sun', '#fde047', 0.48)
    sunLabel.position.set(0, 1.05, 0)
    scene.add(sunLabel)

    const periSprite = makeTextSprite('Perihelion (Jan 3)', '#38bdf8', 0.42)
    const aphSprite = makeTextSprite('Aphelion (Jul 4)', '#fb7185', 0.42)
    scene.add(periSprite, aphSprite)

    // Orbit ellipse line
    const orbitPts = Array.from({ length: 97 }, (_, i) => {
      const th = (i / 96) * Math.PI * 2
      return new THREE.Vector3(-A_ORBIT * Math.cos(th), 0, A_ORBIT * Math.sin(th))
    })
    const orbitLine = polyline(orbitPts, PALETTE.slate, 0.55)
    scene.add(orbitLine)

    // Earth container positioned along orbit
    const earthRoot = new THREE.Group()
    scene.add(earthRoot)

    // Earth tilt container (oriented to nHat)
    const tiltGroup = new THREE.Group()
    earthRoot.add(tiltGroup)

    const earthTex = makeEarthTexture()
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 32, 24),
      new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.72, metalness: 0.05 }),
    )
    tiltGroup.add(earthMesh)

    // Axis pole rod + N/S caps
    const poleRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.85, 12),
      new THREE.MeshBasicMaterial({ color: PALETTE.amber }),
    )
    tiltGroup.add(poleRod)
    const nLabel = makeTextSprite('N', '#fbbf24', 0.34)
    nLabel.position.set(0, 1.08, 0)
    tiltGroup.add(nLabel)

    // Observer latitude ring indicator on tilted globe
    const latRing = polyline(
      arcPoints(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), 0.57, 24),
      PALETTE.rose,
      0.9,
    )
    tiltGroup.add(latRing)

    // Incoming Sun beam indicator arrow pointing toward Earth's sunlit side
    const beamGeo = new THREE.CylinderGeometry(0.11, 0.11, 2.2, 16)
    beamGeo.rotateZ(Math.PI / 2)
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.36,
    })
    const beamMesh = new THREE.Mesh(beamGeo, beamMat)
    earthRoot.add(beamMesh)

    // Translucent Earth Umbra Shadow Cone extending strictly away from Sun
    const umbraGeo = new THREE.ConeGeometry(0.54, 3.0, 24, 1, true)
    umbraGeo.rotateZ(-Math.PI / 2)
    umbraGeo.translate(1.5, 0, 0)
    const umbraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const umbraMesh = new THREE.Mesh(umbraGeo, umbraMat)
    earthRoot.add(umbraMesh)

    // Orbiting Moon + 5° inclined orbital ring
    const moonRingPts = Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2
      return new THREE.Vector3(Math.cos(a) * 1.45, Math.sin(a) * 0.14, Math.sin(a) * 1.45)
    })
    const moonOrbitRing = polyline(moonRingPts, PALETTE.cyan, 0.4)
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 }),
    )
    earthRoot.add(moonOrbitRing, moonMesh)

    let simDay = initial.orbitalDay ?? 172
    let lastSliderDay = simDay
    let spinAngle = 0

    const applyGeometry = (p: Params) => {
      const s = computeSeasons({ ...p, orbitalDay: simDay })
      earthRoot.position.set(s.earthX, 0, s.earthZ)

      // Align tiltGroup local +Y to world nHat
      tiltGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s.nHat)

      // Update latitude ring on Earth surface
      const phi = (s.latDeg * Math.PI) / 180
      const rr = Math.cos(phi) * 0.56
      const ry = Math.sin(phi) * 0.56
      const ringPts: THREE.Vector3[] = []
      for (let i = 0; i <= 24; i += 1) {
        const a = (i / 24) * Math.PI * 2
        ringPts.push(new THREE.Vector3(Math.cos(a) * rr, ry, Math.sin(a) * rr))
      }
      setPolyline(latRing, ringPts)

      // Orbit ellipse points & labels
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 96; i += 1) {
        const th = (i / 96) * Math.PI * 2
        pts.push(new THREE.Vector3(-A_ORBIT * Math.cos(th) + A_ORBIT * s.ecc, 0, s.bOrbit * Math.sin(th)))
      }
      setPolyline(orbitLine, pts)
      periSprite.position.set(-A_ORBIT * (1 - s.ecc), 0.72, 0)
      aphSprite.position.set(A_ORBIT * (1 + s.ecc), 0.72, 0)

      // Orient beam (from Sun toward Earth) & umbra (away from Sun)
      const away = s.toSun.clone().negate()
      umbraMesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), away)
      beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), away)
      beamMesh.position.copy(s.toSun).multiplyScalar(1.65)
      beamMesh.position.y = Math.sin(phi) * 0.25

      const showM = (p.showMoon ?? 1) >= 0.5
      moonOrbitRing.visible = showM
      moonMesh.visible = showM
      umbraMesh.visible = showM
      if (showM) {
        const lunarPhase = ((simDay / 29.53) % 1) * Math.PI * 2
        moonMesh.position.set(Math.cos(lunarPhase) * 1.45, Math.sin(lunarPhase) * 0.14, Math.sin(lunarPhase) * 1.45)
      }
    }

    applyGeometry(initial)

    const hotspots: Hotspot[] = [
      {
        id: 'tilt-axis',
        label: '23.5° Spin Axis',
        title: 'Fixed Space Orientation of Tilt Axis',
        body: 'Earth’s axis keeps pointing the same way in inertial space all year. Around June 21 the Northern Hemisphere leans toward the Sun; around Dec 21 it leans away.',
        position: (t) => t.copy(earthRoot.position).add(new THREE.Vector3(0, 1.05, 0)),
      },
      {
        id: 'perihelion',
        label: 'Jan 3 Perihelion',
        title: 'Closest to the Sun in Northern Winter!',
        body: 'Perihelion occurs around Jan 3 (~0.983 AU). Distance changes solar input by only ~6% across the year — axial tilt, not distance, drives seasons.',
        position: (t) => t.copy(periSprite.position),
      },
      {
        id: 'umbra-cone',
        label: 'Moon vs Umbra',
        title: 'Moon Phases Are NOT Earth’s Shadow',
        body: 'Notice Moon’s 5° tilted orbit passes above/below Earth’s blue umbra cone almost every month. You see Moon phases from viewing angle to its sunlit half!',
        position: (t) => t.copy(earthRoot.position).add(moonMesh.position).add(new THREE.Vector3(0, 0.35, 0)),
        visible: () => moonMesh.visible,
      },
    ]

    return {
      hotspots,
      update: (p, dt) => {
        if ((p.orbitalDay ?? 172) !== lastSliderDay) {
          simDay = p.orbitalDay ?? 172
          lastSliderDay = simDay
        }
        if (dt > 0) {
          const speed = p.orbitSpeed ?? 10
          if (speed > 0) {
            simDay = (simDay + dt * speed) % DAYS_PER_YEAR
            p.orbitalDay = Math.round(simDay)
            lastSliderDay = p.orbitalDay
          }
          spinAngle += dt * 1.4
          earthMesh.rotation.y = spinAngle
        }
        applyGeometry(p)
      },
      step: (p, dir) => {
        simDay = ((simDay + dir * 30) % DAYS_PER_YEAR + DAYS_PER_YEAR) % DAYS_PER_YEAR
        p.orbitalDay = Math.round(simDay)
        lastSliderDay = p.orbitalDay
        applyGeometry(p)
      },
      hudPlot: (ctx, w, h, p) => {
        ctx.clearRect(0, 0, w, h)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'
        ctx.fillRect(0, 0, w, h)

        const padX = 10
        const padY = 10
        const pw = w - padX * 2
        const ph = h - padY * 2

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
        ctx.strokeRect(padX, padY, pw, ph)

        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 73; i += 1) {
          const d = (i / 73) * DAYS_PER_YEAR
          const f = computeSeasons({ ...p, orbitalDay: d }).relFlux
          const x = padX + (d / DAYS_PER_YEAR) * pw
          const y = padY + ph - (Math.min(130, f) / 130) * ph
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        const cur = computeSeasons({ ...p, orbitalDay: simDay })
        const cx = padX + (cur.day / DAYS_PER_YEAR) * pw
        const cy = padY + ph - (Math.min(130, cur.relFlux) / 130) * ph
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(cx, cy, 4, 0, Math.PI * 2)
        ctx.fill()
      },
      readouts: (p) => {
        const s = computeSeasons({ ...p, orbitalDay: simDay })
        return [
          { label: 'Orbital Distance', value: `${s.distAu.toFixed(3)} AU` },
          { label: 'Solar Declination', value: `${s.declDeg >= 0 ? '+' : ''}${s.declDeg.toFixed(1)}°` },
          { label: 'Noon Beam Flux', value: `${s.relFlux.toFixed(0)}%` },
          { label: 'Daylight Length', value: `${s.dayLengthHrs.toFixed(1)} h` },
        ]
      },
      metrics: (p) => {
        const s = computeSeasons({ ...p, orbitalDay: simDay })
        return {
          day: s.day,
          distAu: s.distAu,
          declDeg: s.declDeg,
          relFlux: s.relFlux,
          dayLengthHrs: s.dayLengthHrs,
        }
      },
    }
  },
}

export default function SeasonsAxialTilt3D() {
  return <ModelViewer model={seasonsAxialTilt3dModel} />
}
