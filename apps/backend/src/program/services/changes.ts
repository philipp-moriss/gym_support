import type { DayPlan, WeekPlan } from '../program.types';

/** Одна строка журнала правок: поле, было, стало (текстом для человека). */
export interface FieldChange {
  field: string;
  before: string | null;
  after: string | null;
}

const DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

const kg = (n: number | null | undefined) =>
  n === null || n === undefined ? null : `${Number(n)} кг`;

/** «3×12–15 · 4×15 @20 кг»: план на 4 недели одной строкой. */
export const formatWeeks = (weeks: WeekPlan[] | null | undefined) =>
  weeks?.length
    ? weeks
        .map(
          (w) =>
            `${w.sets}×${w.reps}${w.repsMax ? `–${w.repsMax}` : ''}${
              w.weight ? ` @${w.weight} кг` : ''
            }${w.label ? ` (${w.label})` : ''}`,
        )
        .join(' · ')
    : null;

const formatDays = (days: number[] | null | undefined) =>
  days?.length ? days.map((d) => DAYS[d]).join(', ') : 'все дни тренировок';

const formatSchedule = (schedule: DayPlan[]) =>
  schedule
    .map((d, i) =>
      d.gym === 'yes' ? DAYS[i] : d.gym === 'optional' ? `${DAYS[i]}?` : null,
    )
    .filter(Boolean)
    .join(', ') || 'нет дней';

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

interface ExerciseLike {
  name: string;
  base: number | null;
  step: number;
  targetSets: number;
  repsMin: number;
  repsMax: number;
  weeks: WeekPlan[] | null;
  days: number[];
  tips: string[];
  alternativeOf: string | null;
}

/** Что поменялось в упражнении — то, что важно клиенту. Порядок и мелочи не пишем. */
export function diffExercise(
  before: ExerciseLike,
  after: ExerciseLike,
): FieldChange[] {
  const out: FieldChange[] = [];
  if (!same(before.base, after.base))
    out.push({ field: 'base', before: kg(before.base), after: kg(after.base) });
  if (!same(before.step, after.step))
    out.push({ field: 'step', before: kg(before.step), after: kg(after.step) });
  const scheme = (e: ExerciseLike) =>
    `${e.targetSets}×${e.repsMin}–${e.repsMax}`;
  if (before.base !== null && scheme(before) !== scheme(after))
    out.push({ field: 'scheme', before: scheme(before), after: scheme(after) });
  if (!same(before.weeks, after.weeks))
    out.push({
      field: 'weeks',
      before: formatWeeks(before.weeks),
      after: formatWeeks(after.weeks),
    });
  if (!same(before.days, after.days))
    out.push({
      field: 'days',
      before: formatDays(before.days),
      after: formatDays(after.days),
    });
  if (before.name !== after.name)
    out.push({ field: 'name', before: before.name, after: after.name });
  if (!same(before.tips, after.tips))
    out.push({
      field: 'tips',
      before: before.tips.join('; ') || null,
      after: after.tips.join('; ') || null,
    });
  return out;
}

interface SettingsLike {
  startDate: string;
  resetAt: string | null;
  swaps: Record<string, string>;
  schedule: DayPlan[];
  rules: string[];
}

export function diffSettings(
  before: SettingsLike,
  after: SettingsLike,
): FieldChange[] {
  const out: FieldChange[] = [];
  if (before.startDate !== after.startDate)
    out.push({
      field: 'startDate',
      before: before.startDate,
      after: after.startDate,
    });
  if (!same(before.resetAt, after.resetAt))
    out.push({
      field: 'resetAt',
      before: before.resetAt,
      after: after.resetAt,
    });
  if (!same(before.swaps, after.swaps))
    out.push({
      field: 'swaps',
      before: formatSwaps(before.swaps),
      after: formatSwaps(after.swaps),
    });
  if (!same(before.schedule, after.schedule))
    out.push({
      field: 'schedule',
      before: formatSchedule(before.schedule),
      after: formatSchedule(after.schedule),
    });
  if (!same(before.rules, after.rules))
    out.push({
      field: 'rules',
      before: before.rules.join('\n') || null,
      after: after.rules.join('\n') || null,
    });
  return out;
}

const formatSwaps = (swaps: Record<string, string>) =>
  Object.entries(swaps)
    .map(([from, to]) => `${from} → ${to}`)
    .join(', ') || null;
