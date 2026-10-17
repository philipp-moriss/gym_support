/** Неделя плана упражнения — та же форма, что в entities/program (слайсы не импортируют друг друга). */
export interface WeekPlan {
  sets: number
  reps: number
  repsMax?: number
  weight?: number
  label?: string
}

/** Копия бэкенда (coaching, Swagger: тег coach). */
export interface CoachClient {
  id: string
  login: string
  /** Имя, которое дал клиенту тренер при создании. */
  name: string | null
  /** Как тренер называет клиента у себя. */
  alias: string | null
  linkedAt: string
  /** Неделя цикла клиента сегодня. */
  week: number
  /** YYYY-MM-DD; null — тренировок не было. */
  lastWorkout: string | null
  workouts7d: number
  maxPain14d: number | null
}

export interface NewClient {
  client: CoachClient
  /** Код входа клиента — показывается один раз. */
  code: string
}

export interface Invite {
  code: string
  expiresAt: string
}

export interface ClientNotes {
  text: string
  updatedAt: string | null
}

/** Правка программы чужими руками (тренер или ИИ по решению тренера). */
export interface ProgramChange {
  id: string
  actorId: string
  exerciseId: string | null
  exercise: string | null
  /** base, step, weeks, days, name, tips, added, removed, schedule, rules, startDate, swaps, resetAt */
  field: string
  before: string | null
  after: string | null
  reason: string | null
  source: 'manual' | 'ai'
  seenAt: string | null
  createdAt: string
}

export type Trend = 'up' | 'flat' | 'down'

export interface SuggestedChange {
  exerciseId: string
  exercise: string
  before: {
    base: number | null
    step: number
    targetSets: number
    repsMin: number
    repsMax: number
    weeks: WeekPlan[] | null
    /** Что предложил бы скрипт на следующую тренировку. */
    formula: number | null
  }
  base?: number
  step?: number
  targetSets?: number
  repsMin?: number
  repsMax?: number
  weeks?: WeekPlan[]
  reason: string
}

export interface AnalysisResult {
  journal: {
    summary: string
    progress: { exerciseId: string; trend: Trend; note: string }[]
    concerns: string[]
  }
  program: {
    summary: string
    changes: SuggestedChange[]
    ideas: string[]
    dropped: number
  }
}

export interface Analysis {
  id: string
  clientId: string
  coachId: string
  status: 'pending' | 'ready' | 'failed'
  /** Только в ответе на один анализ. */
  result?: AnalysisResult | null
  error: string | null
  appliedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MyCoach {
  coach: { name: string; since: string } | null
}

/** Правка ИИ, которую применяет тренер (числа можно поправить). */
export interface ChangeInput {
  exerciseId: string
  base?: number
  step?: number
  targetSets?: number
  repsMin?: number
  repsMax?: number
  weeks?: WeekPlan[]
  reason: string
}
