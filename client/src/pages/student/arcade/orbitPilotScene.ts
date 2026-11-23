import * as THREE from 'three'
import { disposeObject, makeTextSprite } from '@/components/models/engine'
import { scaleCount, scaleSegments, type GraphicsProfile } from '@/lib/graphics'
import {
  ATMOSPHERE_RADIUS,
  BAND_TOLERANCE,
  PLANET_RADIUS,
  isInBand,
  orbitElements,
  type OrbitElements,
  type ProbeState,
} from '@/lib/orbit-pilot'

export interface OrbitPilotView {
  /** Draw one frame. `thrust` is the engine state actually applied this frame. */
  draw: (state: ProbeState, targetRadius: number, thrust: -1 | 0 | 1, dt: number) => void
  resize: () => void
  dispose: () => void
}

const SUN_DIRECTION = new THREE.Vector3(8, 3.5, 5).normalize()

function seeded(seed: number): () => number {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return value / 2147483647
  }
}

function makePlanetTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size * 2
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const ocean = ctx.createLinearGradient(0, 0, 0, size)
    ocean.addColorStop(0, '#0b3a6e')
    ocean.addColorStop(0.5, '#1463b8')
    ocean.addColorStop(1, '#0b3a6e')
    ctx.fillStyle = ocean
    ctx.fillRect(0, 0, canvas.width, size)
    const rand = seeded(977)
    const land = ['#2f7d3a', '#3f8f45', '#7a8b3c', '#9c8a55', '#2a6b33']
    for (let i = 0; i < 46; i += 1) {
      const cx = rand() * canvas.width
      const cy = (0.16 + rand() * 0.68) * size
      const blobs = 5 + Math.floor(rand() * 6)
      ctx.fillStyle = land[i % land.length]
      for (let j = 0; j < blobs; j += 1) {
        const r = (0.025 + rand() * 0.06) * size
        const x = cx + (rand() - 0.5) * size * 0.22
        const y = cy + (rand() - 0.5) * size * 0.12
        // Draw twice so land crossing the seam wraps round the globe.
        for (const offset of [0, x < size ? canvas.width : -canvas.width]) {
          ctx.beginPath()
          ctx.ellipse(x + offset, y, r * 1.5, r, rand() * Math.PI, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    const cap = size * 0.075
    ctx.fillStyle = '#eef4fb'
    ctx.fillRect(0, 0, canvas.width, cap)
    ctx.fillRect(0, size - cap, canvas.width, cap)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

function makeCloudTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size * 2
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const rand = seeded(4211)
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 260; i += 1) {
      const r = (0.012 + rand() * 0.035) * size
      ctx.globalAlpha = 0.1 + rand() * 0.28
      ctx.beginPath()
      ctx.ellipse(rand() * canvas.width, (0.1 + rand() * 0.8) * size, r * 3.2, r, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    glow.addColorStop(0, 'rgba(255,255,255,1)')
    glow.addColorStop(0.25, 'rgba(255,255,255,0.55)')
    glow.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, 64, 64)
  }
  return new THREE.CanvasTexture(canvas)
}

/** Soft blue halo that is brightest at the planet's edge and fades outwards. */
function makeAtmosphere(segments: number): THREE.Mesh {
  const shell = PLANET_RADIUS * 1.14
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0.32, 0.6, 1) },
      uEdge: { value: Math.sqrt(1 - (PLANET_RADIUS / shell) ** 2) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uEdge;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = clamp(-dot(normalize(vNormal), normalize(vView)) / uEdge, 0.0, 1.0);
        gl_FragColor = vec4(uColor, pow(facing, 2.2) * 0.85);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(shell, segments, segments), material)
}

