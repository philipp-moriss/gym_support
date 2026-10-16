import {
  CalendarHeart,
  HeartHandshake,
  ListPlus,
  PartyPopper,
  Waves,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  PAIN_LIMIT,
  adaptiveEntries,
  sortEntries,
  volume,
  type Entry,
  type EntryInput,
} from '@/entities/entry'
import {
  CYCLE_WEEKS,
  programWeek,
  workoutFor,
  type Exercise,
  type Program,
} from '@/entities/program'
import { useLogEntry } from '@/features/log-entry'
import { useUpdateSettings } from '@/features/update-settings'
import { routes } from '@/shared/config'
import { formatDay, num, todayIso, weekday, weekdayLong } from '@/shared/lib'
import { Button } from '@/shared/ui'
import { suggest } from '../model/suggest'
import { ExerciseCard } from './exercise-card'

/** «Сегодня»: тренировка дня по расписанию пользователя, с подстройкой весов. */
export function Workout({
  program,
  entries,
  banner,
}: {
  program: Program
  entries: Entry[]
  banner?: ReactNode
}) {
  const { settings, exercises } = program
  const logEntry = useLogEntry()
  const updateSettings = useUpdateSettings()
  const update = updateSettings.mutate
  const date = todayIso()
  const week = programWeek(settings.startDate, date)
  const day = settings.schedule[weekday(date)] ?? {
    gym: 'no',
    title: 'Отдых',
    extras: [],
  }
  const gymToday = day.gym === 'yes'
  const [forced, setForced] = useState(false)
  const exerciseById = new Map(exercises.map((e) => [e.id, e]))
  const list = workoutFor(program, weekday(date))

  const todayEntries = entries.filter((e) => e.date === date)
  const doneIds = new Set(todayEntries.map((e) => e.exerciseId))
  const doneCount = list.all.filter((e) => doneIds.has(e.id)).length
  const firstUndone = list.all.find((e) => !doneIds.has(e.id))?.id ?? null
  const [openId, setOpenId] = useState<string | null>(null)

  // Подстройка видит только записи после последнего сброса
  const adaptive = adaptiveEntries(entries, settings.resetAt)
  const lastSession = sortEntries(adaptive).find((e) => e.date < date)
  const lastPain = lastSession
    ? Math.max(
        ...adaptive
          .filter((e) => e.date === lastSession.date)
          .map((e) => e.pain ?? 0),
      )
    : 0

  const tonnage = todayEntries.reduce((s, e) => s + volume(e), 0)
  const showWorkout = gymToday || forced || todayEntries.length > 0

  function log(
    ex: Exercise,
    values: Pick<
      EntryInput,
      'weight' | 'sets' | 'reps' | 'pain' | 'effort' | 'notes'
    >,
  ) {
    logEntry.mutate({
      ...values,
      date,
      week,
      exerciseId: ex.id,
      exercise: ex.name,
    })
    // Следующее невыполненное раскрывается само
    const next = list.all.find((e) => e.id !== ex.id && !doneIds.has(e.id))
    setTimeout(() => setOpenId(next?.id ?? null), 650)
  }

  function swapFor(ex: Exercise) {
    const alt = exercises.find((e) => e.alternativeOf === ex.id)
    if (alt) {
      return {
        label: `Заменить на «${alt.short}»`,
        onSwap: () => {
          update({ swaps: { ...settings.swaps, [ex.id]: alt.id } })
          setOpenId(alt.id)
        },
      }
    }
    if (ex.alternativeOf) {
      const orig = exerciseById.get(ex.alternativeOf)!
      const rest = Object.fromEntries(
        Object.entries(settings.swaps).filter(([k]) => k !== orig.id),
      )
      return {
        label: `Вернуть «${orig.short}»`,
        onSwap: () => {
          update({ swaps: rest })
          setOpenId(orig.id)
        },
      }
    }
  }

  const renderList = (items: Exercise[], offset: number) =>
    items.map((ex, i) => (
      <ExerciseCard
        key={ex.id}
        index={offset + i}
        ex={ex}
        suggestion={suggest(ex, week, adaptive, date)}
        open={openId === ex.id}
        onToggle={() => setOpenId(openId === ex.id ? null : ex.id)}
        today={todayEntries.filter((e) => e.exerciseId === ex.id)}
        history={sortEntries(entries).filter(
          (e) => e.exerciseId === ex.id && e.date < date,
        )}
        swap={swapFor(ex)}
        onLog={(v) => log(ex, v)}
      />
    ))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          <span className="mono-label text-stage-muted">
            {formatDay(date, { weekday: undefined })} · {day.title}
            {day.extras.length > 0 && ` · ${day.extras.join(', ')}`}
          </span>
          <h1 className="display text-[clamp(1.9rem,8.8vw,3.75rem)] text-accent">
            {weekdayLong[weekday(date)]}
          </h1>
        </div>
        <WeekRing week={week} />
      </header>

      {banner}

      {lastPain >= PAIN_LIMIT && (
        <div className="rise flex items-start gap-3 rounded-md bg-bubblegum-pink p-4 text-ink">
          <HeartHandshake className="size-6 shrink-0" />
          <p className="text-[15px]">
            <b>В прошлый раз спина была {lastPain}/10.</b> Веса уже снижены —
            слушай себя и останавливайся при боли.
          </p>
        </div>
      )}

      {exercises.length === 0 ? (
        <EmptyProgram />
      ) : !showWorkout ? (
        <RestDay
          title={day.title}
          optional={day.gym === 'optional'}
          onTrain={() => setForced(true)}
        />
      ) : (
        <>
          <Progress
            done={doneCount}
            total={list.all.length}
            tonnage={tonnage}
          />

          {doneCount === list.all.length && (
            <div className="pop-in flex items-center gap-4 rounded-md bg-accent p-5 text-ink">
              <PartyPopper className="size-10 shrink-0" />
              <div>
                <p className="display text-3xl">Тренировка закрыта!</p>
                <p className="mt-1 text-[15px]">
                  {tonnage > 0 ? `Поднято ${num(tonnage)} кг. ` : ''}Отдыхай —
                  следующая подстроится по твоим отметкам.
                </p>
              </div>
            </div>
          )}

          {list.main.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle title="Основная часть" hint="С весом" />
              {renderList(list.main, 0)}
            </section>
          )}

          {list.extra.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle title="В конце" hint="Без веса, добивка" />
              {renderList(list.extra, list.main.length)}
            </section>
          )}

          {openId === null &&
            firstUndone &&
            doneCount > 0 &&
            doneCount < list.all.length && (
              <Button
                className="self-center"
                onClick={() => setOpenId(firstUndone)}
              >
                Дальше: {exerciseById.get(firstUndone)?.short}
              </Button>
            )}
        </>
      )}
    </div>
  )
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 pt-2">
      <h2 className="display text-2xl whitespace-nowrap">{title}</h2>
      <span className="mono-label shrink-0 text-right text-stage-muted">
        {hint}
      </span>
    </div>
  )
}

