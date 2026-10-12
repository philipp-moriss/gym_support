import type { Entry } from "./entries";
import { CYCLE_WEEKS, WEEK_PERCENT, mround, planFor, type Exercise } from "./program";

export type Tone = "plan" | "down" | "hold" | "up";

export type Suggestion = {
  weight: number;
  sets: number;
  reps: number;
  label?: string;
  tone: Tone;
  reason: string;
};

/** Порог боли в спине из дневника: 4 и выше — снижаем нагрузку. */
export const PAIN_LIMIT = 4;

export function lastOf(exerciseId: string, entries: Entry[], beforeDate?: string) {
  return entries
    .filter((e) => e.exerciseId === exerciseId && (!beforeDate || e.date < beforeDate))
    .toSorted((a, b) => b.date.localeCompare(a.date))[0];
}

/**
 * Что делать сегодня: план недели, поправленный по прошлой записи.
 * Боль ≥ 4 — минус 15%, тяжело — держим прошлый вес, легко — добиваем повторы до верха диапазона.
 */
export function suggest(
  ex: Exercise,
  week: number,
  bases: Record<string, number>,
  entries: Entry[],
  date: string,
): Suggestion {
  const plan = planFor(ex, week, bases);
  const base: Suggestion = {
    weight: plan.weight ?? 0,
    sets: plan.sets,
    reps: plan.reps,
    label: plan.label,
    tone: "plan",
    reason: week > CYCLE_WEEKS ? "Цикл пройден — держим вес 4-й недели" : `По плану ${week}-й недели`,
  };

  const last = lastOf(ex.id, entries, date);
  if (!last) return base;

  const weighted = ex.step > 0 && last.weight > 0;

  if ((last.pain ?? 0) >= PAIN_LIMIT) {
    return {
      ...base,
      weight: weighted ? Math.max(0, mround(last.weight * 0.85, ex.step)) : base.weight,
      sets: Math.max(2, Math.min(base.sets, last.sets) - (weighted ? 0 : 1)),
      tone: "down",
      reason: `В прошлый раз спина ${last.pain}/10 — снижаем нагрузку`,
    };
  }

  if (last.feel === "hard") {
    return {
      ...base,
      weight: weighted ? Math.min(base.weight, last.weight) : base.weight,
      sets: Math.min(base.sets, Math.max(last.sets, 2)),
      reps: Math.min(base.reps, last.reps),
      tone: "hold",
      reason: "Было тяжело — повторяем прошлую нагрузку",
    };
  }

  if (last.feel === "easy" && last.weight >= base.weight && plan.repsMax && last.reps >= plan.reps) {
    return {
      ...base,
      reps: Math.min(plan.repsMax, last.reps + 2),
      tone: "up",
      reason: "Было легко — добавляем повторы",
    };
  }

  return base;
}

/**
 * Новые базовые веса после цикла: лучший вес 4-й недели без боли / 85%.
 * Если спина болела — база не растёт.
 */
export function nextCycleBases(
  exs: Exercise[],
  bases: Record<string, number>,
  entries: Entry[],
  startDate: string,
) {
  const result: { ex: Exercise; from: number; to: number }[] = [];
  for (const ex of exs) {
    if (ex.base === undefined) continue;
    const from = bases[ex.id] ?? ex.base;
    const cycle = entries.filter((e) => e.exerciseId === ex.id && e.date >= startDate);
    if (cycle.some((e) => (e.pain ?? 0) >= PAIN_LIMIT)) {
      result.push({ ex, from, to: from });
      continue;
    }
    const best = Math.max(0, ...cycle.filter((e) => (e.week ?? 0) >= CYCLE_WEEKS).map((e) => e.weight));
    const to = Math.max(from, mround(best / WEEK_PERCENT[CYCLE_WEEKS - 1]));
    result.push({ ex, from, to });
  }
  return result;
}
