import { useState, type ReactNode } from 'react'
import {
  ACTIVITY_KINDS,
  ACTIVITY_LABEL,
  ACTIVITY_TINT,
  ActivityIcon,
  activityDetails,
  activityHeadline,
  useActivities,
  type Activity,
  type ActivityKind,
} from '@/entities/activity'
import { cn, haptic, num } from '@/shared/lib'
import { Button, Chip, Stepper, Textarea } from '@/shared/ui'
import {
  POOLS,
  formDistanceM,
  formDurationSec,
  formForNew,
  formFromActivity,
  formProblem,
  formToInput,
  type ActivityFormState,
} from '../model/form'
import { useCreateActivity, useUpdateActivity } from '../model/mutations'
import { NumberBox } from './number-box'

const LAP_STEPS = [2, 4, 10]
const PILATES_MINUTES = [30, 45, 60, 90]

/**
 * Запись или правка доп. тренировки. Без `activity` — новая запись за `date`:
 * сначала вид, поля заполнены как в прошлый раз. С `activity` — правка, вид не меняется.
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
  const { data: all } = useActivities()
  const lastOf = (kind: ActivityKind) =>
    all?.find((a) => a.kind === kind && !a.id.startsWith('temp-'))
  const create = useCreateActivity()
  const update = useUpdateActivity()
  const [f, setF] = useState<ActivityFormState>(() => {
    if (activity) return formFromActivity(activity)
    const kind = all?.[0]?.kind ?? 'swim'
    return formForNew(kind, lastOf(kind))
  })
  const [showNotes, setShowNotes] = useState(() => f.notes !== '')
  const set = (patch: Partial<ActivityFormState>) =>
    setF((cur) => ({ ...cur, ...patch }))
  const problem = formProblem(f)
  const pending = create.isPending || update.isPending

  function save() {
    const input = formToInput(f, activity?.date ?? date)
    if (activity) {
      const { kind: _kind, ...patch } = input
      update.mutate({ id: activity.id, patch }, { onSuccess: onDone })
    } else create.mutate(input, { onSuccess: onDone })
  }

  return (
    <div className="pop-in flex flex-col gap-5">
      {!activity && (
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label="Вид"
        >
          {ACTIVITY_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={f.kind === k}
              onClick={() => {
                haptic()
                setF(formForNew(k, lastOf(k)))
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 px-1 py-3 text-sm font-bold transition-[background-color,border-color,transform] active:scale-95',
                f.kind === k
                  ? 'border-ink bg-card'
                  : 'border-transparent bg-muted hover:border-input',
              )}
            >
              <ActivityIcon kind={k} />
              {ACTIVITY_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      {f.kind === 'swim' && (
        <>
          <Section label="Дорожка">
            <div className="flex flex-wrap items-center gap-2">
              {POOLS.map((p) => (
                <Chip
                  key={p}
                  active={!f.customPool && f.poolLength === p}
                  onClick={() => set({ poolLength: p, customPool: false })}
                >
                  {p} м
                </Chip>
              ))}
              <Chip
                active={f.customPool}
                onClick={() => set({ customPool: true })}
              >
                Другая
              </Chip>
              {f.customPool && (
                <NumberBox
                  label="метров"
                  className="w-20"
                  value={str(f.poolLength)}
                  onChange={(v) => set({ poolLength: Number(v || 0) })}
                />
              )}
            </div>
          </Section>

          <div className="flex flex-col gap-2">
            <Stepper
              label="Сколько раз проплыл"
              value={f.laps}
              min={0}
              decimals={false}
              onChange={(laps) => set({ laps })}
            />
            <div className="flex items-center gap-2">
              {LAP_STEPS.map((n) => (
                <Chip key={n} onClick={() => set({ laps: f.laps + n })}>
                  +{n}
                </Chip>
              ))}
              <span className="ml-auto font-mono text-sm font-bold tabular-nums">
                = {num(f.poolLength * f.laps)} м
              </span>
            </div>
          </div>

          <Section label="Время">
            <TimeBoxes>
              <NumberBox
                label="мин"
                value={f.minutes}
                onChange={(minutes) => set({ minutes })}
              />
              <NumberBox
                label="сек"
                maxLength={2}
                value={f.seconds}
                onChange={(seconds) => set({ seconds })}
              />
            </TimeBoxes>
          </Section>
        </>
      )}

      {f.kind === 'bike' && (
        <>
          <Section label="Дистанция">
            <NumberBox
              label="км"
              decimal
              maxLength={6}
              className="w-32"
              value={f.km}
              onChange={(km) => set({ km })}
            />
          </Section>
          <Section label="Время">
            <TimeBoxes>
              <NumberBox
                label="ч"
                maxLength={2}
                value={f.hours}
                onChange={(hours) => set({ hours })}
              />
              <NumberBox
                label="мин"
                maxLength={2}
                value={f.minutes}
                onChange={(minutes) => set({ minutes })}
              />
            </TimeBoxes>
          </Section>
        </>
      )}

      {f.kind === 'pilates' && (
        <Section label="Время">
          <NumberBox
            label="мин"
            className="w-24"
            value={f.minutes}
            onChange={(minutes) => set({ minutes })}
          />
          <div className="grid grid-cols-4 gap-2">
            {PILATES_MINUTES.map((m) => (
              <Chip
                key={m}
                active={f.minutes === String(m) && !f.seconds}
                onClick={() => set({ minutes: String(m), seconds: '' })}
              >
                {m}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      <Preview form={f} problem={problem} />

      {showNotes ? (
        <Textarea
          autoFocus={f.notes === ''}
          placeholder="Заметка: самочувствие, где тренировался…"
          value={f.notes}
          maxLength={2000}
          onChange={(e) => set({ notes: e.target.value })}
        />
      ) : (
        <button
          type="button"
          className="cursor-pointer self-start text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-card-foreground"
          onClick={() => setShowNotes(true)}
        >
          + Заметка
        </button>
      )}

      <div className="flex gap-2">
        <Button
          variant="ink"
          className="flex-1"
          disabled={!!problem || pending}
          onClick={save}
        >
          Сохранить
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Отмена
        </Button>
      </div>
    </div>
  )
}

const str = (n: number) => (n ? String(n) : '')

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="mono-label text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

/** Поля времени через двоеточие: «22 : 30». */
function TimeBoxes({ children }: { children: [ReactNode, ReactNode] }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-20">{children[0]}</div>
      <span className="pt-3 font-mono text-2xl font-bold">:</span>
      <div className="w-20">{children[1]}</div>
    </div>
  )
}

/** Итог вживую в цвете вида: главная цифра крупно, ниже темп или скорость. */
function Preview({
  form,
  problem,
}: {
  form: ActivityFormState
  problem: string | null
}) {
  const measured = {
    kind: form.kind,
    poolLength: form.poolLength,
    laps: form.laps,
    distanceM: formDistanceM(form),
    durationSec: formDurationSec(form),
  }
  const head = activityHeadline(measured)
  return (
    <div
      aria-live="polite"
      className={cn(
        'flex min-h-20 flex-col justify-center gap-1 rounded-md p-4 text-ink',
        ACTIVITY_TINT[form.kind],
      )}
    >
      {problem ? (
        <span className="font-semibold">{problem}</span>
      ) : (
        <>
          <span className="display text-4xl leading-none">
            {head.value}
            <span className="ml-1 text-lg font-semibold">{head.unit}</span>
          </span>
          <span className="font-mono text-sm">
            {activityDetails(measured).join(' · ')}
          </span>
        </>
      )}
    </div>
  )
}
