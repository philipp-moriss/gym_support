import { useState } from 'react'
import {
  ACTIVITY_LABEL,
  activityStats,
  type Activity,
  type ActivityKind,
} from '@/entities/activity'
import { Button, Chip, Field, Stepper, Textarea } from '@/shared/ui'
import {
  emptyForm,
  formDistanceM,
  formDurationSec,
  formFromActivity,
  formToInput,
  formValid,
  type ActivityFormState,
} from '../model/form'
import { useCreateActivity, useUpdateActivity } from '../model/mutations'

const KINDS: ActivityKind[] = ['swim', 'bike']
const POOLS = [25, 50]

/**
 * Запись или правка кардио. Без `activity` — новая запись за `date`
 * с выбором вида; с `activity` — правка, вид не меняется.
 */
export function ActivityForm({
  activity,
  date,
  onDone,
}: {
  activity?: Activity
  date: string
  onDone: () => void
}) {
  const create = useCreateActivity()
  const update = useUpdateActivity()
  const [f, setF] = useState<ActivityFormState>(() =>
    activity ? formFromActivity(activity) : emptyForm('swim'),
  )
  const set = (patch: Partial<ActivityFormState>) =>
    setF((cur) => ({ ...cur, ...patch }))
  const valid = formValid(f)
  const pending = create.isPending || update.isPending

  function save() {
    const input = formToInput(f, activity?.date ?? date)
    if (activity) {
      const { kind: _kind, ...patch } = input
      update.mutate({ id: activity.id, patch }, { onSuccess: onDone })
    } else create.mutate(input, { onSuccess: onDone })
  }

  return (
    <div className="pop-in flex flex-col gap-4 rounded-md bg-muted p-3">
      {!activity && (
        <div className="flex flex-wrap gap-2" aria-label="Вид">
          {KINDS.map((k) => (
            <Chip
              key={k}
              active={f.kind === k}
              onClick={() => setF({ ...emptyForm(k), notes: f.notes })}
            >
              {ACTIVITY_LABEL[k]}
            </Chip>
          ))}
        </div>
      )}

      {f.kind === 'swim' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-label text-muted-foreground">Дорожка</span>
            {POOLS.map((p) => (
              <Chip
                key={p}
                active={f.poolLength === p}
                onClick={() => set({ poolLength: p })}
              >
                {p} м
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stepper
              label="Дорожка"
              unit="м"
              value={f.poolLength}
              min={10}
              decimals={false}
              onChange={(poolLength) => set({ poolLength })}
            />
            <Stepper
              label="Сколько раз"
              value={f.laps}
              min={1}
              decimals={false}
              onChange={(laps) => set({ laps })}
            />
            <Stepper
              label="Минуты"
              value={f.minutes}
              decimals={false}
              onChange={(minutes) => set({ minutes })}
            />
            <Stepper
              label="Секунды"
              value={f.seconds}
              step={5}
              decimals={false}
              onChange={(seconds) => set({ seconds: Math.min(seconds, 59) })}
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Stepper
            label="Дистанция"
            unit="км"
            value={f.km}
            step={1}
            onChange={(km) => set({ km })}
          />
          <div />
          <Stepper
            label="Часы"
            value={f.hours}
            decimals={false}
            onChange={(hours) => set({ hours })}
          />
          <Stepper
            label="Минуты"
            value={f.minutes}
            step={5}
            decimals={false}
            onChange={(minutes) => set({ minutes: Math.min(minutes, 59) })}
          />
        </div>
      )}

      <p className="font-mono text-sm text-muted-foreground">
        {valid
          ? activityStats({
              kind: f.kind,
              poolLength: f.poolLength,
              laps: f.laps,
              distanceM: formDistanceM(f),
              durationSec: formDurationSec(f),
            }).join(' · ')
          : 'Укажи дистанцию и время'}
      </p>

      <Field label="Заметка">
        <Textarea
          value={f.notes}
          maxLength={2000}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </Field>

      <div className="flex gap-2">
        <Button disabled={!valid || pending} onClick={save}>
          Сохранить
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
