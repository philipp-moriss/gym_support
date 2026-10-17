import { Pencil, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { adaptiveEntries, type Entry } from '@/entities/entry'
import {
  CYCLE_WEEKS,
  MuscleDot,
  hasBase,
  muscles,
  nextWorkout,
  programWeek,
  setsReps,
  weekPlanFor,
  type Exercise,
  type Program,
} from '@/entities/program'
import { useScopedRoutes } from '@/shared/config'
import { num, todayIso, weekdayShort } from '@/shared/lib'
import { Card } from '@/shared/ui'

/** Упражнения программы только для чтения: что и с каким весом в следующий раз. */
export function ProgramOverview({
  program,
  entries,
}: {
  program: Program
  entries: Entry[]
}) {
  const { exercises, settings } = program
  const adaptive = adaptiveEntries(entries, settings.resetAt)
  const routes = useScopedRoutes()
  const week = Math.min(
    programWeek(settings.startDate, todayIso()),
    CYCLE_WEEKS,
  )
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const main = exercises.filter((e) => e.group === 'main')
  const extra = exercises.filter((e) => e.group === 'extra')

  return (
    <Card className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="display text-2xl">
            {routes.clientId ? 'Упражнения' : 'Мои упражнения'}
          </h2>
          <span className="mono-label text-muted-foreground">
            На следующую тренировку
          </span>
        </div>
        <Link
          to={routes.planExercises}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border-2 border-ink px-3.5 text-sm font-bold"
        >
          {exercises.length ? (
            <Pencil className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          {exercises.length ? 'Изменить' : 'Добавить'}
        </Link>
      </div>

      {exercises.length === 0 && (
        <p className="rounded-md bg-muted p-4 text-[15px]">
          Пока ни одного упражнения. Нажми «Добавить» — веса, подходы и дни
          настраиваются там же.
        </p>
      )}

      {[
        { title: 'Основная часть', items: main },
        { title: 'В конце', items: extra },
      ]
        .filter((g) => g.items.length)
        .map((g) => (
          <section key={g.title} className="flex flex-col">
            <h3 className="mono-label pb-1 text-muted-foreground">{g.title}</h3>
            {g.items.map((ex) => (
              <Row
                key={ex.id}
                ex={ex}
                week={week}
                entries={adaptive}
                replaces={
                  ex.alternativeOf
                    ? byId.get(ex.alternativeOf)?.short
                    : undefined
                }
              />
            ))}
          </section>
        ))}
    </Card>
  )
}

function Row({
  ex,
  week,
  entries,
  replaces,
}: {
  ex: Exercise
  week: number
  entries: Entry[]
  replaces?: string
}) {
  const p = hasBase(ex)
    ? nextWorkout(ex, entries, todayIso())
    : { ...weekPlanFor(ex, week), label: weekPlanFor(ex, week).label }
  const weight =
    hasBase(ex) || (p.weight ?? 0) > 0 ? `${num(p.weight ?? 0)} кг` : null
  const label = 'label' in p ? p.label : undefined
  return (
    <div className="flex items-center gap-3 border-t border-border py-3 first-of-type:border-t-0">
      <MuscleDot muscle={ex.muscle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{ex.short}</span>
        <span className="truncate text-xs text-muted-foreground">
          {muscles[ex.muscle].label}
          {ex.days.length > 0 &&
            ` · ${ex.days.map((d) => weekdayShort[d]).join(', ')}`}
          {replaces && ` · замена для «${replaces}»`}
          {!weight && label && ` · ${label}`}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        {weight && <span className="font-mono font-bold">{weight}</span>}
        <span className="font-mono text-xs text-muted-foreground">
          {setsReps(
            ex,
            p.sets,
            p.reps,
            p.reps < (p.repsMax ?? 0) ? p.repsMax : undefined,
          )}
        </span>
      </div>
    </div>
  )
}
