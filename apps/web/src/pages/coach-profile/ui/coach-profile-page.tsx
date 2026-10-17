import { useMe } from '@/entities/session'
import { PageHeader } from '@/shared/ui'
import { AccountCard } from '@/widgets/account-card'

/** Профиль тренера: аккаунт, смена кода, выход. */
export function CoachProfilePage() {
  const { data: me } = useMe()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label="Тренер" title={me?.name ?? 'Профиль'} />
      <AccountCard />
    </div>
  )
}
