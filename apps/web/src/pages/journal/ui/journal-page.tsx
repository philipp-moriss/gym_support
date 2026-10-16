import { useEntries } from '@/entities/entry'
import { useProgram } from '@/entities/program'
import { routes } from '@/shared/config'
import { PageState } from '@/shared/ui'
import { JournalList } from '@/widgets/journal-list'

export function JournalPage() {
  const program = useProgram()
  const journal = useEntries()
  if (program.isError || journal.isError)
    return (
      <PageState
        error
        onRetry={() => void Promise.all([program.refetch(), journal.refetch()])}
      />
    )
  if (!program.data || !journal.data) return <PageState />
  return (
    <JournalList
      entries={journal.entries}
      exercises={program.data.exercises}
      back={{ to: routes.profile, label: 'Профиль' }}
    />
  )
}
