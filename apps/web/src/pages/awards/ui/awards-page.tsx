import { useEntries } from '@/entities/entry'
import { routes } from '@/shared/config'
import { PageState } from '@/shared/ui'
import { Achievements } from '@/widgets/achievements'

export function AwardsPage() {
  const journal = useEntries()
  if (journal.isError && !journal.data)
    return <PageState error onRetry={() => void journal.refetch()} />
  if (!journal.data) return <PageState />
  return (
    <Achievements
      entries={journal.entries}
      back={{ to: routes.profile, label: 'Профиль' }}
    />
  )
}
