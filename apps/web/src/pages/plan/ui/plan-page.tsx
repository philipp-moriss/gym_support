import { CalendarDays, RefreshCw, ShieldCheck } from 'lucide-react'
import { CYCLE_WEEKS, programWeek } from '@/entities/program'
import { useScopedRoutes } from '@/shared/config'
import { fromIso, plural, todayIso } from '@/shared/lib'
import { MenuLink, PageHeader, PageState } from '@/shared/ui'
import { CyclePlan } from '@/widgets/cycle-plan'
import { ProgramOverview } from '@/widgets/program-overview'
import { usePlanData } from '../model/use-plan-data'

/** «План»: неделя цикла и свои упражнения; настройки — на отдельных страницах. */
export function PlanPage() {
  const { program, entries, ready, error, retry } = usePlanData()
  const routes = useScopedRoutes()
  if (error) return <PageState error onRetry={retry} />
  if (!ready || !program) return <PageState />
  const { settings } = program
  const week = programWeek(settings.startDate, todayIso())
  const gymDays = settings.schedule.filter((d) => d.gym === 'yes').length
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        label={`Неделя ${week} из ${CYCLE_WEEKS}`}
        title="План"
        back={routes.planBack}
      />
      <CyclePlan program={program} entries={entries} compact />
      <ProgramOverview program={program} entries={entries} />
      <nav className="flex flex-col gap-2" aria-label="Настройки плана">
        <MenuLink
          to={routes.planSchedule}
          icon={CalendarDays}
          color="var(--matcha-cream)"
          title="Дни тренировок"
          hint={`${gymDays} ${plural(gymDays, ['тренировка', 'тренировки', 'тренировок'])} в неделю`}
        />
        <MenuLink
          to={routes.planCycle}
          icon={RefreshCw}
          color="var(--hi-vis-yellow)"
          title="Неделя и сброс"
          hint={`Старт ${fromIso(settings.startDate).toLocaleDateString('ru-RU')} · повтор недели, сброс`}
        />
        <MenuLink
          to={routes.planRules}
          icon={ShieldCheck}
          color="var(--sky)"
          title="Правила безопасности"
          hint={
            settings.rules.length
              ? `${settings.rules.length} ${plural(settings.rules.length, ['правило', 'правила', 'правил'])}`
              : 'Пока нет'
          }
        />
      </nav>
    </div>
  )
}
