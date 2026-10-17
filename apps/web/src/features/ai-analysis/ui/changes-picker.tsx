import { Check } from 'lucide-react'
import { useState } from 'react'
import type { ChangeInput, SuggestedChange } from '@/entities/coaching'
import { cn, num } from '@/shared/lib'
import { Button, Input } from '@/shared/ui'
import { useApplyChanges } from '../model/use-analysis'

type Weeks = NonNullable<SuggestedChange['weeks']>

const weeksText = (weeks: Weeks | null | undefined) =>
  weeks
    ?.map((w) => `${w.sets}×${w.reps}${w.repsMax ? `–${w.repsMax}` : ''}`)
    .join(' · ') ?? '—'

interface Row {
  on: boolean
  base?: string
  step?: string
}

/**
 * Правки ИИ галочками: «было → стало», почему. Числа веса и шага можно
 * поправить перед «Применить». Применяются все выбранные разом.
 */
export function ChangesPicker({
  clientId,
  analysisId,
  changes,
  applied,
}: {
  clientId: string
  analysisId: string
  changes: SuggestedChange[]
  applied: boolean
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    changes.map((c) => ({
      on: true,
      base: c.base?.toString(),
      step: c.step?.toString(),
    })),
  )
  const apply = useApplyChanges(clientId, analysisId)
  const set = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)))

  const selected: ChangeInput[] = changes.flatMap((c, i) => {
    const row = rows[i]
    if (!row.on) return []
    const base = row.base !== undefined ? Number(row.base) : undefined
    const step = row.step !== undefined ? Number(row.step) : undefined
    return [
      {
        exerciseId: c.exerciseId,
        reason: c.reason,
        ...(base !== undefined && Number.isFinite(base) && { base }),
        ...(step !== undefined && Number.isFinite(step) && { step }),
        ...(c.weeks && { weeks: c.weeks }),
      },
    ]
  })

  if (!changes.length)
    return (
      <p className="text-sm text-muted-foreground">
        ИИ не предлагает менять веса и схему.
      </p>
    )

  const done = applied || apply.isSuccess
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col">
        {changes.map((c, i) => (
          <li
            key={c.exerciseId}
            className={cn(
              'flex gap-3 border-t border-border py-3 first:border-t-0',
              !rows[i].on && 'opacity-55',
            )}
          >
            <input
              type="checkbox"
              className="mt-1 size-5 shrink-0 accent-[var(--ink-black)]"
              checked={rows[i].on}
              disabled={done}
              aria-label={`Применить: ${c.exercise}`}
              onChange={(e) => set(i, { on: e.target.checked })}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="font-semibold">{c.exercise}</span>
              {c.base !== undefined && (
                <NumberChange
                  label="Рабочий вес, кг"
                  before={c.before.base}
                  value={rows[i].base ?? ''}
                  disabled={done || !rows[i].on}
                  onChange={(v) => set(i, { base: v })}
                />
              )}
              {c.step !== undefined && (
                <NumberChange
                  label="Шаг веса, кг"
                  before={c.before.step}
                  value={rows[i].step ?? ''}
                  disabled={done || !rows[i].on}
                  onChange={(v) => set(i, { step: v })}
                />
              )}
              {c.weeks && (
                <span className="font-mono text-sm text-muted-foreground">
                  {weeksText(c.before.weeks)} → {weeksText(c.weeks)}
                </span>
              )}
              <span className="text-sm">{c.reason}</span>
            </div>
          </li>
        ))}
      </ul>
      {apply.isError && (
        <p className="text-sm text-destructive">
          Не получилось применить: {apply.error.message}
        </p>
      )}
      {done ? (
        <span className="inline-flex items-center gap-2 text-sm font-bold">
          <Check className="size-4" /> Правки применены — клиент увидит их на
          «Сегодня»
        </span>
      ) : (
        <Button
          variant="ink"
          className="self-start"
          disabled={!selected.length || apply.isPending}
          onClick={() => apply.mutate(selected)}
        >
          Применить ({selected.length})
        </Button>
      )}
    </div>
  )
}

function NumberChange({
  label,
  before,
  value,
  disabled,
  onChange,
}: {
  label: string
  before: number | null
  value: string
  disabled: boolean
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-mono">{before === null ? '—' : num(before)}</span>
      <span aria-hidden>→</span>
      <Input
        type="number"
        inputMode="decimal"
        step="0.5"
        min={0}
        className="h-9 w-24 font-mono"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
