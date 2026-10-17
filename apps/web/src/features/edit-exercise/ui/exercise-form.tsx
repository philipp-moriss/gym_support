import { Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  muscles,
  type Exercise,
  type ExerciseInput,
  type Muscle,
  type Unit,
  type WeekPlan,
  type WorkoutType,
} from '@/entities/program'
import { cn, weekdayShort } from '@/shared/lib'
import {
  Button,
  Chip,
  Confirm,
  Field,
  Input,
  Stepper,
  Textarea,
} from '@/shared/ui'

const units: { id: Unit; label: string }[] = [
  { id: 'reps', label: 'Повторы' },
  { id: 'sec', label: 'Секунды' },
  { id: 'min', label: 'Минуты' },
]
const steps = [0, 0.5, 1, 2.5, 5]

const emptyWeeks = (): WeekPlan[] =>
  Array.from({ length: 4 }, () => ({ sets: 3, reps: 12 }))

const blankExercise = (): ExerciseInput => ({
  name: '',
  short: '',
  muscle: 'chest',
  group: 'main',
  unit: 'reps',
  perSide: false,
  base: 20,
  step: 2.5,
  targetSets: 3,
  repsMin: 12,
  repsMax: 15,
  weeks: null,
  alternativeOf: null,
  tips: [],
  workouts: [],
  days: [],
})

const toInput = ({
  id: _id,
  position: _p,
  baseSetAt: _b,
  ...rest
}: Exercise): ExerciseInput => rest

/**
 * Своё упражнение: название, мышцы, единицы, как растёт нагрузка
 * (от рабочего веса по двойной прогрессии или свой план на 4 недели), дни и нюансы.
 */
