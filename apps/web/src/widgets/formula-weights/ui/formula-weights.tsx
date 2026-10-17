import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Pause,
} from 'lucide-react'
import { adaptiveEntries, type Entry } from '@/entities/entry'
import {
  e1rm,
  hasBase,
  historyFor,
  nextWorkout,
  type Program,
  type ProgressionKind,
} from '@/entities/program'
import { useUpdateExercise } from '@/features/edit-exercise'
import { cn, num, todayIso } from '@/shared/lib'
import { Card, Stepper } from '@/shared/ui'

const kindIcon: Record<ProgressionKind, typeof ArrowRight> = {
  start: ArrowRight,
  reps: ArrowRight,
  hold: Pause,
  up: ArrowUpRight,
  down: ArrowDownRight,
  deload: ArrowDownRight,
  return: ArrowDownRight,
}

/**
 * Расчёт по формулам (двойная прогрессия, e1RM по Epley с RIR): что
 * приложение предложит клиенту на следующей тренировке. Клиенту применять
 * ничего не нужно. Тренер может задать рабочий вес руками — он станет
 * точкой отсчёта. Правила — docs/training-progression.md.
 */
export function FormulaWeights({
  program,
  entries,
}: {
  program: Program
  entries: Entry[]
}) {
  const update = useUpdateExercise()
  const today = todayIso()
  const adaptive = adaptiveEntries(entries, program.settings.resetAt)
  const rows = program.exercises.filter(hasBase).map((ex) => {
    const next = nextWorkout(ex, adaptive, today)
    const history = historyFor(ex.id, adaptive, today)
    const est = history
      .map((e) => e1rm(e))
      .filter((v): v is number => v !== null)
    return {
      ex,
      next,
      last: history[0],
      trend: est.length >= 2 ? { from: est[est.length - 1], to: est[0] } : null,
    }
  })
  if (!rows.length) return null

  return (
    <Card className="gap-3">
      <div className="flex items-center gap-2">
        <Calculator className="size-5" />
        <h2 className="display text-2xl">Веса по формулам</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Это у клиента считается само: двойная прогрессия по повторам, сложности
        и боли. Задай рабочий вес руками — расчёт пойдёт от него.
      </p>
      <ul className="flex flex-col">
        {rows.map(({ ex, next, last, trend }) => {
          const Icon = kindIcon[next.kind]
          return (
            <li
              key={ex.id}
              className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-semibold">{ex.short}</span>
                  <span className="flex items-start gap-1.5 text-sm">
                    <Icon
                      className={cn(
                        'mt-0.5 size-4 shrink-0',
                        next.kind === 'up' && 'text-ink',
                        ['down', 'deload', 'return'].includes(next.kind) &&
                          'text-destructive',
                      )}
                      strokeWidth={3}
                    />
                    {next.reason}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {last
                      ? `Было ${num(last.weight)} кг · ${last.setReps?.length ? last.setReps.join('·') : `${last.sets}×${last.reps}`}`
                      : 'Записей ещё нет'}
                    {trend &&
                      ` · e1RM ${num(trend.from)} → ${num(trend.to)} кг`}
                  </span>
                </div>
                <span className="shrink-0 text-right font-mono text-sm">
                  <b className="text-lg">{num(next.weight)}</b> кг
                  <br />
                  <span className="text-muted-foreground">
                    {next.sets}×{next.reps}
                    {next.reps < next.repsMax && `–${next.repsMax}`}
                  </span>
                </span>
              </div>
              <Stepper
                label="Рабочий вес"
                unit="кг"
                step={ex.step || 2.5}
                value={next.weight}
                onChange={(base) =>
                  update.mutate({ id: ex.id, patch: { base } })
                }
              />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
