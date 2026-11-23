import * as THREE from 'three'
import {
  PALETTE,
  initialParams,
  type ChoiceParam,
  type ModelChallenge,
  type ParamDef,
  type Params,
  type Readout,
  type SliderParam,
  type ToggleParam,
} from './shared-types'
import { scaleCount, scaleSegments, type GraphicsProfile } from '@/lib/graphics'

export {
  PALETTE,
  initialParams,
  type ChoiceParam,
  type ModelChallenge,
  type ParamDef,
  type Params,
  type Readout,
  type SliderParam,
  type ToggleParam,
}

/**
 * Procedural 3D model engine — the contract between the generic
 * <ModelViewer> and each preset scene. Presets build everything from
 * math (no GLTF/GLB assets), so the whole lab works offline and ships
 * as code inside the lazily loaded `three-vendor` chunk.
 */

export interface Hotspot {
  id: string
  label: string
  title: string
  body: string
  /** World position, written into `target` every frame (hotspots can move). */
  position: (target: THREE.Vector3) => THREE.Vector3
  /** Hidden hotspots (e.g. for an atom that isn't in the current molecule). */
  visible?: () => boolean
}

export interface SceneInstance {
  /** Advance the simulation. `dt` is seconds since the last frame (0 when paused). */
  update: (params: Params, dt: number, elapsed: number) => void
  hotspots: Hotspot[]
  /** Live numbers for the side panel (polled a few times per second). */
  readouts?: (params: Params) => Readout[]
  /** Numeric metrics read by ModelChallenge.manipulate evaluators. */
  metrics?: (params: Params) => Record<string, number>
  /** Optional discrete step action for paused inspection. */
  step?: (params: Params, direction: 1 | -1) => void
  /** Optional 2D HUD plot synchronized with the 3D scene (e.g., Wiggers / flux waveform). */
  hudPlot?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: Params,
    elapsed: number,
  ) => void
  /** Extra cleanup beyond the automatic scene-graph disposal. */
  dispose?: () => void
}

export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  /** Accent colors that read well on the dark lab background. */
  palette: typeof PALETTE
  /** Detail scaling for the active graphics tier. */
  quality: SceneQuality
}

export interface SceneQuality {
  profile: GraphicsProfile
  /** Scaled segment count for curved geometry. */
  segments: (base: number) => number
  /** Scaled subdivision level for polyhedron geometry (each level is 4x the faces). */
  subdivisions: (base: number) => number
  /** Scaled particle or instance count. */
  count: (base: number) => number
}

export function makeSceneQuality(profile: GraphicsProfile): SceneQuality {
  const shift = profile.detail < 0.5 ? -2 : profile.detail < 1 ? -1 : 0
  return {
    profile,
    segments: (base) => scaleSegments(profile, base, Math.min(base, 5)),
    subdivisions: (base) => Math.max(Math.min(base, 1), base + shift),
    count: (base) => scaleCount(profile, base),
  }
}

export interface ModelDefinition {
  id: string
  title: string
  subtitle: string
  params: ParamDef[]
  /** Starting camera position. */
  camera: [number, number, number]
  /** Optional Predict -> Manipulate -> Check learning challenges. */
  challenges?: ModelChallenge[]
  /** Optional title for the 2D HUD plot overlay. */
  hudTitle?: string
  build: (ctx: SceneContext, params: Params) => SceneInstance
}

export type PresetScene = ModelDefinition

/** Free every GPU resource reachable from `root`. */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh
    mesh.geometry?.dispose()
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(material)) {
      material.forEach((m) => {
        const map = (m as THREE.SpriteMaterial | THREE.MeshBasicMaterial).map
        map?.dispose()
        m.dispose()
      })
    } else if (material) {
      const map = (material as THREE.SpriteMaterial | THREE.MeshBasicMaterial).map
      map?.dispose()
      material.dispose()
    }
  })
}

/** Crisp in-scene billboard sprite label built from CanvasTexture (spatial contiguity). */
export function makeTextSprite(
  text: string,
  color = '#f8fafc',
  scale = 0.75,
  bg = 'rgba(15, 23, 42, 0.72)',
): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const fontSize = 28
  const padX = 16
  const padY = 10
  if (ctx) {
    ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`
    const metrics = ctx.measureText(text)
    canvas.width = Math.max(64, Math.ceil(metrics.width + padX * 2))
    canvas.height = fontSize + padY * 2
    ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.roundRect(0, 0, canvas.width, canvas.height, 10)
    ctx.fill()
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1)
  } else {
    canvas.width = 128
    canvas.height = 48
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(material)
  const aspect = canvas.width / Math.max(1, canvas.height)
  sprite.scale.set(scale * aspect, scale, 1)
  return sprite
}

/** A thin line segment strip from points (used for vectors, arcs, orbits). */
export function polyline(points: THREE.Vector3[], color: number, opacity = 1): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  })
  return new THREE.Line(geometry, material)
}

/** Overwrite a polyline's vertices in place (same point count). */
export function setPolyline(line: THREE.Line, points: THREE.Vector3[]): void {
  const attribute = line.geometry.getAttribute('position') as THREE.BufferAttribute
  if (attribute.count !== points.length) {
    line.geometry.setFromPoints(points)
    return
  }
  points.forEach((p, i) => attribute.setXYZ(i, p.x, p.y, p.z))
  attribute.needsUpdate = true
  line.geometry.computeBoundingSphere()
}

/** Points along a circular arc from direction `a` to `b` around `center`. */
export function arcPoints(
  center: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  segments = 24,
): THREE.Vector3[] {
  const ua = a.clone().normalize()
  const ub = b.clone().normalize()
  const out: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const angle = ua.angleTo(ub)
    const s = Math.sin(angle) || 1
    const dir = ua
      .clone()
      .multiplyScalar(Math.sin((1 - t) * angle) / s)
      .add(ub.clone().multiplyScalar(Math.sin(t * angle) / s))
    out.push(center.clone().add(dir.multiplyScalar(radius)))
  }
  return out
}

/** A cone-tipped arrow whose direction and length can be updated per frame. */
export function makeArrow(color: number): THREE.ArrowHelper {
  return new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, color, 0.25, 0.14)
}
