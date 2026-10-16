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
  /** Повторы по подходам, если отмечали каждый: [12, 12, 10] */
  setReps?: number[] | null
  /** Только на телефоне: записано без сети, ещё не отправлено */
  pending?: boolean
}

export type EntryInput = Omit<Entry, 'id' | 'createdAt' | 'pending'>

/** Несохранённые правки формы упражнения за сегодня. */
export interface Draft {
  weight: number
  sets: number
  reps: number
  pain: number
  effort: number
  notes: string
  /** Отмеченные подходы: повторы каждого, по порядку */
  setsDone?: number[]
}

export interface Drafts {
  /** null — черновиков ещё не было */
  date: string | null
  items: Record<string, Draft>
}
