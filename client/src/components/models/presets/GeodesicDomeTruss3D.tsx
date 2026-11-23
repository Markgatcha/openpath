import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import {
  disposeObject,
  makeArrow,
  type Hotspot,
  type ModelDefinition,
  type Params,
  type SceneContext,
} from '../engine'

/**
 * Procedural Icosahedral Geodesic Dome Truss & Hooke's Law Stress Tensor:
 * - Subdivides an icosahedron at frequency V ∈ {1, 2, 3, 4}, projects
 *   vertices onto a sphere of radius R, retains the upper structural dome,
 *   and deduplicates hub nodes & axial struts.
 * - Under downward apex load F_z, computes elastic nodal displacements u_i,
 *   axial strain ε = (L − L₀)/L₀, and Hooke's law axial stress σ = E·ε,
 *   coloring members from rose (compression) to cyan/emerald (hoop tension).
 */

const DOME_RADIUS = 3.1

interface GeodesicMeshData {
  nodes: THREE.Vector3[]
  edges: [number, number][]
  apexIndex: number
}

function generateGeodesicDome(freq: number): GeodesicMeshData {
  const vFreq = Math.max(1, Math.min(4, Math.round(freq)))
  const phi = (1 + Math.sqrt(5)) / 2

  // Base icosahedron rotated so vertex 0 sits squarely at the north apex (0, R, 0)
  const rawVerts: [number, number, number][] = [
    [-1, phi, 0],
    [1, phi, 0],
    [-1, -phi, 0],
    [1, -phi, 0],
    [0, -1, phi],
    [0, 1, phi],
    [0, -1, -phi],
    [0, 1, -phi],
    [phi, 0, -1],
    [phi, 0, 1],
    [-phi, 0, -1],
    [-phi, 0, 1],
  ]
  const baseVerts = rawVerts.map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize())
  // Rotate baseVerts[0] onto +Y (0, 1, 0) so the dome has a true north apex joint
  const alignQuat = new THREE.Quaternion().setFromUnitVectors(
    baseVerts[0].clone().normalize(),
    new THREE.Vector3(0, 1, 0),
  )
  baseVerts.forEach((v) => v.applyQuaternion(alignQuat))

  const faces: [number, number, number][] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ]

  const nodeMap = new Map<string, number>()
  const nodes: THREE.Vector3[] = []
  const edgeSet = new Set<string>()
  const edges: [number, number][] = []

  const addNode = (p: THREE.Vector3): number => {
    const key = `${Math.round(p.x * 500)}:${Math.round(p.y * 500)}:${Math.round(p.z * 500)}`
    const existing = nodeMap.get(key)
    if (existing !== undefined) return existing
    const idx = nodes.length
    nodes.push(p.clone())
    nodeMap.set(key, idx)
    return idx
  }

  const addEdge = (i: number, j: number) => {
    if (i === j) return
    const a = Math.min(i, j)
    const b = Math.max(i, j)
    const key = `${a}:${b}`
    if (edgeSet.has(key)) return
    edgeSet.add(key)
    edges.push([a, b])
  }

  for (const [ia, ib, ic] of faces) {
    const va = baseVerts[ia]
    const vb = baseVerts[ib]
    const vc = baseVerts[ic]

    // Build barycentric grid of rows 0..vFreq
    const grid: number[][] = []
    for (let r = 0; r <= vFreq; r += 1) {
      const row: number[] = []
      for (let c = 0; c <= vFreq - r; c += 1) {
        const wA = (vFreq - r - c) / vFreq
        const wB = r / vFreq
        const wC = c / vFreq
        const pt = new THREE.Vector3()
          .addScaledVector(va, wA)
          .addScaledVector(vb, wB)
          .addScaledVector(vc, wC)
          .normalize()
          .multiplyScalar(DOME_RADIUS)
        row.push(addNode(pt))
      }
      grid.push(row)
    }

    for (let r = 0; r < vFreq; r += 1) {
      for (let c = 0; c < vFreq - r; c += 1) {
        const n0 = grid[r][c]
        const n1 = grid[r + 1][c]
        const n2 = grid[r][c + 1]
        if (
          nodes[n0].y >= -0.35 &&
          nodes[n1].y >= -0.35 &&
          nodes[n2].y >= -0.35
        ) {
          addEdge(n0, n1)
          addEdge(n1, n2)
          addEdge(n2, n0)
        }
        if (c + 1 < vFreq - r) {
          const n3 = grid[r + 1][c + 1]
          if (
            nodes[n1].y >= -0.35 &&
            nodes[n3].y >= -0.35 &&
            nodes[n2].y >= -0.35
          ) {
            addEdge(n1, n3)
            addEdge(n3, n2)
          }
        }
      }
    }
  }

  // Keep only nodes referenced by dome edges and remap indices cleanly
  const used = new Map<number, number>()
  const domeNodes: THREE.Vector3[] = []
  for (const [a, b] of edges) {
    if (!used.has(a)) {
      used.set(a, domeNodes.length)
      domeNodes.push(nodes[a])
    }
    if (!used.has(b)) {
      used.set(b, domeNodes.length)
      domeNodes.push(nodes[b])
    }
  }
  const domeEdges: [number, number][] = edges.map(([a, b]) => [used.get(a)!, used.get(b)!])

  let apexIndex = 0
  let maxY = -Infinity
  domeNodes.forEach((n, idx) => {
    if (n.y > maxY) {
      maxY = n.y
      apexIndex = idx
    }
  })

  return { nodes: domeNodes, edges: domeEdges, apexIndex }
}

