import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import { makeTextSprite, type Hotspot, type ModelDefinition, type Params, type SceneContext } from '../engine'

/**
 * Procedural heart and lungs: four chambers that contract in sequence,
 * lungs that inflate with each breath, and red blood cells that travel
 * the two circuits (heart → lungs → heart → body → heart), changing
 * colour where they pick up and give up oxygen.
 */

type V3 = [number, number, number]

const OXY = new THREE.Color(0xef4444)
const DEOXY = new THREE.Color(0x3b6fd8)
const NEUTRAL = new THREE.Color(0xfb7185)

const RA: V3 = [-0.55, 0.55, 0.1]
const RV: V3 = [-0.4, -0.35, 0.25]
const LA: V3 = [0.5, 0.6, -0.15]
const LV: V3 = [0.4, -0.4, 0]

interface Circuit {
  points: V3[]
  /** Control-point index where blood enters and leaves the lung capillaries. */
  lung: [number, number]
  /** Control-point index where blood enters the body capillaries (it leaves at index 1). */
  bedIn: number
  /** Vessel sections drawn as tubes: [from, to, colour, radius]. */
  vessels: [number, number, number, number][]
}

const BLUE = 0x3b6fd8
const RED = 0xef4444
const MIXED = 0xa855f7

/** Lower body → inferior vena cava → right heart → right lung → left heart → descending aorta. */
const LOWER: Circuit = {
  points: [
    [0.35, -3.0, 0.2],
    [-0.3, -3.0, 0.2],
    [-0.95, -1.9, -0.1],
    [-0.85, -0.3, -0.1],
    RA,
    RV,
    [-0.1, 0.6, 0.45],
    [-0.2, 1.2, 0.5],
    [-1.0, 1.3, 0.1],
    [-2.0, 0.9, -0.1],
    [-2.3, 0.2, -0.2],
    [-1.9, -0.2, -0.3],
    [-1.0, 0.5, -0.5],
    [-0.2, 0.65, -0.55],
    LA,
    LV,
    [0.05, 0.5, 0.3],
    [0.15, 1.5, 0.15],
    [0.8, 1.8, -0.2],
    [1.1, 0.9, -0.8],
    [1.0, -1.0, -0.7],
    [0.8, -2.3, -0.1],
  ],
  lung: [9, 11],
  bedIn: 21,
  vessels: [
    [1, 4, BLUE, 0.17],
    [5, 9, BLUE, 0.15],
    [9, 11, MIXED, 0.1],
    [11, 14, RED, 0.13],
    [15, 21, RED, 0.17],
  ],
}

/** Upper body → superior vena cava → right heart → left lung → left heart → aortic arch branch. */
const UPPER: Circuit = {
  points: [
    [-0.35, 3.3, 0.5],
    [-0.8, 2.6, 0.3],
    [-0.75, 1.4, 0.15],
    RA,
    RV,
    [-0.1, 0.6, 0.45],
    [-0.2, 1.2, 0.5],
    [0.7, 1.2, 0.55],
    [2.0, 0.9, -0.1],
    [2.3, 0.2, -0.2],
    [1.9, -0.2, -0.3],
    [1.25, 0.3, -0.2],
    LA,
    LV,
    [0.05, 0.5, 0.3],
    [0.15, 1.5, 0.15],
    [0.45, 2.3, 0.3],
    [0.3, 3.0, 0.5],
  ],
  lung: [8, 10],
  bedIn: 17,
  vessels: [
    [1, 3, BLUE, 0.15],
    [6, 8, BLUE, 0.13],
    [8, 10, MIXED, 0.1],
    [10, 12, RED, 0.13],
    [15, 17, RED, 0.13],
  ],
}

const TABLE_SIZE = 480

function vec(p: V3): THREE.Vector3 {
  return new THREE.Vector3(p[0], p[1], p[2])
}

