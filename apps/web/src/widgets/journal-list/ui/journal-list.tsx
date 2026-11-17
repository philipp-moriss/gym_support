import { CloudOff, NotebookPen, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ActivityLine, type Activity } from '@/entities/activity'
import {
  PainDot,
  repsText,
  sortEntries,
  volume,
  type Entry,
} from '@/entities/entry'
import {
  MuscleDot,
  setsReps,
  weightText,
  type Exercise,
} from '@/entities/program'
import { useDeleteEntry } from '@/features/delete-entry'
import { EntryEditForm } from '@/features/edit-entry'
import { ExportButton } from '@/features/export-xlsx'
import { ImportXlsx } from '@/features/import-xlsx'
import { ActivityForm, useDeleteActivity } from '@/features/log-activity'
import { cn, formatDay, num } from '@/shared/lib'
import { Button, Card, PageHeader } from '@/shared/ui'

/**
 * «Дневник»: все записи и доп. тренировки по дням, итоги, выгрузка и загрузка Excel.
 * `readOnly` — тренер смотрит дневник клиента: без правки, удаления и загрузки.
 */
export function JournalList({
  entries,
  activities,
  exercises,
  back,
  readOnly,
}: {
  entries: Entry[]
  activities: Activity[]
  exercises: Exercise[]
  back?: { to: string; label: string }
  readOnly?: boolean
}) {
  const remove = useDeleteEntry().mutate
  const removeActivity = useDeleteActivity().mutate
  const [editing, setEditing] = useState<string | null>(null) // id записи или кардио
  const exerciseById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  )

  /** Дни новые сверху: записи зала и кардио одного дня — в одной карточке. */
  const groups = useMemo(() => {
    const map = new Map<string, { entries: Entry[]; activities: Activity[] }>()
    const day = (date: string) => {
      let g = map.get(date)
      if (!g) map.set(date, (g = { entries: [], activities: [] }))
      return g
    }
    for (const e of sortEntries(entries)) day(e.date).entries.push(e)
    for (const a of activities) day(a.date).activities.push(a)
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
  }, [entries, activities])

  const gymDays = groups.filter(([, g]) => g.entries.length).length

  const totalVolume = entries.reduce((s, e) => s + volume(e), 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label="Всё, что записано" title="Дневник" back={back} />
      <ExportButton
        variant="highlight"
        className="self-start"
        entries={entries}
        exercises={exercises}
      />

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Тренировок" value={gymDays.toString()} />
        <Stat
          label="Подходов"
          value={num(entries.reduce((s, e) => s + e.sets, 0))}
        />
        <Stat label="Объём, кг" value={num(totalVolume)} />
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-stage-border p-8 text-center text-stage-muted">
          <NotebookPen className="size-8" />
          {readOnly ? (
            <p>Клиент ещё ничего не записал.</p>
          ) : (
            <>
              <p>
                Пока пусто. Отметь упражнения на вкладке «Сегодня» — они
                появятся здесь.
              </p>
              <p className="text-sm">
                Есть прошлые тренировки в Excel? Загрузи файл ниже.
              </p>
            </>
          )}
        </div>
      ) : (
        <section className="flex flex-col gap-4">
          {groups.map(([date, { entries: items, activities: cardio }]) => (
            <Card key={date} className="gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="display min-w-0 text-2xl first-letter:uppercase">
                  {formatDay(date)}
                </h2>
                <span className="mono-label shrink-0 text-muted-foreground">
                  {items.length > 0 &&
                    `${items[0].week ? `Нед. ${items[0].week} · ` : ''}${num(
                      items.reduce((s, e) => s + volume(e), 0),
                    )} кг`}
                </span>
              </div>
              {items.length > 0 && (
                <ul className="flex flex-col">
                  {items.map((e) => {
                    const ex = e.exerciseId
                      ? exerciseById.get(e.exerciseId)
                      : undefined
                    return (
                      <li
                        key={e.id}
                        className="flex flex-col gap-3 border-t border-border py-3 first:border-t-0"
                      >
                        <div className="flex items-center gap-3">
                          <MuscleDot muscle={ex?.muscle} />
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 text-left"
                            aria-expanded={editing === e.id}
                            disabled={readOnly || e.id.startsWith('temp-')}
                            onClick={() =>
                              setEditing(editing === e.id ? null : e.id)
                            }
                          >
                            <span className="flex items-center gap-2 font-semibold">
                              <span className="truncate">
                                {ex?.short ?? e.exercise}
                              </span>
                              {!readOnly && (
                                <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
                              )}
                            </span>
                            <span className="font-mono text-sm text-muted-foreground">
                              {(!ex || ex.step > 0) &&
                                `${weightText(e.weight)} · `}
                              {e.setReps?.length
                                ? repsText(e)
                                : ex
                                  ? setsReps(ex, e.sets, e.reps)
                                  : `${e.sets} × ${e.reps}`}
                              {e.effort !== null && ` · сложн. ${e.effort}/10`}
                            </span>
                            {e.notes && (
                              <span className="text-sm text-muted-foreground">
                                {e.notes}
                              </span>
                            )}
                            {e.pending && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-magenta-punch">
                                <CloudOff className="size-3.5" />
                                Ещё не отправлено — уйдёт, когда появится сеть
                              </span>
                            )}
                          </button>
                          <PainDot pain={e.pain} />
                          {!readOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Удалить «${e.exercise}»`}
                              disabled={e.id.startsWith('temp-')}
                              onClick={() => remove(e.id)}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                        {editing === e.id && (
                          <EntryEditForm
                            entry={e}
                            exercise={ex}
                            onDone={() => setEditing(null)}
                          />
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
              {cardio.length > 0 && (
                <ul
                  className={cn(
                    'flex flex-col',
                    items.length > 0 && 'border-t border-border',
                  )}
                >
                  {cardio.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-col gap-3 border-t border-border py-3 first:border-t-0"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
                          aria-expanded={editing === a.id}
                          disabled={readOnly || a.id.startsWith('temp-')}
                          onClick={() =>
                            setEditing(editing === a.id ? null : a.id)
                          }
                        >
                          <ActivityLine activity={a} />
                          {!readOnly && (
                            <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Удалить доп. тренировку"
                            disabled={a.id.startsWith('temp-')}
                            onClick={() => removeActivity(a.id)}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                      {editing === a.id && (
                        <ActivityForm
                          activity={a}
                          date={a.date}
                          onDone={() => setEditing(null)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </section>
      )}

      {!readOnly && (
        <section className="flex flex-col gap-3 rounded-md bg-block p-4">
          <div className="flex flex-col gap-1">
            <h2 className="display text-2xl">Загрузить из Excel</h2>
            <p className="text-sm text-stage-muted">
              Лист «Дневник» из нашей выгрузки или из «План тренировок.xlsx».
              Упражнения сопоставим с программой по названию, повторы пропустим.
            </p>
          </div>
          <ImportXlsx exercises={exercises} />
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-block p-3 sm:p-4">
      <span className="mono-label text-stage-muted">{label}</span>
      <span className="display truncate text-2xl sm:text-3xl">{value}</span>
    </div>
  )
}
