import clsx from 'clsx'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Equal,
  Pencil,
  Plus,
  Repeat2,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  EASY_MAX,
  HARD_MIN,
  PAIN_LIMIT,
  PainDot,
  effortLabel,
  type Draft,
  repsText,
  type Entry,
  type EntryInput,
} from '@/entities/entry'
import {
  ExerciseIcon,
  muscles,
  setsReps,
  unitShort,
  weightText,
  type Exercise,
} from '@/entities/program'
import { useDraft } from '@/features/edit-draft'
import { restTimer } from '@/features/rest-timer'
import { formatDay, haptic, num } from '@/shared/lib'
import {
  Button,
  Collapse,
  HapticOverlay,
  Input,
  NumberedList,
  Stepper,
} from '@/shared/ui'
import type { Suggestion, Tone } from '../model/suggest'
import { Confetti } from './confetti'
import { SetTracker } from './set-tracker'

type LogValues = Pick<
  EntryInput,
  'weight' | 'sets' | 'reps' | 'setReps' | 'pain' | 'effort' | 'notes'
>

const toneBadge: Record<
  Exclude<Tone, 'plan'>,
  { text: string; icon: typeof ArrowDown; className: string }
> = {
  down: { text: 'легче', icon: ArrowDown, className: 'bg-bubblegum-pink' },
  hold: { text: 'повтор', icon: Equal, className: 'bg-buttery-yellow' },
  up: { text: 'больше', icon: ArrowUp, className: 'bg-matcha-cream' },
}

