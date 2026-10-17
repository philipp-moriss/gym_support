import { ArrowDown, ArrowUp, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { adaptiveEntries, type Entry } from '@/entities/entry'
import {
  CYCLE_WEEKS,
  MuscleDot,
  hasBase,
  muscles,
  nextWorkout,
  programWeek,
  schemeText,
  setsReps,
  weekPlanFor,
  type Exercise,
  type Program,
} from '@/entities/program'
import {
  ExerciseForm,
  useCreateExercise,
  useDeleteExercise,
  useReorderExercises,
  useUpdateExercise,
} from '@/features/edit-exercise'
import { cn, num, todayIso, weekdayShort } from '@/shared/lib'
import { Button, Card, Stepper } from '@/shared/ui'

/**
 * Упражнения программы: рабочий вес (дальше растёт сам), план по неделям,
 * свои упражнения, порядок, дни. Всё сохраняется на сервере сразу.
 */
export function ExerciseManager({
  program,
  entries,
}: {
  program: Program
  entries: Entry[]
}) {
  const { exercises, settings } = program
  const adaptive = adaptiveEntries(entries, settings.resetAt)
  const today = todayIso()
  const shownWeek = Math.min(
    programWeek(settings.startDate, todayIso()),
    CYCLE_WEEKS,
  )
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const create = useCreateExercise()
  const update = useUpdateExercise()
  const remove = useDeleteExercise()
  const reorder = useReorderExercises()

  const move = (index: number, dir: -1 | 1) => {
    const ids = exercises.map((e) => e.id)
    const j = index + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    reorder.mutate(ids)
  }

  return (
    <Card className="gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Меняй «последний вес» — недели пересчитаются сами, с округлением до
          2,5 кг. Карандаш — подходы, повторы, дни и нюансы.
        </p>
      </div>

      {exercises.length === 0 && editing !== 'new' && (
        <p className="rounded-md bg-muted p-4 text-[15px]">
          Пока ни одного упражнения. Добавь первое — с весом, подходами и днями.
        </p>
      )}

      {exercises.map((ex, i) =>
        editing === ex.id ? (
          <div key={ex.id} className="rise rounded-md border-2 border-ink p-3">
            <ExerciseForm
              initial={ex}
              others={exercises.filter((o) => o.id !== ex.id)}
              saving={update.isPending}
              onCancel={() => setEditing(null)}
              onSave={(input) =>
                update.mutate(
                  { id: ex.id, patch: input },
                  { onSuccess: () => setEditing(null) },
                )
              }
              onDelete={() =>
                remove.mutate(ex.id, { onSuccess: () => setEditing(null) })
              }
            />
          </div>
        ) : (
          <ExerciseRow
            key={ex.id}
            ex={ex}
            shownWeek={shownWeek}
            current={
              hasBase(ex) ? nextWorkout(ex, adaptive, today).weight : null
            }
            alternativeOf={
              ex.alternativeOf
                ? exercises.find((o) => o.id === ex.alternativeOf)?.short
                : undefined
            }
            onBase={(base) => update.mutate({ id: ex.id, patch: { base } })}
            onEdit={() => setEditing(ex.id)}
            onUp={i > 0 ? () => move(i, -1) : undefined}
            onDown={i < exercises.length - 1 ? () => move(i, 1) : undefined}
          />
        ),
      )}

      {editing === 'new' ? (
        <div className="rise flex flex-col gap-3 rounded-md border-2 border-ink p-3">
          <h3 className="display text-xl">Новое упражнение</h3>
          <ExerciseForm
            others={exercises}
            saving={create.isPending}
            onCancel={() => setEditing(null)}
            onSave={(input) =>
              create.mutate(input, { onSuccess: () => setEditing(null) })
            }
          />
        </div>
      ) : (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => setEditing('new')}
        >
          <Plus />
          Добавить упражнение
        </Button>
      )}
    </Card>
  )
}

function ExerciseRow({
  ex,
  shownWeek,
  current,
  alternativeOf,
  onBase,
  onEdit,
  onUp,
  onDown,
}: {
  ex: Exercise
  shownWeek: number
  /** Вес следующей тренировки по формулам (с рабочим весом). */
  current: number | null
  alternativeOf?: string
  onBase: (base: number) => void
  onEdit: () => void
  onUp?: () => void
  onDown?: () => void
}) {
  const weighted = hasBase(ex)
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <MuscleDot muscle={ex.muscle} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{ex.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {muscles[ex.muscle].label} ·{' '}
            {ex.group === 'main' ? 'основная часть' : 'в конце'}
            {ex.days.length > 0 &&
              ` · ${ex.days.map((d) => weekdayShort[d]).join(', ')}`}
            {alternativeOf && ` · замена для «${alternativeOf}»`}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Выше: ${ex.short}`}
          disabled={!onUp}
          onClick={onUp}
          className="size-8"
        >
          <ArrowUp />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Ниже: ${ex.short}`}
          disabled={!onDown}
          onClick={onDown}
          className="size-8"
        >
          <ArrowDown />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Изменить «${ex.short}»`}
          onClick={onEdit}
          className="size-9"
        >
          <Pencil />
        </Button>
      </div>
      {weighted ? (
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[200px_1fr]">
          <Stepper
            label="Рабочий вес"
            unit="кг"
            step={ex.step || 2.5}
            value={current ?? ex.base ?? 0}
            onChange={onBase}
          />
          <p className="pb-2 font-mono text-sm text-muted-foreground">
            {schemeText(ex)} · растёт сам
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((w) => {
            const p = weekPlanFor(ex, w)
            return (
              <div
                key={w}
                className={cn(
                  'flex min-w-0 flex-col items-center rounded-md px-1 py-2 text-center',
                  w === shownWeek ? 'bg-accent' : 'bg-muted',
                )}
              >
                <span className="font-mono text-base font-bold">
                  {(p.weight ?? 0) > 0 ? num(p.weight ?? 0) : '—'}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {setsReps(
                    { ...ex, perSide: false },
                    p.sets,
                    p.reps,
                    p.repsMax,
                  )}
                </span>
                {p.label && (
                  <span className="w-full truncate text-[10px] text-muted-foreground">
                    {p.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
