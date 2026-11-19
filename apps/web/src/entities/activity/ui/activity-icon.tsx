import { Bike, PersonStanding, Waves, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib'
import { ACTIVITY_TINT } from '../model/tint'
import type { ActivityKind } from '../model/types'

const ICON: Record<ActivityKind, LucideIcon> = {
  swim: Waves,
  bike: Bike,
  pilates: PersonStanding,
}

/** Иконка вида в цветном круге. */
export function ActivityIcon({
  kind,
  className,
}: {
  kind: ActivityKind
  className?: string
}) {
  const Icon = ICON[kind]
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-full text-ink [&_svg]:size-5',
        ACTIVITY_TINT[kind],
        className,
      )}
    >
      <Icon />
    </span>
  )
}
