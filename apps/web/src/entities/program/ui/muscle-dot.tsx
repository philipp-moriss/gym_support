import { cn } from '@/shared/lib'
import { muscles } from '../model/muscles'
import type { Muscle } from '../model/types'

export function MuscleDot({
  muscle,
  className,
}: {
  muscle?: Muscle
  className?: string
}) {
  return (
    <span
      className={cn('size-3 shrink-0 rounded-full', className)}
      style={{ background: muscle ? muscles[muscle].color : 'var(--border)' }}
    />
  )
}
