import { useEntries } from '@/entities/entry'
import { CYCLE_WEEKS, useProgram } from '@/entities/program'
import { InstallCard } from '@/features/install-app'
import { PageState } from '@/shared/ui'
import { AccountCard } from '@/widgets/account-card'
import { CyclePlan } from '@/widgets/cycle-plan'
import { ExerciseManager } from '@/widgets/exercise-manager'
import { ResetCard } from '@/widgets/reset-card'
import { RulesCard } from '@/widgets/rules-card'
import { ScheduleEditor } from '@/widgets/schedule-editor'

export function PlanPage() {
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <span className="mono-label text-stage-muted">
          Цикл · {CYCLE_WEEKS} недели
        </span>
        <h1 className="display text-5xl text-accent sm:text-6xl">План</h1>
      </header>
      <CyclePlan program={program.data} entries={journal.entries} />
      <ExerciseManager program={program.data} />
      <ScheduleEditor program={program.data} />
      <RulesCard rules={program.data.settings.rules} />
      <ResetCard program={program.data} entries={journal.entries} />
      <InstallCard />
      <AccountCard />
    </div>
  )
}
