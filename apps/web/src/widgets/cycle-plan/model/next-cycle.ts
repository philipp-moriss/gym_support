import { PAIN_LIMIT, type Entry } from '@/entities/entry'
import {
  CYCLE_WEEKS,
  WEEK_PERCENT,
  hasBase,
  mround,
  type Exercise,
} from '@/entities/program'

/**
 * Новые базовые веса после цикла: лучший вес 4-й недели без боли / 85%.
 * Если спина болела — база не растёт.
 */
export function nextCycleBases(
  exs: Exercise[],
  entries: Entry[],
  startDate: string,
) {
  const result: { ex: Exercise; from: number; to: number }[] = []
  for (const ex of exs) {
    if (!hasBase(ex)) continue
    const from = ex.base!
    const cycle = entries.filter(
      (e) => e.exerciseId === ex.id && e.date >= startDate,
    )
    if (cycle.some((e) => (e.pain ?? 0) >= PAIN_LIMIT)) {
      result.push({ ex, from, to: from })
      continue
    }
    const best = Math.max(
      0,
      ...cycle.filter((e) => (e.week ?? 0) >= CYCLE_WEEKS).map((e) => e.weight),
    )
    const to = Math.max(from, mround(best / WEEK_PERCENT[CYCLE_WEEKS - 1]))
    result.push({ ex, from, to })
  }
  return result
}