function makeProbe(): { group: THREE.Group; flame: THREE.Mesh } {
  const group = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xe9c46a, metalness: 0.7, roughness: 0.35 }),
  )
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    emissive: 0x1e3a8a,
    emissiveIntensity: 0.6,
    metalness: 0.4,
    roughness: 0.4,
  })
  const panelGeometry = new THREE.BoxGeometry(0.045, 0.006, 0.13)
  const left = new THREE.Mesh(panelGeometry, panelMaterial)
  left.position.z = 0.1
  const right = new THREE.Mesh(panelGeometry, panelMaterial)
  right.position.z = -0.1
  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(0.032, 0.03, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }),
  )
  dish.position.y = 0.05
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.028, 0.16, 10),
    new THREE.MeshBasicMaterial({
      color: 0xffb347,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  flame.visible = false
  group.add(body, left, right, dish, flame)
  group.scale.setScalar(1.5)
  return { group, flame }
}

/** Build the 3D flight view inside `host`. Returns null when WebGL is unavailable. */
export function createOrbitPilotView(host: HTMLElement, profile: GraphicsProfile): OrbitPilotView | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: profile.antialias,
      powerPreference: profile.tier === 'low' ? 'low-power' : 'high-performance',
    })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatioCap))
  renderer.setClearColor(0x030712)
  if (profile.environment) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
  }
  renderer.domElement.className = 'block h-full w-full'
  renderer.domElement.setAttribute('role', 'img')
  renderer.domElement.setAttribute('aria-label', 'Orbit Pilot: a probe orbiting a planet, seen from above')
  host.prepend(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300)
  const seg = (base: number, min = 8) => scaleSegments(profile, base, min)
  const textureSize = profile.detail >= 1 ? 512 : 256

  const sun = new THREE.DirectionalLight(0xfff4e0, 2.4)
  sun.position.copy(SUN_DIRECTION).multiplyScalar(20)
  scene.add(sun, new THREE.AmbientLight(0x9db4ff, 0.22))
  if (profile.rimLight) {
    const fill = new THREE.DirectionalLight(0x60a5fa, 0.3)
    fill.position.copy(SUN_DIRECTION).multiplyScalar(-20)
    scene.add(fill)
  }

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(PLANET_RADIUS, seg(72, 20), seg(48, 14)),
    new THREE.MeshStandardMaterial({ map: makePlanetTexture(textureSize), roughness: 0.82, metalness: 0.05 }),
  )
  planet.rotation.z = 0.2
  scene.add(planet)

  let clouds: THREE.Mesh | null = null
  if (profile.rimLight) {
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(PLANET_RADIUS * 1.012, seg(64, 20), seg(40, 14)),
      new THREE.MeshStandardMaterial({
        map: makeCloudTexture(textureSize),
        transparent: true,
        depthWrite: false,
        roughness: 1,
      }),
    )
    clouds.rotation.z = 0.2
    scene.add(clouds, makeAtmosphere(seg(64, 24)))
  }

  // Where the atmosphere starts: touching this ring ends the mission.
  const hazard = new THREE.Mesh(
    new THREE.RingGeometry(PLANET_RADIUS, ATMOSPHERE_RADIUS, seg(96, 32)),
    new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  )
  hazard.rotation.x = -Math.PI / 2
  scene.add(hazard)

  const starCount = scaleCount(profile, 1400, 300)
  const starPositions = new Float32Array(starCount * 3)
  const rand = seeded(90210)
  for (let i = 0; i < starCount; i += 1) {
    const u = rand() * 2 - 1
    const angle = rand() * Math.PI * 2
    const radius = 70 + rand() * 30
    const ring = Math.sqrt(1 - u * u)
    starPositions.set([radius * ring * Math.cos(angle), radius * u, radius * ring * Math.sin(angle)], i * 3)
  }
  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  scene.add(
    new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: 0xdbeafe, size: 0.32, sizeAttenuation: true, transparent: true, opacity: 0.85 }),
    ),
  )

  const band = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }),
  )
  band.rotation.x = -Math.PI / 2
  band.position.y = -0.002
  const bandEdges = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.7 }),
  )
  scene.add(band, bandEdges)
  let bandRadius = 0
  const setBand = (targetRadius: number) => {
    bandRadius = targetRadius
    const inner = targetRadius * (1 - BAND_TOLERANCE)
    const outer = targetRadius * (1 + BAND_TOLERANCE)
    band.geometry.dispose()
    band.geometry = new THREE.RingGeometry(inner, outer, seg(128, 48))
    const n = seg(128, 48)
    const edge: number[] = []
    for (const r of [inner, outer]) {
      for (let i = 0; i < n; i += 1) {
        const a0 = (i / n) * Math.PI * 2
        const a1 = ((i + 1) / n) * Math.PI * 2
        edge.push(r * Math.cos(a0), 0, r * Math.sin(a0), r * Math.cos(a1), 0, r * Math.sin(a1))
      }
    }
    bandEdges.geometry.dispose()
    bandEdges.geometry = new THREE.BufferGeometry()
    bandEdges.geometry.setAttribute('position', new THREE.Float32BufferAttribute(edge, 3))
  }

  const orbitPointCount = seg(200, 64)
  const orbitPositions = new Float32Array((orbitPointCount + 1) * 3)
  const orbitGeometry = new THREE.BufferGeometry()
  orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3))
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 })
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial)
  orbitLine.frustumCulled = false
  scene.add(orbitLine)

  const trailMax = seg(140, 40)
  const trailPoints: number[] = []
  const trailPositions = new Float32Array(trailMax * 3)
  const trailGeometry = new THREE.BufferGeometry()
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
  trailGeometry.setDrawRange(0, 0)
  const trail = new THREE.Line(
    trailGeometry,
    new THREE.LineBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.55 }),
  )
  trail.frustumCulled = false
  scene.add(trail)

  const apoapsisLabel = makeTextSprite('Ap', '#bae6fd', 0.42)
  const periapsisLabel = makeTextSprite('Pe', '#bae6fd', 0.42)
  scene.add(apoapsisLabel, periapsisLabel)

  const { group: probe, flame } = makeProbe()
  const glowTexture = makeGlowTexture()
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture, color: 0x7dd3fc, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  glow.scale.setScalar(0.55)
  scene.add(probe, glow)

  // Exhaust sparks are skipped on the lowest tier; the flame cone still shows the burn.
  const sparkCount = profile.particles >= 0.6 ? scaleCount(profile, 90) : 0
  const sparkPositions = new Float32Array(Math.max(1, sparkCount) * 3).fill(1e6)
  const sparkVelocities = new Float32Array(Math.max(1, sparkCount) * 3)
  const sparkLife = new Float32Array(Math.max(1, sparkCount))
  const sparkGeometry = new THREE.BufferGeometry()
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3))
  const sparks = new THREE.Points(
    sparkGeometry,
    new THREE.PointsMaterial({ color: 0xffc078, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  sparks.frustumCulled = false
  sparks.visible = sparkCount > 0
  scene.add(sparks)
  let nextSpark = 0
  const sparkRand = seeded(555)

  const resize = () => {
    const { clientWidth, clientHeight } = host
    if (clientWidth === 0 || clientHeight === 0) return
    renderer.setSize(clientWidth, clientHeight, false)
    const aspect = clientWidth / clientHeight
    camera.aspect = aspect
    // Pull back on narrow screens so the widest orbit still fits.
    const distance = 10.4 / Math.min(1, aspect)
    camera.position.set(0, distance * 0.8, distance * 0.6)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }
  resize()

  const drawOrbit = (el: OrbitElements) => {
    const e = el.eccentricity
    const semiLatus = el.periapsis * (1 + e)
    const sweep = el.bound ? Math.PI : Math.acos(Math.max(-1, -1 / Math.max(e, 1))) * 0.92
    for (let i = 0; i <= orbitPointCount; i += 1) {
      const nu = -sweep + (i / orbitPointCount) * sweep * 2
      const r = Math.min(14, semiLatus / Math.max(0.05, 1 + e * Math.cos(nu)))
      orbitPositions[i * 3] = r * Math.cos(el.periapsisAngle + nu)
      orbitPositions[i * 3 + 1] = 0
      orbitPositions[i * 3 + 2] = r * Math.sin(el.periapsisAngle + nu)
    }
    orbitGeometry.attributes.position.needsUpdate = true
  }

  let lastTime = Infinity
  let lastTrailTime = 0
  const draw: OrbitPilotView['draw'] = (state, targetRadius, thrust, dt) => {
    if (targetRadius !== bandRadius) setBand(targetRadius)
    const el = orbitElements(state)
    drawOrbit(el)
    const locked = isInBand(el, targetRadius)
    const unsafe = !el.bound || el.periapsis <= ATMOSPHERE_RADIUS
    orbitMaterial.color.setHex(locked ? 0x34d399 : unsafe ? 0xf87171 : 0x38bdf8)
    ;(band.material as THREE.MeshBasicMaterial).opacity = locked ? 0.34 : 0.2

    const eccentric = el.eccentricity > 0.02
    periapsisLabel.visible = eccentric
    apoapsisLabel.visible = eccentric && el.bound
    periapsisLabel.position.set(
      el.periapsis * Math.cos(el.periapsisAngle),
      0.16,
      el.periapsis * Math.sin(el.periapsisAngle),
    )
    if (el.bound) {
      apoapsisLabel.position.set(
        -el.apoapsis * Math.cos(el.periapsisAngle),
        0.16,
        -el.apoapsis * Math.sin(el.periapsisAngle),
      )
    }

    probe.position.set(state.x, 0, state.z)
    probe.rotation.y = Math.atan2(-state.vz, state.vx)
    glow.position.copy(probe.position)
    flame.visible = thrust !== 0
    if (thrust !== 0) {
      // The flame points away from the direction of the push.
      flame.rotation.z = (thrust * Math.PI) / 2
      flame.position.x = -thrust * 0.13
      flame.scale.y = 0.8 + sparkRand() * 0.5
    }

    if (state.time < lastTime) {
      trailPoints.length = 0
      lastTrailTime = 0
      sparkPositions.fill(1e6)
    }
    lastTime = state.time
    if (trailPoints.length === 0 || state.time - lastTrailTime >= 0.07) {
      lastTrailTime = state.time
      trailPoints.push(state.x, 0, state.z)
      if (trailPoints.length > trailMax * 3) trailPoints.splice(0, 3)
      trailPositions.set(trailPoints)
      trailGeometry.setDrawRange(0, trailPoints.length / 3)
      trailGeometry.attributes.position.needsUpdate = true
    }

    if (sparkCount > 0) {
      const speed = Math.hypot(state.vx, state.vz) || 1
      if (thrust !== 0) {
        for (let n = 0; n < 2; n += 1) {
          const i = nextSpark * 3
          nextSpark = (nextSpark + 1) % sparkCount
          sparkPositions[i] = state.x
          sparkPositions[i + 1] = 0
          sparkPositions[i + 2] = state.z
          const kick = -thrust * (0.5 + sparkRand() * 0.4)
          sparkVelocities[i] = state.vx + (kick * state.vx) / speed + (sparkRand() - 0.5) * 0.25
          sparkVelocities[i + 1] = (sparkRand() - 0.5) * 0.25
          sparkVelocities[i + 2] = state.vz + (kick * state.vz) / speed + (sparkRand() - 0.5) * 0.25
          sparkLife[i / 3] = 0.5 + sparkRand() * 0.4
        }
      }
      for (let i = 0; i < sparkCount; i += 1) {
        if (sparkLife[i] <= 0) continue
        sparkLife[i] -= dt
        if (sparkLife[i] <= 0) {
          sparkPositions[i * 3 + 1] = 1e6
          continue
        }
        sparkPositions[i * 3] += sparkVelocities[i * 3] * dt
        sparkPositions[i * 3 + 1] += sparkVelocities[i * 3 + 1] * dt
        sparkPositions[i * 3 + 2] += sparkVelocities[i * 3 + 2] * dt
      }
      sparkGeometry.attributes.position.needsUpdate = true
    }

    planet.rotation.y += dt * 0.05
    if (clouds) clouds.rotation.y += dt * 0.075
    renderer.render(scene, camera)
  }

  const dispose = () => {
    disposeObject(scene)
    glowTexture.dispose()
    renderer.dispose()
    // Browsers cap live WebGL contexts; release this one now rather than at garbage collection.
    renderer.forceContextLoss()
    renderer.domElement.remove()
  }

  return { draw, resize, dispose }
}
