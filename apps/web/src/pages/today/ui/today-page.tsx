import { useQuery } from '@tanstack/react-query'
import { draftsQuery, useEntries } from '@/entities/entry'
import { useProgram } from '@/entities/program'
import { useMe } from '@/entities/session'
import { CoachChangesCard } from '@/features/ack-changes'
import { ImportXlsx } from '@/features/import-xlsx'
import { LegacyImportCard } from '@/features/import-legacy'
import { InstallCard } from '@/features/install-app'
import { PageState } from '@/shared/ui'
import { Workout } from '@/widgets/workout'

export function TodayPage() {
  const program = useProgram()
  const journal = useEntries()
  const drafts = useQuery(draftsQuery())
  const { data: me } = useMe()

  if (
    (program.isError && !program.data) ||
    (journal.isError && !journal.data) ||
    (drafts.isError && !drafts.data)
  ) {
    return (
      <PageState
        error
        onRetry={() => {
          void program.refetch()
          void journal.refetch()
          void drafts.refetch()
        }}
      />
    )
  }
  // Черновики ждём, чтобы форма не мигнула значениями по умолчанию.
  if (!program.data || !journal.data || !drafts.data) return <PageState />

  return (
    <Workout
      program={program.data}
      entries={journal.entries}
      banner={
        me && (
          <>
            <CoachChangesCard />
            <InstallCard dismissible />
            <LegacyImportCard
              userId={me.id}
              excelSlot={
                <ImportXlsx
                  exercises={program.data.exercises}
                  buttonVariant="outline"
                />
              }
            />
          </>
        )
      }
    />
  )
}