export function ExerciseForm({
  initial,
  others,
  workouts = [],
  saving,
  onSave,
  onCancel,
  onDelete,
}: {
  initial?: Exercise
  /** Остальные упражнения — для «Замена для». */
  others: Exercise[]
  /** Тренировки сплита программы: «Верх», «Низ». */
  workouts?: WorkoutType[]
  saving?: boolean
  onSave: (input: ExerciseInput) => void
  onCancel: () => void
  onDelete?: () => void
}) {
  const [v, setV] = useState<ExerciseInput>(() =>
    initial ? toInput(initial) : blankExercise(),
  )
  const [tips, setTips] = useState(() => v.tips.join('\n'))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (patch: Partial<ExerciseInput>) =>
    setV((cur) => ({ ...cur, ...patch }))
  const byBase = v.base !== null
  const weeks = v.weeks ?? emptyWeeks()
  const setWeek = (i: number, patch: Partial<WeekPlan>) =>
    set({ weeks: weeks.map((w, j) => (j === i ? { ...w, ...patch } : w)) })

  const valid =
    v.name.trim().length > 0 &&
    (byBase
      ? v.targetSets > 0 && v.repsMin > 0 && v.repsMax >= v.repsMin
      : weeks.every((w) => w.sets > 0 && w.reps > 0))

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onSave({
          ...v,
          name: v.name.trim(),
          short: v.short.trim() || v.name.trim(),
          weeks: byBase ? null : weeks,
          step: byBase && v.step === 0 ? 2.5 : v.step,
          tips: tips
            .split('\n')
            .map((t) => t.trim())
            .filter(Boolean),
        })
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Название">
          <Input
            value={v.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Жим гантелей сидя"
            required
            maxLength={120}
          />
        </Field>
        <Field label="Коротко, для карточки">
          <Input
            value={v.short}
            onChange={(e) => set({ short: e.target.value })}
            placeholder="Жим сидя"
            maxLength={60}
          />
        </Field>
      </div>

      <Field label="Мышцы">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(muscles) as Muscle[]).map((m) => (
            <Chip
              key={m}
              active={v.muscle === m}
              onClick={() => set({ muscle: m })}
              className="h-9 gap-2 px-3"
            >
              <span
                className="mr-1.5 inline-block size-2.5 rounded-full"
                style={{ background: muscles[m].color }}
              />
              {muscles[m].label}
            </Chip>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Где в тренировке">
          <div className="flex flex-wrap gap-2">
            <Chip
              active={v.group === 'main'}
              onClick={() => set({ group: 'main' })}
            >
              Основная часть
            </Chip>
            <Chip
              active={v.group === 'extra'}
              onClick={() => set({ group: 'extra' })}
            >
              В конце
            </Chip>
          </div>
        </Field>
        <Field label="Считаем">
          <div className="flex flex-wrap gap-2">
            {units.map((u) => (
              <Chip
                key={u.id}
                active={v.unit === u.id}
                onClick={() => set({ unit: u.id })}
              >
                {u.label}
              </Chip>
            ))}
            <Chip
              active={v.perSide}
              onClick={() => set({ perSide: !v.perSide })}
            >
              На сторону
            </Chip>
          </div>
        </Field>
      </div>

      <Field label="Нагрузка">
        <div className="flex flex-wrap gap-2">
          <Chip
            active={byBase}
            onClick={() => set({ base: v.base ?? 20, step: v.step || 2.5 })}
          >
            От рабочего веса
          </Chip>
          <Chip active={!byBase} onClick={() => set({ base: null, weeks })}>
            Свой план по неделям
          </Chip>
        </div>
      </Field>

      {byBase ? (
        <div className="flex flex-col gap-3 rounded-md bg-muted p-3">
          <p className="text-sm text-muted-foreground">
            Тренировка идёт с рабочим весом. Сделал все подходы на верх
            диапазона и не у отказа — вес растёт на шаг, иначе добираешь
            повторы. Боль и перерыв снижают нагрузку.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <NumberInput
              label="Подходы"
              value={v.targetSets}
              onChange={(targetSets) => set({ targetSets })}
            />
            <NumberInput
              label="Повторы от"
              value={v.repsMin}
              onChange={(repsMin) => set({ repsMin })}
            />
            <NumberInput
              label="до"
              value={v.repsMax}
              onChange={(repsMax) => set({ repsMax })}
            />
          </div>
          {v.repsMax < v.repsMin && (
            <p className="text-sm text-destructive">
              Верх диапазона меньше низа.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Stepper
              label="Рабочий вес"
              unit="кг"
              step={v.step || 2.5}
              value={v.base ?? 0}
              onChange={(base) => set({ base })}
            />
            <StepPicker
              value={v.step || 2.5}
              onChange={(step) => set({ step })}
              withoutZero
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-md bg-muted p-3">
          <StepPicker value={v.step} onChange={(step) => set({ step })} />
          <div className="flex flex-col gap-2">
            {weeks.map((w, i) => (
              <div
                key={i}
                className="grid grid-cols-[auto_1fr_1fr] items-end gap-2 sm:grid-cols-[auto_1fr_1fr_1fr_2fr]"
              >
                <span className="mono-label pb-3 text-muted-foreground">
                  Нед {i + 1}
                </span>
                <NumberInput
                  label="Подходы"
                  value={w.sets}
                  onChange={(sets) => setWeek(i, { sets })}
                />
                <NumberInput
                  label={
                    v.unit === 'reps'
                      ? 'Повторы'
                      : v.unit === 'sec'
                        ? 'Секунды'
                        : 'Минуты'
                  }
                  value={w.reps}
                  onChange={(reps) => setWeek(i, { reps })}
                />
                {v.step > 0 && (
                  <NumberInput
                    label="Вес, кг"
                    value={w.weight ?? 0}
                    step={v.step}
                    onChange={(weight) => setWeek(i, { weight })}
                  />
                )}
                <Field
                  label="Подпись"
                  className={cn(
                    'col-span-2 sm:col-span-1',
                    v.step === 0 && 'sm:col-span-2',
                  )}
                >
                  <Input
                    value={w.label ?? ''}
                    onChange={(e) =>
                      setWeek(i, { label: e.target.value || undefined })
                    }
                    placeholder="На полу"
                    maxLength={60}
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>
      )}

      {workouts.length > 0 && (
        <Field
          label="Тренировка"
          hint="Ничего не выбрано — упражнение в каждой тренировке."
        >
          <div className="flex flex-wrap gap-1.5">
            {workouts.map((w) => {
              const on = (v.workouts ?? []).includes(w.id)
              return (
                <Chip
                  key={w.id}
                  active={on}
                  onClick={() =>
                    set({
                      workouts: on
                        ? v.workouts.filter((x) => x !== w.id)
                        : [...(v.workouts ?? []), w.id],
                    })
                  }
                >
                  {w.title}
                </Chip>
              )
            })}
          </div>
        </Field>
      )}

      <Field
        label="Дни"
        hint={
          workouts.length
            ? 'Обычно не нужно: дни задаются тренировками в расписании.'
            : 'Ничего не выбрано — упражнение в каждый день тренировки.'
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {weekdayShort.map((d, i) => {
            const on = v.days.includes(i)
            return (
              <Chip
                key={d}
                active={on}
                className="w-12 px-0"
                onClick={() =>
                  set({
                    days: on
                      ? v.days.filter((x) => x !== i)
                      : [...v.days, i].sort(),
                  })
                }
              >
                {d}
              </Chip>
            )
          })}
        </div>
      </Field>

      {others.length > 0 && (
        <Field
          label="Замена для"
          hint="Альтернатива показывается в карточке основного упражнения кнопкой «Заменить»."
        >
          <select
            className="h-11 w-full rounded-md border-2 border-input bg-card px-3 text-[16px]"
            value={v.alternativeOf ?? ''}
            onChange={(e) => set({ alternativeOf: e.target.value || null })}
          >
            <option value="">Самостоятельное упражнение</option>
            {others
              .filter((o) => !o.alternativeOf)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
          </select>
        </Field>
      )}

      <Field label="Нюансы техники" hint="Каждый с новой строки.">
        <Textarea
          value={tips}
          onChange={(e) => setTips(e.target.value)}
          placeholder={'Спина прижата к спинке.\nВниз медленно, 2–3 секунды.'}
          rows={4}
        />
      </Field>

      {confirmDelete && onDelete ? (
        <Confirm
          text="Удалить упражнение из программы? Записи в дневнике останутся."
          danger
          onCancel={() => setConfirmDelete(false)}
        >
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 />
            Удалить
          </Button>
        </Confirm>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="ink" disabled={!valid || saving}>
            <Check strokeWidth={3} />
            {saving ? 'Сохраняю…' : 'Сохранить'}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              className="ml-auto text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 />
              Удалить
            </Button>
          )}
        </div>
      )}
    </form>
  )
}

function StepPicker({
  value,
  onChange,
  withoutZero,
}: {
  value: number
  onChange: (v: number) => void
  withoutZero?: boolean
}) {
  return (
    <Field label="Шаг веса">
      <div className="flex flex-wrap gap-1.5">
        {steps
          .filter((s) => !withoutZero || s > 0)
          .map((s) => (
            <Chip
              key={s}
              active={value === s}
              onClick={() => onChange(s)}
              className="h-9 px-3"
            >
              {s === 0 ? 'Без веса' : `${s.toLocaleString('ru-RU')} кг`}
            </Chip>
          ))}
      </div>
    </Field>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) =>
          onChange(e.target.value === '' ? 0 : Number(e.target.value))
        }
        className="font-mono"
      />
    </Field>
  )
}
