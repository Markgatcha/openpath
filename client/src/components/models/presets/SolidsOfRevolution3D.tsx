import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import {
  disposeObject,
  polyline,
  setPolyline,
  type Hotspot,
  type ModelDefinition,
  type Params,
  type SceneContext,
} from '../engine'

/**
 * Solids of revolution: a 2D curve y = f(x) on [0, L] is revolved around
 * the x-axis with a LatheGeometry. A movable slicing plane shows the
 * cross-section (disk or washer) whose area π(R² − r²) is integrated
 * numerically (Simpson's rule) for the volume readout.
 */

interface Curve {
  label: string
  formula: string
  f: (x: number) => number
}

const CURVES: Curve[] = [
  { label: '√x', formula: 'f(x) = √x', f: (x) => Math.sqrt(x) },
  { label: 'x²/4', formula: 'f(x) = x²/4', f: (x) => (x * x) / 4 + 0.05 },
  { label: 'sin', formula: 'f(x) = 1.2 + sin x', f: (x) => 1.2 + Math.sin(x) },
  { label: 'line', formula: 'f(x) = 0.5 + 0.35x', f: (x) => 0.5 + 0.35 * x },
]

const L = 4
const SAMPLES = 96

function simpson(g: (x: number) => number, a: number, b: number, n = 200): number {
  const h = (b - a) / n
  let sum = g(a) + g(b)
  for (let i = 1; i < n; i += 1) sum += g(a + i * h) * (i % 2 === 0 ? 2 : 4)
  return (sum * h) / 3
}

