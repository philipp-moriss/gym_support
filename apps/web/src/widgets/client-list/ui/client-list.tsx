import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ChevronRight, Moon, UsersRound } from 'lucide-react'
import { Link } from 'react-router'
import {
  clientName,
  coachClientsQuery,
  IDLE_DAYS,
  type CoachClient,
} from '@/entities/coaching'
import { PAIN_LIMIT } from '@/entities/entry'
import { routes } from '@/shared/config'
import { addDays, formatDay, plural, todayIso } from '@/shared/lib'
import { PageState } from '@/shared/ui'

/** Клиенты тренера с сигналами: давно не тренировался, боль за 2 недели. */
export function ClientList() {
  const clients = useQuery(coachClientsQuery())
  if (clients.isError && !clients.data)
    return <PageState error onRetry={() => void clients.refetch()} />
  if (!clients.data) return <PageState />
  if (!clients.data.length)
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-stage-border p-8 text-center text-stage-muted">
        <UsersRound className="size-8" />
        <p>
          Клиентов пока нет. Создай клиента или дай код приглашения тому, у кого
          уже есть аккаунт.
        </p>
      </div>
    )
  return (
    <ul className="flex flex-col gap-2">
      {clients.data.map((c) => (
        <li key={c.id}>
          <ClientRow client={c} />
        </li>
      ))}
    </ul>
  )
}

function ClientRow({ client: c }: { client: CoachClient }) {
  const idle = !c.lastWorkout || c.lastWorkout < addDays(todayIso(), -IDLE_DAYS)
  const pain = c.maxPain14d !== null && c.maxPain14d >= PAIN_LIMIT
  return (
    <Link
      to={routes.coachClient(c.id)}
      className="flex items-center gap-3 rounded-md bg-card p-4 text-card-foreground transition-transform active:scale-[0.99]"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lilac font-bold uppercase">
        {clientName(c).slice(0, 1)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[17px] leading-tight font-bold">
          {clientName(c)}
        </span>
        <span className="truncate text-sm text-muted-foreground">
          Нед. {c.week} ·{' '}
          {c.lastWorkout
            ? `последняя ${formatDay(c.lastWorkout, { weekday: undefined })}`
            : 'ещё не тренировался'}{' '}
          · {c.workouts7d}{' '}
          {plural(c.workouts7d, ['тренировка', 'тренировки', 'тренировок'])} за
          неделю
        </span>
        {(idle || pain) && (
          <span className="flex flex-wrap gap-1.5">
            {pain && (
              <span className="inline-flex items-center gap-1 rounded-full bg-bubblegum-pink px-2 py-0.5 text-xs font-bold">
                <AlertTriangle className="size-3.5" />
                Боль {c.maxPain14d}/10
              </span>
            )}
            {idle && (
              <span className="inline-flex items-center gap-1 rounded-full bg-buttery-yellow px-2 py-0.5 text-xs font-bold">
                <Moon className="size-3.5" />
                {IDLE_DAYS}+ дней без тренировок
              </span>
            )}
          </span>
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}
