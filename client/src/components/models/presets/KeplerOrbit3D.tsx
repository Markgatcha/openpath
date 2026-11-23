import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import {
  makeArrow,
  polyline,
  setPolyline,
  type Hotspot,
  type ModelDefinition,
  type Params,
  type SceneContext,
} from '../engine'

/**
 * Gravitational sandbox: a planet integrated with velocity Verlet under
 * an inverse-square force (GM = 1 in model units). The analytic ellipse
 * is drawn alongside so students can see the numeric orbit lock onto it.
 * Equal-time sectors make Kepler's second law visible; the readouts show
 * T²/a³ staying constant (Kepler's third law) as `a` changes.
 */

const GM = 1
const SECTORS = 8
const SECTOR_COLORS = [0x22d3ee, 0xa78bfa]

function ellipsePoints(a: number, e: number, segments = 160): THREE.Vector3[] {
  const b = a * Math.sqrt(1 - e * e)
  const c = a * e
  const out: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2
    out.push(new THREE.Vector3(a * Math.cos(t) - c, 0, b * Math.sin(t)))
  }
  return out
}

function build({ scene, palette }: SceneContext, params: Params) {
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 40, 28),
    new THREE.MeshBasicMaterial({ color: 0xfde047 }),
  )
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 32, 20),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.25 }),
  )
  sun.add(glow)
  sun.add(new THREE.PointLight(0xfff7d6, 30, 0, 1.6))
  scene.add(sun)

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 28, 20),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 }),
  )
  scene.add(planet)

  const grid = new THREE.PolarGridHelper(8, 16, 8, 64, 0x334155, 0x1e293b)
  scene.add(grid)

  const orbit = polyline(ellipsePoints(params.a, params.e), palette.slate, 0.6)
  scene.add(orbit)
  const trail = polyline(Array.from({ length: 120 }, () => new THREE.Vector3()), palette.cyan, 0.9)
  scene.add(trail)

  const velocityArrow = makeArrow(palette.emerald)
  const gravityArrow = makeArrow(palette.rose)
  scene.add(velocityArrow, gravityArrow)

  const focus2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 8),
    new THREE.MeshBasicMaterial({ color: palette.slate }),
  )
  scene.add(focus2)

  // Equal-time sector fans.
  const sectorGroup = new THREE.Group()
  scene.add(sectorGroup)
  const sectors: THREE.Mesh[] = []
  let sectorPoints: THREE.Vector3[] = []
  let sectorClock = 0
  let sectorIndex = 0

  const position = new THREE.Vector3()
  const velocity = new THREE.Vector3()
  const acceleration = new THREE.Vector3()
  const trailPoints: THREE.Vector3[] = []
  let key = ''
  let a = params.a
  let e = params.e
  let period = 0
  let orbitTime = 0

  const accel = (p: THREE.Vector3, out: THREE.Vector3) => {
    const r = Math.max(p.length(), 0.2)
    return out.copy(p).multiplyScalar(-GM / (r * r * r))
  }

  function clearSectors() {
    for (const mesh of sectors) {
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
      sectorGroup.remove(mesh)
    }
    sectors.length = 0
    sectorPoints = []
    sectorClock = 0
    sectorIndex = 0
  }

  function reset(p: Params) {
    a = p.a
    e = p.e
    const rp = a * (1 - e)
    position.set(rp, 0, 0)
    // Vis-viva at perihelion; motion along +z (counter-clockwise from above).
    velocity.set(0, 0, Math.sqrt((GM * (1 + e)) / rp))
    accel(position, acceleration)
    period = 2 * Math.PI * Math.sqrt((a * a * a) / GM)
    orbitTime = 0
    trailPoints.length = 0
    setPolyline(orbit, ellipsePoints(a, e))
    focus2.position.set(-2 * a * e, 0, 0)
    clearSectors()
  }

  function closeSector() {
    if (sectorPoints.length < 2) return
    const vertices: number[] = []
    for (let i = 0; i < sectorPoints.length - 1; i += 1) {
      const p0 = sectorPoints[i]
      const p1 = sectorPoints[i + 1]
      vertices.push(0, 0, 0, p0.x, 0, p0.z, p1.x, 0, p1.z)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: SECTOR_COLORS[sectorIndex % 2],
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    sectorGroup.add(mesh)
    sectors.push(mesh)
    if (sectors.length > SECTORS) {
      const old = sectors.shift()
      if (old) {
        old.geometry.dispose()
        ;(old.material as THREE.Material).dispose()
        sectorGroup.remove(old)
      }
    }
    sectorIndex += 1
    sectorPoints = [position.clone()]
  }

  const hotspots: Hotspot[] = [
    {
      id: 'sun',
      label: 'Sun (focus)',
      title: 'Kepler’s first law',
      body: 'Every planet moves on an ellipse with the Sun at one focus — not the center. The empty grey dot marks the other focus. At e = 0 the two foci merge and the orbit becomes a circle.',
      position: (t) => t.set(0, 0.55, 0),
    },
    {
      id: 'planet',
      label: 'Planet',
      title: 'Velocity and gravity vectors',
      body: 'Green is velocity (tangent to the path); red is the gravitational pull toward the Sun. Gravity is perpendicular to velocity only on a circular orbit — on an ellipse it has a component along the motion, speeding the planet up on the way in and slowing it on the way out.',
      position: (t) => t.copy(planet.position).add(new THREE.Vector3(0, 0.3, 0)),
    },
    {
      id: 'perihelion',
      label: 'Perihelion',
      title: 'Perihelion — fastest point',
      body: 'The closest approach, at distance a(1 − e). Conservation of angular momentum (r × v constant) forces the planet to move fastest here.',
      position: (t) => t.set(a * (1 - e), 0.1, 0),
    },
    {
      id: 'aphelion',
      label: 'Aphelion',
      title: 'Aphelion — slowest point',
      body: 'The farthest point, at distance a(1 + e). Speed is lowest here; the ratio of perihelion speed to aphelion speed equals (1 + e)/(1 − e).',
      position: (t) => t.set(-a * (1 + e), 0.1, 0),
    },
    {
      id: 'sectors',
      label: 'Equal areas',
      title: 'Kepler’s second law',
      body: 'Each colored wedge is swept in the same amount of time. Near perihelion the wedges are short and wide; near aphelion they are long and thin — but their areas match.',
      position: (t) => {
        const last = sectors[sectors.length - 1]
        if (!last) return t.set(0, 0, 0)
        last.geometry.computeBoundingSphere()
        return t.copy(last.geometry.boundingSphere?.center ?? t.set(0, 0, 0))
      },
      visible: () => sectorGroup.visible && sectors.length > 0,
    },
  ]

  return {
    hotspots,
    update(p: Params, dt: number) {
      const nextKey = `${p.a}:${p.e}`
      if (nextKey !== key) {
        key = nextKey
        reset(p)
      }
      const simDt = dt * p.warp
      const steps = Math.max(1, Math.ceil(simDt / 0.004))
      const h = simDt / steps
      for (let i = 0; i < steps && h > 0; i += 1) {
        // Velocity Verlet (symplectic: orbits don't drift outward).
        position.addScaledVector(velocity, h).addScaledVector(acceleration, 0.5 * h * h)
        const previous = acceleration.clone()
        accel(position, acceleration)
        velocity.addScaledVector(previous.add(acceleration), 0.5 * h)
      }
      orbitTime += simDt
      planet.position.copy(position)

      if (simDt > 0) {
        trailPoints.push(position.clone())
        if (trailPoints.length > 120) trailPoints.shift()
        sectorPoints.push(position.clone())
        sectorClock += simDt
        if (sectorClock >= period / SECTORS) {
          sectorClock -= period / SECTORS
          closeSector()
        }
      }
      if (trailPoints.length > 1) {
        const padded = [...trailPoints]
        while (padded.length < 120) padded.unshift(padded[0])
        setPolyline(trail, padded)
      }

      const showVectors = p.vectors === 1
      velocityArrow.visible = showVectors
      gravityArrow.visible = showVectors
      if (showVectors) {
        velocityArrow.position.copy(position)
        velocityArrow.setDirection(velocity.clone().normalize())
        velocityArrow.setLength(Math.min(3, velocity.length() * 1.2), 0.22, 0.12)
        gravityArrow.position.copy(position)
        gravityArrow.setDirection(acceleration.clone().normalize())
        gravityArrow.setLength(Math.min(2.5, 0.3 + acceleration.length() * 1.5), 0.2, 0.11)
      }
      sectorGroup.visible = p.sectors === 1
    },
    readouts: () => {
      const r = position.length()
      return [
        { label: 'Distance r', value: r.toFixed(2) },
        { label: 'Speed |v|', value: velocity.length().toFixed(3) },
        { label: 'Period T', value: period.toFixed(2) },
        { label: 'T² / a³', value: ((period * period) / (a * a * a)).toFixed(3) },
        { label: 'Orbits done', value: (orbitTime / period).toFixed(2) },
        { label: 'Angular mom.', value: position.clone().cross(velocity).length().toFixed(3) },
      ]
    },
    dispose: clearSectors,
  }
}

export const KEPLER_MODEL: ModelDefinition = {
  id: 'kepler',
  title: 'Kepler Orbit Sandbox',
  subtitle:
    'Stretch the orbit with eccentricity and resize it with the semi-major axis. Watch T²/a³ stay fixed at 4π² ≈ 39.478 — Kepler’s third law.',
  camera: [0, 9, 9],
  params: [
    { kind: 'slider', id: 'e', label: 'Eccentricity e', min: 0, max: 0.85, step: 0.01, initial: 0.45 },
    { kind: 'slider', id: 'a', label: 'Semi-major axis a', min: 2, max: 5.5, step: 0.1, initial: 3.5 },
    { kind: 'slider', id: 'warp', label: 'Time warp', min: 0.25, max: 8, step: 0.25, initial: 2.5, unit: '×' },
    { kind: 'toggle', id: 'vectors', label: 'Velocity & gravity vectors', initial: true },
    { kind: 'toggle', id: 'sectors', label: 'Equal-time area sectors', initial: true },
  ],
  build,
}

export default function KeplerOrbit3D() {
  return <ModelViewer model={KEPLER_MODEL} />
}
