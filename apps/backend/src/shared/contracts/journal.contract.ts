/** Дневник для других модулей (тренер, ИИ): только чтение. */
export interface JournalEntryView {
  id: string;
  date: string;
  week: number | null;
  exerciseId: string | null;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  setReps: number[] | null;
  pain: number | null;
  effort: number | null;
  notes: string;
}

/** Сводка для списка клиентов тренера. */
export interface JournalStats {
  userId: string;
  /** Последний день с записью, YYYY-MM-DD; null — записей нет. */
  lastWorkout: string | null;
  /** Дней с тренировками за последние 7 дней. */
  workouts7d: number;
  /** Максимальная боль за 14 дней; null — не отмечали. */
  maxPain14d: number | null;
}

export const JOURNAL = Symbol('JOURNAL');

export interface JournalReader {
  /** Записи с даты `since` (YYYY-MM-DD) включительно, старые сверху. */
  history(userId: string, since?: string): Promise<JournalEntryView[]>;
  /** Сводка по нескольким пользователям; `today` — YYYY-MM-DD по часам сервера. */
  stats(userIds: string[], today: string): Promise<JournalStats[]>;
}
