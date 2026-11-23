import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import type { Hotspot, ModelDefinition, Params, SceneContext } from '../engine'

/**
 * Procedural eukaryotic (animal) cell: a fluid membrane whose vertices
 * ripple in real time, a nucleus with pores and nucleolus, rough ER
 * wrapped around it, a Golgi stack, mitochondria with cristae, lysosomes
 * and instanced ribosomes that stream through the cytoplasm.
 */

function build({ scene, palette }: SceneContext, params: Params) {
  const root = new THREE.Group()
  scene.add(root)

  // ── Membrane (vertex-animated sphere) ─────────────────────────
  const membraneGeometry = new THREE.IcosahedronGeometry(3.2, 5)
  const basePositions = (membraneGeometry.getAttribute('position') as THREE.BufferAttribute)
    .array.slice() as Float32Array
  const membraneMaterial = new THREE.MeshPhysicalMaterial({
    color: palette.cyan,
    transparent: true,
    opacity: params.membraneOpacity,
    roughness: 0.35,
    transmission: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const membrane = new THREE.Mesh(membraneGeometry, membraneMaterial)
  root.add(membrane)

  // ── Nucleus ───────────────────────────────────────────────────
  const nucleus = new THREE.Group()
  nucleus.position.set(-0.3, 0.2, 0)
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 48, 32),
    new THREE.MeshStandardMaterial({
      color: palette.violet,
      transparent: true,
      opacity: 0.55,
      roughness: 0.5,
    }),
  )
  nucleus.add(envelope)
  const nucleolus = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.4 }),
  )
  nucleolus.position.set(0.25, 0.1, 0.2)
  nucleus.add(nucleolus)
  // Nuclear pores: small rings on a Fibonacci sphere.
  const poreGeometry = new THREE.TorusGeometry(0.06, 0.018, 6, 12)
  const poreMaterial = new THREE.MeshStandardMaterial({ color: palette.white })
  const pores = 36
  for (let i = 0; i < pores; i += 1) {
    const y = 1 - (i / (pores - 1)) * 2
    const radius = Math.sqrt(1 - y * y)
    const theta = i * Math.PI * (3 - Math.sqrt(5))
    const normal = new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius)
    const pore = new THREE.Mesh(poreGeometry, poreMaterial)
    pore.position.copy(normal.clone().multiplyScalar(1.05))
    pore.lookAt(normal.clone().multiplyScalar(2))
    nucleus.add(pore)
  }
  root.add(nucleus)

  // ── Rough ER: wavy shells hugging the nucleus ─────────────────
  const er = new THREE.Group()
  const erMaterial = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    roughness: 0.6,
    side: THREE.DoubleSide,
  })
  for (let layer = 0; layer < 3; layer += 1) {
    const geometry = new THREE.TorusGeometry(1.35 + layer * 0.22, 0.05, 8, 96, Math.PI * 1.3)
    const position = geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i)
      const y = position.getY(i)
      const angle = Math.atan2(y, x)
      position.setZ(i, position.getZ(i) + Math.sin(angle * 9 + layer) * 0.12)
    }
    geometry.computeVertexNormals()
    const sheet = new THREE.Mesh(geometry, erMaterial)
    sheet.rotation.set(0.3 * layer, 0.4, 2.2)
    er.add(sheet)
  }
  er.position.copy(nucleus.position)
  root.add(er)

  // ── Golgi apparatus: stacked curved cisternae ─────────────────
  const golgi = new THREE.Group()
  const golgiMaterial = new THREE.MeshStandardMaterial({ color: palette.amber, roughness: 0.5 })
  for (let i = 0; i < 5; i += 1) {
    const cisterna = new THREE.Mesh(
      new THREE.TorusGeometry(0.55 - i * 0.04, 0.06, 8, 32, Math.PI * 0.9),
      golgiMaterial,
    )
    cisterna.position.y = i * 0.15
    golgi.add(cisterna)
  }
  golgi.position.set(1.4, -0.9, 0.6)
  golgi.rotation.set(Math.PI / 2, 0, 0.6)
  root.add(golgi)

  // ── Streaming organelles (rotate with the cytoplasm) ──────────
  const cytoplasm = new THREE.Group()
  root.add(cytoplasm)

  const mitoMaterial = new THREE.MeshStandardMaterial({ color: palette.rose, roughness: 0.45 })
  const cristaMaterial = new THREE.MeshStandardMaterial({ color: 0xffe4e6, roughness: 0.6 })
  const mitochondria: THREE.Group[] = []
  const mitoSpots: [number, number, number][] = [
    [1.9, 0.8, -0.8],
    [-1.8, -1.2, 1.1],
    [0.6, 1.9, 1.2],
    [-1.2, 1.4, -1.6],
  ]
  for (const [x, y, z] of mitoSpots) {
    const mito = new THREE.Group()
    const shell = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.7, 8, 16), mitoMaterial)
    shell.material = mitoMaterial.clone()
    ;(shell.material as THREE.MeshStandardMaterial).transparent = true
    ;(shell.material as THREE.MeshStandardMaterial).opacity = 0.75
    mito.add(shell)
    for (let k = -2; k <= 2; k += 1) {
      const crista = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.2), cristaMaterial)
      crista.position.y = k * 0.16
      crista.rotation.y = k * 0.5
      mito.add(crista)
    }
    mito.position.set(x, y, z)
    mito.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    cytoplasm.add(mito)
    mitochondria.push(mito)
  }

  const lysosomeMaterial = new THREE.MeshStandardMaterial({ color: palette.emerald, roughness: 0.3 })
  const lysosomes: THREE.Mesh[] = []
  for (const [x, y, z] of [
    [-0.9, -2.0, -0.6],
    [2.1, -0.2, 1.4],
    [0.3, -1.4, -2.0],
  ] as [number, number, number][]) {
    const lysosome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), lysosomeMaterial)
    lysosome.position.set(x, y, z)
    cytoplasm.add(lysosome)
    lysosomes.push(lysosome)
  }

  // Free ribosomes: one InstancedMesh, positions sampled inside the cell.
  const ribosomeCount = 420
  const ribosomes = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.035, 6, 4),
    new THREE.MeshStandardMaterial({ color: palette.white }),
    ribosomeCount,
  )
  const matrix = new THREE.Matrix4()
  const point = new THREE.Vector3()
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < ribosomeCount; i += 1) {
    do {
      point.set(rand() * 6 - 3, rand() * 6 - 3, rand() * 6 - 3)
    } while (point.length() > 2.95 || point.distanceTo(nucleus.position) < 1.25)
    matrix.makeTranslation(point.x, point.y, point.z)
    ribosomes.setMatrixAt(i, matrix)
  }
  cytoplasm.add(ribosomes)

  // ── Hotspots ───────────────────────────────────────────────────
  const world = (object: THREE.Object3D, offset = new THREE.Vector3()) =>
    (target: THREE.Vector3) => object.localToWorld(target.copy(offset))

  const hotspots: Hotspot[] = [
    {
      id: 'membrane',
      label: 'Membrane',
      title: 'Plasma membrane',
      body: 'A phospholipid bilayer studded with proteins. It is fluid — lipids drift sideways constantly (the ripple you see) — and selectively permeable: small nonpolar molecules cross freely while ions need channels or pumps.',
      position: world(membrane, new THREE.Vector3(0, 3.2, 0)),
    },
    {
      id: 'nucleus',
      label: 'Nucleus',
      title: 'Nucleus & nuclear pores',
      body: 'The double-membrane envelope stores DNA as chromatin. Nuclear pores (the white rings) regulate traffic: mRNA and ribosomal subunits leave, while proteins such as polymerases and histones are imported.',
      position: world(envelope, new THREE.Vector3(-0.6, 0.85, 0)),
    },
    {
      id: 'nucleolus',
      label: 'Nucleolus',
      title: 'Nucleolus',
      body: 'A dense region inside the nucleus where rRNA is transcribed and assembled with proteins into ribosomal subunits — the factories for every ribosome in the cell.',
      position: world(nucleolus),
    },
    {
      id: 'er',
      label: 'Rough ER',
      title: 'Rough endoplasmic reticulum',
      body: 'Continuous with the nuclear envelope. Ribosomes docked on its surface translate proteins destined for secretion or membranes, threading them into the ER lumen to fold.',
      position: world(er.children[1], new THREE.Vector3(1.57, 0, 0)),
    },
    {
      id: 'golgi',
      label: 'Golgi',
      title: 'Golgi apparatus',
      body: 'Stacked cisternae receive vesicles from the ER on the cis face, modify proteins (for example by glycosylation), then sort and ship them from the trans face.',
      position: world(golgi, new THREE.Vector3(0, 0.3, 0)),
    },
    {
      id: 'mitochondrion',
      label: 'Mitochondrion',
      title: 'Mitochondrion',
      body: 'Folded inner membranes (cristae) carry the electron transport chain. Pumping H⁺ into the intermembrane space builds the gradient that ATP synthase uses to make most of the cell’s ATP.',
      position: world(mitochondria[0]),
    },
    {
      id: 'lysosome',
      label: 'Lysosome',
      title: 'Lysosome',
      body: 'A membrane sac of hydrolytic enzymes kept at about pH 5. It digests worn-out organelles (autophagy) and material brought in by endocytosis.',
      position: world(lysosomes[0]),
    },
    {
      id: 'ribosome',
      label: 'Ribosomes',
      title: 'Free ribosomes',
      body: 'Free ribosomes in the cytosol translate proteins that stay in the cytoplasm. They are identical to ER-bound ribosomes — the signal sequence on the protein decides where translation finishes.',
      position: (target) => target.set(0.9, -2.2, 1.6).applyMatrix4(cytoplasm.matrixWorld),
      visible: () => ribosomes.visible,
    },
  ]

  return {
    hotspots,
    update(p: Params, dt: number, elapsed: number) {
      membraneMaterial.opacity = p.membraneOpacity
      ribosomes.visible = p.ribosomes === 1
      cytoplasm.rotation.y += dt * p.streaming * 0.25
      for (const mito of mitochondria) mito.rotation.x += dt * p.streaming * 0.4

      // Membrane fluidity: displace each vertex along its normal.
      const position = membraneGeometry.getAttribute('position') as THREE.BufferAttribute
      const amplitude = p.fluidity * 0.12
      for (let i = 0; i < position.count; i += 1) {
        const bx = basePositions[i * 3]
        const by = basePositions[i * 3 + 1]
        const bz = basePositions[i * 3 + 2]
        const wave =
          Math.sin(bx * 2.1 + elapsed * 1.3) * Math.cos(by * 1.7 + elapsed * 0.9) +
          Math.sin(bz * 2.6 - elapsed * 1.1) * 0.5
        const scale = 1 + (amplitude * wave) / 3.2
        position.setXYZ(i, bx * scale, by * scale, bz * scale)
      }
      position.needsUpdate = true
      if (amplitude > 0) membraneGeometry.computeVertexNormals()
    },
    readouts: (p: Params) => [
      { label: 'Cell diameter (model)', value: '≈ 20 µm' },
      { label: 'Streaming', value: `${p.streaming.toFixed(1)}×` },
      { label: 'Mitochondria shown', value: String(mitochondria.length) },
      { label: 'Ribosomes shown', value: p.ribosomes === 1 ? String(ribosomeCount) : 'hidden' },
    ],
  }
}

export const CELL_MODEL: ModelDefinition = {
  id: 'cell',
  title: 'Eukaryotic Cell',
  subtitle:
    'Click an organelle pin to inspect it. Fade the membrane to look inside, and speed up cytoplasmic streaming to watch organelles circulate.',
  camera: [0, 2.5, 8.5],
  params: [
    { kind: 'slider', id: 'membraneOpacity', label: 'Membrane opacity', min: 0.05, max: 0.8, step: 0.05, initial: 0.22, format: (v) => `${Math.round(v * 100)}%` },
    { kind: 'slider', id: 'fluidity', label: 'Membrane fluidity', min: 0, max: 1, step: 0.05, initial: 0.4, format: (v) => `${Math.round(v * 100)}%` },
    { kind: 'slider', id: 'streaming', label: 'Cytoplasmic streaming', min: 0, max: 3, step: 0.1, initial: 0.6, unit: '×' },
    { kind: 'toggle', id: 'ribosomes', label: 'Show free ribosomes', initial: true },
  ],
  build,
}

export default function CellStructure3D() {
  return <ModelViewer model={CELL_MODEL} />
}
