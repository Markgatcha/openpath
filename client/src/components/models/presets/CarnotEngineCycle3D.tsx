import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import {
  polyline,
  setPolyline,
  type Hotspot,
  type ModelDefinition,
  type Params,
  type SceneContext,
} from '../engine'

/**
 * Procedural Carnot Heat Engine Cycle (3D Piston + Live P-V Indicator Loop):
 * - Left: 3D glass cylinder with reciprocating piston, instanced kinetic gas
 *   molecules whose speed and thermal color track gas temperature T(t), plus
 *   adjacent T_H (hot) and T_C (cold) thermal reservoirs with heat-flow streams.
 * - Right: Synchronized 3D P–V indicator diagram tracing:
 *     1 -> 2 Isothermal expansion at T_H (absorbs Q_H)
 *     2 -> 3 Adiabatic expansion (cools T_H -> T_C)
 *     3 -> 4 Isothermal compression at T_C (rejects Q_C)
 *     4 -> 1 Adiabatic compression (warms T_C -> T_H)
 */

const GAS_COUNT_BASE = 110
const HEAT_FLOW_COUNT_BASE = 28
const GAMMA = 5 / 3
const LOOP_SAMPLES = 96

const STAGE_NAMES = [
  '1→2 Isothermal Exp. (Q_H in)',
  '2→3 Adiabatic Exp. (Q = 0)',
  '3→4 Isothermal Comp. (Q_C out)',
  '4→1 Adiabatic Comp. (Q = 0)',
]

interface CarnotState {
  stage: number // 0..3
  V: number
  P: number
  T: number
  vMin: number
  vMax: number
  pMax: number
}

function carnotVertices(th: number, tc: number, compRatio: number) {
  const safeTc = Math.min(tc, th - 40)
  const v1 = 1.0
  const v2 = Math.max(1.35, compRatio)
  const adiaFactor = Math.pow(th / safeTc, 1 / (GAMMA - 1))
  const v3 = v2 * adiaFactor
  const v4 = v1 * adiaFactor
  return { safeTc, v1, v2, v3, v4 }
}

function evaluateCycle(u: number, th: number, tc: number, compRatio: number): CarnotState {
  const { safeTc, v1, v2, v3, v4 } = carnotVertices(th, tc, compRatio)
  const pMax = th / v1
  const seg = Math.min(3, Math.floor(u * 4))
  const local = u * 4 - seg

  let V = v1
  let T = th
  if (seg === 0) {
    // 1 -> 2 Isothermal at T_H
    V = v1 * Math.pow(v2 / v1, local)
    T = th
  } else if (seg === 1) {
    // 2 -> 3 Adiabatic expansion: T * V^(gamma-1) = const
    V = v2 * Math.pow(v3 / v2, local)
    T = th * Math.pow(v2 / V, GAMMA - 1)
  } else if (seg === 2) {
    // 3 -> 4 Isothermal at T_C
    V = v3 * Math.pow(v4 / v3, local)
    T = safeTc
  } else {
    // 4 -> 1 Adiabatic compression
    V = v4 * Math.pow(v1 / v4, local)
    T = safeTc * Math.pow(v4 / V, GAMMA - 1)
  }
  const P = T / V
  return { stage: seg, V, P, T, vMin: v1, vMax: v3, pMax }
}

