import { Dumbbell, PersonStanding, Timer, Wind } from 'lucide-react'
import type { Exercise } from '../model/types'

export function ExerciseIcon({
  ex,
  className,
}: {
  ex: Pick<Exercise, 'unit' | 'step'>
  className?: string
}) {
  if (ex.unit === 'sec') return <Timer className={className} />
  if (ex.unit === 'min') return <Wind className={className} />
  if (ex.step > 0) return <Dumbbell className={className} />
  return <PersonStanding className={className} />
}
