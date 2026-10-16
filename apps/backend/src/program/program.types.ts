/** Ключи и значения совпадают с клиентом (apps/web, entities/program). Не переименовывать без клиента. */
export const MUSCLES = [
  'chest',
  'back',
  'glutes',
  'legs',
  'shoulders',
  'arms',
  'posture',
  'core',
  'mobility',
  'cardio',
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const UNITS = ['reps', 'sec', 'min'] as const;
export type Unit = (typeof UNITS)[number];

export const GROUPS = ['main', 'extra'] as const;
export type Group = (typeof GROUPS)[number];

export const GYM_DAYS = ['yes', 'optional', 'no'] as const;

export interface WeekPlan {
  sets: number;
  reps: number;
  repsMax?: number;
  /** кг; для упражнений без базы — из плана */
  weight?: number;
  /** подпись: «Гантели 1–2 кг», «На полу» */
  label?: string;
}

/** День недели в расписании, 0 — понедельник. */
export interface DayPlan {
  gym: (typeof GYM_DAYS)[number];
  title: string;
  extras: string[];
}
