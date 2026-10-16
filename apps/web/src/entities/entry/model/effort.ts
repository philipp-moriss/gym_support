/** Старый формат «как пошло» — встречается в ранних записях и Excel-файлах. */
export type Feel = 'easy' | 'ok' | 'hard'

/** «Легко / норм / тяжело» из ранних версий → сложность 0–10. */
export const legacyEffort: Record<Feel, number> = { easy: 3, ok: 5, hard: 9 }

/** Пороги сложности: до 4 — легко, от 8 — тяжело. */
export const EASY_MAX = 4
export const HARD_MIN = 8

/** Порог боли в спине: 4 и выше — снижаем нагрузку. */
export const PAIN_LIMIT = 4

export function effortLabel(n: number) {
  if (n <= 2) return 'очень легко'
  if (n <= EASY_MAX) return 'легко'
  if (n < HARD_MIN) return 'норм'
  if (n < 10) return 'тяжело'
  return 'на пределе'
}
