/**
 * Flight model for the Orbit Pilot arcade game: a probe in a planar two-body
 * orbit whose engine fires along (or against) its direction of travel.
 *
 * Scene units: the planet's radius is 1 and its gravitational parameter is 1.
 * Readouts are converted to Earth-like kilometres and metres per second.
 */

export const MU = 1
export const PLANET_RADIUS = 1
/** Below this radius the probe is in the atmosphere and is lost. */
export const ATMOSPHERE_RADIUS = 1.06
/** Beyond this radius the probe is treated as gone. */
export const ESCAPE_RADIUS = 7
/** Engine acceleration while firing, in scene units per second squared. */
export const THRUST_ACCEL = 0.05
/** Fraction of the target radius the orbit's high and low points may miss by. */
export const BAND_TOLERANCE = 0.07
/** Seconds the orbit must stay inside the band, engine off, to lock in. */
export const LOCK_SECONDS = 1.2
export const MISSION_TIME_LIMIT = 150

const STEP = 1 / 240
const KM_PER_UNIT = 6371
const EARTH_GM = 398600
/** Scene speed 1 is the orbital speed at the planet's surface (about 7.9 km/s). */
const KMS_PER_UNIT = Math.sqrt(EARTH_GM / (MU * KM_PER_UNIT))

export const altitudeKm = (radius: number): number => (radius - PLANET_RADIUS) * KM_PER_UNIT
export const speedKms = (speed: number): number => speed * KMS_PER_UNIT
export const deltaVMs = (deltaV: number): number => deltaV * KMS_PER_UNIT * 1000

/** Speed at distance `r` on an orbit with semi-major axis `a` (the vis-viva equation). */
export function visViva(r: number, a: number): number {
  return Math.sqrt(MU * (2 / r - 1 / a))
}

/**
 * Cheapest two-burn route from an orbit with the given low and high points to
 * a circular orbit of radius `target`: change one end of the orbit to the
 * target radius, coast there, then circularise.
 */
export function idealDeltaV(periapsis: number, apoapsis: number, target: number): number {
  const a0 = (periapsis + apoapsis) / 2
  const route = (from: number) => {
    const transfer = (from + target) / 2
    return (
      Math.abs(visViva(from, transfer) - visViva(from, a0)) +
      Math.abs(visViva(target, target) - visViva(target, transfer))
    )
  }
  return Math.min(route(periapsis), route(apoapsis))
}

export interface OrbitMission {
  id: string
  title: string
  brief: string
  tip: string
  debrief: string
  /** Starting orbit; the probe starts at its lowest point. */
  startPeriapsis: number
  startApoapsis: number
  targetRadius: number
  /** Fuel carried, as a multiple of the ideal two-burn cost. */
  fuelMargin: number
}

export const ORBIT_MISSIONS: OrbitMission[] = [
  {
    id: 'raise',
    title: 'Climb to a Higher Orbit',
    brief:
      'Your probe is in a low circular orbit. Move it up to the green target band and make the new orbit circular.',
    tip: 'Burn prograde (forwards) and watch the far side of the orbit rise. Stop when it touches the band, coast to that high point, then burn prograde again to lift the low point.',
    debrief:
      'Speeding up at one point raises the opposite side of the orbit. Two forward burns, half an orbit apart, make a Hohmann transfer: the cheapest way between two circular orbits.',
    startPeriapsis: 1.5,
    startApoapsis: 1.5,
    targetRadius: 2.4,
    fuelMargin: 2.2,
  },
  {
    id: 'lower',
    title: 'Drop to a Lower Orbit',
    brief: 'This time the target band is below you. Bring the probe down without touching the atmosphere.',
    tip: 'Burn retrograde (backwards) to lower the far side of the orbit into the band. Coast down to that low point, then burn retrograde again to bring the high point down.',
    debrief:
      'Slowing down lowers the opposite side of the orbit. Notice that the probe ends up moving faster in the lower orbit even though you only ever braked: lower orbits are faster orbits.',
    startPeriapsis: 2.8,
    startApoapsis: 2.8,
    targetRadius: 1.7,
    fuelMargin: 2.1,
  },
  {
    id: 'circularise',
    title: 'Circularise at the Top',
    brief:
      'The probe is on a stretched (elliptical) orbit whose high point already reaches the target band. Turn it into a circle at that height.',
    tip: 'Do nothing until the probe reaches its highest point (Ap), where it is moving slowest. Then burn prograde until the low point (Pe) rises into the band.',
    debrief:
      'A probe moves fastest at its lowest point and slowest at its highest. At the top of an ellipse it is too slow to stay at that height, so it falls back. A forward burn there supplies the missing speed.',
    startPeriapsis: 1.5,
    startApoapsis: 3.0,
    targetRadius: 3.0,
    fuelMargin: 2,
  },
  {
    id: 'trim',
    title: 'Trim Both Ends',
    brief: 'The orbit is too high at one end and too low at the other. Fix both ends to fit inside the band.',
    tip: 'Each end is fixed by a burn at the opposite end. Raise the low point with a prograde burn at the high point, and lower the high point with a retrograde burn at the low point.',
    debrief:
      'A burn changes the height of the point half an orbit away, not the height where you are. That is why spacecraft always wait for the right place before firing.',
    startPeriapsis: 1.6,
    startApoapsis: 3.4,
    targetRadius: 2.3,
    fuelMargin: 2,
  },
  {
    id: 'tight',
    title: 'Long Climb on a Tight Budget',
    brief: 'A big climb with little fuel to spare. Wasted burns will leave you stranded.',
    tip: 'Make each burn short and centred on the right spot: the first where you start, the second exactly at the high point. Burning anywhere else costs more for the same result.',
    debrief:
      'Fuel is the hard limit in spaceflight, measured as delta-v: the total change in speed the engine can deliver. Mission planners choose transfers like this one because they reach the target for the least delta-v.',
    startPeriapsis: 1.4,
    startApoapsis: 1.4,
    targetRadius: 3.2,
    fuelMargin: 1.6,
  },
]

