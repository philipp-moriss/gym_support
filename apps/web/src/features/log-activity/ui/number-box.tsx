import { cn } from '@/shared/lib'

/**
 * Крупное поле под цифровую клавиатуру: минуты, секунды, км.
 * Пропускает только цифры (и одну запятую, если `decimal`).
 */
export function NumberBox({
  label,
  value,
  onChange,
  decimal,
  maxLength = 3,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  decimal?: boolean
  maxLength?: number
  className?: string
}) {
  return (
    <label className={cn('flex flex-col items-center gap-1', className)}>
      <input
        inputMode={decimal ? 'decimal' : 'numeric'}
        enterKeyHint="done"
        placeholder="0"
        aria-label={label}
        value={value}
        maxLength={maxLength}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const raw = e.target.value.replace('.', ',')
          const clean = decimal
            ? raw.replace(/[^\d,]/g, '').replace(/(,.*),/g, '$1')
            : raw.replace(/\D/g, '')
          onChange(clean)
        }}
        className="h-14 w-full min-w-0 rounded-md border-2 border-input bg-card text-center font-mono text-2xl font-bold tabular-nums outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/50 focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-ring/20"
      />
      <span className="mono-label text-muted-foreground">{label}</span>
    </label>
  )
}
