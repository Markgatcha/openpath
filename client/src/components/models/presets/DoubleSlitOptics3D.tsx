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
 * Procedural Young's Double-Slit Wave Interference & Diffraction:
 * - Coherent monochromatic wave tank propagating from z = -4.2, passing
 *   through two slits at z = -2.0 separated by d, interfering across the
 *   propagation region, and striking a movable detector screen at z = L.
 * - Live 3D intensity curve I(x) = cos²(β)·(sin α / α)² + optional single-slit
 *   diffraction envelope (sin α / α)².
 */

const GRID_SEG = 84
const CURVE_SAMPLES = 121

/** Approximate spectral RGB for visible wavelength λ in [400, 700] nm. */
function wavelengthToColor(nm: number, target: THREE.Color): THREE.Color {
  let r = 0
  let g = 0
  let b = 0
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380)
    b = 1
  } else if (nm >= 440 && nm < 490) {
    g = (nm - 440) / (490 - 440)
    b = 1
  } else if (nm >= 490 && nm < 510) {
    g = 1
    b = -(nm - 510) / (510 - 490)
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510)
    g = 1
  } else if (nm >= 580 && nm < 645) {
    r = 1
    g = -(nm - 645) / (645 - 580)
  } else {
    r = 1
  }
  return target.setRGB(
    Math.min(1, 0.15 + r * 0.85),
    Math.min(1, 0.15 + g * 0.85),
    Math.min(1, 0.15 + b * 0.85),
  )
}

function sincSq(x: number): number {
  if (Math.abs(x) < 1e-4) return 1
  const s = Math.sin(x) / x
  return s * s
}

