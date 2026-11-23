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

/** Wrap any phase, including a negative one, into 0..1. */
function wrap(phase: number): number {
  return phase - Math.floor(phase)
}

const EJECT_START = 0.14
const EJECT_END = 0.44

/**
 * Blood moved since phase 0, for any number of beats forwards or backwards. It is the integral of the
 * relative flow `0.55 + 1.5 * bump(phase, EJECT_START, EJECT_END)`: a steady trickle plus a surge during ejection.
 */
function surgeIntegral(phase: number): number {
  const beats = Math.floor(phase)
  const x = phase - beats
  const span = EJECT_END - EJECT_START
  const into = Math.min(Math.max(x - EJECT_START, 0), span)
  const ejected = into / 2 - (span / (4 * Math.PI)) * Math.sin((2 * Math.PI * into) / span)
  const perBeat = 0.55 + 1.5 * (span / 2)
  return beats * perBeat + 0.55 * x + 1.5 * ejected
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

  // ── Airway: trachea and bronchi ────────────────────────────────
  const airwayMaterial = new THREE.MeshStandardMaterial({ color: palette.cyan, transparent: true, opacity: 0.4, roughness: 0.5, depthWrite: false })
  const airwayPaths: THREE.CatmullRomCurve3[] = [-1, 1].map(
    (side) =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 3.5, -0.6),
        new THREE.Vector3(0, 2.0, -0.6),
        new THREE.Vector3(side * 0.9, 1.35, -0.45),
        new THREE.Vector3(side * 1.9, 0.75, -0.25),
        new THREE.Vector3(side * 2.2, -0.1, -0.2),
      ]),
  )
  for (const path of airwayPaths) {
    root.add(new THREE.Mesh(new THREE.TubeGeometry(path, quality.segments(40), 0.13, quality.segments(10)), airwayMaterial))
  }
  // Rings of cartilage keep the trachea open.
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
  for (let i = 0; i < 6; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, quality.segments(6), quality.segments(18)), ringMaterial)
    ring.position.set(0, 3.35 - i * 0.24, -0.6)
    ring.rotation.x = Math.PI / 2
    root.add(ring)
  }

  // Air: dots that move down the airway on an in-breath and back up on an out-breath.
  const airCount = quality.count(36)
  const air = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.04, quality.segments(8), quality.segments(6)),
    new THREE.MeshBasicMaterial({ color: 0xa5f3fc }),
    airCount,
  )
  root.add(air)

  // ── Blood cells ────────────────────────────────────────────────
  const cellCount = quality.count(200)
  const cells = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.055, quality.segments(10), quality.segments(8)),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
    cellCount,
  )
  const cellU = new Float32Array(cellCount)
  const cellCircuit = new Uint8Array(cellCount)
  const cellOffset: THREE.Vector3[] = []
  for (let i = 0; i < cellCount; i += 1) {
    cellU[i] = rand()
    cellCircuit[i] = i % 2
    cellOffset.push(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.13))
  }
  root.add(cells)

  // ── Body tissues at each end of the systemic circuit ───────────
  const tissueMaterial = new THREE.MeshStandardMaterial({ color: palette.violet, transparent: true, opacity: 0.2, roughness: 0.7, depthWrite: false })
  for (const [x, y, z] of [
    [0, 3.3, 0.5],
    [0.05, -3.05, 0.2],
  ] as V3[]) {
    const tissue = new THREE.Mesh(new THREE.SphereGeometry(0.62, quality.segments(28), quality.segments(20)), tissueMaterial)
    tissue.position.set(x, y, z)
    tissue.scale.set(1.5, 0.6, 0.9)
    root.add(tissue)
  }
  const upperLabel = makeTextSprite('Head & arms', '#ddd6fe', 0.34)
  upperLabel.position.set(0, 3.95, 0.5)
  const lowerLabel = makeTextSprite('Body & legs', '#ddd6fe', 0.34)
  lowerLabel.position.set(0.05, -3.7, 0.2)
  root.add(upperLabel, lowerLabel)

  // ── State ──────────────────────────────────────────────────────
  let beat = 0
  let breath = 0
  const matrix = new THREE.Matrix4()
  const point = new THREE.Vector3()
  const color = new THREE.Color()

  const place = (c: CircuitRuntime, u: number, target: THREE.Vector3) => {
    const f = u * TABLE_SIZE
    const i = Math.floor(f) % TABLE_SIZE
    return target.lerpVectors(c.table[i], c.table[i + 1], f - Math.floor(f))
  }

  const draw = (p: Params) => {
    const atria = bump(beat, 0, 0.14)
    const ventricles = bump(beat, 0.12, 0.44)
    squeeze(rightAtrium, 0.14 * atria)
    squeeze(leftAtrium, 0.14 * atria)
    squeeze(rightVentricle, 0.17 * ventricles)
    squeeze(leftVentricle, 0.17 * ventricles)
    muscle.scale.set(1.05 * (1 - 0.07 * ventricles), 1.25 * (1 - 0.07 * ventricles), 0.85 * (1 - 0.07 * ventricles))

    const fill = 0.5 - 0.5 * Math.cos(breath * Math.PI * 2)
    const swell = 1 + (0.03 + 0.05 * (p.tidalVolume ?? 0.5)) * fill
    lungs.forEach((lung) => lung.scale.set(0.95 * swell, 1.65 * swell, 0.9 * swell))
    lungMaterial.opacity = p.lungOpacity ?? 0.22

    for (let i = 0; i < alveoliCount; i += 1) {
      const center = lungCenters[alveoliLung[i]]
      const base = alveoliBase[i]
      matrix.makeScale(swell, swell, swell)
      matrix.setPosition(center[0] + base.x * swell, center[1] + base.y * swell, center[2] + base.z * swell)
      alveoli.setMatrixAt(i, matrix)
    }
    alveoli.instanceMatrix.needsUpdate = true

    for (let i = 0; i < airCount; i += 1) {
      const along = Math.min(0.98, (i / airCount) * 0.55 + fill * 0.42)
      airwayPaths[i % 2].getPoint(along, point)
      matrix.makeTranslation(point.x + Math.sin(i * 2.4) * 0.05, point.y, point.z + Math.cos(i * 1.7) * 0.05)
      air.setMatrixAt(i, matrix)
    }
    air.instanceMatrix.needsUpdate = true

    const byOxygen = (p.colorByOxygen ?? 1) >= 0.5
    for (let i = 0; i < cellCount; i += 1) {
      const circuit = circuits[cellCircuit[i]]
      place(circuit, cellU[i], point).add(cellOffset[i])
      matrix.makeTranslation(point.x, point.y, point.z)
      cells.setMatrixAt(i, matrix)
      if (byOxygen) color.copy(DEOXY).lerp(OXY, saturation(circuit, cellU[i]))
      else color.copy(NEUTRAL)
      cells.setColorAt(i, color)
    }
    cells.instanceMatrix.needsUpdate = true
    if (cells.instanceColor) cells.instanceColor.needsUpdate = true
  }

  const advance = (p: Params, dt: number) => {
    const heartRate = p.heartRate ?? 70
    const nextBeat = beat + (dt * heartRate) / 60
    // Flow follows cardiac output and surges while the ventricles eject. Integrating the surge over the
    // beat makes the distance depend only on where the beat starts and ends, so stepping back undoes a step forward.
    const du = 0.014 * cardiacOutput(p) * (60 / heartRate) * (surgeIntegral(nextBeat) - surgeIntegral(beat))
    beat = wrap(nextBeat)
    breath = wrap(breath + (dt * (p.breathRate ?? 14)) / 60)
    for (let i = 0; i < cellCount; i += 1) cellU[i] = wrap(cellU[i] + du)
  }

  draw(params)

  const at = (x: number, y: number, z: number) => (target: THREE.Vector3) => root.localToWorld(target.set(x, y, z))
  const hotspots: Hotspot[] = [
    {
      id: 'right-atrium',
      label: 'Right atrium',
      title: 'Right atrium',
      body: 'Collects oxygen-poor blood returning from the body through the two venae cavae, then pushes it down through the tricuspid valve into the right ventricle.',
      position: at(RA[0] - 0.25, RA[1] + 0.2, RA[2] + 0.35),
    },
    {
      id: 'right-ventricle',
      label: 'Right ventricle',
      title: 'Right ventricle',
      body: 'Pumps oxygen-poor blood to the lungs. Its wall is thinner than the left ventricle’s because the lungs are close by and need only a low pressure.',
      position: at(RV[0] - 0.2, RV[1] - 0.3, RV[2] + 0.5),
    },
    {
      id: 'left-atrium',
      label: 'Left atrium',
      title: 'Left atrium',
      body: 'Receives oxygen-rich blood from the lungs through the pulmonary veins and passes it through the mitral valve into the left ventricle.',
      position: at(LA[0] + 0.3, LA[1] + 0.25, LA[2] + 0.3),
    },
    {
      id: 'left-ventricle',
      label: 'Left ventricle',
      title: 'Left ventricle',
      body: 'The strongest chamber. Its thick wall generates the pressure, about 120 mmHg at its peak, that drives blood through the aorta to the whole body.',
      position: at(LV[0] + 0.35, LV[1] - 0.4, LV[2] + 0.5),
    },
    {
      id: 'pulmonary-artery',
      label: 'Pulmonary artery',
      title: 'Pulmonary artery',
      body: 'Carries blood from the right ventricle to the lungs. It is an artery because it leads away from the heart, even though the blood in it is oxygen-poor.',
      position: at(-0.6, 1.35, 0.4),
    },
    {
      id: 'pulmonary-vein',
      label: 'Pulmonary veins',
      title: 'Pulmonary veins',
      body: 'Return freshly oxygenated blood from the lungs to the left atrium. They are the only veins that carry oxygen-rich blood.',
      position: at(1.3, 0.3, -0.1),
    },
    {
      id: 'aorta',
      label: 'Aorta',
      title: 'Aorta',
      body: 'The body’s largest artery. It arches over the heart, sending branches to the head and arms before running down to supply the rest of the body.',
      position: at(0.75, 1.9, -0.1),
    },
    {
      id: 'vena-cava',
      label: 'Venae cavae',
      title: 'Superior and inferior vena cava',
      body: 'The two large veins that return oxygen-poor blood to the right atrium: the superior from the head and arms, the inferior from the rest of the body.',
      position: at(-0.95, -1.5, 0),
    },
    {
      id: 'alveoli',
      label: 'Alveoli',
      title: 'Alveoli and gas exchange',
      body: 'The lungs hold hundreds of millions of tiny air sacs wrapped in capillaries. Oxygen diffuses from the air into the blood and carbon dioxide diffuses out, across a wall only one cell thick.',
      position: at(-2.4, 0.3, 0.5),
    },
    {
      id: 'trachea',
      label: 'Trachea',
      title: 'Trachea and bronchi',
      body: 'The windpipe, held open by rings of cartilage, splits into two bronchi, one for each lung. They branch again and again until they end at the alveoli.',
      position: at(0.2, 2.9, -0.5),
    },
  ]

  return {
    hotspots,
    update(p: Params, dt: number) {
      if (dt > 0) advance(p, dt)
      draw(p)
    },
    step(p: Params, direction: 1 | -1) {
      // An eighth of a heartbeat per step, forwards or backwards.
      advance(p, (direction * 60) / (p.heartRate ?? 70) / 8)
      draw(p)
    },
    readouts: (p: Params) => [
      { label: 'Cardiac output', value: `${cardiacOutput(p).toFixed(1)} L/min` },
      { label: 'Heart rate × stroke volume', value: `${Math.round(p.heartRate ?? 70)} × ${Math.round(p.strokeVolume ?? 70)} mL` },
      { label: 'Air breathed per minute', value: `${minuteVentilation(p).toFixed(1)} L/min` },
      { label: 'Heartbeat phase', value: phaseName(beat) },
      { label: 'Left ventricle pressure', value: `${Math.round(lvPressure(beat))} mmHg` },
    ],
    metrics: (p: Params) => ({
      cardiacOutput: cardiacOutput(p),
      minuteVentilation: minuteVentilation(p),
      beatPhase: beat,
    }),
    hudPlot: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'
      ctx.fillRect(0, 0, w, h)
      const padX = 10
      const padY = 10
      const pw = w - padX * 2
      const ph = h - padY * 2
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
      ctx.strokeRect(padX, padY, pw, ph)
      const y = (mmHg: number) => padY + ph - (mmHg / 130) * ph
      ctx.strokeStyle = '#fb7185'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 96; i += 1) {
        const x = padX + (i / 96) * pw
        if (i === 0) ctx.moveTo(x, y(lvPressure(0)))
        else ctx.lineTo(x, y(lvPressure(i / 96)))
      }
      ctx.stroke()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(padX + beat * pw, y(lvPressure(beat)), 4, 0, Math.PI * 2)
      ctx.fill()
    },
  }
}

