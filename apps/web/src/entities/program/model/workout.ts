import type { Exercise, Program } from './types'

/** Упражнение в тренировке сплита: без привязки (или к удалённым тренировкам) — во всех. */
export function inWorkout(
  e: Exercise,
  workoutId: string | null,
  known: Set<string>,
) {
  const own = (e.workouts ?? []).filter((w) => known.has(w))
  return !workoutId || !own.length || own.includes(workoutId)
}

/** Какая тренировка сплита в этот день по расписанию. */
export const scheduledWorkout = ({ settings }: Program, day: number) => {
  const id = settings.schedule[day]?.workout ?? null
  return (settings.workouts ?? []).some((w) => w.id === id) ? id : null
}

/**
 * Упражнения на день: основные с учётом замен и добивка. Сплит: только
 * упражнения тренировки дня (или выбранной — `workoutId`). Упражнения,
 * привязанные к другим дням, не попадают; если не подходит ни одно
 * (тренировка вне расписания) — берём всю программу.
 */
export function workoutFor(
  program: Program,
  day: number,
  workoutId?: string | null,
) {
  const { exercises, settings } = program
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const known = new Set((settings.workouts ?? []).map((w) => w.id))
  const chosen = workoutId !== undefined
  const wid = chosen ? workoutId : scheduledWorkout(program, day)
  const fits = (e: Exercise) =>
    inWorkout(e, wid, known) &&
    // Выбранная вручную тренировка — не смотрим на дни недели.
    (chosen || !e.days.length || e.days.includes(day))
  const pick = (filter: (e: Exercise) => boolean) => {
    const main = exercises
      .filter((e) => e.group === 'main' && !e.alternativeOf && filter(e))
      .map((e) => byId.get(settings.swaps[e.id]) ?? e)
    const extra = exercises.filter(
      (e) => e.group === 'extra' && !e.alternativeOf && filter(e),
    )
    return { main, extra, all: [...main, ...extra] }
  }
  const today = pick(fits)
  return {
    ...(today.all.length ? today : pick(() => true)),
    workout: settings.workouts?.find((w) => w.id === wid) ?? null,
  }
}

/**
 * Следующая по кругу тренировка сплита после последней сделанной — для
 * тренировки вне расписания. `lastExerciseIds` — упражнения последней тренировки.
 */
export function nextInRotation(program: Program, lastExerciseIds: string[]) {
  const types = program.settings.workouts ?? []
  if (!types.length) return null
  const known = new Set(types.map((w) => w.id))
  const byId = new Map(program.exercises.map((e) => [e.id, e]))
  const last = types.findIndex((t) =>
    lastExerciseIds.some((id) => {
      const e = byId.get(id)
      return e && (e.workouts ?? []).filter((w) => known.has(w)).includes(t.id)
    }),
  )
  return types[(last + 1) % types.length].id
}

/** Какая тренировка сплита была по записям дня (тренировались вне расписания). */
export function workoutOfEntries(program: Program, exerciseIds: string[]) {
  const types = program.settings.workouts ?? []
  const byId = new Map(program.exercises.map((e) => [e.id, e]))
  return (
    types.find((t) =>
      exerciseIds.some((id) => (byId.get(id)?.workouts ?? []).includes(t.id)),
    )?.id ?? null
  )
}