export const missionIdealDeltaV = (m: OrbitMission): number =>
  idealDeltaV(m.startPeriapsis, m.startApoapsis, m.targetRadius)

export const missionFuel = (m: OrbitMission): number => missionIdealDeltaV(m) * m.fuelMargin

export interface ProbeState {
  x: number
  z: number
  vx: number
  vz: number
  /** Remaining delta-v in scene units. */
  fuel: number
  time: number
  lockTime: number
}

export function initialProbeState(m: OrbitMission): ProbeState {
  const a = (m.startPeriapsis + m.startApoapsis) / 2
  // Anticlockwise seen from above: at +x the probe heads towards -z.
  return {
    x: m.startPeriapsis,
    z: 0,
    vx: 0,
    vz: -visViva(m.startPeriapsis, a),
    fuel: missionFuel(m),
    time: 0,
    lockTime: 0,
  }
}

export interface OrbitElements {
  radius: number
  speed: number
  /** False once the probe has reached escape speed. */
  bound: boolean
  semiMajor: number
  eccentricity: number
  periapsis: number
  apoapsis: number
  /** Direction of the lowest point, as an angle in the x-z plane. */
  periapsisAngle: number
  /** +1 for anticlockwise motion seen from above, -1 for clockwise. */
  direction: 1 | -1
}

export function orbitElements(s: ProbeState): OrbitElements {
  const radius = Math.hypot(s.x, s.z)
  const speedSq = s.vx * s.vx + s.vz * s.vz
  const energy = speedSq / 2 - MU / radius
  const rDotV = s.x * s.vx + s.z * s.vz
  const ex = ((speedSq - MU / radius) * s.x - rDotV * s.vx) / MU
  const ez = ((speedSq - MU / radius) * s.z - rDotV * s.vz) / MU
  const eccentricity = Math.hypot(ex, ez)
  const bound = energy < -1e-6
  const semiMajor = bound ? -MU / (2 * energy) : Infinity
  // Angular momentum about +y; positive means anticlockwise seen from above.
  const h = s.z * s.vx - s.x * s.vz
  const semiLatus = (h * h) / MU
  return {
    radius,
    speed: Math.sqrt(speedSq),
    bound,
    semiMajor,
    eccentricity,
    periapsis: semiLatus / (1 + eccentricity),
    apoapsis: bound ? semiMajor * (1 + eccentricity) : Infinity,
    periapsisAngle: eccentricity > 1e-4 ? Math.atan2(ez, ex) : Math.atan2(s.z, s.x),
    direction: h >= 0 ? 1 : -1,
  }
}

export function isInBand(el: OrbitElements, targetRadius: number): boolean {
  return (
    el.bound &&
    el.periapsis >= targetRadius * (1 - BAND_TOLERANCE) &&
    el.apoapsis <= targetRadius * (1 + BAND_TOLERANCE)
  )
}

export type MissionEnd = 'success' | 'crash' | 'escape' | 'fuel' | 'timeout' | 'abort'

function accelerate(s: ProbeState, thrust: number, dt: number): void {
  const r = Math.hypot(s.x, s.z)
  const g = -MU / (r * r * r)
  let ax = g * s.x
  let az = g * s.z
  if (thrust !== 0) {
    const speed = Math.hypot(s.vx, s.vz) || 1
    ax += (thrust * THRUST_ACCEL * s.vx) / speed
    az += (thrust * THRUST_ACCEL * s.vz) / speed
  }
  s.vx += ax * dt
  s.vz += az * dt
}

/**
 * Advance the probe by `dt` seconds. `thrust` is +1 (prograde), -1
 * (retrograde) or 0. Returns how the mission ended, or null if it goes on.
 */
export function advanceProbe(
  s: ProbeState,
  mission: OrbitMission,
  thrust: -1 | 0 | 1,
  dt: number,
): MissionEnd | null {
  let remaining = dt
  while (remaining > 1e-9) {
    const h = Math.min(STEP, remaining)
    remaining -= h
    const firing = thrust !== 0 && s.fuel > 0 ? thrust : 0
    // Kick-drift-kick keeps a coasting orbit closed over many laps.
    accelerate(s, firing, h / 2)
    s.x += s.vx * h
    s.z += s.vz * h
    accelerate(s, firing, h / 2)
    if (firing !== 0) s.fuel = Math.max(0, s.fuel - THRUST_ACCEL * h)
    s.time += h

    const el = orbitElements(s)
    if (el.radius <= ATMOSPHERE_RADIUS) return 'crash'
    if (el.radius >= ESCAPE_RADIUS) return 'escape'
    const inBand = isInBand(el, mission.targetRadius)
    s.lockTime = inBand && firing === 0 ? s.lockTime + h : 0
    if (s.lockTime >= LOCK_SECONDS) return 'success'
    if (s.fuel <= 0 && !inBand) return 'fuel'
    if (s.time >= MISSION_TIME_LIMIT) return 'timeout'
  }
  return null
}
