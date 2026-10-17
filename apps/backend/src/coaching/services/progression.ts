/**
 * Подстройка рабочего веса: двойная прогрессия с поправкой на сложность (RIR)
 * и боль. Правила и источники — docs/training-progression.md.
 *
 * Копия apps/web/src/entities/program/model/progression.ts: приложения не
 * делят код. Меняешь правило — меняй в обоих местах.
 */

/** Сколько боли (0–10) уже снижает нагрузку. */
export const PAIN_LIMIT = 4;
/** Сильная боль: снижаем сильнее и на подход меньше. */
export const PAIN_SEVERE = 7;
/** Сложность до 8 включительно — 2+ повтора в запасе: можно прибавлять. */
export const PROGRESS_MAX_EFFORT = 8;
/** Сложность 9–10 — 0–1 повтор в запасе, работа у отказа. */
export const HARD_EFFORT = 9;
/** Сложность до 4 — очень легко: добираем по 2 повтора. */
export const EASY_EFFORT = 4;

const LOWER_BODY = new Set(['legs', 'glutes']);

export interface ProgressionExercise {
  base: number | null;
  baseSetAt: Date | string | null;
  step: number;
  muscle: string;
  unit: string;
  targetSets: number;
  repsMin: number;
  repsMax: number;
}

export interface ProgressionEntry {
  date: string;
  createdAt: Date | string;
  sets: number;
  reps: number;
  setReps?: number[] | null;
  weight: number;
  pain: number | null;
  effort: number | null;
}

export type ProgressionKind =
  'start' | 'up' | 'reps' | 'hold' | 'down' | 'deload' | 'return';

export interface Progression {
  weight: number;
  sets: number;
  /** Цель повторов на подход. */
  reps: number;
  repsMax: number;
  kind: ProgressionKind;
  reason: string;
}

const DAY = 86_400_000;
const time = (d: Date | string) => new Date(d).getTime();
const days = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY,
  );

/** Вниз до шага, но не меньше нуля. */
const roundDown = (w: number, step: number) =>
  step > 0 ? Math.max(0, Math.floor(w / step + 1e-9) * step) : w;
/** Вверх до шага. */
const roundUp = (w: number, step: number) =>
  step > 0 ? Math.ceil(w / step - 1e-9) * step : w;
const kg = (w: number) => `${Math.round(w * 100) / 100} кг`;

/** Повторы по подходам: отмеченные по одному или «подходы × повторы». */
export const repsPerSet = (
  e: Pick<ProgressionEntry, 'sets' | 'reps' | 'setReps'>,
) =>
  e.setReps?.length ? e.setReps : Array.from({ length: e.sets }, () => e.reps);

/**
 * Оценка максимума на 1 повтор: Epley с поправкой на повторы в запасе
 * (RIR = 10 − сложность). Только для повторов до 20 — дальше формула врёт.
 */
export function e1rm(
  e: Pick<ProgressionEntry, 'sets' | 'reps' | 'setReps' | 'weight' | 'effort'>,
) {
  if (e.weight <= 0) return null;
  const best = Math.max(...repsPerSet(e));
  if (!best || best > 20) return null;
  const rir = e.effort === null ? 0 : Math.max(0, 10 - e.effort);
  return Math.round(e.weight * (1 + (best + rir) / 30) * 10) / 10;
}

/**
 * Что делать в следующий раз. `history` — записи этого упражнения до сегодня
 * (после сброса подстройки), новые первыми.
 */
export function progress(
  ex: ProgressionExercise,
  history: ProgressionEntry[],
  today: string,
): Progression {
  const step = ex.step;
  const scheme = { sets: ex.targetSets, reps: ex.repsMin, repsMax: ex.repsMax };
  const last = history[0];
  const manual =
    ex.base !== null &&
    (!last ||
      (ex.baseSetAt !== null && time(ex.baseSetAt) > time(last.createdAt)));
  if (manual || !last)
    return {
      ...scheme,
      weight: ex.base ?? 0,
      kind: 'start',
      reason: last ? 'Новый рабочий вес' : 'Рабочий вес',
    };

  const w = step > 0 ? last.weight : 0;
  const done = repsPerSet(last);
  const worst = Math.min(...done);
  const effort = last.effort;
  const pain = last.pain ?? 0;

  const gap = days(last.date, today);
  if (gap >= 14) {
    const k = gap >= 28 ? 0.8 : 0.9;
    return {
      ...scheme,
      weight: roundDown(w * k, step),
      kind: 'return',
      reason: `Перерыв ${gap} дн. — начинаем на ${Math.round((1 - k) * 100)}% легче`,
    };
  }

  if (pain >= PAIN_LIMIT) {
    const severe = pain >= PAIN_SEVERE;
    const lighter = roundDown(w * (severe ? 0.8 : 0.9), step);
    return {
      ...scheme,
      sets: severe ? Math.max(2, scheme.sets - 1) : scheme.sets,
      weight: w > 0 ? Math.max(0, Math.min(lighter, w - step)) : 0,
      kind: 'down',
      reason: `Боль была ${pain}/10 — снижаем нагрузку`,
    };
  }

  // Застой у отказа: две тренировки с тем же весом, сложность 9+, повторы не растут.
  const prev = history[1];
  if (
    prev &&
    effort !== null &&
    effort >= HARD_EFFORT &&
    (prev.effort ?? 0) >= HARD_EFFORT &&
    prev.weight === last.weight &&
    sum(done) <= sum(repsPerSet(prev))
  ) {
    return {
      ...scheme,
      sets: Math.max(2, scheme.sets - 1),
      weight:
        w > 0 ? Math.max(0, Math.min(roundDown(w * 0.9, step), w - step)) : 0,
      kind: 'deload',
      reason:
        'Две тренировки у отказа без роста — разгрузка: −10% и подход меньше',
    };
  }

  const allTop = done.length >= scheme.sets && worst >= scheme.repsMax;
  if (
    allTop &&
    (effort === null || effort <= PROGRESS_MAX_EFFORT) &&
    step > 0
  ) {
    const pct = LOWER_BODY.has(ex.muscle) ? 0.05 : 0.025;
    const next = Math.max(roundUp(w * (1 + pct), step), w + step);
    return {
      ...scheme,
      weight: next,
      kind: 'up',
      reason: `Все подходы по ${scheme.repsMax}${effort !== null ? `, сложность ${effort}/10` : ''} — +${kg(next - w)}`,
    };
  }

  if (effort !== null && effort >= HARD_EFFORT)
    return {
      ...scheme,
      weight: w,
      reps: Math.max(scheme.reps, Math.min(worst, scheme.repsMax)),
      kind: 'hold',
      reason: `Сложность была ${effort}/10 — повторяем прошлую нагрузку`,
    };

  // Без веса верх диапазона — просто держим его.
  const add = effort !== null && effort <= EASY_EFFORT ? 2 : 1;
  const target = Math.min(scheme.repsMax, Math.max(scheme.reps, worst + add));
  return {
    ...scheme,
    weight: w,
    reps: target,
    kind: allTop ? 'hold' : 'reps',
    reason: allTop
      ? 'Верх диапазона — держим'
      : `Тот же вес, добираем до ${target} повторов`,
  };
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
