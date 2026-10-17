/** Копия бэкенда (program/program.types.ts, Swagger: тег program). Ключи не переименовывать. */
export type Unit = 'reps' | 'sec' | 'min'
export type Group = 'main' | 'extra'
export type Muscle =
  | 'chest'
  | 'back'
  | 'glutes'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'posture'
  | 'core'
  | 'mobility'
  | 'cardio'

export interface WeekPlan {
  sets: number
  reps: number
  repsMax?: number
  /** кг; для упражнений без базы — из плана */
  weight?: number
  /** подпись из плана: «Гантели 1–2 кг», «На полу» */
  label?: string
}

export interface Exercise {
  id: string
  position: number
  name: string
  short: string
  muscle: Muscle
  group: Group
  unit: Unit
  perSide: boolean
  /** Рабочий вес, дальше — двойная прогрессия (docs/training-progression.md). null — план в weeks. */
  base: number | null
  /** Когда рабочий вес задан руками: позже последней записи — считаем от него. */
  baseSetAt: string | null
  /** Шаг изменения веса в степпере; 0 — без веса */
  step: number
  /** Подходов и диапазон повторов для упражнения с рабочим весом. */
  targetSets: number
  repsMin: number
  repsMax: number
  weeks: WeekPlan[] | null
  /** id упражнения, которое это заменяет */
  alternativeOf: string | null
  tips: string[]
  /** Дни недели (0 — пн); пусто — каждый день тренировки */
  days: number[]
}

export type ExerciseInput = Omit<Exercise, 'id' | 'position' | 'baseSetAt'>

/** День расписания, 0 — понедельник. */
export interface DayPlan {
  gym: 'yes' | 'optional' | 'no'
  title: string
  extras: string[]
}

export interface Settings {
  /** Понедельник первой недели цикла */
  startDate: string
  /** Упражнение заменено альтернативой: bridge → bridge1 */
  swaps: Record<string, string>
  /** С этой даты записи снова влияют на подстройку весов; более ранние игнорируются */
  resetAt: string | null
  schedule: DayPlan[]
  rules: string[]
}

export interface Program {
  exercises: Exercise[]
  settings: Settings
}
