import { Bike, Waves } from 'lucide-react'
import { activityStats } from '../model/metrics'
import { ACTIVITY_LABEL, type Activity } from '../model/types'

/** Кардио одной строкой: иконка, вид, дистанция · время · темп/скорость, заметка. */
export function ActivityLine({ activity }: { activity: Activity }) {
  const Icon = activity.kind === 'swim' ? Waves : Bike
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
      <span className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{ACTIVITY_LABEL[activity.kind]}</span>
      </span>
      <span className="font-mono text-sm text-muted-foreground">
        {activityStats(activity).join(' · ')}
      </span>
      {activity.notes && (
        <span className="text-sm text-muted-foreground">{activity.notes}</span>
      )}
    </span>
  )
}
