import { RefreshCw, RotateCcw, Sparkles } from 'lucide-react'
import { adaptiveEntries, type Entry } from '@/entities/entry'
import {
  CYCLE_WEEKS,
  WEEK_PERCENT,
  programWeek,
  type Program,
} from '@/entities/program'
import { useSetBases } from '@/features/edit-exercise'
import { useUpdateSettings } from '@/features/update-settings'
import { addDays, cn, fromIso, mondayOf, num, todayIso } from '@/shared/lib'
import { Button, Card, Input } from '@/shared/ui'
import { nextCycleBases } from '../model/next-cycle'

/** Неделя цикла: проценты, повтор недели, дата старта; после 4-й — предложение нового цикла. */
export function CyclePlan({
  program,
  entries,
}: {
  program: Program
  entries: Entry[]
}) {
  const { settings, exercises } = program
  const update = useUpdateSettings().mutate
  const setBases = useSetBases()
  const date = todayIso()
  const week = programWeek(settings.startDate, date)
  const shownWeek = Math.min(week, CYCLE_WEEKS)
  const nextCycle =
    week > CYCLE_WEEKS
      ? nextCycleBases(
          exercises,
          adaptiveEntries(entries, settings.resetAt),
          settings.startDate,
        )
      : []

  return (
    <>
      {nextCycle.length > 0 && (
        <Card className="rise bg-accent">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 size-6 shrink-0" />
            <div className="flex flex-col gap-1">
              <h2 className="display text-2xl">Цикл пройден — пора на новый</h2>
              <p className="text-[15px]">
                Новые базовые веса по 4-й неделе: лучший вес без боли ÷ 85%. Где
                спина болела — база не меняется.
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-1 font-mono text-sm">
            {nextCycle.map(({ ex, from, to }) => (
              <li key={ex.id} className="flex justify-between gap-3">
                <span className="truncate">{ex.short}</span>
                <span>
                  {num(from)} → <b>{num(to)} кг</b>
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="ink"
            className="self-start"
            disabled={setBases.isPending}
            onClick={() =>
              setBases.mutate(
                Object.fromEntries(nextCycle.map((c) => [c.ex.id, c.to])),
                {
                  onSuccess: () => update({ startDate: mondayOf(date) }),
                },
              )
            }
          >
            <RefreshCw />
            Начать новый цикл
          </Button>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="display text-2xl">Неделя {week}</h2>
          <span className="mono-label text-muted-foreground">
            старт {fromIso(settings.startDate).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {WEEK_PERCENT.map((p, i) => (
            <div
              key={p}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md py-3 transition-colors',
                i + 1 === shownWeek
                  ? 'bg-ink text-ink-foreground'
                  : i + 1 < shownWeek
                    ? 'bg-matcha-cream'
                    : 'bg-muted',
              )}
            >
              <span className="mono-label opacity-70">Нед {i + 1}</span>
              <span className="display text-2xl">{Math.round(p * 100)}%</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={week <= 1}
            onClick={() =>
              update({ startDate: addDays(settings.startDate, 7) })
            }
          >
            <RotateCcw />
            Повторить неделю
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <span className="mono-label text-muted-foreground">Начало</span>
            <Input
              type="date"
              className="h-9 w-auto"
              value={settings.startDate}
              onChange={(e) =>
                e.target.value &&
                update({ startDate: mondayOf(e.target.value) })
              }
            />
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          Неделя прошла тяжело — повтори её, а не переходи к следующей.
        </p>
      </Card>
    </>
  )
}
