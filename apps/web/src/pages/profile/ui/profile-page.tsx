import { NotebookPen, Trophy } from 'lucide-react'
import { useEntries, volume } from '@/entities/entry'
import { InstallCard } from '@/features/install-app'
import { MyCoachCard } from '@/features/link-coach'
import { routes } from '@/shared/config'
import { num, plural, tonnage } from '@/shared/lib'
import { MenuLink, PageHeader, PageState } from '@/shared/ui'
import { AccountCard } from '@/widgets/account-card'

/** «Профиль»: аккаунт, дневник и награды, установка на телефон. */
export function ProfilePage() {
  const journal = useEntries()
  if (journal.isError && !journal.data)
    return <PageState error onRetry={() => void journal.refetch()} />
  if (!journal.data) return <PageState />
  const { entries } = journal
  const workouts = new Set(entries.map((e) => e.date)).size
  const total = entries.reduce((s, e) => s + volume(e), 0)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label="Аккаунт и история" title="Профиль" />
      <AccountCard />
      <MyCoachCard />
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Тренировок" value={num(workouts)} />
        <Stat label="Поднято всего" value={tonnage(total)} />
      </div>
      <nav className="flex flex-col gap-2" aria-label="Профиль">
        <MenuLink
          to={routes.journal}
          icon={NotebookPen}
          color="var(--bubblegum-pink)"
          title="Дневник"
          hint={
            entries.length
              ? `${entries.length} ${plural(entries.length, ['запись', 'записи', 'записей'])} · выгрузка и загрузка Excel`
              : 'Пока пусто · загрузка из Excel'
          }
        />
        <MenuLink
          to={routes.awards}
          icon={Trophy}
          color="var(--hi-vis-yellow)"
          title="Награды"
          hint="Сколько поднял, коллекция, значки, рекорды"
        />
      </nav>
      <InstallCard />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-block p-3 sm:p-4">
      <span className="mono-label text-stage-muted">{label}</span>
      <span className="display truncate text-3xl">{value}</span>
    </div>
  )
}
