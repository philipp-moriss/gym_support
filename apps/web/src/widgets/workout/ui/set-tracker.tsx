import clsx from 'clsx'
import { Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { haptic } from '@/shared/lib'
import { Button, HapticOverlay, Stepper } from '@/shared/ui'

/**
 * Подходы кружками: тап — подход сделан (с текущими повторами) и пошёл отдых.
 * Тап по сделанному — поправить его повторы или убрать.
 */
export function SetTracker({
  planned,
  reps,
  repsLabel,
  done,
  onChange,
  onSetDone,
}: {
  /** Сколько подходов по плану (из степпера «Подходы») */
  planned: number
  /** Повторы для нового подхода (из степпера «Повторы») */
  reps: number
  repsLabel: string
  /** Повторы сделанных подходов, по порядку */
  done: number[]
  onChange: (done: number[]) => void
  /** Подход отмечен — запустить отдых */
  onSetDone: () => void
}) {
  const [editing, setEditing] = useState<number | null>(null)
  const count = Math.max(planned, done.length)

  return (
    <div className="flex flex-col gap-3">
      <span className="flex items-baseline justify-between gap-2">
        <span className="mono-label text-muted-foreground">
          Отмечай подходы
        </span>
        <span className="font-mono text-sm">
          <b className="text-lg">{done.length}</b> / {count}
        </span>
      </span>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: count }, (_, i) => {
          const isDone = i < done.length
          return (
            <button
              key={i}
              type="button"
              aria-label={
                isDone
                  ? `Подход ${i + 1}: ${done[i]}, изменить`
                  : `Отметить подход ${i + 1}`
              }
              aria-pressed={isDone}
              onClick={() => {
                if (isDone) {
                  setEditing(editing === i ? null : i)
                  return
                }
                haptic()
                setEditing(null)
                onChange([...done, reps])
                onSetDone()
              }}
              className={clsx(
                'relative grid size-12 cursor-pointer place-items-center rounded-full font-mono text-base font-bold transition-[background-color,transform] active:scale-90',
                isDone
                  ? 'pop-in bg-ink text-ink-foreground'
                  : i === done.length
                    ? 'border-2 border-dashed border-ink text-ink'
                    : 'border-2 border-dashed border-input text-muted-foreground',
                editing === i && 'ring-4 ring-accent',
              )}
            >
              {isDone ? done[i] : i + 1}
              <HapticOverlay />
            </button>
          )
        })}
      </div>
      {editing !== null && editing < done.length && (
        <div className="pop-in flex flex-col gap-3 rounded-md bg-muted p-3">
          <Stepper
            label={`Подход ${editing + 1}: ${repsLabel.toLowerCase()}`}
            value={done[editing]}
            min={0}
            decimals={false}
            onChange={(v) =>
              onChange(done.map((r, j) => (j === editing ? v : r)))
            }
          />
          <div className="flex gap-2">
            <Button variant="ink" size="sm" onClick={() => setEditing(null)}>
              <Check strokeWidth={3} />
              Готово
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(done.filter((_, j) => j !== editing))
                setEditing(null)
              }}
            >
              <Trash2 />
              Убрать подход
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