function build({ scene, palette, quality }: SceneContext, initial: Params) {
  const GAS_COUNT = quality.count(GAS_COUNT_BASE)
  const HEAT_FLOW_COUNT = quality.count(HEAT_FLOW_COUNT_BASE)
  const root = new THREE.Group()
  scene.add(root)

  // ── Left assembly: Cylinder + Piston + Reservoirs (x = -2.2) ──
  const cylX = -2.25
  const cylBottomY = -2.1

  // Cylinder glass sleeve
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 4.1, quality.segments(36), 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      transparent: true,
      opacity: 0.28,
      roughness: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  sleeve.position.set(cylX, cylBottomY + 2.05, 0)
  root.add(sleeve)

  // Cylinder base plate
  const basePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.22, 1.22, 0.18, quality.segments(36)),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.55, roughness: 0.35 }),
  )
  basePlate.position.set(cylX, cylBottomY - 0.09, 0)
  root.add(basePlate)

  // Moving piston head + connecting rod
  const pistonGroup = new THREE.Group()
  const pistonHead = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 1.12, 0.28, quality.segments(36)),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.25 }),
  )
  const pistonRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 2.2, quality.segments(16)),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.65, roughness: 0.3 }),
  )
  pistonRod.position.y = 1.2
  pistonGroup.add(pistonHead, pistonRod)
  root.add(pistonGroup)

  // Hot reservoir (left of cylinder base) & Cold reservoir (right of cylinder base)
  const hotReservoir = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.7, 1.4),
    new THREE.MeshStandardMaterial({
      color: 0xea580c,
      emissive: 0x9a3412,
      emissiveIntensity: 0.85,
      roughness: 0.4,
    }),
  )
  hotReservoir.position.set(cylX - 1.4, cylBottomY - 0.48, 0)

  const coldReservoir = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.7, 1.4),
    new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x075985,
      emissiveIntensity: 0.75,
      roughness: 0.4,
    }),
  )
  coldReservoir.position.set(cylX + 1.4, cylBottomY - 0.48, 0)
  root.add(hotReservoir, coldReservoir)

  // Kinetic gas molecules inside chamber
  const gasMat = new THREE.MeshStandardMaterial({
    color: palette.amber,
    emissive: palette.amber,
    emissiveIntensity: 0.55,
    roughness: 0.3,
  })
  const gasInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.065, quality.segments(10), quality.segments(8)), gasMat, GAS_COUNT)
  const gasParticles = Array.from({ length: GAS_COUNT }, (_, i) => {
    const r = Math.sqrt(((i * 19) % 100) / 100) * 0.92
    const th = i * 2.39996
    return {
      x: Math.cos(th) * r,
      z: Math.sin(th) * r,
      uY: ((i * 31) % 100) / 100,
      vx: Math.cos(i * 1.7) * 1.4,
      vy: Math.sin(i * 2.3) * 0.75,
      vz: Math.sin(i * 1.1) * 1.4,
    }
  })
  root.add(gasInst)

  // Heat-transfer stream particles between reservoirs and cylinder base
  const heatMat = new THREE.MeshStandardMaterial({
    color: palette.rose,
    emissive: palette.rose,
    emissiveIntensity: 1.1,
  })
  const heatInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.055, quality.segments(8), quality.segments(8)),
    heatMat,
    HEAT_FLOW_COUNT,
  )
  root.add(heatInst)

  // ── Right assembly: Live 3D P–V Indicator Diagram (x = +0.5 .. +4.1) ──
  const pvOrigin = new THREE.Vector3(0.55, -2.0, 0)
  const pvW = 3.5
  const pvH = 3.6
  const xAxis = polyline(
    [pvOrigin.clone(), pvOrigin.clone().add(new THREE.Vector3(pvW + 0.25, 0, 0))],
    palette.slate,
    0.85,
  )
  const yAxis = polyline(
    [pvOrigin.clone(), pvOrigin.clone().add(new THREE.Vector3(0, pvH + 0.25, 0))],
    palette.slate,
    0.85,
  )
  const pvCurvePts = Array.from({ length: LOOP_SAMPLES + 1 }, () => new THREE.Vector3())
  const pvLoopLine = polyline(pvCurvePts, palette.cyan, 0.95)
  const pvStateDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, quality.segments(18), quality.segments(14)),
    new THREE.MeshStandardMaterial({
      color: palette.amber,
      emissive: palette.amber,
      emissiveIntensity: 1.1,
    }),
  )
  root.add(xAxis, yAxis, pvLoopLine, pvStateDot)

  let cycleU = 0
  let currentState = evaluateCycle(0, initial.tempHot, initial.tempCold, initial.compressionRatio)
  const dummy = new THREE.Object3D()
  const hotColor = new THREE.Color(0xf97316)
  const coldColor = new THREE.Color(0x22d3ee)

  function toPvPoint(V: number, P: number, vMin: number, vMax: number, pMax: number, out: THREE.Vector3) {
    const nx = (Math.log(V) - Math.log(vMin)) / Math.max(0.2, Math.log(vMax) - Math.log(vMin))
    const ny = P / Math.max(0.1, pMax)
    return out.set(
      pvOrigin.x + 0.25 + nx * (pvW - 0.35),
      pvOrigin.y + 0.2 + ny * (pvH - 0.3),
      0,
    )
  }

  function sync(p: Params, dt: number, elapsed: number) {
    const th = Math.max(p.tempHot, p.tempCold + 50)
    const tc = Math.min(p.tempCold, th - 50)

    // Optional pause dwell at stage transitions so students can inspect corners
    let speed = 0.14
    if (p.stepPause === 1) {
      const distToCorner = Math.min((cycleU * 4) % 1, 1 - ((cycleU * 4) % 1))
      if (distToCorner < 0.08) speed = 0.025
    }
    cycleU = (cycleU + dt * speed) % 1

    const st = evaluateCycle(cycleU, th, tc, p.compressionRatio)
    currentState = st

    // Piston height scales smoothly with normalized volume
    const vNorm = (Math.log(st.V) - Math.log(st.vMin)) / Math.max(0.2, Math.log(st.vMax) - Math.log(st.vMin))
    const chamberHeight = 0.85 + vNorm * 2.75
    pistonGroup.position.set(cylX, cylBottomY + chamberHeight + 0.14, 0)

    // Color gas by normalized temperature between T_C and T_H
    const tNorm = Math.max(0, Math.min(1, (st.T - tc) / Math.max(1, th - tc)))
    gasMat.color.copy(coldColor).lerp(hotColor, tNorm)
    gasMat.emissive.copy(gasMat.color)

    const speedFactor = 0.65 + tNorm * 1.85
    for (let i = 0; i < GAS_COUNT; i += 1) {
      const g = gasParticles[i]
      g.x += g.vx * dt * speedFactor
      g.z += g.vz * dt * speedFactor
      g.uY += g.vy * dt * speedFactor * 0.45
      const radSq = g.x * g.x + g.z * g.z
      if (radSq > 0.92 * 0.92) {
        const len = Math.sqrt(radSq) || 1
        const nx = g.x / len
        const nz = g.z / len
        const dot = g.vx * nx + g.vz * nz
        g.vx -= 2 * dot * nx
        g.vz -= 2 * dot * nz
        g.x = nx * 0.91
        g.z = nz * 0.91
      }
      if (g.uY < 0.06) {
        g.uY = 0.06
        g.vy = Math.abs(g.vy)
      } else if (g.uY > 0.94) {
        g.uY = 0.94
        g.vy = -Math.abs(g.vy)
      }
      dummy.position.set(cylX + g.x, cylBottomY + g.uY * chamberHeight, g.z)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      gasInst.setMatrixAt(i, dummy.matrix)
    }
    gasInst.instanceMatrix.needsUpdate = true

    // Heat flow particles active during stage 0 (Q_H in) and stage 2 (Q_C out)
    const showHeat = p.showHeatFlow === 1 && (st.stage === 0 || st.stage === 2)
    heatInst.visible = showHeat
    if (showHeat) {
      const isHotIn = st.stage === 0
      heatMat.color.setHex(isHotIn ? 0xf97316 : 0x38bdf8)
      heatMat.emissive.setHex(isHotIn ? 0xea580c : 0x0284c7)
      for (let i = 0; i < HEAT_FLOW_COUNT; i += 1) {
        const prog = ((elapsed * 1.8 + i / HEAT_FLOW_COUNT) % 1 + 1) % 1
        const startX = isHotIn ? cylX - 1.35 : cylX + 0.1
        const endX = isHotIn ? cylX - 0.1 : cylX + 1.35
        const hx = startX + (endX - startX) * prog
        const hy = cylBottomY - 0.42 + Math.sin(prog * Math.PI) * 0.42
        const hz = (((i * 23) % 100) / 100 - 0.5) * 0.8
        dummy.position.set(hx, hy, hz)
        dummy.scale.setScalar(0.85 + 0.35 * Math.sin(prog * Math.PI))
        dummy.updateMatrix()
        heatInst.setMatrixAt(i, dummy.matrix)
      }
      heatInst.instanceMatrix.needsUpdate = true
    }

    // Update P-V closed loop & state dot
    for (let i = 0; i <= LOOP_SAMPLES; i += 1) {
      const s = evaluateCycle(i / LOOP_SAMPLES, th, tc, p.compressionRatio)
      toPvPoint(s.V, s.P, s.vMin, s.vMax, s.pMax, pvCurvePts[i])
    }
    setPolyline(pvLoopLine, pvCurvePts)
    toPvPoint(st.V, st.P, st.vMin, st.vMax, st.pMax, pvStateDot.position)
  }

  sync(initial, 0, 0)

  const hotspots: Hotspot[] = [
    {
      id: 'piston',
      label: 'Working Gas',
      title: 'Ideal Gas Kinetic Distribution',
      body: 'Gas molecules speed up (orange) during adiabatic compression and slow down (cyan) during adiabatic expansion as internal energy ΔU = nC_vΔT converts into mechanical piston work.',
      position: (t) => t.set(cylX, cylBottomY + 1.3, 1.15),
    },
    {
      id: 'hot-res',
      label: 'Hot Reservoir T_H',
      title: 'Isothermal Heat Absorption (Q_H)',
      body: 'During Stage 1→2, heat Q_H flows from the hot reservoir into the gas at constant temperature T_H so all absorbed heat becomes expansion work W = nRT_H ln(V₂/V₁).',
      position: (t) => t.copy(hotReservoir.position).add(new THREE.Vector3(0, 0.5, 0.5)),
    },
    {
      id: 'cold-res',
      label: 'Cold Sink T_C',
      title: 'Entropy Rejection (Second Law)',
      body: 'No cyclic engine can convert 100% of heat into work: Stage 3→4 must dump waste heat Q_C = Q_H(T_C/T_H) into the cold sink to reset entropy.',
      position: (t) => t.copy(coldReservoir.position).add(new THREE.Vector3(0, 0.5, 0.5)),
    },
    {
      id: 'pv-loop',
      label: 'P–V Loop',
      title: 'Enclosed Area = Net Work W_net',
      body: 'Steeper curves are adiabats (PV^γ = const); shallower curves are isotherms (PV = const). The area enclosed inside the loop equals net work output per cycle.',
      position: (t) => t.copy(pvStateDot.position).add(new THREE.Vector3(0, 0.28, 0)),
    },
  ]

  return {
    hotspots,
    update(p: Params, dt: number, elapsed: number) {
      sync(p, dt, elapsed)
    },
    readouts: (p: Params) => {
      const th = Math.max(p.tempHot, p.tempCold + 50)
      const tc = Math.min(p.tempCold, th - 50)
      const eff = ((1 - tc / th) * 100).toFixed(1)
      return [
        { label: 'Carnot η_max', value: `${eff}%` },
        { label: 'Active Stage', value: STAGE_NAMES[currentState.stage] ?? '' },
        { label: 'Gas Temp T', value: `${Math.round(currentState.T)} K` },
        { label: 'Volume V / V₁', value: `${currentState.V.toFixed(2)}×` },
      ]
    },
  }
}

