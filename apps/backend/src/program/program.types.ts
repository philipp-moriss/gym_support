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
  /** Какая тренировка сплита в этот день (id из settings.workouts); нет — все упражнения. */
  workout?: string | null;
}

/** Тренировка сплита: «Верх», «Низ», «Всё тело». */
export interface WorkoutType {
  id: string;
  title: string;
}

/** Упражнение шаблона программы (до привязки к пользователю). */
export interface ExerciseTemplate {
  id: string;
  name: string;
  short: string;
  muscle: Muscle;
  group: Group;
  unit: Unit;
  perSide?: boolean;
  base?: number;
  step: number;
  weeks?: WeekPlan[];
  alternativeOf?: string;
  tips: string[];
  /** Подходы и диапазон повторов (с рабочим весом); по умолчанию 3×12–15. */
  targetSets?: number;
  repsMin?: number;
  repsMax?: number;
  /** Тренировки сплита, где есть упражнение; пусто — во всех. */
  workouts?: string[];
}

export interface ProgramTemplateData {
  exercises: ExerciseTemplate[];
  rules: string[];
  schedule: DayPlan[];
  workouts: WorkoutType[];
}
