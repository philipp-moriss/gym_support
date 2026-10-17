import { useQuery } from '@tanstack/react-query'
import type { Client } from '@/entities/client'
import { coachName, coachesQuery } from '@/entities/coach'
import { errorText } from '@/shared/api'
import { ErrorText, Select, Spinner } from '@/shared/ui'
import { useAssignCoach } from '../model/use-assign-coach'

const NONE = ''

export function CoachSelect({ client }: { client: Client }) {
  const { data: coaches = [] } = useQuery(coachesQuery())
  const mutation = useAssignCoach(client.id)
  const current = client.coach?.id ?? NONE
  // Пока список не обновился, показываем выбранное, а не старое значение.
  const value = mutation.isPending ? (mutation.variables ?? NONE) : current

  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-2">
        <Select
          aria-label={`Тренер клиента ${client.name ?? client.login}`}
          className="h-9 w-full min-w-40 text-[15px] md:w-52"
          value={value}
          disabled={mutation.isPending}
          onChange={(e) => {
            mutation.reset()
            mutation.mutate(e.target.value === NONE ? null : e.target.value)
          }}
        >
          <option value={NONE}>Без тренера</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {coachName(c)}
              {c.disabled ? ' (заблокирован)' : ''}
            </option>
          ))}
          {/* Тренер клиента есть, а в списке его ещё нет — не теряем значение. */}
          {client.coach && !coaches.some((c) => c.id === client.coach?.id) && (
            <option value={client.coach.id}>{client.coach.name}</option>
          )}
        </Select>
        {mutation.isPending && <Spinner className="size-4 shrink-0" />}
      </span>
      <ErrorText>{mutation.isError && errorText(mutation.error)}</ErrorText>
    </span>
  )
}
