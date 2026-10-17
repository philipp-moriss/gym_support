import { useId } from 'react'
import { cn } from '@/shared/lib'

export interface ChartPoint {
  /** Подпись по оси X (дата). */
  label: string
  value: number
}

const W = 320
const H = 120
const PAD = { top: 12, right: 8, bottom: 20, left: 32 }

/**
 * Простой линейный график на SVG без библиотек: линия, точки, подписи
 * минимума и максимума, первая и последняя дата. Масштабируется по ширине.
 */
export function LineChart({
  points,
  color = 'var(--ink-black)',
  min,
  max,
  unit = '',
  className,
}: {
  points: ChartPoint[]
  color?: string
  /** Фиксированная шкала (например, 0–10 для боли); иначе — по данным. */
  min?: number
  max?: number
  unit?: string
  className?: string
}) {
  const titleId = useId()
  if (!points.length) return null
  const values = points.map((p) => p.value)
  const lo = min ?? Math.min(...values)
  const hi = max ?? Math.max(...values)
  const span = hi - lo || 1
  const x = (i: number) =>
    PAD.left +
    (points.length === 1
      ? (W - PAD.left - PAD.right) / 2
      : (i / (points.length - 1)) * (W - PAD.left - PAD.right))
  const y = (v: number) =>
    PAD.top + (1 - (v - lo) / span) * (H - PAD.top - PAD.bottom)
  const path = points
    .map(
      (p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`,
    )
    .join(' ')
  const fmt = (v: number) => `${Math.round(v * 10) / 10}${unit}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn('h-auto w-full overflow-visible', className)}
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>
        {`${fmt(values[0])} → ${fmt(values[values.length - 1])}`}
      </title>
      {[lo, hi].map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <text
            x={PAD.left - 4}
            y={y(v) + 4}
            textAnchor="end"
            className="fill-muted-foreground font-mono text-[10px]"
          >
            {fmt(v)}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={3} fill={color}>
          <title>{`${p.label}: ${fmt(p.value)}`}</title>
        </circle>
      ))}
      <text
        x={x(0)}
        y={H - 4}
        textAnchor={points.length === 1 ? 'middle' : 'start'}
        className="fill-muted-foreground font-mono text-[10px]"
      >
        {points[0].label}
      </text>
      {points.length > 1 && (
        <text
          x={x(points.length - 1)}
          y={H - 4}
          textAnchor="end"
          className="fill-muted-foreground font-mono text-[10px]"
        >
          {points[points.length - 1].label}
        </text>
      )}
    </svg>
  )
}
