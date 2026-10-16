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

/** Поднятый вес: подходы × повторы × кг (или сумма повторов по подходам × кг). */
export function volume(e: Pick<Entry, 'sets' | 'reps' | 'weight' | 'setReps'>) {
  const reps = e.setReps?.length
    ? e.setReps.reduce((s, r) => s + r, 0)
    : e.sets * e.reps
  return reps * e.weight
}

/** «12 · 12 · 10» или «3 × 12» — как записаны подходы. */
export const repsText = (e: Pick<Entry, 'sets' | 'reps' | 'setReps'>) =>
  e.setReps?.length ? e.setReps.join(' · ') : `${e.sets} × ${e.reps}`

/** Записи, которые учитывает автоподстройка: всё после последнего сброса. */
export function adaptiveEntries(entries: Entry[], resetAt: string | null) {
  return resetAt ? entries.filter((e) => e.date >= resetAt) : entries
}
