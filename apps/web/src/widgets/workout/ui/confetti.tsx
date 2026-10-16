import type { CSSProperties } from 'react'

const confettiColors = [
  'var(--hi-vis-yellow)',
  'var(--bubblegum-pink)',
  'var(--matcha-cream)',
  'var(--dusk-violet)',
  'var(--sky)',
]
const bits = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2
  const dist = 60 + ((i * 37) % 50)
  return {
    dx: `${Math.cos(angle) * dist}px`,
    dy: `${Math.sin(angle) * dist - 30}px`,
    rot: `${(i * 67) % 360}deg`,
    color: confettiColors[i % confettiColors.length],
  }
})

export function Confetti() {
  return (
    <span
      className="pointer-events-none absolute top-10 left-10 z-10"
      aria-hidden
    >
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={
            {
              background: b.color,
              '--dx': b.dx,
              '--dy': b.dy,
              '--rot': b.rot,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}
