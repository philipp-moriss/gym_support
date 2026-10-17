import { CreateCoachForm } from '@/features/create-coach'
import { PageHeader } from '@/shared/ui'
import { CoachesTable } from '@/widgets/coaches-table'

export function CoachesPage() {
  return (
    <>
      <PageHeader
        label="Аккаунты"
        title="Тренеры"
        description="Тренер входит в приложение по коду из 8 цифр. Лимит ИИ — сколько анализов в сутки он может запустить; пусто — общий лимит по умолчанию."
      />
      <CreateCoachForm />
      <CoachesTable />
    </>
  )
}
