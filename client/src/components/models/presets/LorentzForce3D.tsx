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
 * Procedural Lorentz Force Cyclotron & Helical Motion:
 * Integrates exact relativistic/Newtonian Lorentz dynamics
 *   F = q (E + v × B)
 * with uniform magnetic field B = (0, B, 0) along +Y and uniform electric
 * field E = (0, E_y, 0) along +Y (accelerating pitch along B-field lines!).
 */

const TRAIL_LEN = 260

function computeTrajectory(p: Params, maxTime: number): {
  points: THREE.Vector3[]
  pos: THREE.Vector3
  vel: THREE.Vector3
  force: THREE.Vector3
} {
  const B = p.bField
  const v0 = p.velocity
  const q = p.charge
  const Ey = p.eField

  // Launch with transverse v_x and modest parallel v_y so helices are vivid
  const vx0 = v0 * 0.88
  const vy0 = v0 * 0.38
  const pos = new THREE.Vector3(0, -2.4, 0)
  const vel = new THREE.Vector3(vx0, vy0, 0)
  const bVec = new THREE.Vector3(0, B, 0)
  const eVec = new THREE.Vector3(0, Ey, 0)

  const points: THREE.Vector3[] = []
  const steps = TRAIL_LEN - 1
  const dt = Math.max(0.002, maxTime / steps)

  // Boris-like / RK4 integration of dv/dt = q(E + v x B) (unit mass m = 1)
  const accel = (v: THREE.Vector3) =>
    v.clone().cross(bVec).add(eVec).multiplyScalar(q)

  points.push(pos.clone())
  for (let i = 0; i < steps; i += 1) {
    const k1v = accel(vel)
    const k1x = vel.clone()

    const v2 = vel.clone().addScaledVector(k1v, dt * 0.5)
    const k2v = accel(v2)
    const k2x = v2

    const v3 = vel.clone().addScaledVector(k2v, dt * 0.5)
    const k3v = accel(v3)
    const k3x = v3

    const v4 = vel.clone().addScaledVector(k3v, dt)
    const k4v = accel(v4)
    const k4x = v4

    pos.addScaledVector(
      k1x.addScaledVector(k2x, 2).addScaledVector(k3x, 2).add(k4x),
      dt / 6,
    )
    vel.addScaledVector(
      k1v.addScaledVector(k2v, 2).addScaledVector(k3v, 2).add(k4v),
      dt / 6,
    )
    points.push(pos.clone())
  }

  const force = vel.clone().cross(bVec).add(eVec).multiplyScalar(q)
  return { points, pos, vel, force }
}

