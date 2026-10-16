import type { Entry } from './types'

/** Новые сверху: по дате, затем по порядку добавления. */
export function sortEntries<T extends Pick<Entry, 'date' | 'createdAt'>>(
  entries: T[],
) {
  return entries.toSorted(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  )
}

/** Поднятый вес: подходы × повторы × кг. */
export function volume(e: Pick<Entry, 'sets' | 'reps' | 'weight'>) {
  return e.sets * e.reps * e.weight
}

/** Записи, которые учитывает автоподстройка: всё после последнего сброса. */
export function adaptiveEntries(entries: Entry[], resetAt: string | null) {
  return resetAt ? entries.filter((e) => e.date >= resetAt) : entries
}
