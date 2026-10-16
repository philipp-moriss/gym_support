import { fromIso } from '@/shared/lib'
import type { Exercise, WeekPlan } from './types'

/** Проценты от последнего веса и схема подходов для упражнений с базой. */
export const WEEK_PERCENT = [0.55, 0.65, 0.75, 0.85]
export const MAIN_SCHEME: WeekPlan[] = [
  { sets: 3, reps: 12, repsMax: 15 },
  { sets: 3, reps: 12, repsMax: 15 },
  { sets: 4, reps: 12, repsMax: 15 },
  { sets: 4, reps: 15 },
]
export const CYCLE_WEEKS = 4

/** Номер недели программы, начиная с 1. */
export function programWeek(startIso: string, dateIso: string) {
  const days = Math.round(
    (fromIso(dateIso).getTime() - fromIso(startIso).getTime()) / 86_400_000,
  )
  return Math.max(1, Math.floor(days / 7) + 1)
}

export const mround = (n: number, step = 2.5) => Math.round(n / step) * step

export function planFor(ex: Exercise, week: number): WeekPlan {
  const i = Math.min(week, CYCLE_WEEKS) - 1
  if (ex.weeks) return ex.weeks[i]
  return { ...MAIN_SCHEME[i], weight: mround((ex.base ?? 0) * WEEK_PERCENT[i]) }
}

export const hasBase = (ex: Exercise) => ex.base !== null