function build({ scene, palette, quality }: SceneContext, initial: Params) {
  const root = new THREE.Group()
  scene.add(root)

  // Uniform B-field grid arrows pointing upward (+Y)
  const bFieldGroup = new THREE.Group()
  for (let gx = -3; gx <= 3; gx += 2) {
    for (let gz = -3; gz <= 3; gz += 2) {
      const arrow = makeArrow(0x38bdf8)
      arrow.position.set(gx, -2.8, gz)
      arrow.setDirection(new THREE.Vector3(0, 1, 0))
      arrow.setLength(5.6, 0.22, 0.11)
      arrow.line.material = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.28,
      })
      bFieldGroup.add(arrow)
    }
  }
  root.add(bFieldGroup)

  // Translucent E-field capacitor reference rings at bottom and top
  const plateGeo = new THREE.RingGeometry(0.4, 3.8, quality.segments(48))
  plateGeo.rotateX(Math.PI / 2)
  const bottomPlate = new THREE.Mesh(
    plateGeo,
    new THREE.MeshBasicMaterial({
      color: palette.rose,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
    }),
  )
  bottomPlate.position.y = -2.8
  const topPlate = new THREE.Mesh(
    plateGeo,
    new THREE.MeshBasicMaterial({
      color: palette.cyan,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
    }),
  )
  topPlate.position.y = 2.8
  root.add(bottomPlate, topPlate)

  // Charged particle sphere + glow halo
  const particleMat = new THREE.MeshStandardMaterial({
    color: palette.rose,
    emissive: palette.rose,
    emissiveIntensity: 0.7,
    roughness: 0.25,
  })
  const particle = new THREE.Mesh(new THREE.SphereGeometry(0.22, quality.segments(24), quality.segments(18)), particleMat)
  root.add(particle)

  // Trajectory polyline
  const initPoints = Array.from({ length: TRAIL_LEN }, () => new THREE.Vector3())
  const trail = polyline(initPoints, palette.amber, 0.95)
  root.add(trail)

  // Live Velocity (emerald) and Magnetic Force (rose/violet) vectors
  const velArrow = makeArrow(palette.emerald)
  const forceArrow = makeArrow(palette.rose)
  root.add(velArrow, forceArrow)

  let simPhase = 0.65
  let latestVel = new THREE.Vector3()
  let latestForce = new THREE.Vector3()

  function sync(p: Params) {
    // Color particle by sign of charge q
    const qColor = p.charge > 0.05 ? palette.rose : p.charge < -0.05 ? palette.cyan : palette.slate
    particleMat.color.setHex(qColor)
    particleMat.emissive.setHex(qColor)

    const full = computeTrajectory(p, 4.2)
    setPolyline(trail, full.points)

    const idx = Math.min(
      full.points.length - 1,
      Math.max(1, Math.floor(simPhase * (full.points.length - 1))),
    )
    const sub = computeTrajectory(p, 4.2 * (idx / (full.points.length - 1)))
    particle.position.copy(sub.pos)
    latestVel.copy(sub.vel)
    latestForce.copy(sub.force)

    // Scale B-field arrows subtly with B strength
    const bLen = 2.2 + (p.bField / 3) * 3.4
    bFieldGroup.children.forEach((child) => {
      const arr = child as THREE.ArrowHelper
      arr.setLength(bLen, 0.22, 0.11)
    })

    velArrow.visible = p.showVel === 1 && sub.vel.lengthSq() > 0.001
    if (velArrow.visible) {
      velArrow.position.copy(sub.pos)
      velArrow.setDirection(sub.vel.clone().normalize())
      velArrow.setLength(Math.min(2.2, 0.45 + sub.vel.length() * 0.35), 0.22, 0.12)
    }

    forceArrow.visible = p.showForce === 1 && sub.force.lengthSq() > 0.001
    if (forceArrow.visible) {
      forceArrow.position.copy(sub.pos)
      forceArrow.setDirection(sub.force.clone().normalize())
      forceArrow.setLength(Math.min(2.2, 0.45 + sub.force.length() * 0.25), 0.22, 0.12)
    }
  }

  sync(initial)

  const hotspots: Hotspot[] = [
    {
      id: 'particle',
      label: 'Charged Particle',
      title: 'Right-Hand Rule & Charge Sign',
      body: 'Positive charges (q > 0, rose) and negative charges (q < 0, cyan) spiral with opposite handedness around B. Setting q = 0 eliminates Lorentz force completely, turning the helix into a straight Newton’s-first-law line!',
      position: (t) => t.copy(particle.position).add(new THREE.Vector3(0, 0.32, 0)),
    },
    {
      id: 'bfield',
      label: 'B-Field Lines',
      title: 'Uniform Magnetic Field B (+Y)',
      body: 'Magnetic force q(v × B) acts strictly perpendicular to velocity, supplying centripetal force qv⊥B = mv⊥²/r without doing mechanical work.',
      position: (t) => t.set(2, 1.8, 2),
    },
    {
      id: 'helix',
      label: 'Helical Pitch',
      title: 'Cyclotron Radius & E-Field Acceleration',
      body: 'Increasing B tightens the Larmor radius r = mv⊥/(|q|B). Adding parallel electric field E stretches the helix pitch as v∥ accelerates.',
      position: (t) => t.set(0, -2.4, 0),
    },
  ]

  return {
    hotspots,
    update(p: Params, dt: number) {
      simPhase = (simPhase + dt * 0.22) % 1
      if (simPhase < 0.04) simPhase = 0.04
      sync(p)
    },
    readouts: (p: Params) => {
      const vPerp = p.velocity * 0.88
      const qB = Math.abs(p.charge * p.bField)
      const radius = qB > 0.02 ? (vPerp / qB).toFixed(2) + ' m' : '∞ (straight)'
      const omega = qB.toFixed(2)
      return [
        { label: 'Larmor Radius r', value: radius },
        { label: 'Cyclotron ω_c', value: `${omega} rad/s` },
        { label: 'Speed |v|', value: `${latestVel.length().toFixed(2)} Mm/s` },
        { label: 'Force |F|', value: `${latestForce.length().toFixed(2)} pN` },
      ]
    },
  }
}

export const LORENTZ_FORCE_MODEL: ModelDefinition = {
  id: 'lorentz-force',
  title: 'Lorentz Force & Cyclotron Helix',
  subtitle:
    'Launch positive, negative, or neutral particles through uniform B and E fields to explore helical trajectories under F = q(E + v × B).',
  camera: [5.8, 3.2, 6.8],
  params: [
    {
      kind: 'slider',
      id: 'bField',
      label: 'Magnetic Field B',
      min: 0.2,
      max: 3.0,
      step: 0.1,
      initial: 1.5,
      unit: ' T',
    },
    {
      kind: 'slider',
      id: 'velocity',
      label: 'Particle Speed v',
      min: 0.5,
      max: 4.0,
      step: 0.1,
      initial: 2.2,
      unit: ' Mm/s',
    },
    {
      kind: 'slider',
      id: 'charge',
      label: 'Charge q',
      min: -2,
      max: 2,
      step: 0.5,
      initial: 1,
      unit: ' e',
    },
    {
      kind: 'slider',
      id: 'eField',
      label: 'Parallel E-Field',
      min: -0.8,
      max: 0.8,
      step: 0.1,
      initial: 0.2,
      unit: ' kV/m',
    },
    { kind: 'toggle', id: 'showVel', label: 'Velocity Vector v', initial: true },
    { kind: 'toggle', id: 'showForce', label: 'Magnetic Force Vector F', initial: true },
  ],
  build,
}

export default function LorentzForce3D() {
  return <ModelViewer model={LORENTZ_FORCE_MODEL} />
}
