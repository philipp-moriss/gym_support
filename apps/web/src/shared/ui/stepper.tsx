import { useState } from 'react'
import { haptic, num } from '@/shared/lib'
import { HapticOverlay } from './haptic-overlay'

/**
 * Большой степпер «− 30 кг +»: вес и повторы меняются пальцем, без клавиатуры.
 * Тап по числу — точный ввод с цифровой клавиатуры (47,5 вместо десяти «+»).
 */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  unit,
  decimals = true,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  unit?: string
  /** false — только целые (подходы, повторы) */
  decimals?: boolean
}) {
  const [typing, setTyping] = useState<string | null>(null)
  const round = (n: number) => Math.round(n * 100) / 100

  const commit = () => {
    if (typing === null) return
    const parsed = Number(typing.replace(',', '.').replace(/[^\d.]/g, ''))
    if (typing.trim() !== '' && Number.isFinite(parsed)) {
      onChange(Math.max(min, decimals ? round(parsed) : Math.round(parsed)))
    }
    setTyping(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="mono-label text-muted-foreground">{label}</span>
      <div className="flex h-12 items-center rounded-full bg-muted p-1">
        <button
          type="button"
          aria-label={`${label}: меньше`}
          onClick={() => {
            haptic()
            onChange(Math.max(min, round(value - step)))
          }}
          className="relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-xl font-bold transition-transform hover:bg-ink/5 active:scale-90"
        >
          −
          <HapticOverlay />
        </button>
        {typing !== null ? (
          <input
            autoFocus
            inputMode={decimals ? 'decimal' : 'numeric'}
            enterKeyHint="done"
            aria-label={label}
            value={typing}
            onChange={(e) => setTyping(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setTyping(null)
            }}
            className="h-10 w-full min-w-0 flex-1 rounded-full bg-card text-center font-mono text-lg font-bold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ink"
          />
        ) : (
          <button
            type="button"
            aria-label={`${label}: ${num(value)}${unit ? ` ${unit}` : ''}, ввести точно`}
            onClick={() => setTyping(String(value).replace('.', ','))}
            className="h-10 min-w-0 flex-1 cursor-text truncate rounded-full text-center font-mono text-lg font-bold tabular-nums"
          >
            {num(value)}
            {unit && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                {unit}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          aria-label={`${label}: больше`}
          onClick={() => {
            haptic()
            onChange(round(value + step))
          }}
          className="relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-ink text-xl font-bold text-ink-foreground transition-transform active:scale-90"
        >
          +
          <HapticOverlay />
        </button>
      </div>
    </div>
  )
}