export const HEART_LUNGS_MODEL: ModelDefinition = {
  id: 'heart-lungs-circulation-3d',
  title: 'Heart & Lungs: The Double Circulation',
  subtitle:
    'Follow blood from the body to the right heart, through the lungs, and back out from the left heart. Cells turn red where they pick up oxygen and blue where they give it up.',
  camera: [0, 0.6, 9.5],
  hudTitle: 'Left Ventricle Pressure Over One Beat (simplified)',
  params: [
    { kind: 'slider', id: 'heartRate', label: 'Heart rate', min: 40, max: 180, step: 5, initial: 70, unit: ' bpm' },
    { kind: 'slider', id: 'strokeVolume', label: 'Stroke volume (blood per beat)', min: 50, max: 120, step: 5, initial: 70, unit: ' mL' },
    { kind: 'slider', id: 'breathRate', label: 'Breathing rate', min: 6, max: 40, step: 1, initial: 14, unit: ' /min' },
    { kind: 'slider', id: 'tidalVolume', label: 'Air per breath', min: 0.3, max: 2.5, step: 0.1, initial: 0.5, unit: ' L' },
    { kind: 'slider', id: 'lungOpacity', label: 'Lung opacity', min: 0.05, max: 0.7, step: 0.05, initial: 0.22, format: (v) => `${Math.round(v * 100)}%` },
    { kind: 'toggle', id: 'colorByOxygen', label: 'Colour blood by oxygen level', initial: true },
  ],
  challenges: [
    {
      id: 'which-vessel-is-blue',
      title: 'An Artery With Blue Blood',
      setupParams: { heartRate: 70, strokeVolume: 70, colorByOxygen: 1 },
      predict: {
        prompt: 'Which vessel carries oxygen-poor blood away from the heart?',
        options: ['The pulmonary vein', 'The aorta', 'The pulmonary artery'],
        correctIndex: 2,
      },
      explain:
        'Arteries are named for direction, not for oxygen. Every artery carries blood away from the heart. The pulmonary artery leaves the right ventricle with oxygen-poor blood for the lungs, and the pulmonary veins bring it back oxygen-rich.',
      misconceptionTag: 'arteries-always-carry-oxygenated-blood',
    },
    {
      id: 'exercise-output',
      title: 'Output During Exercise',
      setupParams: { heartRate: 70, strokeVolume: 70 },
      predict: {
        prompt:
          'At rest the heart beats 70 times a minute and pumps 70 mL per beat. In hard exercise both rise, to 140 bpm and 100 mL. Roughly how does the blood pumped per minute change?',
        options: ['It doubles', 'It nearly triples', 'It stays the same, because each beat is shorter'],
        correctIndex: 1,
      },
      manipulate: {
        instruction: 'Raise heart rate and stroke volume until the cardiac output reaches at least 14 L/min.',
        evaluate: (p) => ({
          passed: cardiacOutput(p) >= 14,
          feedback: `Cardiac output ${cardiacOutput(p).toFixed(1)} L/min.`,
        }),
      },
      explain:
        'Cardiac output = heart rate × stroke volume. At rest that is 70 × 70 mL = 4.9 L/min. In exercise 140 × 100 mL = 14 L/min, nearly three times as much, because both factors increase.',
      misconceptionTag: 'cardiac-output-is-heart-rate-only',
    },
    {
      id: 'athlete-resting-rate',
      title: 'The Athlete’s Slow Pulse',
      setupParams: { heartRate: 70, strokeVolume: 70 },
      predict: {
        prompt:
          'Endurance training enlarges the heart, so each beat pumps more. If an athlete’s resting stroke volume is 100 mL and the body still needs about 5 L/min, what happens to the resting heart rate?',
        options: ['It falls to about 50 bpm', 'It stays at 70 bpm', 'It rises to about 100 bpm'],
        correctIndex: 0,
      },
      manipulate: {
        instruction: 'Set stroke volume to 100 mL, then choose the heart rate that gives a cardiac output of 5 L/min.',
        evaluate: (p) => ({
          passed: Math.round(p.strokeVolume ?? 70) === 100 && Math.abs(cardiacOutput(p) - 5) < 0.26,
          feedback: `${Math.round(p.heartRate ?? 70)} bpm × ${Math.round(p.strokeVolume ?? 70)} mL = ${cardiacOutput(p).toFixed(1)} L/min.`,
        }),
      },
      explain:
        'The body’s resting demand is unchanged, so a larger stroke volume means fewer beats are needed: 5,000 mL ÷ 100 mL = 50 beats per minute. A low resting pulse is a common sign of endurance fitness.',
      misconceptionTag: 'slow-pulse-means-weak-heart',
    },
  ],
  build,
}

export default function HeartLungsCirculation3D() {
  return <ModelViewer model={HEART_LUNGS_MODEL} />
}