export const CARNOT_CYCLE_MODEL: ModelDefinition = {
  id: 'carnot-cycle',
  title: 'Carnot Heat Engine & P–V Cycle',
  subtitle:
    'Tune reservoir temperatures T_H and T_C to watch a 3D kinetic gas piston trace isothermal and adiabatic paths on a synchronized P–V diagram.',
  camera: [0, 1.3, 9.2],
  params: [
    {
      kind: 'slider',
      id: 'tempHot',
      label: 'Hot Reservoir T_H',
      min: 450,
      max: 1000,
      step: 25,
      initial: 750,
      unit: ' K',
    },
    {
      kind: 'slider',
      id: 'tempCold',
      label: 'Cold Sink T_C',
      min: 150,
      max: 400,
      step: 25,
      initial: 250,
      unit: ' K',
    },
    {
      kind: 'slider',
      id: 'compressionRatio',
      label: 'Isothermal Expansion V₂/V₁',
      min: 1.4,
      max: 3.0,
      step: 0.1,
      initial: 2.0,
      unit: '×',
    },
    { kind: 'toggle', id: 'showHeatFlow', label: 'Show Heat Flow Particles', initial: true },
    { kind: 'toggle', id: 'stepPause', label: 'Step-by-Step Corner Dwell', initial: false },
  ],
  build,
}

export default function CarnotEngineCycle3D() {
  return <ModelViewer model={CARNOT_CYCLE_MODEL} />
}