function build({ scene, palette }: SceneContext, initial: Params) {
  const root = new THREE.Group()
  scene.add(root)

  const barrierZ = -2.1

  // Wave surface mesh (x in [-4.2, 4.2], z in [-4.2, 4.2])
  const waveGeo = new THREE.PlaneGeometry(8.4, 8.4, GRID_SEG, GRID_SEG)
  waveGeo.rotateX(-Math.PI / 2)
  const posAttr = waveGeo.getAttribute('position') as THREE.BufferAttribute
  const colors = new Float32Array(posAttr.count * 3)
  waveGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const waveMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.3,
    metalness: 0.15,
    side: THREE.DoubleSide,
  })
  const waveMesh = new THREE.Mesh(waveGeo, waveMat)
  waveMesh.position.y = -0.6
  root.add(waveMesh)

  // Three-segment opaque barrier wall at z = barrierZ leaving two open slits
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.3 })
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 1.25, 0.14), wallMat)
  const centerWall = new THREE.Mesh(new THREE.BoxGeometry(1, 1.25, 0.14), wallMat)
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 1.25, 0.14), wallMat)
  leftWall.position.set(-2.5, -0.35, barrierZ)
  centerWall.position.set(0, -0.35, barrierZ)
  rightWall.position.set(2.5, -0.35, barrierZ)
  root.add(leftWall, centerWall, rightWall)

  // Absorption screen at z = screenZ with vertex-colored vertical fringe bands
  const screenSegX = 96
  const screenGeo = new THREE.PlaneGeometry(8.4, 2.2, screenSegX, 2)
  const screenPos = screenGeo.getAttribute('position') as THREE.BufferAttribute
  const screenColors = new Float32Array(screenPos.count * 3)
  screenGeo.setAttribute('color', new THREE.BufferAttribute(screenColors, 3))
  const screenMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  })
  const screenMesh = new THREE.Mesh(screenGeo, screenMat)
  root.add(screenMesh)

  // Live 3D Intensity Curve I(θ) & Single-Slit Envelope Curve mounted above screen
  const intensityPts = Array.from({ length: CURVE_SAMPLES }, () => new THREE.Vector3())
  const envelopePts = Array.from({ length: CURVE_SAMPLES }, () => new THREE.Vector3())
  const intensityLine = polyline(intensityPts, palette.white, 1)
  const envelopeLine = polyline(envelopePts, palette.amber, 0.85)
  root.add(intensityLine, envelopeLine)

  let screenZ = 2.6
  let showEnvelopeFlag = initial.showEnvelope === 1
  const spectral = new THREE.Color()
  const darkBg = new THREE.Color(0x0b1020)
  const tmpColor = new THREE.Color()

  function sync(p: Params, elapsed: number) {
    wavelengthToColor(p.wavelength, spectral)
    ;(intensityLine.material as THREE.LineBasicMaterial).color.copy(spectral)

    // Map physical sliders into coherent visual coordinates
    const slitHalfSep = 0.35 + ((p.slitSep - 20) / 100) * 1.45
    const slitWidth = 0.24
    screenZ = -0.2 + ((p.screenDist - 0.8) / 2.2) * 3.8
    const lambdaVis = 0.38 + ((p.wavelength - 400) / 300) * 0.48
    const k = (2 * Math.PI) / lambdaVis
    const omega = 5.5

    // Position the 3 barrier wall pieces around slits at x = ±slitHalfSep
    const innerHalf = Math.max(0.08, slitHalfSep - slitWidth / 2)
    centerWall.scale.x = innerHalf * 2
    centerWall.position.x = 0

    const outerStart = slitHalfSep + slitWidth / 2
    const outerWidth = Math.max(0.2, 4.2 - outerStart)
    leftWall.scale.x = outerWidth
    leftWall.position.x = -(outerStart + outerWidth / 2)
    rightWall.scale.x = outerWidth
    rightWall.position.x = outerStart + outerWidth / 2

    // Update 2D wave tank vertices & colors
    const showPeaks = p.showPeaks === 1
    const colorAttr = waveGeo.getAttribute('color') as THREE.BufferAttribute
    for (let i = 0; i < posAttr.count; i += 1) {
      const x = posAttr.getX(i)
      const z = posAttr.getZ(i)
      let amp = 0
      if (z < barrierZ) {
        // Incident coherent plane wave
        amp = 0.22 * Math.cos(k * z - omega * elapsed)
      } else if (z <= screenZ + 0.05) {
        // Cylindrical Huygens wavelets from Slit 1 and Slit 2
        const dz = z - barrierZ
        const r1 = Math.hypot(x + slitHalfSep, dz)
        const r2 = Math.hypot(x - slitHalfSep, dz)
        const w1 = Math.cos(k * r1 - omega * elapsed) / Math.sqrt(0.45 + r1)
        const w2 = Math.cos(k * r2 - omega * elapsed) / Math.sqrt(0.45 + r2)
        amp = 0.28 * (w1 + w2)
      }
      posAttr.setY(i, showPeaks ? amp : amp * 0.12)

      const brightness = Math.max(0, Math.min(1, 0.42 + amp * 1.65))
      tmpColor.copy(darkBg).lerp(spectral, brightness)
      colorAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b)
    }
    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    if (showPeaks) waveGeo.computeVertexNormals()

    // Update absorption screen & analytical intensity curve I(θ)
    screenMesh.position.set(0, 0.55, screenZ)
    const L = Math.max(0.5, screenZ - barrierZ)
    // Physical scaling so fringe spacing matches visual wave tank k*d*x/L
    const screenColAttr = screenGeo.getAttribute('color') as THREE.BufferAttribute
    for (let i = 0; i < screenPos.count; i += 1) {
      const x = screenPos.getX(i)
      const sinTheta = x / Math.hypot(x, L)
      const beta = k * slitHalfSep * sinTheta
      const alpha = k * (slitWidth * 0.9) * sinTheta
      const env = sincSq(alpha)
      const intensity = Math.cos(beta) ** 2 * env
      tmpColor.copy(darkBg).lerp(spectral, Math.pow(intensity, 0.75))
      screenColAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b)
    }
    screenColAttr.needsUpdate = true

    for (let i = 0; i < CURVE_SAMPLES; i += 1) {
      const x = -4.2 + (8.4 * i) / (CURVE_SAMPLES - 1)
      const sinTheta = x / Math.hypot(x, L)
      const beta = k * slitHalfSep * sinTheta
      const alpha = k * (slitWidth * 0.9) * sinTheta
      const env = sincSq(alpha)
      const intensity = Math.cos(beta) ** 2 * env
      intensityPts[i].set(x, -0.35 + intensity * 1.85, screenZ + 0.06)
      envelopePts[i].set(x, -0.35 + env * 1.85, screenZ + 0.08)
    }
    setPolyline(intensityLine, intensityPts)
    setPolyline(envelopeLine, envelopePts)

    showEnvelopeFlag = p.showEnvelope === 1
    envelopeLine.visible = showEnvelopeFlag
  }

  sync(initial, 0)

  const hotspots: Hotspot[] = [
    {
      id: 'slits',
      label: 'Double Slits',
      title: 'Huygens’ Principle & Coherent Sources',
      body: 'Each narrow aperture acts as a synchronized point-like source of cylindrical wavelets with identical wavelength λ and fixed initial phase.',
      position: (t) => t.set(0, 0.35, barrierZ),
    },
    {
      id: 'central-max',
      label: 'Central Maximum',
      title: 'Constructive Interference (Δr = mλ)',
      body: 'At x = 0, waves from both slits travel equal path lengths (Δr = 0), arriving crest-on-crest to produce peak intensity 4I₁.',
      position: (t) => t.set(0, 1.65, screenZ + 0.1),
    },
    {
      id: 'envelope',
      label: 'Diffraction Envelope',
      title: 'Single-Slit Modulation (sin α / α)²',
      body: 'Finite slit width modulates the rapid cos²(β) interference fringes beneath a broader amber single-slit diffraction envelope.',
      position: (t) => t.set(1.65, 1.15, screenZ + 0.12),
      visible: () => showEnvelopeFlag,
    },
  ]

  return {
    hotspots,
    update(p: Params, _dt: number, elapsed: number) {
      sync(p, elapsed)
    },
    readouts: (p: Params) => {
      // Δy = λ * L / d (λ in nm = 1e-9 m, d in μm = 1e-6 m, L in m -> Δy in mm)
      const fringeMm = ((p.wavelength * 1e-6 * p.screenDist) / (p.slitSep * 1e-3)).toFixed(2)
      const firstMinDeg = (
        (Math.asin(Math.min(0.99, (p.wavelength * 1e-9) / (2 * p.slitSep * 1e-6))) * 180) /
        Math.PI
      ).toFixed(2)
      return [
        { label: 'Fringe Δy = λL/d', value: `${fringeMm} mm` },
        { label: '1st Dark θ₁', value: `${firstMinDeg}°` },
        { label: 'Wavelength λ', value: `${Math.round(p.wavelength)} nm` },
        { label: 'Photon Energy', value: `${(1240 / p.wavelength).toFixed(2)} eV` },
      ]
    },
  }
}

