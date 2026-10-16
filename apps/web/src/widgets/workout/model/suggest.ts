import { EASY_MAX, HARD_MIN, PAIN_LIMIT, type Entry } from '@/entities/entry'
import { CYCLE_WEEKS, mround, planFor, type Exercise } from '@/entities/program'

export type Tone = 'plan' | 'down' | 'hold' | 'up'

export type Suggestion = {
  weight: number
  sets: number
  reps: number
  label?: string
  tone: Tone
  reason: string
}

export function lastOf(
  exerciseId: string,
  entries: Entry[],
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
    )[0]
}

/**
 * Что делать сегодня: план недели, поправленный по прошлой записи.
 * Боль ≥ 4 — минус 15%, тяжело — держим прошлый вес, легко — добиваем повторы до верха диапазона.
 */
export function suggest(
  ex: Exercise,
  week: number,
  entries: Entry[],
  date: string,
): Suggestion {
  const plan = planFor(ex, week)
  const base: Suggestion = {
    weight: plan.weight ?? 0,
    sets: plan.sets,
    reps: plan.reps,
    label: plan.label,
    tone: 'plan',
    reason:
      week > CYCLE_WEEKS
        ? 'Цикл пройден — держим вес 4-й недели'
        : `По плану ${week}-й недели`,
  }

  const last = lastOf(ex.id, entries, date)
  if (!last) return base

  const weighted = ex.step > 0 && last.weight > 0

  if ((last.pain ?? 0) >= PAIN_LIMIT) {
    return {
      ...base,
      weight: weighted
        ? Math.max(0, mround(last.weight * 0.85, ex.step))
        : base.weight,
      sets: Math.max(2, Math.min(base.sets, last.sets) - (weighted ? 0 : 1)),
      tone: 'down',
      reason: `В прошлый раз спина ${last.pain}/10 — снижаем нагрузку`,
    }
  }

  const effort = last.effort ?? undefined

  if (effort !== undefined && effort >= HARD_MIN) {
    return {
      ...base,
      weight: weighted ? Math.min(base.weight, last.weight) : base.weight,
      sets: Math.min(base.sets, Math.max(last.sets, 2)),
      reps: Math.min(base.reps, last.reps),
      tone: 'hold',
      reason: `Сложность была ${effort}/10 — повторяем прошлую нагрузку`,
    }
  }

  if (
    effort !== undefined &&
    effort <= EASY_MAX &&
    last.weight >= base.weight &&
    plan.repsMax &&
    last.reps >= plan.reps
  ) {
    return {
      ...base,
      reps: Math.min(plan.repsMax, last.reps + 2),
      tone: 'up',
      reason: `Сложность была ${effort}/10 — добавляем повторы`,
    }
  }

  return base
}
