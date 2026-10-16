import type { ComponentProps } from 'react'
import { cn, haptic } from '@/shared/lib'
import { HapticOverlay } from './haptic-overlay'

/** Кнопка-выбор: недели, дни, тип дня, мышцы. Выбор отзывается лёгким тиком. */
export function Chip({
  active,
  className,
  onClick,
  children,
  disabled,
  ...props
}: ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        'relative h-10 cursor-pointer rounded-full border-2 px-4 text-sm font-bold transition-[background-color,color,transform] active:scale-95',
        active
          ? 'border-ink bg-ink text-ink-foreground'
          : 'border-input text-card-foreground hover:border-ink',
        className,
      )}
      onClick={(e) => {
        haptic()
        onClick?.(e)
      }}
      {...props}
    >
      {children}
      <HapticOverlay disabled={disabled} />
    </button>
  )
}
