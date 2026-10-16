/** Копия бэкенда (journal, Swagger: тег journal). */
export interface Entry {
  id: string
  createdAt: string
  /** YYYY-MM-DD */
  date: string
  /** Неделя программы на момент записи */
  week: number | null
  exerciseId: string | null
  exercise: string
  sets: number
  /** Повторы, секунды или минуты — смотря что у упражнения */
  reps: number
  /** кг, 0 — без веса */
  weight: number
  /** Боль в спине 0–10 */
  pain: number | null
  /** Сложность 0–10 */
  effort: number | null
  notes: string
}

export type EntryInput = Omit<Entry, 'id' | 'createdAt'>

/** Несохранённые правки формы упражнения за сегодня. */
export interface Draft {
  weight: number
  sets: number
  reps: number
  pain: number
  effort: number
  notes: string
}

export interface Drafts {
  /** null — черновиков ещё не было */
  date: string | null
  items: Record<string, Draft>
}
