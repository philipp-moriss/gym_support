import { fromIso } from '@/shared/lib'
import {
  progress,
  type Progression,
  type ProgressionEntry,
} from './progression'
import type { Exercise, WeekPlan } from './types'

/** Неделя цикла для упражнений со своим планом на 4 недели. */
export const CYCLE_WEEKS = 4

/** Номер недели программы, начиная с 1. */
export function programWeek(startIso: string, dateIso: string) {
  const days = Math.round(
    (fromIso(dateIso).getTime() - fromIso(startIso).getTime()) / 86_400_000,
  )
  return Math.max(1, Math.floor(days / 7) + 1)
}

export const mround = (n: number, step = 2.5) => Math.round(n / step) * step

export const hasBase = (ex: Exercise) => ex.base !== null

/** План по неделям (упражнения без рабочего веса); после 4-й недели — как 4-я. */
export function weekPlanFor(ex: Exercise, week: number): WeekPlan {
  const i = Math.min(week, CYCLE_WEEKS) - 1
  return ex.weeks?.[i] ?? { sets: ex.targetSets, reps: ex.repsMin }
}

/** «3 × 12–15» — схема упражнения с рабочим весом. */
export const schemeText = (
  ex: Pick<Exercise, 'targetSets' | 'repsMin' | 'repsMax'>,
) =>
  `${ex.targetSets} × ${ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}–${ex.repsMax}`}`

type Logged = ProgressionEntry & {
  exerciseId: string | null
  createdAt: string
}

/** Записи упражнения до даты (не включая её), новые первыми. */
export function historyFor<T extends Logged>(
  exerciseId: string,
  entries: T[],
  beforeDate?: string,
) {
  return entries
    .filter(
      (e) =>
        e.exerciseId === exerciseId && (!beforeDate || e.date < beforeDate),
    )
    .toSorted(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    )
}

/**
 * Следующая тренировка упражнения с рабочим весом: двойная прогрессия по
 * записям до `date`. `entries` — уже после сброса подстройки (resetAt).
 */
export function nextWorkout(
  ex: Exercise,
  entries: Logged[],
  date: string,
): Progression {
  return progress(ex, historyFor(ex.id, entries, date), date)
}
