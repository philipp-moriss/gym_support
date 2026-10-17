import type { Entry } from '@/entities/entry'
import { e1rm } from '@/entities/program'
import type { ChartPoint } from '@/shared/ui'

const label = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`

/** Записи по датам, старые слева. */
function byDate(entries: Entry[]) {
  const map = new Map<string, Entry[]>()
  for (const e of entries.toSorted((a, b) => a.date.localeCompare(b.date)))
    map.set(e.date, [...(map.get(e.date) ?? []), e])
  return [...map.entries()]
}

/**
 * Прогресс упражнения: лучший вес дня; у упражнений без веса — лучшие
 * повторы (секунды, минуты).
 */
export function exerciseSeries(entries: Entry[], exerciseId: string) {
  const own = entries.filter((e) => e.exerciseId === exerciseId)
  const withWeight = own.some((e) => e.weight > 0)
  const points: ChartPoint[] = byDate(own).map(([date, items]) => ({
    label: label(date),
    value: Math.max(
      ...items.map((e) =>
        withWeight ? e.weight : Math.max(e.reps, ...(e.setReps ?? [])),
      ),
    ),
  }))
  return { points, unit: withWeight ? ' кг' : '' }
}

/** Боль (максимум за день) и сложность (среднее за день) по тренировкам. */
export function feelSeries(entries: Entry[]) {
  const days = byDate(entries)
  const pick = (key: 'pain' | 'effort', agg: 'max' | 'avg') =>
    days.flatMap(([date, items]) => {
      const values = items
        .map((e) => e[key])
        .filter((v): v is number => v !== null)
      if (!values.length) return []
      const value =
        agg === 'max'
          ? Math.max(...values)
          : values.reduce((s, v) => s + v, 0) / values.length
      return [{ label: label(date), value }]
    })
  return { pain: pick('pain', 'max'), effort: pick('effort', 'avg') }
}

/** Упражнения, которые есть в дневнике, — по частоте. */
export function loggedExercises(entries: Entry[]) {
  const count = new Map<string, number>()
  for (const e of entries)
    if (e.exerciseId)
      count.set(e.exerciseId, (count.get(e.exerciseId) ?? 0) + 1)
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

/** Оценочный максимум на 1 повтор (Epley с RIR) — лучший за день. */
export function e1rmSeries(entries: Entry[], exerciseId: string) {
  return byDate(entries.filter((e) => e.exerciseId === exerciseId)).flatMap(
    ([date, items]) => {
      const values = items
        .map((e) => e1rm(e))
        .filter((v): v is number => v !== null)
      return values.length
        ? [{ label: label(date), value: Math.max(...values) }]
        : []
    },
  )
}