function build({ scene, palette, quality }: SceneContext, _params: Params) {
  // Shift so the solid is centered on the origin (x ∈ [−L/2, L/2]).
  const offset = -L / 2

  const axis = polyline([new THREE.Vector3(offset - 0.6, 0, 0), new THREE.Vector3(-offset + 0.6, 0, 0)], palette.white, 0.7)
  scene.add(axis)
  scene.add(new THREE.GridHelper(8, 16, 0x334155, 0x1e293b))

  const solid = new THREE.Group()
  scene.add(solid)

  const curveLine = polyline(Array.from({ length: SAMPLES + 1 }, () => new THREE.Vector3()), palette.amber)
  const innerLine = polyline(Array.from({ length: SAMPLES + 1 }, () => new THREE.Vector3()), palette.rose)
  scene.add(curveLine, innerLine)

  const slice = new THREE.Mesh(
    new THREE.RingGeometry(0, 1, quality.segments(64)),
    new THREE.MeshStandardMaterial({
      color: palette.cyan,
      emissive: palette.cyan,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    }),
  )
  slice.rotation.y = Math.PI / 2
  scene.add(slice)

  let curve = CURVES[0]
  let key = ''
  let washer = false

  const outer = (x: number) => curve.f(x)
  const inner = (x: number) => (washer ? curve.f(x) * 0.45 : 0)

  function rebuild(p: Params) {
    disposeObject(solid)
    solid.clear()
    curve = CURVES[p.curve] ?? CURVES[0]
    washer = p.washer === 1
    const sweep = (p.sweep * Math.PI) / 180

    // Lathe revolves (radius, height) around +Y; we then turn +Y into +X.
    const profile = (g: (x: number) => number) =>
      Array.from({ length: SAMPLES + 1 }, (_, i) => {
        const x = (i / SAMPLES) * L
        return new THREE.Vector2(Math.max(g(x), 0.0001), x + offset)
      })

    const material = new THREE.MeshStandardMaterial({
      color: palette.brand,
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const outerMesh = new THREE.Mesh(new THREE.LatheGeometry(profile(outer), quality.segments(96), 0, sweep), material)
    outerMesh.rotation.z = -Math.PI / 2
    solid.add(outerMesh)
    const wire = new THREE.Mesh(
      outerMesh.geometry,
      new THREE.MeshBasicMaterial({ color: palette.violet, wireframe: true, transparent: true, opacity: 0.12 }),
    )
    wire.rotation.z = -Math.PI / 2
    solid.add(wire)

    if (washer) {
      const innerMesh = new THREE.Mesh(
        new THREE.LatheGeometry(profile(inner), quality.segments(96), 0, sweep),
        new THREE.MeshStandardMaterial({ color: palette.rose, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }),
      )
      innerMesh.rotation.z = -Math.PI / 2
      solid.add(innerMesh)
    }

    const pts = (g: (x: number) => number) =>
      Array.from({ length: SAMPLES + 1 }, (_, i) => {
        const x = (i / SAMPLES) * L
        return new THREE.Vector3(x + offset, g(x), 0)
      })
    setPolyline(curveLine, pts(outer))
    setPolyline(innerLine, pts(inner))
    innerLine.visible = washer
  }

  const volume = (p: Params) =>
    Math.PI * simpson((x) => outer(x) ** 2 - inner(x) ** 2, 0, L) * (p.sweep / 360)

  const hotspots: Hotspot[] = [
    {
      id: 'curve',
      label: 'f(x)',
      title: 'The generating curve',
      body: 'The amber curve is the region’s top boundary. Revolving it around the x-axis traces a surface: every point at height f(x) sweeps a circle of radius f(x).',
      position: (t) => t.set(L * 0.75 + offset, outer(L * 0.75) + 0.2, 0),
    },
    {
      id: 'axis',
      label: 'Axis',
      title: 'Axis of revolution',
      body: 'Here the axis is y = 0. Revolving around a different line (say y = −1) shifts every radius: R(x) = f(x) + 1. Always measure radii from the axis, not from the x-axis by habit.',
      position: (t) => t.set(-offset + 0.5, 0.15, 0),
    },
    {
      id: 'slice',
      label: 'Cross-section',
      title: 'Disk / washer slice',
      body: 'A slice perpendicular to the axis is a disk of area πR² — or a washer of area π(R² − r²) when there is a hole. Volume is the integral of these areas: V = ∫ A(x) dx.',
      position: (t) => t.copy(slice.position).add(new THREE.Vector3(0, slice.scale.y + 0.15, 0)),
    },
  ]

  return {
    hotspots,
    update(p: Params) {
      const nextKey = `${p.curve}:${p.sweep}:${p.washer}`
      if (nextKey !== key) {
        key = nextKey
        rebuild(p)
      }
      const x0 = p.slice * L
      const R = outer(x0)
      const r = inner(x0)
      slice.position.set(x0 + offset, 0, 0)
      slice.scale.setScalar(R)
      // RingGeometry inner radius is relative to the unit outer radius.
      const ring = slice.geometry as THREE.RingGeometry
      const wantedInner = R > 0 ? r / R : 0
      if (Math.abs(ring.parameters.innerRadius - wantedInner) > 1e-3) {
        slice.geometry.dispose()
        slice.geometry = new THREE.RingGeometry(wantedInner, 1, quality.segments(64))
      }
      slice.visible = p.showSlice === 1
    },
    readouts: (p: Params) => {
      const x0 = p.slice * L
      const R = outer(x0)
      const r = inner(x0)
      return [
        { label: 'Curve', value: curve.formula },
        { label: 'Slice at x', value: x0.toFixed(2) },
        { label: 'R(x)', value: R.toFixed(3) },
        { label: 'r(x)', value: r.toFixed(3) },
        { label: 'Slice area', value: (Math.PI * (R * R - r * r)).toFixed(3) },
        { label: `Volume (${p.sweep}°)`, value: volume(p).toFixed(3) },
      ]
    },
  }
}

export const SOLIDS_MODEL: ModelDefinition = {
  id: 'solids',
  title: 'Solids of Revolution',
  subtitle:
    'Revolve a curve around the x-axis on [0, 4]. Drag the sweep to watch the solid form, move the slicing plane, and switch to washers to cut a hole.',
  camera: [3.5, 3.5, 6.5],
  params: [
    { kind: 'choice', id: 'curve', label: 'Curve', choices: CURVES.map((c) => c.label), initial: 0 },
    { kind: 'slider', id: 'sweep', label: 'Revolution sweep', min: 10, max: 360, step: 5, initial: 300, unit: '°' },
    { kind: 'slider', id: 'slice', label: 'Slice position', min: 0, max: 1, step: 0.01, initial: 0.5, format: (v) => `x = ${(v * L).toFixed(2)}` },
    { kind: 'toggle', id: 'washer', label: 'Washer method (inner r = 0.45·f)', initial: false },
    { kind: 'toggle', id: 'showSlice', label: 'Show slicing plane', initial: true },
  ],
  build,
}

export default function SolidsOfRevolution3D() {
  return <ModelViewer model={SOLIDS_MODEL} />
}
