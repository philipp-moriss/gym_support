import { useQuery } from '@tanstack/react-query'
import { adminsQuery, useMe, type Admin } from '@/entities/admin'
import { CreateAdminForm } from '@/features/create-admin'
import { errorText } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import {
  Badge,
  DataTable,
  PageHeader,
  PageState,
  type Column,
} from '@/shared/ui'

export function AdminsPage() {
  const { data, isPending, isError, error, refetch } = useQuery(adminsQuery())
  const { data: me } = useMe()

  const columns: Column<Admin>[] = [
    {
      key: 'login',
      header: 'Логин',
      primary: true,
      cell: (a) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-mono font-bold">{a.login}</span>
          {a.id === me?.id && <Badge tone="accent">Это вы</Badge>}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Создан',
      cell: (a) => formatDateTime(a.createdAt),
    },
  ]

  return (
    <>
      <PageHeader
        label="Доступ"
        title="Админы"
        description="У каждого админа полный доступ к админке. Пароль задаёт тот, кто создаёт аккаунт."
      />
      <CreateAdminForm />
      {isPending ? (
        <PageState />
      ) : isError ? (
        <PageState
          error
          message={errorText(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <DataTable columns={columns} rows={data} rowKey={(a) => a.id} />
      )}
    </>
  )
}
