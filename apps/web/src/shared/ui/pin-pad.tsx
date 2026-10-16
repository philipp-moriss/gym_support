import { Delete } from 'lucide-react'
import { useEffect } from 'react'
import { cn, haptic } from '@/shared/lib'

const KEYS = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
] as const

/**
 * Экран кода как разблокировка iPhone: точки сверху, круглая цифровая
 * клавиатура. Ошибка — тряска точек (меняется shakeKey). Работает и с
 * клавиатуры компьютера: цифры, Backspace.
 */
export function PinPad({
  value,
  onChange,
  length = 6,
  shakeKey = 0,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  length?: number
  /** Новое значение — снова потрясти точки. */
  shakeKey?: number
  disabled?: boolean
}) {
  const press = (digit: string) => {
    if (disabled || value.length >= length) return
    haptic()
    onChange(value + digit)
  }
  const erase = () => {
    if (disabled || !value) return
    haptic()
    onChange(value.slice(0, -1))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') erase()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (shakeKey) haptic('error')
  }, [shakeKey])

  return (
    <div className="flex flex-col items-center gap-10">
      <div
        key={shakeKey}
        className={cn('flex gap-4', shakeKey > 0 && 'shake')}
        role="status"
        aria-label={`Введено цифр: ${value.length} из ${length}`}
      >
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={cn(
              'size-4 rounded-full border-2 border-bone-white transition-[background-color,transform] duration-150',
              i < value.length && 'scale-110 border-accent bg-accent',
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-x-6 gap-y-4">
        {KEYS.map(([digit, letters]) => (
          <PadKey
            key={digit}
            onClick={() => press(digit)}
            disabled={disabled}
            label={digit}
          >
            <span className="text-[34px] leading-none font-normal">
              {digit}
            </span>
            {letters && (
              <span className="font-mono text-[10px] tracking-[0.2em] text-stage-muted">
                {letters}
              </span>
            )}
          </PadKey>
        ))}
        <span />
        <PadKey onClick={() => press('0')} disabled={disabled} label="0">
          <span className="text-[34px] leading-none font-normal">0</span>
        </PadKey>
        <button
          type="button"
          onClick={erase}
          disabled={disabled || !value}
          aria-label="Стереть"
          className="grid size-[76px] cursor-pointer place-items-center rounded-full text-bone-white transition-opacity active:opacity-60 disabled:opacity-0"
        >
          <Delete className="size-7" />
        </button>
      </div>
    </div>
  )
}

function PadKey({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-[76px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full bg-block text-bone-white transition-[background-color,transform] duration-100 select-none active:scale-95 active:bg-bone-white/45 disabled:opacity-60"
    >
      {children}
    </button>
  )
}
