import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import type { Hotspot, ModelDefinition, Params, SceneContext } from '../engine'

/**
 * Procedural Chemical Synapse Neurotransmission:
 * - Pre-synaptic axon bouton (top) with synaptic vesicles docking & fusing
 *   at the active zone, plus voltage-gated Ca²⁺ channels along the neck.
 * - Neurotransmitter ligand molecules diffusing across the ~20 nm synaptic
 *   cleft, binding to 5-subunit post-synaptic ligand-gated ion channels
 *   (which physically dilate open when bound!), and getting cleared by
 *   pre-synaptic reuptake transporters.
 */

const LIGAND_COUNT = 120
const ION_COUNT = 45
const RECEPTOR_POSITIONS: [number, number][] = [
  [-1.7, -0.6],
  [-0.85, 0.75],
  [0, -0.15],
  [0.9, 0.65],
  [1.75, -0.55],
]

function build({ scene, palette }: SceneContext, initial: Params) {
  const root = new THREE.Group()
  scene.add(root)

  // 1. Pre-synaptic Axon Terminal Bouton (top, y > 0.75)
  const preGroup = new THREE.Group()
  const boutonGeo = new THREE.SphereGeometry(2.35, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.62)
  boutonGeo.rotateX(Math.PI)
  const boutonMat = new THREE.MeshPhysicalMaterial({
    color: 0x6366f1,
    transparent: true,
    opacity: 0.36,
    roughness: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const bouton = new THREE.Mesh(boutonGeo, boutonMat)
  bouton.position.y = 2.15
  preGroup.add(bouton)

  // Axon stalk above bouton
  const axonNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.35, 1.6, 28, 1, true),
    boutonMat,
  )
  axonNeck.position.y = 3.25
  preGroup.add(axonNeck)

  // Active zone flat pre-synaptic membrane disc at y = 0.78
  const preMembrane = new THREE.Mesh(
    new THREE.CylinderGeometry(2.12, 2.12, 0.1, 36),
    new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.65,
      roughness: 0.45,
    }),
  )
  preMembrane.position.y = 0.78
  preGroup.add(preMembrane)

  // Voltage-gated Ca2+ channels around the lateral pre-synaptic rim
  const caMat = new THREE.MeshStandardMaterial({
    color: palette.cyan,
    emissive: 0x0891b2,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  })
  const caChannels: THREE.Mesh[] = []
  for (let i = 0; i < 6; i += 1) {
    const ang = (i / 6) * Math.PI * 2 + 0.3
    const ch = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.07, 12, 20), caMat)
    ch.position.set(Math.cos(ang) * 2.02, 1.18, Math.sin(ang) * 2.02)
    ch.lookAt(0, 1.18, 0)
    preGroup.add(ch)
    caChannels.push(ch)
  }

  // Reuptake transporter barrels on pre-synaptic membrane edge
  const transporterMat = new THREE.MeshStandardMaterial({
    color: palette.violet,
    emissive: 0x5b21b6,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  })
  const transporters: THREE.Mesh[] = []
  ;[
    [-1.45, 0.95],
    [1.45, 0.95],
    [0, -1.55],
  ].forEach(([tx, tz]) => {
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.34, 16), transporterMat)
    pump.position.set(tx, 0.78, tz)
    preGroup.add(pump)
    transporters.push(pump)
  })

  // Synaptic vesicles inside pre-synaptic terminal (docking and fusing)
  const vesicleGeo = new THREE.SphereGeometry(0.32, 20, 16)
  const vesicleMat = new THREE.MeshPhysicalMaterial({
    color: palette.emerald,
    transparent: true,
    opacity: 0.62,
    roughness: 0.25,
  })
  const vesicles = Array.from({ length: 7 }, (_, i) => {
    const mesh = new THREE.Mesh(vesicleGeo, vesicleMat)
    const ang = (i / 7) * Math.PI * 2
    const rad = i === 0 ? 0 : 0.95
    mesh.position.set(Math.cos(ang) * rad, 1.55 + (i % 3) * 0.35, Math.sin(ang) * rad)
    preGroup.add(mesh)
    return { mesh, baseX: Math.cos(ang) * rad, baseZ: Math.sin(ang) * rad, phaseOffset: i / 7 }
  })
  root.add(preGroup)

  // 2. Post-synaptic Dendritic Membrane & Spine (bottom, y < -0.75)
  const postGroup = new THREE.Group()
  const postBilayer = new THREE.Mesh(
    new THREE.CylinderGeometry(2.55, 2.35, 0.24, 40),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.55 }),
  )
  postBilayer.position.y = -0.82
  postGroup.add(postBilayer)

  const dendriteBody = new THREE.Mesh(
    new THREE.SphereGeometry(2.55, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshPhysicalMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.28,
      roughness: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  dendriteBody.rotation.x = Math.PI
  dendriteBody.position.y = -0.85
  postGroup.add(dendriteBody)

  // 5 Pentameric Post-synaptic Ligand-Gated Ion Channels
  const receptorBaseMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.32,
    metalness: 0.15,
  })
  const receptorHighlightMat = new THREE.MeshStandardMaterial({
    color: palette.amber,
    emissive: 0xd97706,
    emissiveIntensity: 0.75,
    roughness: 0.28,
  })
  const receptors = RECEPTOR_POSITIONS.map(([rx, rz]) => {
    const group = new THREE.Group()
    group.position.set(rx, -0.74, rz)
    const subunits: THREE.Mesh[] = []
    for (let s = 0; s < 5; s += 1) {
      const sub = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.28, 6, 12), receptorBaseMat)
      const ang = (s / 5) * Math.PI * 2
      sub.position.set(Math.cos(ang) * 0.16, 0, Math.sin(ang) * 0.16)
      group.add(sub)
      subunits.push(sub)
    }
    postGroup.add(group)
    return { group, subunits, rx, rz, openAmount: 0 }
  })
  root.add(postGroup)

  // 3. Instanced Neurotransmitter Ligand Molecules in the Synaptic Cleft
  const ligandInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.055, 10, 8),
    new THREE.MeshStandardMaterial({
      color: palette.emerald,
      emissive: 0x059669,
      emissiveIntensity: 0.85,
    }),
    LIGAND_COUNT,
  )
  const ligands = Array.from({ length: LIGAND_COUNT }, (_, i) => ({
    x: (((i * 37) % 100) / 100 - 0.5) * 2.4,
    y: 0.7 - ((i * 19) % 100) / 100 * 1.35,
    z: (((i * 53) % 100) / 100 - 0.5) * 2.4,
    vx: Math.cos(i * 2.1) * 0.6,
    vy: -0.55 - ((i * 11) % 10) * 0.08,
    vz: Math.sin(i * 1.7) * 0.6,
  }))
  root.add(ligandInst)

  // 4. Instanced Na+ Ions streaming through open receptors into dendrite
  const ionInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshStandardMaterial({
      color: palette.rose,
      emissive: 0xe11d48,
      emissiveIntensity: 1.0,
    }),
    ION_COUNT,
  )
  root.add(ionInst)

  let openChannelCount = 3
  let caGlowFlag = initial.caGlow === 1
  const dummy = new THREE.Object3D()

  const hotspots: Hotspot[] = [
    {
      id: 'vesicles',
      label: 'Synaptic Vesicles',
      title: 'SNARE-Mediated Exocytosis',
      body: 'Membrane-bound vesicles packed with thousands of neurotransmitter molecules dock at the pre-synaptic active zone and fuse upon Ca²⁺ binding to synaptotagmin.',
      position: (t) => t.set(0, 1.45, 0.9),
    },
    {
      id: 'calcium',
      label: 'Ca²⁺ Channels',
      title: 'Voltage-Gated Calcium Influx',
      body: 'Arriving action potentials depolarize the axon bouton, opening voltage-gated Ca²⁺ channels so calcium ions rush down their steep electrochemical gradient.',
      position: (t) => t.copy(caChannels[0].position).add(new THREE.Vector3(0.2, 0.15, 0.2)),
      visible: () => caGlowFlag,
    },
    {
      id: 'receptors',
      label: 'Ionotropic Receptors',
      title: 'Ligand-Gated Ion Channels (EPSP)',
      body: 'When neurotransmitters bind to pentameric post-synaptic receptors, their 5 subunits radially dilate open, allowing Na⁺ influx to depolarize the dendrite.',
      position: (t) => t.set(RECEPTOR_POSITIONS[2][0], -0.62, RECEPTOR_POSITIONS[2][1] + 0.3),
    },
    {
      id: 'reuptake',
      label: 'Reuptake Pump',
      title: 'Neurotransmitter Clearance',
      body: 'High-affinity reuptake transporters pump unbound neurotransmitter back into the pre-synaptic terminal to terminate the synaptic signal crisply.',
      position: (t) => t.copy(transporters[1].position).add(new THREE.Vector3(0.15, 0.2, 0)),
    },
  ]

  return {
    hotspots,
    update(p: Params, dt: number, elapsed: number) {
      const freqNorm = p.apFreq / 50
      const reuptakeNorm = p.reuptakeRate
      caGlowFlag = p.caGlow === 1

      // Action potential pulse wave
      const apWave = Math.max(0, Math.sin(elapsed * (1.5 + freqNorm * 5.5)))
      caChannels.forEach((ch) => {
        ch.visible = caGlowFlag
      })
      caMat.emissiveIntensity = caGlowFlag ? 0.35 + apWave * 1.9 : 0.15

      // Vesicles cycle downward to dock at y = 0.92 and fuse
      vesicles.forEach((v) => {
        const cyc = ((elapsed * (0.25 + freqNorm * 0.55) + v.phaseOffset) % 1 + 1) % 1
        const vy = 2.05 - cyc * 1.18
        const fuseScale = cyc > 0.88 ? Math.max(0.25, 1 - (cyc - 0.88) * 6) : 1
        v.mesh.position.set(v.baseX * (1 - cyc * 0.35), vy, v.baseZ * (1 - cyc * 0.35))
        v.mesh.scale.setScalar(fuseScale)
      })

      // Active ligand fraction scales up with AP frequency and down with reuptake rate
      const activeLigands = Math.max(
        18,
        Math.min(LIGAND_COUNT, Math.round(LIGAND_COUNT * (0.28 + freqNorm * 0.72 - reuptakeNorm * 0.32))),
      )

      const receptorHits = Array.from({ length: receptors.length }, () => 0)

      for (let i = 0; i < LIGAND_COUNT; i += 1) {
        const lig = ligands[i]
        if (i >= activeLigands) {
          dummy.position.set(0, 100, 0)
          dummy.scale.setScalar(0.001)
          dummy.updateMatrix()
          ligandInst.setMatrixAt(i, dummy.matrix)
          continue
        }
        lig.x += lig.vx * dt
        lig.y += lig.vy * dt * (0.7 + freqNorm * 0.7 + reuptakeNorm * 0.4)
        lig.z += lig.vz * dt

        if (lig.y < -0.66) {
          // Check proximity to post-synaptic receptors
          receptors.forEach((rec, rIdx) => {
            if (Math.hypot(lig.x - rec.rx, lig.z - rec.rz) < 0.65) {
              receptorHits[rIdx] += 1
            }
          })
          // Recycle back to fusing vesicle zone at y = 0.72
          lig.y = 0.72
          lig.x = (((i * 41 + Math.floor(elapsed * 17)) % 100) / 100 - 0.5) * 1.9
          lig.z = (((i * 67 + Math.floor(elapsed * 13)) % 100) / 100 - 0.5) * 1.9
        }
        if (Math.hypot(lig.x, lig.z) > 1.95) {
          lig.vx *= -1
          lig.vz *= -1
        }
        dummy.position.set(lig.x, lig.y, lig.z)
        dummy.scale.setScalar(1)
        dummy.updateMatrix()
        ligandInst.setMatrixAt(i, dummy.matrix)
      }
      ligandInst.instanceMatrix.needsUpdate = true

      // Dilate receptor pores based on ligand occupancy & highlight toggle
      const useHighlight = p.highlightReceptors === 1
      let opened = 0
      receptors.forEach((rec, idx) => {
        const targetOpen = Math.min(1, (freqNorm * 0.85 + (receptorHits[idx] > 0 ? 0.4 : 0)) * (1.15 - reuptakeNorm * 0.4))
        rec.openAmount += (targetOpen - rec.openAmount) * Math.min(1, dt * 6)
        if (rec.openAmount > 0.38) opened += 1
        const poreRadius = 0.14 + rec.openAmount * 0.11
        rec.subunits.forEach((sub, s) => {
          const ang = (s / 5) * Math.PI * 2
          sub.position.set(Math.cos(ang) * poreRadius, 0, Math.sin(ang) * poreRadius)
          sub.material = useHighlight ? receptorHighlightMat : receptorBaseMat
        })
      })
      openChannelCount = opened

      // Stream Na+ ions through open channels into dendrite
      for (let i = 0; i < ION_COUNT; i += 1) {
        const rec = receptors[i % receptors.length]
        if (rec.openAmount < 0.35) {
          dummy.position.set(0, 100, 0)
          dummy.scale.setScalar(0.001)
        } else {
          const prog = ((elapsed * (1.4 + freqNorm) + i / ION_COUNT) % 1 + 1) % 1
          const iy = -0.52 - prog * 1.45
          dummy.position.set(
            rec.rx + Math.sin(prog * 6 + i) * 0.08 * prog,
            iy,
            rec.rz + Math.cos(prog * 6 + i) * 0.08 * prog,
          )
          dummy.scale.setScalar(0.95)
        }
        dummy.updateMatrix()
        ionInst.setMatrixAt(i, dummy.matrix)
      }
      ionInst.instanceMatrix.needsUpdate = true
    },
    readouts: (p: Params) => {
      const epspMv = (-70 + (p.apFreq / 100) * 32 * (1.2 - p.reuptakeRate * 0.45)).toFixed(1)
      return [
        { label: 'Firing Rate', value: `${Math.round(p.apFreq)} Hz` },
        { label: 'Reuptake Rate', value: `${Math.round(p.reuptakeRate * 100)}%` },
        { label: 'Open Channels', value: `${openChannelCount} / ${receptors.length}` },
        { label: 'Post-Synaptic Vm', value: `${epspMv} mV` },
      ]
    },
  }
}

export const SYNAPSE_NEURO_MODEL: ModelDefinition = {
  id: 'synapse-neuro',
  title: 'Chemical Synapse Transmission',
  subtitle:
    'Drive action potential frequency and reuptake pump speed to observe vesicle fusion, cleft diffusion, and ion channel gating.',
  camera: [4.2, 1.6, 5.8],
  params: [
    {
      kind: 'slider',
      id: 'apFreq',
      label: 'Action Potential Frequency',
      min: 5,
      max: 100,
      step: 5,
      initial: 45,
      unit: ' Hz',
    },
    {
      kind: 'slider',
      id: 'reuptakeRate',
      label: 'Reuptake Transporter Rate',
      min: 0.1,
      max: 1.0,
      step: 0.05,
      initial: 0.45,
    },
    { kind: 'toggle', id: 'caGlow', label: 'Calcium Influx Glow', initial: true },
    { kind: 'toggle', id: 'highlightReceptors', label: 'Receptors Highlight', initial: false },
  ],
  build,
}

export default function SynapseTransmission3D() {
  return <ModelViewer model={SYNAPSE_NEURO_MODEL} />
}
