import confetti from 'canvas-confetti'

/**
 * Procedural Web Audio synthesizer + burst confetti for the Educational Arcade.
 * Zero external audio assets: tones are synthesized locally via Web Audio
 * oscillators and gain envelopes, and respect a persistent mute preference.
 */

const MUTE_KEY = 'openpath:arcade:muted'
let audioCtx: AudioContext | null = null

export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    // Ignore storage quota errors in restricted webviews.
  }
}

function ctx(): AudioContext | null {
  if (isSoundMuted() || typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function tone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.11,
  delaySec = 0,
  endFreq?: number,
): void {
  const c = ctx()
  if (!c) return
  const start = c.currentTime + delaySec
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), start + durationSec)
  }
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(start)
  osc.stop(start + durationSec + 0.02)
}

export function playHitSound(combo = 1): void {
  const semitones = Math.min(14, Math.max(0, combo - 1))
  const root = 440 * Math.pow(2, semitones / 12)
  tone(root, 0.12, 'triangle', 0.11, 0)
  tone(root * 1.25, 0.16, 'sine', 0.09, 0.05)
}

export function playMissSound(): void {
  tone(210, 0.22, 'sawtooth', 0.08, 0, 125)
}

export function playBurstSound(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, idx) => tone(f, 0.18, 'triangle', 0.1, idx * 0.045))
}

export function playCritSound(): void {
  tone(587.33, 0.1, 'triangle', 0.13, 0)
  tone(880, 0.14, 'triangle', 0.13, 0.045)
  tone(1174.66, 0.24, 'sine', 0.12, 0.09)
}

export function playShieldBreakSound(): void {
  tone(420, 0.28, 'sawtooth', 0.09, 0, 110)
}

export function playVictorySound(): void {
  const fanfare = [523.25, 659.25, 783.99, 1046.5]
  fanfare.forEach((f, idx) => tone(f, 0.24, 'triangle', 0.11, idx * 0.07))
}

export function fireComboBurst(): void {
  void confetti({
    particleCount: 38,
    spread: 60,
    startVelocity: 28,
    origin: { y: 0.72 },
    colors: ['#6366f1', '#22d3ee', '#34d399', '#fbbf24'],
    disableForReducedMotion: true,
  })
}
