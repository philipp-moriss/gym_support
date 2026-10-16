import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

export function Chip({
  active,
  className,
  ...props
}: ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'h-10 cursor-pointer rounded-full border-2 px-4 text-sm font-bold transition-[background-color,color,transform] active:scale-95',
        active
          ? 'border-ink bg-ink text-ink-foreground'
          : 'border-input text-card-foreground hover:border-ink',
        className,
      )}
      {...props}
    />
  )
}
