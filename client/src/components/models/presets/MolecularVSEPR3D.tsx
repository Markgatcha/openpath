import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import {
  arcPoints,
  disposeObject,
  polyline,
  setPolyline,
  type Hotspot,
  type ModelDefinition,
  type Params,
  type SceneContext,
} from '../engine'

/**
 * VSEPR geometry built from real bond directions. Lone pairs are drawn
 * as translucent lobes that *occupy* electron domains, which is why NH₃
 * and H₂O pinch below the ideal 109.5° tetrahedral angle.
 */

interface Molecule {
  formula: string
  name: string
  geometry: string
  hybrid: string
  polar: boolean
  bondAngle: number
  central: { symbol: string; color: number; radius: number }
  ligand: { symbol: string; color: number; radius: number }
  bonds: THREE.Vector3[]
  lonePairs: THREE.Vector3[]
  bondOrder?: number
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize()

/** Three bonds symmetric around −Y with a given inter-bond angle. */
function pyramidal(angleDeg: number): THREE.Vector3[] {
  const cosT = Math.cos((angleDeg * Math.PI) / 180)
  const sinA = Math.sqrt((1 - cosT) / 1.5)
  const cosA = Math.sqrt(1 - sinA * sinA)
  return [0, 1, 2].map((k) => {
    const phi = (k * 2 * Math.PI) / 3
    return v(sinA * Math.cos(phi), -cosA, sinA * Math.sin(phi))
  })
}

function bent(angleDeg: number): THREE.Vector3[] {
  const half = (angleDeg * Math.PI) / 360
  return [v(Math.sin(half), -Math.cos(half), 0), v(-Math.sin(half), -Math.cos(half), 0)]
}

const TETRA = [v(1, 1, 1), v(1, -1, -1), v(-1, 1, -1), v(-1, -1, 1)]
const H = { symbol: 'H', color: 0xf8fafc, radius: 0.25 }

const MOLECULES: Molecule[] = [
  {
    formula: 'CH₄',
    name: 'Methane',
    geometry: 'Tetrahedral',
    hybrid: 'sp³',
    polar: false,
    bondAngle: 109.5,
    central: { symbol: 'C', color: 0x334155, radius: 0.42 },
    ligand: H,
    bonds: TETRA,
    lonePairs: [],
  },
  {
    formula: 'NH₃',
    name: 'Ammonia',
    geometry: 'Trigonal pyramidal',
    hybrid: 'sp³',
    polar: true,
    bondAngle: 107,
    central: { symbol: 'N', color: 0x3b82f6, radius: 0.4 },
    ligand: H,
    bonds: pyramidal(107),
    lonePairs: [v(0, 1, 0)],
  },
  {
    formula: 'H₂O',
    name: 'Water',
    geometry: 'Bent',
    hybrid: 'sp³',
    polar: true,
    bondAngle: 104.5,
    central: { symbol: 'O', color: 0xef4444, radius: 0.38 },
    ligand: H,
    bonds: bent(104.5),
    lonePairs: [v(0, 0.75, 0.66), v(0, 0.75, -0.66)],
  },
  {
    formula: 'SF₆',
    name: 'Sulfur hexafluoride',
    geometry: 'Octahedral',
    hybrid: 'sp³d²',
    polar: false,
    bondAngle: 90,
    central: { symbol: 'S', color: 0xeab308, radius: 0.48 },
    ligand: { symbol: 'F', color: 0x84cc16, radius: 0.32 },
    bonds: [v(1, 0, 0), v(0, 1, 0), v(-1, 0, 0), v(0, -1, 0), v(0, 0, 1), v(0, 0, -1)],
    lonePairs: [],
  },
  {
    formula: 'BF₃',
    name: 'Boron trifluoride',
    geometry: 'Trigonal planar',
    hybrid: 'sp²',
    polar: false,
    bondAngle: 120,
    central: { symbol: 'B', color: 0xfda4af, radius: 0.36 },
    ligand: { symbol: 'F', color: 0x84cc16, radius: 0.32 },
    bonds: [0, 1, 2].map((k) => v(Math.cos((k * 2 * Math.PI) / 3), 0, Math.sin((k * 2 * Math.PI) / 3))),
    lonePairs: [],
  },
  {
    formula: 'CO₂',
    name: 'Carbon dioxide',
    geometry: 'Linear',
    hybrid: 'sp',
    polar: false,
    bondAngle: 180,
    central: { symbol: 'C', color: 0x334155, radius: 0.42 },
    ligand: { symbol: 'O', color: 0xef4444, radius: 0.38 },
    bonds: [v(1, 0, 0), v(-1, 0, 0)],
    lonePairs: [],
    bondOrder: 2,
  },
]

const BOND_LENGTH = 1.5
/** Space-filling scales atoms up to roughly van der Waals proportions. */
const FILL_SCALE = 2.6

function build({ scene, palette, quality }: SceneContext, _params: Params) {
  const molecule = new THREE.Group()
  scene.add(molecule)

  const angleArc = polyline(arcPoints(new THREE.Vector3(), v(1, 0, 0), v(0, 1, 0), 0.7), palette.amber)
  scene.add(angleArc)

  let current: Molecule = MOLECULES[0]
  let builtKey = ''
  let centralAtom: THREE.Mesh | null = null
  let firstLigand: THREE.Mesh | null = null
  const lobes: THREE.Mesh[] = []

  function rebuild(p: Params) {
    disposeObject(molecule)
    molecule.clear()
    lobes.length = 0
    current = MOLECULES[p.molecule] ?? MOLECULES[0]
    const fill = p.mode === 1

    const atom = (spec: Molecule['central'], at: THREE.Vector3) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(spec.radius * (fill ? FILL_SCALE : 1), quality.segments(40), quality.segments(28)),
        new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.35, metalness: 0.05 }),
      )
      mesh.position.copy(at)
      molecule.add(mesh)
      return mesh
    }

    centralAtom = atom(current.central, new THREE.Vector3())
    firstLigand = null
    const bondMaterial = new THREE.MeshStandardMaterial({ color: palette.slate, roughness: 0.5 })
    current.bonds.forEach((dir, index) => {
      const end = dir.clone().multiplyScalar(BOND_LENGTH)
      const ligand = atom(current.ligand, end)
      if (index === 0) firstLigand = ligand
      if (fill) return
      const order = current.bondOrder ?? 1
      for (let k = 0; k < order; k += 1) {
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, BOND_LENGTH, quality.segments(14)), bondMaterial)
        cylinder.position.copy(end.clone().multiplyScalar(0.5))
        cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
        if (order > 1) {
          const side = new THREE.Vector3(0, 0, 1).cross(dir).normalize().multiplyScalar((k - (order - 1) / 2) * 0.18)
          cylinder.position.add(side)
        }
        molecule.add(cylinder)
      }
    })

    for (const dir of current.lonePairs) {
      const lobe = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, quality.segments(28), quality.segments(20)),
        new THREE.MeshStandardMaterial({
          color: palette.violet,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        }),
      )
      lobe.scale.set(0.75, 1.35, 0.75)
      lobe.position.copy(dir.clone().multiplyScalar(0.85))
      lobe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
      molecule.add(lobe)
      lobes.push(lobe)
    }

    if (current.bonds.length >= 2) {
      setPolyline(angleArc, arcPoints(new THREE.Vector3(), current.bonds[0], current.bonds[1], 0.75))
    }
  }

  const measuredAngle = () => {
    if (current.bonds.length < 2) return 0
    return (current.bonds[0].angleTo(current.bonds[1]) * 180) / Math.PI
  }

  const hotspots: Hotspot[] = [
    {
      id: 'central',
      label: 'Central atom',
      title: 'Central atom & electron domains',
      body: 'VSEPR counts electron domains around the central atom — bonds (single, double, or triple each count once) plus lone pairs. Domains spread out as far as possible to minimize repulsion, which sets the electron geometry.',
      position: (t) => (centralAtom ? centralAtom.getWorldPosition(t).add(new THREE.Vector3(0, 0.15, 0)) : t.set(0, 0, 0)),
    },
    {
      id: 'ligand',
      label: 'Bonded atom',
      title: 'Bonding domain',
      body: 'Each bonded atom occupies one domain. The molecular geometry names only the positions of atoms, so molecules with lone pairs get a different shape name than their electron geometry.',
      position: (t) => (firstLigand ? firstLigand.getWorldPosition(t) : t.set(1, 0, 0)),
    },
    {
      id: 'lonepair',
      label: 'Lone pair',
      title: 'Lone pairs squeeze bond angles',
      body: 'A lone pair is held by only one nucleus, so its electron cloud is fatter and repels more strongly than a bonding pair. That is why NH₃ (one lone pair) has 107° and H₂O (two) has 104.5° instead of 109.5°.',
      position: (t) => (lobes[0] ? lobes[0].getWorldPosition(t) : t.set(0, 1, 0)),
      visible: () => lobes.length > 0 && lobes[0].visible,
    },
    {
      id: 'angle',
      label: 'Bond angle',
      title: 'Bond angle overlay',
      body: 'The amber arc spans the angle between two bonds, measured directly from the 3D model. Ideal values: linear 180°, trigonal planar 120°, tetrahedral 109.5°, octahedral 90°.',
      position: (t) => {
        const attribute = angleArc.geometry.getAttribute('position') as THREE.BufferAttribute
        const mid = Math.floor(attribute.count / 2)
        return t.set(attribute.getX(mid), attribute.getY(mid), attribute.getZ(mid)).applyMatrix4(angleArc.matrixWorld)
      },
      visible: () => angleArc.visible,
    },
  ]

  return {
    hotspots,
    update(p: Params, _dt: number, elapsed: number) {
      const key = `${p.molecule}:${p.mode}`
      if (key !== builtKey) {
        builtKey = key
        rebuild(p)
      }
      for (const lobe of lobes) lobe.visible = p.lonePairs === 1
      angleArc.visible = p.angles === 1 && current.bonds.length >= 2
      // Symmetric stretch vibration (amplitude 0 = rigid model).
      const stretch = 1 + Math.sin(elapsed * 9) * p.vibration * 0.08
      molecule.children.forEach((child) => {
        if (child === centralAtom || lobes.includes(child as THREE.Mesh)) return
        if ((child as THREE.Mesh).geometry instanceof THREE.SphereGeometry) {
          const dir = child.position.clone().normalize()
          child.position.copy(dir.multiplyScalar(BOND_LENGTH * stretch))
        }
      })
    },
    readouts: () => [
      { label: 'Molecule', value: `${current.formula} · ${current.name}` },
      { label: 'Shape', value: current.geometry },
      { label: 'Bond angle', value: `${measuredAngle().toFixed(1)}°` },
      { label: 'Hybridization', value: current.hybrid },
      { label: 'Lone pairs (central)', value: String(current.lonePairs.length) },
      { label: 'Polarity', value: current.polar ? 'Polar' : 'Nonpolar' },
    ],
  }
}

export const VSEPR_MODEL: ModelDefinition = {
  id: 'vsepr',
  title: 'VSEPR Molecular Geometry',
  subtitle:
    'Switch molecules to compare ideal and lone-pair-compressed angles. The bond-angle readout is measured live from the 3D coordinates.',
  camera: [3.2, 2.2, 4.2],
  params: [
    { kind: 'choice', id: 'molecule', label: 'Molecule', choices: MOLECULES.map((m) => m.formula), initial: 0 },
    { kind: 'choice', id: 'mode', label: 'Display', choices: ['Ball & stick', 'Space-filling'], initial: 0 },
    { kind: 'toggle', id: 'lonePairs', label: 'Show lone pairs', initial: true },
    { kind: 'toggle', id: 'angles', label: 'Bond-angle overlay', initial: true },
    { kind: 'slider', id: 'vibration', label: 'Bond vibration', min: 0, max: 1, step: 0.05, initial: 0, format: (x) => `${Math.round(x * 100)}%` },
  ],
  build,
}

export default function MolecularVSEPR3D() {
  return <ModelViewer model={VSEPR_MODEL} />
}
