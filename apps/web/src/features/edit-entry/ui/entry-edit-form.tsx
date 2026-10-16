import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import { effortLabel, type Entry } from '@/entities/entry'
import { unitShort, type Exercise } from '@/entities/program'
import { Button, Input, Stepper } from '@/shared/ui'
import { useUpdateEntry, type EntryPatch } from '../model/use-update-entry'

/** Правка записи дневника: вес, подходы (или каждый подход), сложность, боль, заметка. */
export function EntryEditForm({
  entry,
  exercise,
  onDone,
}: {
  entry: Entry
  exercise?: Exercise
  onDone: () => void
}) {
  const update = useUpdateEntry()
  const weighted = (exercise ? exercise.step > 0 : true) || entry.weight > 0
  const unit =
    exercise && exercise.unit !== 'reps' ? unitShort[exercise.unit] : undefined
  const [v, setV] = useState({
    weight: entry.weight,
    sets: entry.sets,
    reps: entry.reps,
    setReps: entry.setReps?.length ? entry.setReps : null,
    effort: entry.effort ?? 5,
    pain: entry.pain ?? 0,
    notes: entry.notes,
  })
  const set = (patch: Partial<typeof v>) =>
    setV((cur) => ({ ...cur, ...patch }))

  function save() {
    const patch: EntryPatch = {
      weight: weighted ? v.weight : 0,
      notes: v.notes.trim(),
      effort: v.effort,
      pain: v.pain,
      ...(v.setReps?.length
        ? {
            setReps: v.setReps,
            sets: v.setReps.length,
            reps: Math.round(
              v.setReps.reduce((a, r) => a + r, 0) / v.setReps.length,
            ),
          }
        : { setReps: null, sets: v.sets, reps: v.reps }),
    }
    update.mutate({ id: entry.id, patch }, { onSuccess: onDone })
  }

  return (
    <div className="pop-in flex flex-col gap-4 rounded-md bg-muted p-3">
      {weighted && (
        <Stepper
          label="Вес"
          unit="кг"
          value={v.weight}
          step={exercise?.step || 2.5}
          onChange={(weight) => set({ weight })}
        />
      )}

      {v.setReps ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            {v.setReps.map((r, i) => (
              <Stepper
                key={i}
                label={`Подход ${i + 1}`}
                unit={unit}
                value={r}
                min={0}
                decimals={false}
                onChange={(n) =>
                  set({
                    setReps:
                      n === 0 && v.setReps!.length > 1
                        ? v.setReps!.filter((_, j) => j !== i)
                        : v.setReps!.map((x, j) => (j === i ? n : x)),
                  })
                }
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() =>
              set({ setReps: [...v.setReps!, v.setReps!.at(-1) ?? v.reps] })
            }
          >
            <Plus />
            Подход
          </Button>
          <span className="text-xs text-muted-foreground">
            Поставь 0 — подход уберётся.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Stepper
            label="Подходы"
            value={v.sets}
            min={1}
            decimals={false}
            onChange={(sets) => set({ sets })}
          />
          <Stepper
            label={
              exercise?.unit === 'sec' || exercise?.unit === 'min'
                ? 'Время'
                : 'Повторы'
            }
            unit={unit}
            value={v.reps}
            min={1}
            decimals={false}
            onChange={(reps) => set({ reps })}
          />
        </div>
      )}

      <label className="flex flex-col gap-2">
        <span className="flex items-baseline justify-between">
          <span className="mono-label text-muted-foreground">Сложность</span>
          <span className="font-mono text-sm">
            <b>{v.effort}</b>/10 · {effortLabel(v.effort)}
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={10}
          value={v.effort}
          onChange={(e) => set({ effort: Number(e.target.value) })}
          className="pain-range effort-range"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="flex items-baseline justify-between">
          <span className="mono-label text-muted-foreground">Боль в спине</span>
          <span className="font-mono text-sm">
            <b>{v.pain}</b>/10
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={10}
          value={v.pain}
          onChange={(e) => set({ pain: Number(e.target.value) })}
          className="pain-range"
        />
      </label>
      <Input
        placeholder="Заметка"
        value={v.notes}
        onChange={(e) => set({ notes: e.target.value })}
      />

      {update.isError && (
        <p className="text-sm font-semibold text-destructive">
          Не сохранилось — нет связи. Попробуй ещё раз.
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="ink"
          size="sm"
          onClick={save}
          disabled={update.isPending}
        >
          <Check strokeWidth={3} />
          Сохранить
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