function WeekRing({ week }: { week: number }) {
  const shown = Math.min(week, CYCLE_WEEKS)
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div
      className="relative grid size-20 shrink-0 sm:size-24 place-items-center"
      title={`Неделя ${week} из ${CYCLE_WEEKS}`}
    >
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--stage-border)"
          strokeWidth="7"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--hi-vis-yellow)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / CYCLE_WEEKS)}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="display text-2xl sm:text-3xl">{week}</span>
        <span className="mono-label text-[10px] text-stage-muted">
          из {CYCLE_WEEKS} нед
        </span>
      </div>
    </div>
  )
}

function Progress({
  done,
  total,
  tonnage,
}: {
  done: number
  total: number
  tonnage: number
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-block p-4">
      <div className="flex items-baseline justify-between">
        <span className="mono-label text-stage-muted">Сделано</span>
        <span className="font-mono text-sm">
          <b className="text-lg">{done}</b> / {total}
          {tonnage > 0 && (
            <span className="text-stage-muted"> · {num(tonnage)} кг</span>
          )}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-2.5 flex-1 rounded-full transition-colors duration-500"
            style={{
              background:
                i < done ? 'var(--hi-vis-yellow)' : 'var(--stage-border)',
              transitionDelay: `${i * 30}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function RestDay({
  title,
  optional,
  onTrain,
}: {
  title: string
  optional: boolean
  onTrain: () => void
}) {
  const diving = title === 'Дайвинг'
  const Icon = diving ? Waves : CalendarHeart
  return (
    <div className="rise flex flex-col items-start gap-4 rounded-md bg-card p-6 text-card-foreground">
      <span className="grid size-14 place-items-center rounded-full bg-[var(--sky)]">
        <Icon className="size-7" />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="display text-3xl">
          {diving
            ? 'Сегодня дайвинг'
            : optional
              ? 'Зал по желанию'
              : 'День отдыха'}
        </h2>
        <p className="text-[15px] text-muted-foreground">
          {optional
            ? 'Если есть время и спина хорошо переносит нагрузку — тренировка ждёт.'
            : 'Восстановление — часть плана. Следующая тренировка подстроится под прошлые отметки.'}
        </p>
      </div>
      <Button variant="outline" onClick={onTrain}>
        {optional ? 'Потренироваться' : 'Всё равно потренироваться'}
      </Button>
    </div>
  )
}

function EmptyProgram() {
  return (
    <div className="rise flex flex-col items-start gap-4 rounded-md bg-card p-6 text-card-foreground">
      <span className="grid size-14 place-items-center rounded-full bg-hi-vis-yellow">
        <ListPlus className="size-7" />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="display text-3xl">Программа пустая</h2>
        <p className="text-[15px] text-muted-foreground">
          Добавь упражнения, рабочие веса и подходы на вкладке «План» — и выбери
          дни тренировок.
        </p>
      </div>
      <Link
        to={routes.plan}
        className="inline-flex h-11 items-center rounded-full bg-ink px-[17px] font-bold text-ink-foreground"
      >
        Собрать программу
      </Link>
    </div>
  )
}
