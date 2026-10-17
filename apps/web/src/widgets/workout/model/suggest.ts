import { EASY_MAX, HARD_MIN, PAIN_LIMIT, type Entry } from '@/entities/entry'
import {
  CYCLE_WEEKS,
  hasBase,
  historyFor,
  nextWorkout,
  weekPlanFor,
  type Exercise,
  type ProgressionKind,
} from '@/entities/program'

export type Tone = 'plan' | 'down' | 'hold' | 'up'

export type Suggestion = {
  weight: number
  sets: number
  reps: number
  /** Верх диапазона повторов. */
  repsMax?: number
  label?: string
  tone: Tone
  reason: string
}

const toneOf: Record<ProgressionKind, Tone> = {
  start: 'plan',
  reps: 'plan',
  up: 'up',
  hold: 'hold',
  down: 'down',
  deload: 'down',
  return: 'down',
}

/**
 * Что делать сегодня. С рабочим весом — двойная прогрессия по прошлым записям
 * (entities/program/model/progression.ts). Со своим планом по неделям — план
 * недели, поправленный по прошлой записи: боль — минус подход, тяжело —
 * повторяем, легко — добиваем повторы до верха.
 */
export function suggest(
  ex: Exercise,
  week: number,
  entries: Entry[],
  date: string,
): Suggestion {
  if (hasBase(ex)) {
    const next = nextWorkout(ex, entries, date)
    return {
      weight: next.weight,
      sets: next.sets,
      reps: next.reps,
      repsMax: next.repsMax,
      tone: toneOf[next.kind],
      reason: next.reason,
    }
  }

  const plan = weekPlanFor(ex, week)
  const base: Suggestion = {
    weight: plan.weight ?? 0,
    sets: plan.sets,
    reps: plan.reps,
    repsMax: plan.repsMax,
    label: plan.label,
    tone: 'plan',
    reason:
      week > CYCLE_WEEKS
        ? 'План 4-й недели — пока не начат новый цикл'
        : `По плану ${week}-й недели`,
  }
  const last = historyFor(ex.id, entries, date)[0]
  if (!last) return base

  if ((last.pain ?? 0) >= PAIN_LIMIT)
    return {
      ...base,
      sets: Math.max(1, Math.min(base.sets, last.sets) - 1),
      tone: 'down',
      reason: `В прошлый раз спина ${last.pain}/10 — на подход меньше`,
    }

  const effort = last.effort ?? undefined
  if (effort !== undefined && effort >= HARD_MIN)
    return {
      ...base,
      sets: Math.min(base.sets, Math.max(last.sets, 1)),
      reps: Math.min(base.reps, last.reps),
      tone: 'hold',
      reason: `Сложность была ${effort}/10 — повторяем прошлую нагрузку`,
    }

  if (
    effort !== undefined &&
    effort <= EASY_MAX &&
    plan.repsMax &&
    last.reps >= plan.reps
  )
    return {
      ...base,
      reps: Math.min(plan.repsMax, last.reps + 2),
      tone: 'up',
      reason: `Сложность была ${effort}/10 — добавляем повторы`,
    }

  return base
}
