import type { Exercise, Program } from './types'

/**
 * Упражнения на день: основные с учётом замен и добивка. Упражнения,
 * привязанные к другим дням, не попадают; если на день не подходит ни
 * одно (тренировка вне расписания) — берём всю программу.
 */
export function workoutFor({ exercises, settings }: Program, day: number) {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const onDay = (e: Exercise) => !e.days.length || e.days.includes(day)
  const pick = (filter: (e: Exercise) => boolean) => {
    const main = exercises
      .filter((e) => e.group === 'main' && !e.alternativeOf && filter(e))
      .map((e) => byId.get(settings.swaps[e.id]) ?? e)
    const extra = exercises.filter(
      (e) => e.group === 'extra' && !e.alternativeOf && filter(e),
    )
    return { main, extra, all: [...main, ...extra] }
  }
  const today = pick(onDay)
  return today.all.length ? today : pick(() => true)
}
