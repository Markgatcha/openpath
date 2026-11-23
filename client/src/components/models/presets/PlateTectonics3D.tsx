import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import { makeArrow, type Hotspot, type ModelDefinition, type Params, type SceneContext } from '../engine'

/**
 * Procedural Oceanic–Continental Subduction Zone (Plate Tectonics):
 * - Dense basaltic oceanic crust subducting along an inclined slab beneath
 *   buoyant granitic continental crust at an oceanic trench.
 * - Asthenosphere mantle convection cells animated with instanced magma
 *   particles + optional 3D convection velocity arrows.
 * - Continental stratovolcano arc fed by flux-melting magma diapirs above
 *   the Wadati–Benioff earthquake hypocenter plane.
 */

const PLUME_PARTICLES_BASE = 180
const QUAKE_COUNT = 16

function slabCenterY(x: number): number {
  if (x < -0.6) return 0.95
  const u = (x + 0.6) / 5.2
  return 0.95 - u * u * 3.55 - u * 0.85
}

function build({ scene, palette, quality }: SceneContext, initial: Params) {
  const PLUME_PARTICLES = quality.count(PLUME_PARTICLES_BASE)
  const root = new THREE.Group()
  scene.add(root)

  // 1. Mantle cutaway block (translucent glowing asthenosphere)
  const mantleMat = new THREE.MeshPhysicalMaterial({
    color: 0x9a3412,
    emissive: 0x7c2d12,
    emissiveIntensity: 0.45,
    roughness: 0.65,
    transparent: true,
    opacity: 0.52,
  })
  const mantleBlock = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.6, 4.4), mantleMat)
  mantleBlock.position.set(0, -1.35, 0)
  root.add(mantleBlock)

  // 2. Subducting Oceanic Crust (curved ribbon slab)
  const slabShape = new THREE.Shape()
  const slabSteps = 28
  for (let i = 0; i <= slabSteps; i += 1) {
    const x = -4.8 + (9.0 * i) / slabSteps
    const y = slabCenterY(x) + 0.22
    if (i === 0) slabShape.moveTo(x, y)
    else slabShape.lineTo(x, y)
  }
  for (let i = slabSteps; i >= 0; i -= 1) {
    const x = -4.8 + (9.0 * i) / slabSteps
    const y = slabCenterY(x) - 0.26
    slabShape.lineTo(x, y)
  }
  slabShape.closePath()

  const oceanicSlabGeo = new THREE.ExtrudeGeometry(slabShape, {
    depth: 4.36,
    bevelEnabled: false,
  })
  oceanicSlabGeo.translate(0, 0, -2.18)
  const oceanicSlab = new THREE.Mesh(
    oceanicSlabGeo,
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75, metalness: 0.15 }),
  )
  root.add(oceanicSlab)

  // 3. Ocean water wedge on the left up to the trench (x = -4.8 .. -0.3)
  const oceanWater = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.55, 4.38),
    new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.58,
      roughness: 0.15,
      transmission: 0.35,
    }),
  )
  oceanWater.position.set(-2.55, 1.42, 0)
  root.add(oceanWater)

  // 4. Overriding Continental Crust block + Accretionary Wedge
  const continentShape = new THREE.Shape()
  continentShape.moveTo(-0.35, 0.95)
  continentShape.lineTo(0.4, 1.65)
  continentShape.lineTo(4.8, 1.72)
  continentShape.lineTo(4.8, 0.5)
  continentShape.lineTo(0.5, 0.55)
  continentShape.closePath()
  const continentGeo = new THREE.ExtrudeGeometry(continentShape, { depth: 4.38, bevelEnabled: false })
  continentGeo.translate(0, 0, -2.19)
  const continentMesh = new THREE.Mesh(
    continentGeo,
    new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.82 }),
  )
  root.add(continentMesh)

  // Green/tan continental surface cap
  const surfaceCap = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.12, 4.38),
    new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.85 }),
  )
  surfaceCap.position.set(2.6, 1.74, 0)
  root.add(surfaceCap)

  // 5. Volcanic Arc (3 stratovolcanoes + glowing magma conduits)
  const volcanoGroup = new THREE.Group()
  const volcanoZ = [-1.25, 0.05, 1.3]
  const conduits: THREE.Mesh[] = []
  volcanoZ.forEach((vz, idx) => {
    const vx = 2.05 + idx * 0.22
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.62, 0.95, quality.segments(24)),
      new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.8 }),
    )
    cone.position.set(vx, 2.2, vz)
    const craterGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, quality.segments(14), quality.segments(10)),
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 1.5,
      }),
    )
    craterGlow.position.set(vx, 2.66, vz)

    const conduit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.18, 2.6, quality.segments(12)),
      new THREE.MeshStandardMaterial({
        color: 0xfb923c,
        emissive: 0xea580c,
        emissiveIntensity: 1.1,
        transparent: true,
        opacity: 0.85,
      }),
    )
    conduit.position.set(vx, 0.9, vz)
    conduits.push(conduit)
    volcanoGroup.add(cone, craterGlow, conduit)
  })
  root.add(volcanoGroup)

  // 6. Instanced Mantle Convection Plume Particles
  const plumeGeo = new THREE.SphereGeometry(0.075, quality.segments(10), quality.segments(8))
  const plumeMat = new THREE.MeshStandardMaterial({
    color: palette.amber,
    emissive: 0xdc2626,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  })
  const plumes = new THREE.InstancedMesh(plumeGeo, plumeMat, PLUME_PARTICLES)
  const seeds = Array.from({ length: PLUME_PARTICLES }, (_, i) => ({
    cell: i % 2 === 0 ? -1 : 1,
    phase: (i / PLUME_PARTICLES) * Math.PI * 2 + (i % 7) * 0.37,
    radiusScale: 0.45 + ((i * 13) % 10) * 0.055,
    z: (((i * 29) % 100) / 100 - 0.5) * 3.8,
  }))
  root.add(plumes)

  // 7. Convection Velocity Vector Arrows
  const vectorGroup = new THREE.Group()
  const cellCenters = [
    { cx: -2.4, cy: -1.45, dir: 1 },
    { cx: 2.3, cy: -1.45, dir: -1 },
  ]
  cellCenters.forEach(({ cx, cy, dir }) => {
    for (let k = 0; k < 6; k += 1) {
      const ang = (k / 6) * Math.PI * 2
      const rx = 1.45 * Math.cos(ang)
      const ry = 0.85 * Math.sin(ang)
      const arrow = makeArrow(palette.amber)
      arrow.position.set(cx + rx, cy + ry, 2.24)
      const tangent = new THREE.Vector3(-Math.sin(ang) * dir, Math.cos(ang) * dir * 0.65, 0).normalize()
      arrow.setDirection(tangent)
      arrow.setLength(0.58, 0.18, 0.11)
      vectorGroup.add(arrow)
    }
  })
  root.add(vectorGroup)

  // 8. Wadati-Benioff Zone Earthquake Hypocenter Spheres
  const quakeGroup = new THREE.Group()
  const quakes: { mesh: THREE.Mesh; baseX: number; baseY: number; offset: number }[] = []
  for (let i = 0; i < QUAKE_COUNT; i += 1) {
    const t = i / (QUAKE_COUNT - 1)
    const qx = -0.35 + t * 3.85
    const qy = slabCenterY(qx) + 0.14
    const qz = (((i * 37) % 100) / 100 - 0.5) * 3.5
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, quality.segments(14), quality.segments(10)),
      new THREE.MeshStandardMaterial({
        color: t < 0.35 ? palette.amber : t < 0.7 ? palette.rose : palette.violet,
        emissive: t < 0.35 ? 0xf59e0b : 0xe11d48,
        emissiveIntensity: 1.2,
      }),
    )
    mesh.position.set(qx, qy, qz)
    quakeGroup.add(mesh)
    quakes.push({ mesh, baseX: qx, baseY: qy, offset: i * 0.9 })
  }
  root.add(quakeGroup)

  let simClock = 0
  let showQuakesFlag = initial.showQuakes === 1
  const dummy = new THREE.Object3D()

  const hotspots: Hotspot[] = [
    {
      id: 'trench',
      label: 'Oceanic Trench',
      title: 'Subduction Trench & Slab Pull',
      body: 'Cold, dense basaltic oceanic crust (~3.0 g/cm³) bends downward beneath lighter granitic continental crust (~2.7 g/cm³), carving a deep seafloor trench.',
      position: (t) => t.set(-0.45, 1.25, 1.2),
    },
    {
      id: 'arc',
      label: 'Volcanic Arc',
      title: 'Flux Melting & Continental Stratovolcanoes',
      body: 'At ~100 km depth, hydrous minerals in the subducting slab release water into the overlying mantle wedge, lowering peridotite’s melting point to feed an explosive volcanic arc.',
      position: (t) => t.set(2.25, 2.85, 0.05),
    },
    {
      id: 'benioff',
      label: 'Benioff Zone',
      title: 'Wadati–Benioff Seismic Plane',
      body: 'Earthquake hypocenters deepen systematically landward from shallow megathrust events near the trench (amber) to deep slab-deformation quakes at 300–670 km (violet).',
      position: (t) => t.set(1.55, slabCenterY(1.55) + 0.25, 1.3),
      visible: () => showQuakesFlag,
    },
    {
      id: 'convection',
      label: 'Mantle Plumes',
      title: 'Asthenosphere Thermal Convection',
      body: 'Core-heated mantle rock rises buoyantly, spreads laterally beneath lithosphere, and sinks with cold subducted slabs to drive plate motion.',
      position: (t) => t.set(-2.3, -1.35, 2.2),
    },
  ]

  return {
    hotspots,
    update(p: Params, dt: number, elapsed: number) {
      const rateFactor = p.convergenceRate / 6
      const tempNorm = (p.mantleTemp - 1100) / 500
      simClock += dt * (0.4 + rateFactor * 1.1)

      mantleMat.emissiveIntensity = 0.3 + tempNorm * 0.65
      vectorGroup.visible = p.showVectors === 1
      showQuakesFlag = p.showQuakes === 1
      quakeGroup.visible = showQuakesFlag

      // Animate convection cell particles
      for (let i = 0; i < PLUME_PARTICLES; i += 1) {
        const s = seeds[i]
        const cx = s.cell === -1 ? -2.4 : 2.3
        const dir = s.cell === -1 ? 1 : -1
        const ang = s.phase + simClock * dir * (0.8 + tempNorm * 0.6)
        const px = cx + Math.cos(ang) * 1.75 * s.radiusScale
        const py = -1.45 + Math.sin(ang) * 1.05 * s.radiusScale
        dummy.position.set(px, py, s.z)
        const scale = 0.75 + 0.45 * Math.sin(ang)
        dummy.scale.setScalar(Math.max(0.45, scale))
        dummy.updateMatrix()
        plumes.setMatrixAt(i, dummy.matrix)
      }
      plumes.instanceMatrix.needsUpdate = true

      // Pulse Benioff seismic foci
      if (showQuakesFlag) {
        quakes.forEach((q) => {
          const pulse = 0.8 + 0.55 * Math.max(0, Math.sin(elapsed * 3.2 * rateFactor + q.offset))
          q.mesh.scale.setScalar(pulse)
        })
      }

      // Conduit glow scales with convergence + temperature
      conduits.forEach((c, idx) => {
        const mat = c.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.7 + tempNorm * 0.8 + 0.25 * Math.sin(elapsed * 2.5 + idx)
      })
    },
    readouts: (p: Params) => {
      const meltDepthKm = Math.round(125 - ((p.mantleTemp - 1100) / 500) * 30)
      const seismicMw = (6.8 + (p.convergenceRate / 12) * 2.1).toFixed(1)
      return [
        { label: 'Convergence', value: `${p.convergenceRate.toFixed(1)} cm/yr` },
        { label: 'Mantle Temp', value: `${Math.round(p.mantleTemp)} °C` },
        { label: 'Flux Melt Depth', value: `~${meltDepthKm} km` },
        { label: 'Max Megathrust', value: `Mw ${seismicMw}` },
      ]
    },
  }
}

export const PLATE_TECTONICS_MODEL: ModelDefinition = {
  id: 'plate-tectonics',
  title: 'Subduction & Mantle Convection',
  subtitle:
    'Adjust plate convergence speed and mantle temperature to inspect oceanic subduction, Wadati–Benioff earthquakes, and volcanic arc formation.',
  camera: [0.4, 2.6, 8.6],
  params: [
    {
      kind: 'slider',
      id: 'convergenceRate',
      label: 'Convergence Rate',
      min: 1,
      max: 12,
      step: 0.5,
      initial: 6.5,
      unit: ' cm/yr',
    },
    {
      kind: 'slider',
      id: 'mantleTemp',
      label: 'Mantle Temperature',
      min: 1100,
      max: 1600,
      step: 25,
      initial: 1350,
      unit: ' °C',
    },
    { kind: 'toggle', id: 'showVectors', label: 'Show Convection Vectors', initial: true },
    { kind: 'toggle', id: 'showQuakes', label: 'Earthquake Epicenters', initial: true },
  ],
  build,
}

export default function PlateTectonics3D() {
  return <ModelViewer model={PLATE_TECTONICS_MODEL} />
}
