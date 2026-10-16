import { CloudOff, NotebookPen, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { formatDay, num } from '@/shared/lib'
import { Button, Card, PageHeader } from '@/shared/ui'

/** «Дневник»: все записи по дням, итоги, выгрузка и загрузка Excel. */
export function JournalList({
  entries,
  exercises,
  back,
}: {
  entries: Entry[]
  exercises: Exercise[]
  back?: { to: string; label: string }
}) {
  const remove = useDeleteEntry().mutate
  const [editing, setEditing] = useState<string | null>(null)
  const exerciseById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  )

  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const e of sortEntries(entries))
      map.set(e.date, [...(map.get(e.date) ?? []), e])
    return [...map.entries()]
  }, [entries])

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
        <Stat label="Тренировок" value={groups.length.toString()} />
        <Stat
          label="Подходов"
          value={num(entries.reduce((s, e) => s + e.sets, 0))}
        />
        <Stat label="Объём, кг" value={num(totalVolume)} />
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-stage-border p-8 text-center text-stage-muted">
          <NotebookPen className="size-8" />
          <p>
            Пока пусто. Отметь упражнения на вкладке «Сегодня» — они появятся
            здесь.
          </p>
          <p className="text-sm">
            Есть прошлые тренировки в Excel? Загрузи файл ниже.
          </p>
        </div>
      ) : (
        <section className="flex flex-col gap-4">
          {groups.map(([date, items]) => (
            <Card key={date} className="gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="display min-w-0 text-2xl first-letter:uppercase">
                  {formatDay(date)}
                </h2>
                <span className="mono-label shrink-0 text-muted-foreground">
                  {items[0].week ? `Нед. ${items[0].week} · ` : ''}
                  {num(items.reduce((s, e) => s + volume(e), 0))} кг
                </span>
              </div>
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
                          disabled={e.id.startsWith('temp-')}
                          onClick={() =>
                            setEditing(editing === e.id ? null : e.id)
                          }
                        >
                          <span className="flex items-center gap-2 font-semibold">
                            <span className="truncate">
                              {ex?.short ?? e.exercise}
                            </span>
                            <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
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
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Удалить «${e.exercise}»`}
                          disabled={e.id.startsWith('temp-')}
                          onClick={() => remove(e.id)}
                        >
                          <Trash2 />
                        </Button>
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
            </Card>
          ))}
        </section>
      )}

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
