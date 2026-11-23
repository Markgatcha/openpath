import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import type { Hotspot, ModelDefinition, Params, SceneContext } from '../engine'

/**
 * Procedural DNA Replication Fork (100% mathematical Three.js):
 * - Parental B-DNA double helix (lower region, y < 0) unwinding at the
 *   hexameric Helicase torus (y = 0) into two diverging template strands.
 * - Leading strand synthesized continuously 5' -> 3' toward the fork by
 *   DNA Polymerase III; lagging strand synthesized discontinuously away
 *   from the fork as discrete Okazaki fragments initiated by RNA primers.
 * - Color-coded A=T (emerald/rose, 2 H-bond spheres) and G≡C (amber/cyan,
 *   3 H-bond spheres) base-pair rungs.
 */

const TOTAL_PAIRS = 26
const Y_MIN = -4.2
const Y_MAX = 4.2
const FORK_Y = -0.2

function strandPoint(
  s: number,
  strand: 1 | -1,
  phase: number,
  out: THREE.Vector3,
): THREE.Vector3 {
  const y = Y_MIN + s * (Y_MAX - Y_MIN)
  const radius = 0.85
  if (y <= FORK_Y) {
    // Intact parental double helix
    const theta = y * 1.65 + phase + (strand === 1 ? 0 : Math.PI)
    return out.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius)
  }
  // Above the fork: template strands peel apart symmetrically in X with gentle twist
  const u = (y - FORK_Y) / (Y_MAX - FORK_Y)
  const forkTheta = FORK_Y * 1.65 + phase + (strand === 1 ? 0 : Math.PI)
  const baseX = Math.cos(forkTheta) * radius * (1 - u) + strand * (0.65 + u * 2.55)
  const baseZ = Math.sin(forkTheta) * radius * (1 - u * 0.72) + Math.sin(u * Math.PI * 2 + phase * 0.4) * 0.22
  return out.set(baseX, y, baseZ)
}

function tubeFromSamples(
  pts: THREE.Vector3[],
  radius: number,
  quality: SceneContext['quality'],
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(pts)
  return new THREE.TubeGeometry(curve, quality.segments(64), radius, quality.segments(10), false)
}

