/**
 * Программа пользователя для других модулей (тренер, ИИ). Формы совпадают с
 * ответом `GET /program`; типы продублированы здесь, потому что shared не
 * зависит от модуля `program`.
 */
export interface ProgramWeekPlan {
  sets: number;
  reps: number;
  repsMax?: number;
  weight?: number;
  label?: string;
}

export interface ProgramExerciseView {
  id: string;
  position: number;
  name: string;
  short: string;
  muscle: string;
  group: string;
  unit: string;
  perSide: boolean;
  base: number | null;
  /** Когда рабочий вес задан руками; позже последней записи — точка отсчёта. */
  baseSetAt: Date | null;
  step: number;
  targetSets: number;
  repsMin: number;
  repsMax: number;
  weeks: ProgramWeekPlan[] | null;
  alternativeOf: string | null;
  tips: string[];
  /** Тренировки сплита, где есть упражнение; пусто — во всех. */
  workouts: string[];
  days: number[];
}

export interface ProgramSettingsView {
  startDate: string;
  swaps: Record<string, string>;
  resetAt: string | null;
  schedule: {
    gym: string;
    title: string;
    extras: string[];
    workout?: string | null;
  }[];
  rules: string[];
  workouts: { id: string; title: string }[];
}

export interface ProgramView {
  exercises: ProgramExerciseView[];
  settings: ProgramSettingsView;
}

/** Кто меняет программу не своими руками: тренер вручную или правкой ИИ. */
export interface ProgramActor {
  id: string;
  source: 'manual' | 'ai';
  reason?: string | null;
}

/** Правка упражнения из ИИ-анализа: хотя бы одно поле нагрузки. */
export interface ExerciseChange {
  exerciseId: string;
  base?: number;
  step?: number;
  targetSets?: number;
  repsMin?: number;
  repsMax?: number;
  weeks?: ProgramWeekPlan[];
  reason: string;
}

export interface ProgramChangeView {
  id: string;
  actorId: string;
  exerciseId: string | null;
  exercise: string | null;
  field: string;
  before: string | null;
  after: string | null;
  reason: string | null;
  source: 'manual' | 'ai';
  seenAt: Date | null;
  createdAt: Date;
}

export const PROGRAM = Symbol('PROGRAM');

export interface ProgramAccess {
  get(userId: string): Promise<ProgramView>;
  /** Всё или ничего: неподходящая правка — 400 с id упражнения. Каждая правка попадает в журнал правок. */
  applyExerciseChanges(
    userId: string,
    changes: ExerciseChange[],
    actor: ProgramActor,
  ): Promise<ProgramView>;
  /** Правки чужими руками, новые сверху. */
  listChanges(userId: string, limit?: number): Promise<ProgramChangeView[]>;
}
