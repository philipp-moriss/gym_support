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

type Measured = Pick<
  Activity,
  'kind' | 'poolLength' | 'laps' | 'distanceM' | 'durationSec'
>

/**
 * Главная цифра карточки. Бассейн — метры («1 000 м»), велик — км
 * («32,4 км»), пилатес — минуты («45 мин»).
 */
export function activityHeadline(a: Measured): { value: string; unit: string } {
  if (a.kind === 'swim') return { value: num(a.distanceM ?? 0), unit: 'м' }
  if (a.kind === 'bike')
    return { value: oneDecimal((a.distanceM ?? 0) / 1000), unit: 'км' }
  return { value: num(Math.round(a.durationSec / 60)), unit: 'мин' }
}

/** Мелкие цифры под главной: круги, время, темп или скорость. */
export function activityDetails(a: Measured): string[] {
  const time = formatDuration(a.durationSec)
  const m = a.distanceM ?? 0
  if (a.kind === 'swim')
    return [
      `${a.laps}×${a.poolLength} м`,
      time,
      `${formatDuration(pacePer100m(m, a.durationSec))}/100 м`,
    ]
  if (a.kind === 'bike')
    return [time, `${oneDecimal(speedKmh(m, a.durationSec))} км/ч`]
  // Пилатес: время уже в заголовке; секунды покажем, только если они есть.
  return a.durationSec % 60 ? [time] : []
}
