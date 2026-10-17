import { RotateCcw } from 'lucide-react'
import type { Entry } from '@/entities/entry'
import { CYCLE_WEEKS, programWeek, type Program } from '@/entities/program'
import { useUpdateSettings } from '@/features/update-settings'
import { addDays, cn, fromIso, mondayOf, todayIso } from '@/shared/lib'
import { Button, Card, Input } from '@/shared/ui'

/**
 * Неделя цикла: нужна упражнениям со своим планом на 4 недели. Упражнения с
 * рабочим весом от недели не зависят — вес растёт по двойной прогрессии.
 * compact — только неделя (на главной «Плана»).
 */
export function CyclePlan({
  program,
  compact,
}: {
  program: Program
  entries?: Entry[]
  compact?: boolean
}) {
  const { settings, exercises } = program
  const update = useUpdateSettings().mutate
  const week = programWeek(settings.startDate, todayIso())
  const shownWeek = Math.min(week, CYCLE_WEEKS)
  const weekly = exercises.filter((e) => e.weeks).length

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="display text-2xl">Неделя {week}</h2>
        <span className="mono-label text-muted-foreground">
          старт {fromIso(settings.startDate).toLocaleDateString('ru-RU')}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: CYCLE_WEEKS }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={cn(
              'flex items-center justify-center rounded-md py-2.5 transition-colors',
              n === shownWeek
                ? 'bg-ink text-ink-foreground'
                : n < shownWeek
                  ? 'bg-matcha-cream'
                  : 'bg-muted',
            )}
          >
            <span className="mono-label">Нед {n}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Веса растут сами: все подходы на верх диапазона и не у отказа — вес +1
        шаг, иначе добираешь повторы.
        {weekly > 0 &&
          ` Неделя цикла задаёт план для упражнений по неделям (${weekly}).`}
      </p>
      {!compact && (
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
      )}
    </Card>
  )
}
