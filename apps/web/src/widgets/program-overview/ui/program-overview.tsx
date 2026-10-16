import { Pencil, Plus } from 'lucide-react'
import { Link } from 'react-router'
import {
  CYCLE_WEEKS,
  MuscleDot,
  hasBase,
  muscles,
  planFor,
  programWeek,
  setsReps,
  type Exercise,
  type Program,
} from '@/entities/program'
import { routes } from '@/shared/config'
import { num, todayIso, weekdayShort } from '@/shared/lib'
import { Card } from '@/shared/ui'

/** Упражнения программы только для чтения: что и с каким весом на этой неделе. */
export function ProgramOverview({ program }: { program: Program }) {
  const { exercises, settings } = program
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
          <h2 className="display text-2xl">Мои упражнения</h2>
          <span className="mono-label text-muted-foreground">
            Веса {week}-й недели
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
  replaces,
}: {
  ex: Exercise
  week: number
  replaces?: string
}) {
  const p = planFor(ex, week)
  const weight =
    hasBase(ex) || (p.weight ?? 0) > 0 ? `${num(p.weight ?? 0)} кг` : null
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
          {!weight && p.label && ` · ${p.label}`}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        {weight && <span className="font-mono font-bold">{weight}</span>}
        <span className="font-mono text-xs text-muted-foreground">
          {setsReps(ex, p.sets, p.reps, p.repsMax)}
        </span>
      </div>
    </div>
  )
}
