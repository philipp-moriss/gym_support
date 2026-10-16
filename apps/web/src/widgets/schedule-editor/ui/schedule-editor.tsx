import { Check, Pencil } from 'lucide-react'
import { useState } from 'react'
import { workoutFor, type DayPlan, type Program } from '@/entities/program'
import { useUpdateSettings } from '@/features/update-settings'
import { cn, plural, todayIso, weekday, weekdayShort } from '@/shared/lib'
import { Button, Card, Chip, Input } from '@/shared/ui'

const gymLabels: Record<DayPlan['gym'], string> = {
  yes: 'Зал',
  optional: 'По желанию',
  no: 'Отдых',
}

const dayColor = (d: DayPlan) =>
  d.gym === 'yes'
    ? 'bg-matcha-cream'
    : d.gym === 'optional'
      ? 'bg-buttery-yellow'
      : d.title === 'Дайвинг'
        ? 'bg-sky'
        : 'bg-muted'

/** Неделя по дням: какие дни — тренировки. Свои названия и заметки на вечер. */
export function ScheduleEditor({ program }: { program: Program }) {
  const { schedule } = program.settings
  const update = useUpdateSettings()
  const [draft, setDraft] = useState<DayPlan[] | null>(null)
  const today = weekday(todayIso())

  if (draft) {
    const setDay = (i: number, patch: Partial<DayPlan>) =>
      setDraft(draft.map((d, j) => (j === i ? { ...d, ...patch } : d)))
    return (
      <Card>
        <h2 className="display text-2xl">Дни тренировок</h2>
        <div className="flex flex-col gap-3">
          {draft.map((d, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono-label w-7">{weekdayShort[i]}</span>
                {(Object.keys(gymLabels) as DayPlan['gym'][]).map((g) => (
                  <Chip
                    key={g}
                    active={d.gym === g}
                    className="h-9 px-3"
                    onClick={() =>
                      setDay(i, {
                        gym: g,
                        // Название по умолчанию следует за типом дня, своё не трогаем.
                        title:
                          Object.values(gymLabels).includes(d.title) ||
                          d.title === 'Зал по желанию'
                            ? g === 'optional'
                              ? 'Зал по желанию'
                              : gymLabels[g]
                            : d.title,
                      })
                    }
                  >
                    {gymLabels[g]}
                  </Chip>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pl-9">
                <Input
                  className="h-9"
                  value={d.title}
                  maxLength={40}
                  aria-label={`${weekdayShort[i]}: название`}
                  onChange={(e) => setDay(i, { title: e.target.value })}
                />
                <Input
                  className="h-9"
                  value={d.extras.join(', ')}
                  maxLength={120}
                  placeholder="Заметка: бачата вечером"
                  aria-label={`${weekdayShort[i]}: заметка`}
                  onChange={(e) =>
                    setDay(i, {
                      extras: e.target.value
                        ? e.target.value.split(/\s*,\s*/).slice(0, 5)
                        : [],
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ink"
            onClick={() => {
              update.mutate({
                schedule: draft.map((d) => ({
                  ...d,
                  title: d.title.trim() || gymLabels[d.gym],
                  extras: d.extras.map((x) => x.trim()).filter(Boolean),
                })),
              })
              setDraft(null)
            }}
          >
            <Check strokeWidth={3} />
            Сохранить
          </Button>
          <Button variant="ghost" onClick={() => setDraft(null)}>
            Отмена
          </Button>
        </div>
      </Card>
    )
  }

  const gymDays = schedule.filter((d) => d.gym === 'yes').length
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="display text-2xl">Неделя по дням</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDraft(schedule.map((d) => ({ ...d })))}
        >
          <Pencil />
          Изменить
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-7">
        {schedule.map((d, i) => {
          const count = d.gym !== 'no' ? workoutFor(program, i).all.length : 0
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 sm:min-h-24 sm:flex-col sm:items-center sm:gap-1 sm:px-1.5 sm:text-center',
                dayColor(d),
                today === i && 'ring-[3px] ring-ink',
              )}
            >
              <span className="mono-label w-6 sm:w-auto">
                {weekdayShort[i]}
              </span>
              <span className="text-sm leading-tight font-semibold sm:text-xs">
                {d.title}
              </span>
              {count > 0 && (
                <span className="font-mono text-xs text-muted-foreground sm:text-[11px]">
                  {count} упр.
                </span>
              )}
              {d.extras.map((x) => (
                <span
                  key={x}
                  className="ml-auto text-sm leading-tight text-muted-foreground sm:ml-0 sm:text-[11px]"
                >
                  {x}
                </span>
              ))}
            </div>
          )
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        {gymDays} {plural(gymDays, ['тренировка', 'тренировки', 'тренировок'])}{' '}
        в неделю. Упражнения можно привязать к своим дням в их настройках.
      </p>
    </Card>
  )
}