export function ExerciseCard({
  ex,
  suggestion,
  open,
  onToggle,
  today,
  history,
  swap,
  onLog,
  index,
}: {
  ex: Exercise
  suggestion: Suggestion
  open: boolean
  onToggle: () => void
  /** Записи этого упражнения за сегодня */
  today: Entry[]
  /** Прошлые записи, новые сверху */
  history: Entry[]
  swap?: { label: string; onSwap: () => void }
  onLog: (values: LogValues) => void
  index: number
}) {
  const done = today.length > 0
  const muscle = muscles[ex.muscle]
  const badge = suggestion.tone !== 'plan' ? toneBadge[suggestion.tone] : null
  const [burst, setBurst] = useState(0)
  const ref = useRef<HTMLElement>(null)

  // Правки формы хранятся в черновике: переживают переход к другому упражнению и перезагрузку
  const { draft, save, clear } = useDraft(ex.id)
  const defaults: Draft = {
    weight: suggestion.weight,
    sets: suggestion.sets,
    reps: suggestion.reps,
    pain: history[0]?.pain ?? 0,
    effort: 5,
    notes: '',
  }
  // Слияние с defaults: черновик старого формата (без effort) не ломает форму
  const values: Draft = { ...defaults, ...draft }
  // «Изменено» — только нагрузка: сложность, боль и заметка — отметки за сегодня, а не правка плана.
  const modified =
    !!draft &&
    (['weight', 'sets', 'reps'] as const).some((k) => values[k] !== defaults[k])

  // Раскрытую карточку подтягиваем в кадр, когда она открылась сама после «Сделано»
  useEffect(() => {
    if (open)
      setTimeout(
        () =>
          ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
        340,
      )
  }, [open])

  return (
    <article
      ref={ref}
      className={clsx(
        'rise relative rounded-md text-card-foreground transition-colors duration-300',
        done
          ? 'bg-[color-mix(in_srgb,var(--matcha-cream)_45%,var(--bone-white))]'
          : 'bg-card',
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {burst > 0 && <Confetti key={burst} />}

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
      >
        <span
          className="relative grid size-11 shrink-0 place-items-center rounded-full text-ink"
          style={{ background: muscle.color }}
        >
          {done ? (
            <Check className="pop-in size-6" strokeWidth={3} />
          ) : (
            <ExerciseIcon ex={ex} className="size-5" />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={clsx(
              'line-clamp-2 text-[17px] font-bold leading-tight',
              done && 'line-through decoration-2 opacity-70',
            )}
          >
            {ex.short}
          </span>
          <span className="flex items-center gap-2">
            <span className="mono-label text-muted-foreground">
              {muscle.label}
            </span>
            {badge && (
              <span
                className={clsx(
                  'mono-label inline-flex items-center gap-1 rounded-full px-2 py-1 text-ink',
                  badge.className,
                )}
              >
                <badge.icon className="size-3" strokeWidth={3} />
                {badge.text}
              </span>
            )}
            {!done && (values.setsDone?.length ?? 0) > 0 && (
              <span className="mono-label rounded-full bg-hi-vis-yellow px-2 py-1 text-ink">
                {values.setsDone!.length}/{values.sets}
              </span>
            )}
            {modified && (
              <span className="mono-label inline-flex items-center gap-1 rounded-full bg-[var(--lilac)] px-2 py-1 text-ink">
                <Pencil className="size-3" strokeWidth={3} />
                изменено
              </span>
            )}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-1">
          {ex.step > 0 && (
            <span className="display text-2xl tabular-nums">
              {values.weight > 0 ? (
                <>
                  {num(values.weight)}
                  <span className="ml-0.5 text-base">кг</span>
                </>
              ) : (
                <span className="text-lg">без веса</span>
              )}
            </span>
          )}
          <span
            className={clsx(
              'font-mono text-sm text-muted-foreground',
              ex.step === 0 && 'text-base font-bold text-ink',
            )}
          >
            {setsReps(ex, values.sets, values.reps)}
          </span>
        </span>

        <ChevronDown
          className={clsx(
            'size-5 shrink-0 text-muted-foreground transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>

      <Collapse open={open}>
        {open && (
          <Details
            ex={ex}
            suggestion={suggestion}
            today={today}
            history={history}
            swap={swap}
            values={values}
            defaults={defaults}
            modified={modified}
            onChange={(patch) => save({ ...values, ...patch })}
            onReset={() =>
              save({
                ...values,
                weight: defaults.weight,
                sets: defaults.sets,
                reps: defaults.reps,
              })
            }
            onLog={(v) => {
              onLog(v)
              clear()
              setBurst((b) => b + 1)
            }}
          />
        )}
      </Collapse>
    </article>
  )
}

function Details({
  ex,
  suggestion,
  today,
  history,
  swap,
  values,
  defaults,
  modified,
  onChange,
  onReset,
  onLog,
}: {
  ex: Exercise
  suggestion: Suggestion
  today: Entry[]
  history: Entry[]
  swap?: { label: string; onSwap: () => void }
  values: Draft
  defaults: Draft
  modified: boolean
  onChange: (patch: Partial<Draft>) => void
  onReset: () => void
  onLog: (values: LogValues) => void
}) {
  const { weight, sets, reps, pain, effort, notes } = values
  const setsDone = values.setsDone ?? []
  const allSetsDone = setsDone.length >= sets
  // Нагрузка правится только после «Изменить»: случайный тап по степперу не сдвинет вес.
  const [editLoad, setEditLoad] = useState(false)
  // Упражнение уже записано: форма скрыта, пока не нажали «Записать ещё раз».
  const [again, setAgain] = useState(false)
  const showForm = today.length === 0 || again

  const repsStep = ex.unit === 'sec' ? 5 : 1

  return (
    <div className="flex flex-col gap-5 px-[17px] pb-[17px]">
      <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--magenta-punch)]" />
        <span>
          <b>{suggestion.reason}.</b>{' '}
          {suggestion.label && (
            <span className="text-muted-foreground">{suggestion.label}.</span>
          )}
        </span>
      </div>

      {(ex.tips.length > 0 || swap) && (
        <section className="flex flex-col gap-2">
          {ex.tips.length > 0 && (
            <h3 className="mono-label text-muted-foreground">Нюансы</h3>
          )}
          <NumberedList items={ex.tips} />
          {swap && (
            <Button
              variant="outline"
              size="sm"
              className="mt-1 max-w-full self-start"
              onClick={swap.onSwap}
            >
              <Repeat2 />
              <span className="truncate">{swap.label}</span>
            </Button>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="mono-label text-muted-foreground">Прошлые разы</h3>
          <ul className="flex flex-col gap-1.5">
            {history.slice(0, 3).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 font-mono text-sm"
              >
                <span className="text-muted-foreground">
                  {formatDay(e.date, { weekday: undefined, month: 'short' })}
                </span>
                <span className="flex-1 truncate text-right">
                  {ex.step > 0 && `${weightText(e.weight)} · `}
                  {e.setReps?.length
                    ? repsText(e)
                    : setsReps(ex, e.sets, e.reps)}
                </span>
                <PainDot pain={e.pain} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-md border-2 border-dashed border-border p-3">
        {today.length > 0 && (
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Check className="size-4" strokeWidth={3} />
            Сегодня записано:{' '}
            {today
              .map(
                (e) =>
                  `${ex.step > 0 ? `${num(e.weight)} кг · ` : ''}${repsText(e)}`,
              )
              .join(', ')}
          </p>
        )}
        {!showForm ? (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setAgain(true)}
          >
            <Plus />
            Записать ещё раз
          </Button>
        ) : (
          <>
            {editLoad ? (
              <div
                className={clsx(
                  'grid gap-3',
                  ex.step > 0 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2',
                )}
              >
                {ex.step > 0 && (
                  <Stepper
                    label="Вес"
                    unit="кг"
                    value={weight}
                    step={ex.step}
                    onChange={(v) => onChange({ weight: v })}
                  />
                )}
                <Stepper
                  label="Подходы"
                  value={sets}
                  min={1}
                  decimals={false}
                  onChange={(v) => onChange({ sets: v })}
                />
                <Stepper
                  label={
                    ex.unit === 'reps'
                      ? ex.perSide
                        ? 'Повторы / сторона'
                        : 'Повторы'
                      : 'Время'
                  }
                  unit={ex.unit === 'reps' ? undefined : unitShort[ex.unit]}
                  value={reps}
                  min={1}
                  step={repsStep}
                  decimals={false}
                  onChange={(v) => onChange({ reps: v })}
                />
                <Button
                  variant="ink"
                  size="sm"
                  className="self-start sm:col-span-3"
                  onClick={() => setEditLoad(false)}
                >
                  <Check strokeWidth={3} />
                  Готово
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="flex flex-col gap-1">
                  <span className="mono-label text-muted-foreground">
                    Нагрузка
                  </span>
                  <b className="font-mono">
                    {ex.step > 0 && (
                      <span className="whitespace-nowrap">
                        {weightText(weight)} ·{' '}
                      </span>
                    )}
                    <span className="whitespace-nowrap">
                      {setsReps(ex, sets, reps)}
                    </span>
                  </b>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditLoad(true)}
                >
                  <Pencil />
                  Изменить
                </Button>
              </div>
            )}
            {modified && (
              <div className="pop-in flex flex-wrap items-center justify-between gap-2 rounded-md bg-[color-mix(in_srgb,var(--lilac)_45%,var(--bone-white))] p-2 pl-3">
                <span className="text-sm">
                  Изменено вручную. По умолчанию:{' '}
                  <b className="font-mono whitespace-nowrap">
                    {ex.step > 0 && `${weightText(defaults.weight)} · `}
                    {setsReps(ex, defaults.sets, defaults.reps)}
                  </b>
                </span>
                <Button variant="outline" size="sm" onClick={onReset}>
                  <RotateCcw />
                  Вернуть по умолчанию
                </Button>
              </div>
            )}

            <SetTracker
              planned={sets}
              reps={reps}
              repsLabel={ex.unit === 'reps' ? 'Повторы' : 'Время'}
              done={setsDone}
              onChange={(next) => onChange({ setsDone: next })}
              onSetDone={() => restTimer.start()}
            />

            {/* Подписи фиксированной высоты: пока тянешь слайдер, карточка не прыгает. */}
            <label className="flex flex-col gap-3">
              <span className="flex items-baseline justify-between gap-2">
                <span className="mono-label text-muted-foreground">
                  Сложность
                </span>
                <span className="font-mono text-sm whitespace-nowrap">
                  <b className="text-lg">{effort}</b>/10 · {effortLabel(effort)}
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={10}
                value={effort}
                onChange={(e) => onChange({ effort: Number(e.target.value) })}
                className="pain-range effort-range"
              />
              <span className="h-5 truncate text-sm text-muted-foreground">
                {effort >= HARD_MIN
                  ? 'Повторим вес в следующий раз'
                  : effort <= EASY_MAX
                    ? 'Добавим повторы в следующий раз'
                    : ''}
              </span>
            </label>

            <label className="flex flex-col gap-3">
              <span className="flex items-baseline justify-between gap-2">
                <span className="mono-label text-muted-foreground">
                  Боль в спине
                </span>
                <span className="font-mono text-sm whitespace-nowrap">
                  <b className="text-lg">{pain}</b>/10
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={10}
                value={pain}
                onChange={(e) => onChange({ pain: Number(e.target.value) })}
                className="pain-range"
              />
              <span className="h-5 truncate text-sm text-destructive">
                {pain >= PAIN_LIMIT ? 'Снизим нагрузку в следующий раз' : ''}
              </span>
            </label>

            <Input
              placeholder="Заметка: техника, самочувствие…"
              value={notes}
              onChange={(e) => onChange({ notes: e.target.value })}
            />

            {/* Пока подходы не закончились, кнопка отмечает следующий; запись — только после всех. */}
            <Button
              variant="ink"
              className={clsx(
                'relative w-full',
                allSetsDone &&
                  'bg-hi-vis-yellow text-ink hover:bg-hi-vis-yellow/85',
              )}
              onClick={() => {
                if (!allSetsDone) {
                  haptic()
                  onChange({ setsDone: [...setsDone, reps] })
                  restTimer.start()
                  return
                }
                onLog({
                  weight: ex.step > 0 ? weight : 0,
                  sets: setsDone.length,
                  reps: Math.round(
                    setsDone.reduce((a, r) => a + r, 0) / setsDone.length,
                  ),
                  setReps: setsDone,
                  pain,
                  effort,
                  notes: notes.trim(),
                })
                setAgain(false)
              }}
            >
              <Check strokeWidth={3} />
              {allSetsDone
                ? 'Сделано'
                : `Подход ${setsDone.length + 1} из ${sets} сделан`}
              <HapticOverlay />
            </Button>
          </>
        )}
      </section>
    </div>
  )
}
