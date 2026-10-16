import { routes } from '@/shared/config'
import { PageHeader, PageState } from '@/shared/ui'
import { CyclePlan } from '@/widgets/cycle-plan'
import { ExerciseManager } from '@/widgets/exercise-manager'
import { ResetCard } from '@/widgets/reset-card'
import { RulesCard } from '@/widgets/rules-card'
import { ScheduleEditor } from '@/widgets/schedule-editor'
import { usePlanData } from '../model/use-plan-data'

const back = { to: routes.plan, label: 'План' }

/** Режим правки упражнений: веса, подходы, дни, порядок, новые упражнения. */
export function PlanExercisesPage() {
  const { program, ready, error, retry } = usePlanData()
  if (error) return <PageState error onRetry={retry} />
  if (!ready || !program) return <PageState />
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label="Правка" title="Упражнения" back={back} />
      <ExerciseManager program={program} />
    </div>
  )
}

export function PlanSchedulePage() {
  const { program, ready, error, retry } = usePlanData()
  if (error) return <PageState error onRetry={retry} />
  if (!ready || !program) return <PageState />
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label="Неделя по дням" title="Расписание" back={back} />
      <ScheduleEditor program={program} />
    </div>
  )
}

export function PlanCyclePage() {
  const { program, entries, ready, error, retry } = usePlanData()
  if (error) return <PageState error onRetry={retry} />
  if (!ready || !program) return <PageState />
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label="Цикл" title="Неделя и сброс" back={back} />
      <CyclePlan program={program} entries={entries} />
      <ResetCard program={program} entries={entries} />
    </div>
  )
}

export function PlanRulesPage() {
  const { program, ready, error, retry } = usePlanData()
  if (error) return <PageState error onRetry={retry} />
  if (!ready || !program) return <PageState />
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label="Для своей спины" title="Правила" back={back} />
      <RulesCard rules={program.settings.rules} defaultOpen />
    </div>
  )
}
