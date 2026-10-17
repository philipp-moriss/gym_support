import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

const tones = {
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-matcha-cream text-ink',
  warn: 'bg-buttery-yellow text-ink',
  danger: 'bg-bubblegum-pink text-ink',
  accent: 'bg-accent text-accent-foreground',
}

/** Моно-штамп статуса: «Активен», «Изменён». */
export function Badge({
  tone = 'muted',
  className,
  children,
}: {
  tone?: keyof typeof tones
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'mono-label inline-flex h-6 shrink-0 items-center rounded-full px-2.5 whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
