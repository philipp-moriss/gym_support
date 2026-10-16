import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

/**
 * Pill-кнопки как в FAS. Жёлтый — только контур, не заливка.
 * На сцене: default (кремовая) и highlight (жёлтый контур).
 * В карточках: ink (чернильная) и outline.
 */
const variants = {
  default: 'bg-primary text-primary-foreground',
  highlight: 'border-2 border-accent text-accent hover:bg-accent/15',
  ink: 'bg-ink text-ink-foreground hover:bg-ink/85',
  outline: 'border-2 border-ink text-ink hover:bg-ink/5',
  ghost: 'hover:translate-y-0 hover:bg-current/10',
  destructive: 'bg-destructive text-bone-white hover:bg-destructive/90',
}

const sizes = {
  default: 'h-11 px-[17px] text-base',
  sm: 'h-9 px-3.5 text-sm',
  icon: 'size-10',
}

export type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-bold tracking-[0.04em] whitespace-nowrap outline-none transition-[transform,background-color,color,opacity] duration-200 hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring active:translate-y-0 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