/** Smooth 0 → 1 → 0 bump across [start, end] of a 0..1 phase. */
function bump(phase: number, start: number, end: number): number {
  if (phase < start || phase > end) return 0
  const s = Math.sin((Math.PI * (phase - start)) / (end - start))
  return s * s
}

/** Simplified left-ventricle pressure (mmHg) over one beat. */
function lvPressure(phase: number): number {
  if (phase < 0.12) return 6 + 6 * bump(phase, 0, 0.12)
  if (phase < 0.17) return 6 + ((phase - 0.12) / 0.05) * 74
  if (phase < 0.4) return 80 + 40 * Math.sin((Math.PI * (phase - 0.17)) / 0.3)
  if (phase < 0.48) return 6 + (1 - (phase - 0.4) / 0.08) * (80 + 40 * Math.sin((Math.PI * 0.23) / 0.3) - 6)
  return 4 + 2 * ((phase - 0.48) / 0.52)
}

function cardiacOutput(p: Params): number {
  return ((p.heartRate ?? 70) * (p.strokeVolume ?? 70)) / 1000
}

function minuteVentilation(p: Params): number {
  return (p.breathRate ?? 14) * (p.tidalVolume ?? 0.5)
}

function phaseName(phase: number): string {
  if (phase < 0.12) return 'Atria contracting'
  if (phase < 0.42) return 'Ventricles contracting (systole)'
  return 'Chambers filling (diastole)'
}

interface CircuitRuntime {
  table: THREE.Vector3[]
  uLungIn: number
  uLungOut: number
  uBedIn: number
  uBedOut: number
}

/** Oxygen saturation (0 = deoxygenated, 1 = oxygenated) at position `u` round a circuit. */
function saturation(c: CircuitRuntime, u: number): number {
  if (u >= c.uBedOut && u <= c.uLungIn) return 0
  if (u > c.uLungIn && u < c.uLungOut) return (u - c.uLungIn) / (c.uLungOut - c.uLungIn)
  if (u >= c.uLungOut && u <= c.uBedIn) return 1
  const span = 1 - c.uBedIn + c.uBedOut
  const into = u > c.uBedIn ? u - c.uBedIn : u + 1 - c.uBedIn
  return 1 - Math.min(1, into / span)
}

