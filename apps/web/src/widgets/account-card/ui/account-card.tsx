import { KeyRound, LogOut, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMe } from '@/entities/session'
import { ChangeCodeFlow } from '@/features/change-code'
import { useLogout } from '@/features/logout'
import { routes } from '@/shared/config'
import { Button, Card } from '@/shared/ui'

/**
 * Кто вошёл, смена кода и выход. Логин запомнен на устройстве: вход обратно —
 * сразу по коду.
 */
export function AccountCard() {
  const { data: me } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const [changing, setChanging] = useState(false)
  if (!me) return null
  return (
    <Card className="flex-row flex-wrap items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lilac">
        <UserRound className="size-6" />
      </span>
      <div className="flex min-w-40 flex-1 flex-col">
        <span className="mono-label text-muted-foreground">Аккаунт</span>
        <span
          className="truncate font-mono text-lg font-bold"
          data-testid="account-login"
        >
          {me.login}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setChanging(true)}>
          <KeyRound />
          Сменить код
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSettled: () => navigate(routes.login, { replace: true }),
            })
          }
        >
          <LogOut />
          Выйти
        </Button>
      </div>
      {changing && <ChangeCodeFlow onClose={() => setChanging(false)} />}
    </Card>
  )
}