function build({ scene, palette, quality }: SceneContext, initial: Params) {
  const root = new THREE.Group()
  scene.add(root)
  root.position.y = -1.1

  // Foundation ring slab
  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(DOME_RADIUS * 0.99, 0.08, quality.segments(12), quality.segments(64)),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.35 }),
  )
  baseRing.rotation.x = Math.PI / 2
  baseRing.position.y = -0.15
  root.add(baseRing)

  const trussGroup = new THREE.Group()
  root.add(trussGroup)

  // Downward Apex Load Arrow F_z
  const loadArrow = makeArrow(palette.amber)
  root.add(loadArrow)

  let builtFreq = -1
  let meshData: GeodesicMeshData = generateGeodesicDome(initial.frequency)
  let nodeMeshes: THREE.Mesh[] = []
  let strutMeshes: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; a: number; b: number; l0: number }[] = []
  let peakCompMpa = 0
  let peakTensMpa = 0
  let apexDeflectMm = 0
  let showCoordsFlag = initial.showCoords === 1

  const upVec = new THREE.Vector3(0, 1, 0)
  const compressionColor = new THREE.Color(0xf43f5e)
  const neutralColor = new THREE.Color(0x94a3b8)
  const tensionColor = new THREE.Color(0x22d3ee)
  const displaced: THREE.Vector3[] = []

  function rebuildFrequency(freq: number) {
    disposeObject(trussGroup)
    trussGroup.clear()
    meshData = generateGeodesicDome(freq)
    builtFreq = freq

    const hubRadius = Math.max(0.055, 0.11 - freq * 0.014)
    const strutRadius = Math.max(0.026, 0.052 - freq * 0.006)
    const hubGeo = new THREE.SphereGeometry(hubRadius, quality.segments(14), quality.segments(10))
    const strutGeo = new THREE.CylinderGeometry(strutRadius, strutRadius, 1, quality.segments(10))

    nodeMeshes = meshData.nodes.map((n, idx) => {
      const hubMat = new THREE.MeshStandardMaterial({
        color: idx === meshData.apexIndex ? palette.amber : 0xe2e8f0,
        metalness: 0.45,
        roughness: 0.3,
      })
      const m = new THREE.Mesh(hubGeo, hubMat)
      m.position.copy(n)
      trussGroup.add(m)
      return m
    })

    strutMeshes = meshData.edges.map(([a, b]) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.35,
        roughness: 0.35,
      })
      const mesh = new THREE.Mesh(strutGeo, mat)
      trussGroup.add(mesh)
      return {
        mesh,
        mat,
        a,
        b,
        l0: meshData.nodes[a].distanceTo(meshData.nodes[b]),
      }
    })
  }

  function applyLoadAndStress(p: Params) {
    const fRound = Math.round(p.frequency)
    if (fRound !== builtFreq) rebuildFrequency(fRound)

    showCoordsFlag = p.showCoords === 1
    const loadKn = p.apexLoad
    const loadFactor = loadKn / 200 // 0 .. 1

    displaced.length = meshData.nodes.length
    for (let i = 0; i < meshData.nodes.length; i += 1) {
      const orig = meshData.nodes[i]
      // Pinned foundation ring near y <= 0.15; upper shell deflects downward and flares radially outward (hoop tension)
      const hNorm = Math.max(0, orig.y / DOME_RADIUS)
      const dy = -loadFactor * 0.48 * Math.pow(hNorm, 2.2)
      const radialFlare = loadFactor * 0.22 * Math.sin(hNorm * Math.PI) * (1 - hNorm * 0.35)
      const rHoriz = Math.hypot(orig.x, orig.z)
      const rx = rHoriz > 0.01 ? (orig.x / rHoriz) * radialFlare : 0
      const rz = rHoriz > 0.01 ? (orig.z / rHoriz) * radialFlare : 0
      const def = new THREE.Vector3(orig.x + rx, orig.y + dy, orig.z + rz)
      displaced[i] = def
      nodeMeshes[i].position.copy(def)
    }

    apexDeflectMm = Math.abs(displaced[meshData.apexIndex].y - meshData.nodes[meshData.apexIndex].y) * 85

    // Position load arrow above deflected apex
    const apexPos = displaced[meshData.apexIndex]
    const arrowLen = 0.55 + loadFactor * 1.35
    loadArrow.visible = loadKn > 1
    loadArrow.position.set(apexPos.x, apexPos.y + arrowLen + 0.12, apexPos.z)
    loadArrow.setDirection(new THREE.Vector3(0, -1, 0))
    loadArrow.setLength(arrowLen, 0.28, 0.16)

    // Compute Hooke's law axial strain ε = (L - L0) / L0 and stress σ = E * ε
    let maxComp = 0
    let maxTens = 0
    const dir = new THREE.Vector3()
    const mid = new THREE.Vector3()
    const useColorMap = p.stressMap === 1

    for (const s of strutMeshes) {
      const pa = displaced[s.a]
      const pb = displaced[s.b]
      dir.subVectors(pb, pa)
      const len = dir.length()
      mid.addVectors(pa, pb).multiplyScalar(0.5)

      s.mesh.position.copy(mid)
      s.mesh.scale.set(1, len, 1)
      s.mesh.quaternion.setFromUnitVectors(upVec, dir.normalize())

      // Effective steel modulus scaled to realistic MPa readout
      const strain = (len - s.l0) / s.l0
      const stressMpa = strain * 2400
      if (stressMpa < maxComp) maxComp = stressMpa
      if (stressMpa > maxTens) maxTens = stressMpa

      if (useColorMap) {
        const norm = Math.max(-1, Math.min(1, stressMpa / 160))
        if (norm < 0) {
          s.mat.color.copy(neutralColor).lerp(compressionColor, -norm)
        } else {
          s.mat.color.copy(neutralColor).lerp(tensionColor, norm)
        }
      } else {
        s.mat.color.copy(neutralColor)
      }
    }

    peakCompMpa = Math.abs(maxComp)
    peakTensMpa = maxTens
  }

  applyLoadAndStress(initial)

  const hotspots: Hotspot[] = [
    {
      id: 'apex',
      label: 'Apex Crown',
      title: 'Concentrated Meridional Compression',
      body: 'Downward load F_z at the crown places upper meridional struts into strong axial compression (rose), distributing forces across all 5 radial sectors.',
      position: (t) =>
        t.copy(displaced[meshData.apexIndex] ?? new THREE.Vector3(0, DOME_RADIUS, 0)).add(new THREE.Vector3(0, -0.9, 0)),
    },
    {
      id: 'hoop',
      label: 'Tension Ring',
      title: 'Lower Hoop Tension (σ = E·ε > 0)',
      body: 'As the upper shell pushes outward, horizontal ring struts in the lower tiers stretch in axial tension (cyan), preventing the dome walls from buckling outward without interior columns!',
      position: (t) => t.set(DOME_RADIUS * 0.88, 0.15, DOME_RADIUS * 0.35),
    },
    {
      id: 'coords',
      label: 'Apex Node (x,y,z)',
      title: 'Spherical Geodesic Coordinates',
      body: 'Every hub lies on x² + y² + z² = R² prior to loading. Subdividing icosahedral faces at higher frequency V shortens strut lengths and raises buckling capacity.',
      position: (t) => t.set(-1.35, 1.4, 1.35),
      visible: () => showCoordsFlag,
    },
  ]

  return {
    hotspots,
    update(p: Params) {
      applyLoadAndStress(p)
    },
    readouts: (p: Params) => {
      const apex = displaced[meshData.apexIndex] ?? new THREE.Vector3(0, DOME_RADIUS, 0)
      const items = [
        { label: 'Frequency / Members', value: `${Math.round(p.frequency)}V · ${strutMeshes.length} struts` },
        { label: 'Peak Compression', value: `−${peakCompMpa.toFixed(1)} MPa` },
        { label: 'Peak Hoop Tension', value: `+${peakTensMpa.toFixed(1)} MPa` },
        { label: 'Crown Deflection', value: `${apexDeflectMm.toFixed(1)} mm` },
      ]
      if (p.showCoords === 1) {
        items.push({
          label: 'Apex Pos (m)',
          value: `(${apex.x.toFixed(2)}, ${apex.y.toFixed(2)}, ${apex.z.toFixed(2)})`,
        })
      }
      return items
    },
  }
}

export const GEODESIC_TRUSS_MODEL: ModelDefinition = {
  id: 'geodesic-truss',
  title: 'Geodesic Dome Truss & Stress Tensor',
  subtitle:
    'Subdivide an icosahedral dome from 1V to 4V and apply downward crown loads to visualize Hooke’s law compression and hoop tension.',
  camera: [5.4, 3.8, 6.2],
  params: [
    {
      kind: 'slider',
      id: 'frequency',
      label: 'Subdivision Frequency V',
      min: 1,
      max: 4,
      step: 1,
      initial: 2,
      unit: 'V',
    },
    {
      kind: 'slider',
      id: 'apexLoad',
      label: 'Downward Apex Load F_z',
      min: 0,
      max: 200,
      step: 10,
      initial: 90,
      unit: ' kN',
    },
    { kind: 'toggle', id: 'stressMap', label: 'Tensile vs Compression Color Map', initial: true },
    { kind: 'toggle', id: 'showCoords', label: 'Node Coordinates Readout', initial: true },
  ],
  build,
}

export default function GeodesicDomeTruss3D() {
  return <ModelViewer model={GEODESIC_TRUSS_MODEL} />
}
