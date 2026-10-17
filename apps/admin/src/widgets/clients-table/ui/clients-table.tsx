import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { clientsQuery, type Client } from '@/entities/client'
import { coachName, coachesQuery } from '@/entities/coach'
import { CoachSelect } from '@/features/assign-coach'
import { ClientNameEdit, ClientStatusToggle } from '@/features/edit-client'
import { errorText } from '@/shared/api'
import { formatDay, plural } from '@/shared/lib'
import {
  Card,
  DataTable,
  Input,
  PageState,
  Select,
  type Column,
} from '@/shared/ui'

/** Фильтр по тренеру: все, без тренера или id тренера. */
const ALL = '*'
const NONE = '-'

const columns: Column<Client>[] = [
  {
    key: 'name',
    header: 'Клиент',
    primary: true,
    cell: (c) => <ClientNameEdit client={c} />,
  },
  {
    key: 'coach',
    header: 'Тренер',
    cell: (c) => <CoachSelect client={c} />,
  },
  {
    key: 'last',
    header: 'Последняя тренировка',
    cell: (c) =>
      c.lastWorkout ? (
        <span className="whitespace-nowrap">{formatDay(c.lastWorkout)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'week',
    header: 'За 7 дней',
    className: 'text-right font-mono tabular-nums',
    cell: (c) => c.workouts7d,
  },
  {
    key: 'status',
    header: 'Статус',
    cell: (c) => <ClientStatusToggle client={c} />,
  },
]

export function ClientsTable() {
  const { data, isPending, isError, error, refetch } = useQuery(clientsQuery())
  const { data: coaches = [] } = useQuery(coachesQuery())
  const [search, setSearch] = useState('')
  const [coach, setCoach] = useState(ALL)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter(
      (c) =>
        (coach === ALL ||
          (coach === NONE ? !c.coach : c.coach?.id === coach)) &&
        (!q ||
          c.login.toLowerCase().includes(q) ||
          (c.name ?? '').toLowerCase().includes(q)),
    )
  }, [data, search, coach])

  if (isPending) return <PageState />
  if (isError)
    return (
      <PageState
        error
        message={errorText(error)}
        onRetry={() => void refetch()}
      />
    )

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Поиск по имени или логину"
            placeholder="Имя или логин"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Select
          aria-label="Фильтр по тренеру"
          className="sm:w-64"
          value={coach}
          onChange={(e) => setCoach(e.target.value)}
        >
          <option value={ALL}>Все тренеры</option>
          <option value={NONE}>Без тренера</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {coachName(c)}
            </option>
          ))}
        </Select>
        <span className="mono-label whitespace-nowrap text-muted-foreground">
          {rows.length} {plural(rows.length, ['клиент', 'клиента', 'клиентов'])}
        </span>
      </Card>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        rowClassName={(c) => (c.disabled ? 'bg-muted' : undefined)}
        empty={
          data.length
            ? 'Никого не нашли — измени поиск или фильтр.'
            : 'Клиентов пока нет.'
        }
      />
    </div>
  )
}
