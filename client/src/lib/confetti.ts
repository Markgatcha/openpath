import confetti from 'canvas-confetti'

/** Side-cannon celebration for great results. */
export function fireConfetti(): void {
  const colors = ['#6366f1', '#a855f7', '#22d3ee', '#f59e0b', '#10b981']
  void confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors,
    disableForReducedMotion: true,
  })
  window.setTimeout(() => {
    void confetti({
      particleCount: 60,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    })
    void confetti({
      particleCount: 60,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    })
  }, 180)
}
