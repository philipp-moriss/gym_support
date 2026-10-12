import type { Exercise, Unit } from "./program";

export const num = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 1 });

export const unitShort: Record<Unit, string> = { reps: "повт.", sec: "сек", min: "мин" };

/** «3 × 12», «3 × 30 сек», «3 × 8 на сторону» */
export function setsReps(ex: Exercise, sets: number, reps: number, repsMax?: number) {
  const r = repsMax ? `${reps}–${repsMax}` : `${reps}`;
  const unit = ex.unit === "reps" ? "" : ` ${unitShort[ex.unit]}`;
  const side = ex.perSide ? (ex.unit === "reps" ? " на сторону" : "") : "";
  return `${sets} × ${r}${unit}${side}`;
}

export function weightText(weight: number) {
  return weight > 0 ? `${num(weight)} кг` : "без веса";
}

export const formatDay = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    ...opts,
  });
