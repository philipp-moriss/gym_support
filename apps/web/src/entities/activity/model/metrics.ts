import { num } from '@/shared/lib'
import type { Activity } from './types'

const oneDecimal = (n: number) =>
  n.toLocaleString('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
const pad = (n: number) => String(n).padStart(2, '0')

/** Средняя скорость, км/ч. */
export const speedKmh = (distanceM: number, durationSec: number) =>
  durationSec > 0 ? (distanceM / durationSec) * 3.6 : 0

/** Темп, секунды на 100 м. */
export const pacePer100m = (distanceM: number, durationSec: number) =>
  distanceM > 0 ? (durationSec / distanceM) * 100 : 0

/** 1350 → «22:30», 4320 → «1:12:00». */
export function formatDuration(sec: number) {
  const s = Math.round(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`
}

/** Бассейн — в метрах («1 000 м»), велик — в км («32,4 км»). */
export const formatDistance = (kind: Activity['kind'], m: number) =>
  kind === 'swim' ? `${num(m)} м` : `${oneDecimal(m / 1000)} км`

/** Короткая сводка: дистанция, круги, время, темп или скорость. */
export function activityStats(
  a: Pick<Activity, 'kind' | 'poolLength' | 'laps' | 'distanceM' | 'durationSec'>,
) {
  const time = formatDuration(a.durationSec)
  if (a.kind === 'swim')
    return [
      formatDistance('swim', a.distanceM),
      `${a.laps}×${a.poolLength} м`,
      time,
      `${formatDuration(pacePer100m(a.distanceM, a.durationSec))}/100 м`,
    ]
  return [
    formatDistance('bike', a.distanceM),
    time,
    `${oneDecimal(speedKmh(a.distanceM, a.durationSec))} км/ч`,
  ]
}