function build({ scene, palette, quality }: SceneContext, params: Params) {
  const root = new THREE.Group()
  scene.add(root)

  // ── Circuits: lookup tables, vessel tubes ──────────────────────
  const vesselMaterials: THREE.MeshPhysicalMaterial[] = []
  const makeCircuit = (def: Circuit): CircuitRuntime => {
    const curve = new THREE.CatmullRomCurve3(def.points.map(vec), true, 'catmullrom', 0.5)
    const table = curve.getSpacedPoints(TABLE_SIZE)
    const uOf = (index: number) => {
      const target = vec(def.points[index])
      let best = 0
      let bestDistance = Infinity
      for (let i = 0; i < TABLE_SIZE; i += 1) {
        const d = table[i].distanceToSquared(target)
        if (d < bestDistance) {
          bestDistance = d
          best = i
        }
      }
      return best / TABLE_SIZE
    }
    for (const [from, to, color, radius] of def.vessels) {
      const a = Math.round(uOf(from) * TABLE_SIZE)
      const b = Math.round(uOf(to) * TABLE_SIZE)
      const samples: THREE.Vector3[] = []
      const stride = Math.max(1, Math.floor((b - a) / 28))
      for (let i = a; i < b; i += stride) samples.push(table[i])
      samples.push(table[b])
      const material = new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: 0.34,
        roughness: 0.3,
        clearcoat: 0.6,
        depthWrite: false,
      })
      vesselMaterials.push(material)
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(samples), quality.segments(56), radius, quality.segments(12)),
        material,
      )
      root.add(tube)
    }
    return {
      table,
      uLungIn: uOf(def.lung[0]),
      uLungOut: uOf(def.lung[1]),
      uBedIn: uOf(def.bedIn),
      uBedOut: uOf(1),
    }
  }
  const circuits = [makeCircuit(LOWER), makeCircuit(UPPER)]

  // ── Heart chambers ─────────────────────────────────────────────
  const chamber = (center: V3, radius: number, stretch: V3, color: number) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, quality.segments(40), quality.segments(28)),
      new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: 0.62,
        roughness: 0.35,
        clearcoat: 0.7,
        clearcoatRoughness: 0.3,
        depthWrite: false,
      }),
    )
    mesh.position.set(center[0], center[1], center[2])
    mesh.scale.set(stretch[0], stretch[1], stretch[2])
    mesh.userData.stretch = stretch
    root.add(mesh)
    return mesh
  }
  const rightAtrium = chamber(RA, 0.42, [1, 0.9, 1], 0x60a5fa)
  const leftAtrium = chamber(LA, 0.4, [1, 0.9, 1], 0xfb7185)
  const rightVentricle = chamber(RV, 0.55, [0.95, 1.3, 0.95], 0x3b82f6)
  const leftVentricle = chamber(LV, 0.6, [0.95, 1.4, 1], 0xe11d48)
  const squeeze = (mesh: THREE.Mesh, amount: number) => {
    const stretch = mesh.userData.stretch as V3
    const k = 1 - amount
    mesh.scale.set(stretch[0] * k, stretch[1] * k, stretch[2] * k)
  }

  // Heart muscle: a faint shell round the ventricles.
  const muscle = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, quality.segments(40), quality.segments(28)),
    new THREE.MeshStandardMaterial({ color: 0x9f1239, transparent: true, opacity: 0.16, roughness: 0.6, depthWrite: false }),
  )
  muscle.position.set(0.02, -0.42, 0.1)
  muscle.scale.set(1.05, 1.25, 0.85)
  root.add(muscle)

  // ── Lungs ──────────────────────────────────────────────────────
  const lungMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfda4af,
    transparent: true,
    opacity: params.lungOpacity ?? 0.22,
    roughness: 0.55,
    clearcoat: 0.3,
    depthWrite: false,
  })
  const lungs: THREE.Mesh[] = []
  const lungCenters: V3[] = [
    [-2.1, 0.35, -0.2],
    [2.1, 0.35, -0.2],
  ]
  for (const center of lungCenters) {
    const geometry = new THREE.SphereGeometry(1, quality.segments(44), quality.segments(32))
    const position = geometry.getAttribute('position') as THREE.BufferAttribute
    const side = Math.sign(center[0])
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i)
      const y = position.getY(i)
      const z = position.getZ(i)
      // Narrow toward the top and hollow the side that faces the heart.
      const taper = 1 - 0.28 * Math.max(0, y)
      const notch = x * side < 0 && y < 0.2 ? 0.82 : 1
      position.setXYZ(i, x * taper * notch, y, z * taper)
    }
    geometry.computeVertexNormals()
    const lung = new THREE.Mesh(geometry, lungMaterial)
    lung.position.set(center[0], center[1], center[2])
    lung.scale.set(0.95, 1.65, 0.9)
    root.add(lung)
    lungs.push(lung)
  }

  // Alveoli: instanced air sacs filling each lung.
  const alveoliCount = quality.count(240)
  const alveoli = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.06, quality.segments(8), quality.segments(6)),
    new THREE.MeshStandardMaterial({ color: 0xffe4e6, roughness: 0.5, transparent: true, opacity: 0.75 }),
    alveoliCount,
  )
  let seed = 19
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const alveoliBase: THREE.Vector3[] = []
  const alveoliLung: number[] = []
  const scratch = new THREE.Vector3()
  for (let i = 0; i < alveoliCount; i += 1) {
    do {
      scratch.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1)
    } while (scratch.length() > 0.85)
    alveoliBase.push(new THREE.Vector3(scratch.x * 0.8, scratch.y * 1.45, scratch.z * 0.75))
    alveoliLung.push(i % 2)
  }
  root.add(alveoli)
