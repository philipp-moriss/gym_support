import { activityDetails, activityHeadline } from '../model/metrics'
import { ACTIVITY_LABEL, type Activity } from '../model/types'
import { ActivityIcon } from './activity-icon'

/** Доп. тренировка: иконка вида, крупная главная цифра, ниже — круги, время, темп. */
export function ActivityLine({ activity }: { activity: Activity }) {
  const head = activityHeadline(activity)
  const details = activityDetails(activity)
  return (
    <span className="flex min-w-0 flex-1 items-start gap-3 text-left">
      <ActivityIcon kind={activity.kind} />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="mono-label text-muted-foreground">
          {ACTIVITY_LABEL[activity.kind]}
        </span>
        <span className="display text-3xl leading-none">
          {head.value}
          <span className="ml-1 text-base font-semibold">{head.unit}</span>
        </span>
        {details.length > 0 && (
          <span className="font-mono text-sm text-muted-foreground">
            {details.join(' · ')}
          </span>
        )}
        {activity.notes && (
          <span className="text-sm text-muted-foreground">
            {activity.notes}
          </span>
        )}
      </span>
    </span>
  )
}
