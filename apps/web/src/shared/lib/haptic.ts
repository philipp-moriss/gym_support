/**
 * Тактильный отклик. Android (браузеры с Vibration API) — короткая вибрация
 * из обработчика нажатия. Safari на iPhone вибрацию не поддерживает и не даёт
 * «тик» от программного клика — там отклик даёт прозрачный системный
 * переключатель поверх кнопки (shared/ui/haptic-overlay), здесь ничего не делаем.
 */
type Kind = 'tap' | 'error' | 'success'

const patterns: Record<Kind, number | number[]> = {
  tap: 8,
  error: [40, 60, 40],
  /** Вся тренировка закрыта: короткая «победная» серия. */
  success: [15, 50, 15, 50, 45],
}

export function haptic(kind: Kind = 'tap') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator)
    navigator.vibrate(patterns[kind])
}

/** iPhone / iPad (iPadOS притворяется Mac'ом, но у него есть тач). */
export const isIos = () =>
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))
