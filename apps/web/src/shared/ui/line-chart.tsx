import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/shared/lib'

export interface ChartPoint {
  /** Подпись по оси X (дата). */
  label: string
  value: number
}

const PAD = { top: 10, right: 10, bottom: 22, left: 44 }

/** Ширина контейнера в пикселях: график рисуется в реальном размере, текст не растягивается. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/** Шкала по данным; у ровного ряда (один вес все дни) — с запасом, чтобы линия была посередине. */
function scale(values: number[], min?: number, max?: number) {
  let lo = min ?? Math.min(...values)
  let hi = max ?? Math.max(...values)
  if (hi - lo < 1e-9) {
    const pad = Math.max(1, Math.abs(hi) * 0.1)
    lo = min ?? Math.floor(lo - pad)
    hi = max ?? Math.ceil(hi + pad)
  }
  return { lo, hi }
}

/**
 * Простой линейный график на SVG без библиотек: линия, точки, подписи
 * шкалы и первой/последней даты. Рисуется в пикселях контейнера.
 */
export function LineChart({
  points,
  color = 'var(--ink-black)',
  min,
  max,
  unit = '',
  height = 140,
  className,
}: {
  points: ChartPoint[]
  color?: string
  /** Фиксированная шкала (например, 0–10 для боли); иначе — по данным. */
  min?: number
  max?: number
  unit?: string
  height?: number
  className?: string
}) {
  const titleId = useId()
  const [ref, width] = useWidth()
  if (!points.length) return null

  const values = points.map((p) => p.value)
  const { lo, hi } = scale(values, min, max)
  const W = Math.max(width, 120)
  const H = height
  const innerW = W - PAD.left - PAD.right
  const x = (i: number) =>
    PAD.left +
    (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) =>
    PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom)
  const path = points
    .map(
      (p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`,
    )
    .join(' ')
  const fmt = (v: number) => `${Math.round(v * 10) / 10}${unit}`
  const ticks = [hi, (lo + hi) / 2, lo]
  const last = points.length - 1

  return (
    <div ref={ref} className={cn('w-full', className)} style={{ height: H }}>
      {width > 0 && (
        <svg
          width={W}
          height={H}
          role="img"
          aria-labelledby={titleId}
          className="block overflow-visible font-mono text-[11px]"
        >
          <title id={titleId}>
            {`${fmt(values[0])} → ${fmt(values[last])}`}
          </title>
          {ticks.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--border)"
                strokeDasharray={i === 1 ? '2 4' : '3 3'}
              />
              {i !== 1 && (
                <text
                  x={PAD.left - 6}
                  y={y(v) + 4}
                  textAnchor="end"
                  className="fill-muted-foreground"
                >
                  {fmt(v)}
                </text>
              )}
            </g>
          ))}
          {points.length > 1 && (
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(p.value)}
              r={points.length > 30 ? 2.5 : 3.5}
              fill={color}
            >
              <title>{`${p.label}: ${fmt(p.value)}`}</title>
            </circle>
          ))}
          <text
            x={x(0)}
            y={H - 6}
            textAnchor={points.length === 1 ? 'middle' : 'start'}
            className="fill-muted-foreground"
          >
            {points[0].label}
          </text>
          {points.length > 1 && (
            <text
              x={x(last)}
              y={H - 6}
              textAnchor="end"
              className="fill-muted-foreground"
            >
              {points[last].label}
            </text>
          )}
        </svg>
      )}
    </div>
  )
}
