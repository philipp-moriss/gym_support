import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

/** Кремовая карточка 6px на фиолетовой сцене: плоская, без теней и рамки. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-md bg-card p-[17px] text-card-foreground',
        className,
      )}
      {...props}
    />
  )
}
