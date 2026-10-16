export function PainDot({ pain }: { pain: number | null }) {
  if (pain === null) return null
  const color =
    pain >= 4
      ? 'var(--firecracker-red)'
      : pain >= 2
        ? 'var(--buttery-yellow)'
        : 'var(--matcha-cream)'
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 font-mono text-xs"
      title="Боль в спине"
    >
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {pain}
    </span>
  )
}
