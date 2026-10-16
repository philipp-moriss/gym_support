import { num } from '@/shared/lib'

/** Большой степпер «− 30 кг +»: вес и повторы меняются пальцем, без клавиатуры. */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  unit,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  unit?: string
}) {
  const round = (n: number) => Math.round(n * 100) / 100
  return (
    <div className="flex flex-col gap-2">
      <span className="mono-label text-muted-foreground">{label}</span>
      <div className="flex h-12 items-center rounded-full bg-muted p-1">
        <button
          type="button"
          aria-label={`${label}: меньше`}
          onClick={() => onChange(Math.max(min, round(value - step)))}
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-xl font-bold transition-transform hover:bg-ink/5 active:scale-90"
        >
          −
        </button>
        <span className="flex-1 truncate text-center font-mono text-lg font-bold tabular-nums">
          {num(value)}
          {unit && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {unit}
            </span>
          )}
        </span>
        <button
          type="button"
          aria-label={`${label}: больше`}
          onClick={() => onChange(round(value + step))}
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-ink text-xl font-bold text-ink-foreground transition-transform active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  )
}
