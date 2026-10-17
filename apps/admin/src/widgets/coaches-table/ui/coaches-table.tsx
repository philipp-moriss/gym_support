import { useQuery } from '@tanstack/react-query'
import { coachesQuery, type Coach } from '@/entities/coach'
import {
  CoachLimitEdit,
  CoachNameEdit,
  CoachStatusToggle,
} from '@/features/edit-coach'
import { ResetCodeButton } from '@/features/reset-coach-code'
import { errorText } from '@/shared/api'
import { formatDate } from '@/shared/lib'
import { DataTable, PageState, type Column } from '@/shared/ui'

const num = 'text-right font-mono tabular-nums'

const columns: Column<Coach>[] = [
  {
    key: 'name',
    header: 'Тренер',
    primary: true,
    cell: (c) => <CoachNameEdit coach={c} />,
  },
  {
    key: 'login',
    header: 'Логин',
    cell: (c) => (
      <span className="flex flex-col whitespace-nowrap">
        <span className="font-mono text-sm">{c.login}</span>
        <span className="text-xs text-muted-foreground">
          с {formatDate(c.createdAt)}
        </span>
      </span>
    ),
  },
  {
    key: 'clients',
    header: 'Клиенты',
    className: num,
    cell: (c) => c.clients,
  },
  {
    key: 'analyses',
    header: 'Анализы, 30 дн',
    className: num,
    cell: (c) => c.analyses30d,
  },
  {
    key: 'limit',
    header: 'Лимит ИИ',
    cell: (c) => <CoachLimitEdit coach={c} />,
  },
  {
    key: 'status',
    header: 'Статус',
    cell: (c) => <CoachStatusToggle coach={c} />,
  },
  {
    key: 'actions',
    header: '',
    className: 'text-right',
    cell: (c) => <ResetCodeButton coach={c} />,
  },
]

export function CoachesTable() {
  const { data, isPending, isError, error, refetch } = useQuery(coachesQuery())
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
    <DataTable
      columns={columns}
      rows={data}
      rowKey={(c) => c.id}
      rowClassName={(c) => (c.disabled ? 'bg-muted' : undefined)}
      empty="Тренеров пока нет — создай первого выше."
    />
  )
}
