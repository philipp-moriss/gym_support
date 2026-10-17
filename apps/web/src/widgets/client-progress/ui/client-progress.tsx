import { TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Entry } from '@/entities/entry'
import type { Exercise } from '@/entities/program'
import { addDays, todayIso } from '@/shared/lib'
import { Card, Chip, LineChart } from '@/shared/ui'
import {
  e1rmSeries,
  exerciseSeries,
  feelSeries,
  loggedExercises,
} from '../model/series'

const PERIODS = [
  { days: 28, label: '4 нед.' },
  { days: 84, label: '12 нед.' },
  { days: 0, label: 'Всё' },
]

/** Графики клиента: вес по упражнению, боль и сложность по тренировкам. */
export function ClientProgress({
  entries,
  exercises,
}: {
  entries: Entry[]
  exercises: Exercise[]
}) {
  const [period, setPeriod] = useState(84)
  const shown = useMemo(() => {
    if (!period) return entries
    const since = addDays(todayIso(), -period)
    return entries.filter((e) => e.date >= since)
  }, [entries, period])
  const ids = useMemo(() => loggedExercises(shown), [shown])
  const [picked, setPicked] = useState<string | null>(null)
  const current = picked && ids.includes(picked) ? picked : ids[0]
  const names = new Map(exercises.map((e) => [e.id, e.short || e.name]))
  const feel = feelSeries(shown)
  const series = current ? exerciseSeries(shown, current) : null
  const strength = current ? e1rmSeries(shown, current) : []

  return (
    <Card className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5" />
          <h2 className="display text-2xl">Прогресс</h2>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Chip
              key={p.days}
              active={period === p.days}
              className="h-8 px-3 text-xs"
              onClick={() => setPeriod(p.days)}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </div>

      {!shown.length ? (
        <p className="text-sm text-muted-foreground">
          За этот период записей нет.
        </p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ids.map((id) => (
              <Chip
                key={id}
                active={id === current}
                className="h-9 shrink-0 px-3"
                onClick={() => setPicked(id)}
              >
                {names.get(id) ?? id}
              </Chip>
            ))}
          </div>
          {series && (
            <figure className="flex flex-col gap-1">
              <figcaption className="mono-label text-muted-foreground">
                {series.unit ? 'Лучший вес за день' : 'Лучшие повторы за день'}
              </figcaption>
              {series.points.length > 1 ? (
                <LineChart
                  points={series.points}
                  unit={series.unit}
                  height={160}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Пока одна тренировка
                  {series.points[0] &&
                    ` (${series.points[0].label}: ${series.points[0].value}${series.unit})`}
                  — график появится после второй.
                </p>
              )}
            </figure>
          )}
          {strength.length > 1 && (
            <figure className="flex flex-col gap-1">
              <figcaption className="mono-label text-muted-foreground">
                Оценка максимума (e1RM, Epley с запасом повторов)
              </figcaption>
              <LineChart
                points={strength}
                unit=" кг"
                height={140}
                color="var(--lilac-shadow)"
              />
            </figure>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {feel.pain.length > 0 && (
              <figure className="flex flex-col gap-1">
                <figcaption className="mono-label text-muted-foreground">
                  Боль (макс. за день)
                </figcaption>
                <LineChart
                  points={feel.pain}
                  min={0}
                  max={10}
                  height={110}
                  color="var(--firecracker-red)"
                />
              </figure>
            )}
            {feel.effort.length > 0 && (
              <figure className="flex flex-col gap-1">
                <figcaption className="mono-label text-muted-foreground">
                  Сложность (средняя)
                </figcaption>
                <LineChart
                  points={feel.effort}
                  min={0}
                  max={10}
                  height={110}
                  color="var(--magenta-punch)"
                />
              </figure>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