export const WAVE_OPTICS_MODEL: ModelDefinition = {
  id: 'wave-optics',
  title: 'Double-Slit Wave Interference',
  subtitle:
    'Vary wavelength λ, slit separation d, and screen distance L to observe constructive and destructive wave interference in 3D.',
  camera: [4.6, 4.5, 6.8],
  params: [
    {
      kind: 'slider',
      id: 'slitSep',
      label: 'Slit Separation d',
      min: 20,
      max: 120,
      step: 5,
      initial: 55,
      unit: ' μm',
    },
    {
      kind: 'slider',
      id: 'wavelength',
      label: 'Wavelength λ',
      min: 400,
      max: 700,
      step: 10,
      initial: 520,
      unit: ' nm',
    },
    {
      kind: 'slider',
      id: 'screenDist',
      label: 'Screen Distance L',
      min: 0.8,
      max: 3.0,
      step: 0.1,
      initial: 2.0,
      unit: ' m',
    },
    { kind: 'toggle', id: 'showPeaks', label: 'Show 3D Wave Peaks', initial: true },
    { kind: 'toggle', id: 'showEnvelope', label: 'Show Diffraction Envelope', initial: true },
  ],
  build,
}

export default function DoubleSlitOptics3D() {
  return <ModelViewer model={WAVE_OPTICS_MODEL} />
}
