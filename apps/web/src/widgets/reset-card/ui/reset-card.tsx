import { Trash2, Undo2 } from 'lucide-react'
import { useState } from 'react'
import type { Entry } from '@/entities/entry'
import { CYCLE_WEEKS, programWeek, type Program } from '@/entities/program'
import { ExportButton } from '@/features/export-xlsx'
import { useGoToWeek, useResetAll } from '@/features/reset-progress'
import { todayIso } from '@/shared/lib'
import { Button, Card, Chip, Confirm } from '@/shared/ui'

type Pending = { kind: 'week'; week: number } | { kind: 'all' } | null

/** Переход на неделю со сбросом подстройки и полный сброс. Оба — через подтверждение. */
export function ResetCard({
  program,
  entries,
}: {
  program: Program
  entries: Entry[]
}) {
  const week = programWeek(program.settings.startDate, todayIso())
  const goToWeek = useGoToWeek()
  const resetAll = useResetAll()
  const [pending, setPending] = useState<Pending>(null)
  const [done, setDone] = useState<string | null>(null)

  return (
    <Card className="gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="display text-2xl">Сброс</h2>
        <p className="text-sm text-muted-foreground">
          Начни заново с нужной недели: прошлые отметки (боль и сложность)
          перестанут влиять на веса. Дневник сохранится.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="mono-label text-muted-foreground">
          Перейти на неделю
        </span>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: CYCLE_WEEKS }, (_, i) => i + 1).map((n) => (
            <Chip
              key={n}
              active={
                pending?.kind === 'week'
                  ? pending.week === n
                  : Math.min(week, CYCLE_WEEKS) === n
              }
              onClick={() => {
                setDone(null)
                setPending({ kind: 'week', week: n })
              }}
              className="h-12 text-base"
            >
              {n}
            </Chip>
          ))}
        </div>
      </div>

      {pending?.kind === 'week' && (
        <Confirm
          text={`Перейти на неделю ${pending.week} и сбросить подстройку? Веса будут ровно по плану ${pending.week}-й недели, замены упражнений вернутся к основным.`}
          onCancel={() => setPending(null)}
        >
          <Button
            variant="ink"
            size="sm"
            disabled={goToWeek.isPending}
            onClick={() =>
              goToWeek.mutate(pending.week, {
                onSuccess: () => {
                  setDone(
                    `Теперь неделя ${pending.week}. Веса — ровно по плану.`,
                  )
                  setPending(null)
                },
              })
            }
          >
            <Undo2 />
            Перейти на неделю {pending.week}
          </Button>
        </Confirm>
      )}

      <div className="border-t border-border pt-4">
        {pending?.kind === 'all' ? (
          <Confirm
            text={`Удалить все записи (${entries.length}) и черновики, начать цикл с этой недели? Упражнения и расписание останутся. Это не отменить — лучше сначала выгрузить Excel.`}
            danger
            onCancel={() => setPending(null)}
          >
            <ExportButton
              variant="outline"
              size="sm"
              entries={entries}
              exercises={program.exercises}
              label="Сначала Excel"
            />
            <Button
              variant="destructive"
              size="sm"
              disabled={resetAll.isPending}
              onClick={() =>
                resetAll.mutate(undefined, {
                  onSuccess: () => {
                    setPending(null)
                    setDone('Всё сброшено. Начинаем с первой недели.')
                  },
                })
              }
            >
              <Trash2 />
              Удалить всё
            </Button>
          </Confirm>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              setDone(null)
              setPending({ kind: 'all' })
            }}
          >
            <Trash2 />
            Сбросить всё
          </Button>
        )}
      </div>

      {done && (
        <p className="pop-in rounded-md bg-matcha-cream px-3 py-2 text-sm font-semibold">
          {done}
        </p>
      )}
    </Card>
  )
}