function build({ scene, palette, quality }: SceneContext, initial: Params) {
  const buildTubeFromSamples = (pts: THREE.Vector3[], radius: number) =>
    tubeFromSamples(pts, radius, quality)
  const root = new THREE.Group()
  scene.add(root)

  // Backbone materials
  const templateMatA = new THREE.MeshStandardMaterial({ color: palette.brand, roughness: 0.35, metalness: 0.15 })
  const templateMatB = new THREE.MeshStandardMaterial({ color: palette.violet, roughness: 0.35, metalness: 0.15 })
  const daughterLeadMat = new THREE.MeshStandardMaterial({ color: palette.cyan, roughness: 0.3, emissive: 0x083344, emissiveIntensity: 0.5 })
  const daughterLagMat = new THREE.MeshStandardMaterial({ color: palette.amber, roughness: 0.3, emissive: 0x451a03, emissiveIntensity: 0.45 })
  const primerMat = new THREE.MeshStandardMaterial({ color: palette.rose, roughness: 0.35 })

  const sampleCount = 44
  const ptsA = Array.from({ length: sampleCount }, (_, i) =>
    strandPoint(i / (sampleCount - 1), -1, 0, new THREE.Vector3()),
  )
  const ptsB = Array.from({ length: sampleCount }, (_, i) =>
    strandPoint(i / (sampleCount - 1), 1, 0, new THREE.Vector3()),
  )

  const backboneA = new THREE.Mesh(buildTubeFromSamples(ptsA, 0.1), templateMatA)
  const backboneB = new THREE.Mesh(buildTubeFromSamples(ptsB, 0.1), templateMatB)
  root.add(backboneA, backboneB)

  // Daughter leading strand (hugs left template from top down toward fork)
  const leadSamples = 24
  const leadPts = Array.from({ length: leadSamples }, (_, i) => new THREE.Vector3(0, i * 0.1, 0))
  const leadingMesh = new THREE.Mesh(buildTubeFromSamples(leadPts, 0.085), daughterLeadMat)
  root.add(leadingMesh)

  // Lagging strand: 3 discrete Okazaki fragments + short RNA primer tips
  const okazakiFragments: { dna: THREE.Mesh; primer: THREE.Mesh }[] = []
  for (let f = 0; f < 3; f += 1) {
    const segPts = Array.from({ length: 10 }, (_, i) => new THREE.Vector3(0, i * 0.08, 0))
    const dna = new THREE.Mesh(buildTubeFromSamples(segPts, 0.082), daughterLagMat)
    const primPts = Array.from({ length: 5 }, (_, i) => new THREE.Vector3(0, i * 0.05, 0))
    const primer = new THREE.Mesh(buildTubeFromSamples(primPts, 0.095), primerMat)
    root.add(dna, primer)
    okazakiFragments.push({ dna, primer })
  }

  // Helicase ring at the replication fork
  const helicase = new THREE.Group()
  helicase.position.set(0, FORK_Y, 0)
  const helicaseTorus = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.24, quality.segments(16), quality.segments(36)),
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.25,
      metalness: 0.2,
      transparent: true,
      opacity: 0.82,
    }),
  )
  helicaseTorus.rotation.x = Math.PI / 2
  helicase.add(helicaseTorus)
  for (let k = 0; k < 6; k += 1) {
    const lobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, quality.segments(16), quality.segments(12)),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.35 }),
    )
    const ang = (k / 6) * Math.PI * 2
    lobe.position.set(Math.cos(ang) * 1.02, 0, Math.sin(ang) * 1.02)
    helicase.add(lobe)
  }
  root.add(helicase)

  // DNA Polymerase III holoenzyme spheres on leading and lagging templates
  const polLead = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.36, quality.subdivisions(2)),
    new THREE.MeshStandardMaterial({ color: palette.emerald, roughness: 0.35 }),
  )
  const polLag = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.34, quality.subdivisions(2)),
    new THREE.MeshStandardMaterial({ color: palette.emerald, roughness: 0.35 }),
  )
  root.add(polLead, polLag)

  // 5' and 3' terminal marker spheres
  const endGroup = new THREE.Group()
  const endGeo = new THREE.SphereGeometry(0.2, quality.segments(16), quality.segments(12))
  const fivePrimeMat = new THREE.MeshStandardMaterial({ color: palette.amber, emissive: 0x78350f })
  const threePrimeMat = new THREE.MeshStandardMaterial({ color: palette.rose, emissive: 0x881337 })
  const endBottomA = new THREE.Mesh(endGeo, threePrimeMat)
  const endBottomB = new THREE.Mesh(endGeo, fivePrimeMat)
  const endTopA = new THREE.Mesh(endGeo, fivePrimeMat)
  const endTopB = new THREE.Mesh(endGeo, threePrimeMat)
  endGroup.add(endBottomA, endBottomB, endTopA, endTopB)
  root.add(endGroup)

  // Base-pair nucleotide cylinders + hydrogen bond beads
  const baseMats = {
    A: new THREE.MeshStandardMaterial({ color: palette.emerald, roughness: 0.4 }),
    T: new THREE.MeshStandardMaterial({ color: palette.rose, roughness: 0.4 }),
    G: new THREE.MeshStandardMaterial({ color: palette.amber, roughness: 0.4 }),
    C: new THREE.MeshStandardMaterial({ color: palette.cyan, roughness: 0.4 }),
  }
  const hBondMat = new THREE.MeshStandardMaterial({
    color: palette.white,
    emissive: 0x94a3b8,
    emissiveIntensity: 0.6,
  })
  const baseCylGeo = new THREE.CylinderGeometry(0.055, 0.055, 1, quality.segments(10))
  baseCylGeo.rotateX(Math.PI / 2)
  const hBondGeo = new THREE.SphereGeometry(0.048, quality.segments(10), quality.segments(8))

  interface PairVisual {
    isGC: boolean
    leftBase: THREE.Mesh
    rightBase: THREE.Mesh
    hBonds: THREE.Mesh[]
  }

  const pairVisuals: PairVisual[] = []
  for (let i = 0; i < TOTAL_PAIRS; i += 1) {
    const isGC = (i * 7 + 3) % 5 < 3
    const swap = i % 2 === 0
    const leftKey = isGC ? (swap ? 'G' : 'C') : swap ? 'A' : 'T'
    const rightKey = isGC ? (swap ? 'C' : 'G') : swap ? 'T' : 'A'
    const leftBase = new THREE.Mesh(baseCylGeo, baseMats[leftKey])
    const rightBase = new THREE.Mesh(baseCylGeo, baseMats[rightKey])
    const bondCount = isGC ? 3 : 2
    const hBonds = Array.from({ length: bondCount }, () => new THREE.Mesh(hBondGeo, hBondMat))
    root.add(leftBase, rightBase, ...hBonds)
    pairVisuals.push({ isGC, leftBase, rightBase, hBonds })
  }

  let phase = 0
  let showEndsFlag = initial.showEnds === 1
  const tmpA = new THREE.Vector3()
  const tmpB = new THREE.Vector3()
  const mid = new THREE.Vector3()

  function syncGeometry(p: Params) {
    const bpScale = p.bpScale
    const showHBonds = p.showHBonds === 1
    showEndsFlag = p.showEnds === 1
    endGroup.visible = showEndsFlag

    // Update template backbones
    for (let i = 0; i < sampleCount; i += 1) {
      const s = i / (sampleCount - 1)
      strandPoint(s, -1, phase, ptsA[i])
      strandPoint(s, 1, phase, ptsB[i])
    }
    backboneA.geometry.dispose()
    backboneA.geometry = buildTubeFromSamples(ptsA, 0.095)
    backboneB.geometry.dispose()
    backboneB.geometry = buildTubeFromSamples(ptsB, 0.095)

    // Leading daughter strand mirrors left template (-1) from top down toward fork
    const forkS = (FORK_Y - Y_MIN) / (Y_MAX - Y_MIN)
    const leadProgress = 0.85 + 0.1 * Math.sin(phase * 1.5)
    for (let i = 0; i < leadSamples; i += 1) {
      const t = i / (leadSamples - 1)
      const s = 0.98 - t * (0.98 - (forkS + 0.05)) * leadProgress
      strandPoint(s, -1, phase, tmpA)
      leadPts[i].set(tmpA.x + 0.52, tmpA.y, tmpA.z)
    }
    leadingMesh.geometry.dispose()
    leadingMesh.geometry = buildTubeFromSamples(leadPts, 0.08)
    polLead.position.copy(leadPts[leadPts.length - 1])

    // Lagging strand: 3 Okazaki fragments moving upward as fork advances
    const cycle = ((phase * 0.18) % 1 + 1) % 1
    for (let f = 0; f < okazakiFragments.length; f += 1) {
      const { dna, primer } = okazakiFragments[f]
      const uStart = forkS + 0.08 + ((f + cycle * 0.65) / 3.3) * (0.94 - forkS - 0.08)
      const uEnd = Math.min(0.98, uStart + 0.13)
      const segPts: THREE.Vector3[] = []
      for (let i = 0; i < 10; i += 1) {
        const s = uStart + ((uEnd - uStart) * i) / 9
        strandPoint(s, 1, phase, tmpB)
        segPts.push(new THREE.Vector3(tmpB.x - 0.52, tmpB.y, tmpB.z))
      }
      dna.geometry.dispose()
      dna.geometry = buildTubeFromSamples(segPts, 0.078)

      const primPts: THREE.Vector3[] = []
      for (let i = 0; i < 5; i += 1) {
        const s = Math.max(forkS + 0.05, uStart - 0.035 + (0.035 * i) / 4)
        strandPoint(s, 1, phase, tmpB)
        primPts.push(new THREE.Vector3(tmpB.x - 0.52, tmpB.y, tmpB.z))
      }
      primer.geometry.dispose()
      primer.geometry = buildTubeFromSamples(primPts, 0.09)
      if (f === 0) polLag.position.copy(segPts[segPts.length - 1])
    }

    // Terminal 5'/3' spheres
    endBottomA.position.copy(ptsA[0])
    endBottomB.position.copy(ptsB[0])
    endTopA.position.copy(ptsA[ptsA.length - 1])
    endTopB.position.copy(ptsB[ptsB.length - 1])

    // Base pairs & H-bonds
    for (let i = 0; i < TOTAL_PAIRS; i += 1) {
      const s = (i + 0.5) / TOTAL_PAIRS
      strandPoint(s, -1, phase, tmpA)
      strandPoint(s, 1, phase, tmpB)
      const { leftBase, rightBase, hBonds } = pairVisuals[i]
      const intact = tmpA.y <= FORK_Y + 0.05

      if (intact) {
        mid.copy(tmpA).add(tmpB).multiplyScalar(0.5)
        const halfVec = mid.clone().sub(tmpA)
        const rungLen = Math.max(0.15, halfVec.length() * 0.78 * bpScale)

        leftBase.position.copy(tmpA).lerp(mid, 0.44)
        leftBase.lookAt(mid)
        leftBase.scale.set(bpScale, bpScale, rungLen)

        rightBase.position.copy(tmpB).lerp(mid, 0.44)
        rightBase.lookAt(mid)
        rightBase.scale.set(bpScale, bpScale, rungLen)

        hBonds.forEach((bond, idx) => {
          bond.visible = showHBonds
          const offset = (idx - (hBonds.length - 1) / 2) * 0.11
          bond.position.set(mid.x, mid.y + offset, mid.z)
        })
      } else {
        // Above fork: unpaired template bases face inward toward daughter strands
        const inwardA = tmpA.clone().add(new THREE.Vector3(0.24 * bpScale, 0, 0))
        leftBase.position.copy(tmpA).lerp(inwardA, 0.5)
        leftBase.lookAt(inwardA)
        leftBase.scale.set(bpScale, bpScale, 0.42 * bpScale)

        const inwardB = tmpB.clone().add(new THREE.Vector3(-0.24 * bpScale, 0, 0))
        rightBase.position.copy(tmpB).lerp(inwardB, 0.5)
        rightBase.lookAt(inwardB)
        rightBase.scale.set(bpScale, bpScale, 0.42 * bpScale)

        hBonds.forEach((bond) => {
          bond.visible = false
        })
      }
    }
  }

  syncGeometry(initial)

  const hotspots: Hotspot[] = [
    {
      id: 'helicase',
      label: 'Helicase',
      title: 'DNA Helicase (Replication Fork)',
      body: 'ATP-powered hexameric motor that translocates along DNA, disrupting A=T (2) and G≡C (3) hydrogen bonds to unzip the parental duplex.',
      position: (t) => t.set(0, FORK_Y + 0.15, 1.05),
    },
    {
      id: 'leading',
      label: 'Leading Strand',
      title: 'Leading Strand & DNA Pol III',
      body: 'Synthesized continuously in the 5′ → 3′ direction toward the advancing replication fork because its 3′ → 5′ template runs into the fork.',
      position: (t) => t.copy(polLead.position).add(new THREE.Vector3(-0.35, 0.25, 0)),
    },
    {
      id: 'okazaki',
      label: 'Okazaki Fragments',
      title: 'Lagging Strand & RNA Primers',
      body: 'Synthesized discontinuously away from the fork as short Okazaki fragments (amber), each initiated by a red RNA primer and later sealed by DNA Ligase.',
      position: (t) => t.copy(polLag.position).add(new THREE.Vector3(0.4, 0.25, 0)),
    },
    {
      id: '5prime-3prime',
      label: "5′ & 3′ Ends",
      title: 'Antiparallel Polarity (5′ ↔ 3′)',
      body: 'Amber caps mark 5′-phosphate ends and rose caps mark 3′-hydroxyl ends. Complementary DNA strands always run antiparallel.',
      position: (t) => t.copy(endTopA.position).add(new THREE.Vector3(-0.2, 0.25, 0)),
      visible: () => showEndsFlag,
    },
  ]

  return {
    hotspots,
    update(p: Params, dt: number) {
      phase += dt * p.unwindSpeed * 1.4
      helicase.rotation.y = phase * 1.2
      syncGeometry(p)
    },
    readouts: (p: Params) => {
      const gcCount = pairVisuals.filter((v) => v.isGC).length
      const hBondTotal = gcCount * 3 + (TOTAL_PAIRS - gcCount) * 2
      return [
        { label: 'Fork Speed', value: `${Math.round(p.unwindSpeed * 450)} bp/s` },
        { label: 'GC Content', value: `${Math.round((gcCount / TOTAL_PAIRS) * 100)}%` },
        { label: 'Duplex H-Bonds', value: `${hBondTotal} bonds` },
        { label: 'Synthesis Dir.', value: '5′ → 3′ only' },
      ]
    },
  }
}

export const DNA_FORK_MODEL: ModelDefinition = {
  id: 'dna-fork',
  title: 'DNA Replication Fork',
  subtitle:
    'Watch helicase unzip parental B-DNA while DNA Polymerase III builds the continuous leading strand and back-stitched Okazaki fragments.',
  camera: [0, 0.8, 9.5],
  params: [
    {
      kind: 'slider',
      id: 'unwindSpeed',
      label: 'Unwinding Speed',
      min: 0,
      max: 3,
      step: 0.1,
      initial: 1.0,
      unit: '×',
    },
    {
      kind: 'slider',
      id: 'bpScale',
      label: 'Base Pair Scale',
      min: 0.6,
      max: 1.5,
      step: 0.05,
      initial: 1.0,
      unit: '×',
    },
    { kind: 'toggle', id: 'showHBonds', label: 'Show Hydrogen Bonds', initial: true },
    { kind: 'toggle', id: 'showEnds', label: "Label 5′ and 3′ Ends", initial: true },
  ],
  build,
}

export default function DnaReplicationFork3D() {
  return <ModelViewer model={DNA_FORK_MODEL} />
}
