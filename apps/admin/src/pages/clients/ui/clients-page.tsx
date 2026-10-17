import { PageHeader } from '@/shared/ui'
import { ClientsTable } from '@/widgets/clients-table'

export function ClientsPage() {
  return (
    <>
      <PageHeader
        label="Аккаунты"
        title="Клиенты"
        description="Закреплённый тренер видит дневник клиента и запускает анализ ИИ."
      />
      <ClientsTable />
    </>
  )
}
