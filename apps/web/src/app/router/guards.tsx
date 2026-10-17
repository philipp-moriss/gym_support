import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useState } from 'react'
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router'
import { entriesKey, pendingEntries } from '@/entities/entry'
import { programKey } from '@/entities/program'
import { useMe } from '@/entities/session'
import { actingAs, session } from '@/shared/api'
import { routes } from '@/shared/config'
import { PageState } from '@/shared/ui'

/** Пускает дальше только вошедшего; иначе — на экран входа. */
export function RequireAuth() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const hasSession = session.hasSession()
  const { data: me, isError } = useMe()

  // Очередь записей без сети — своя у каждого аккаунта.
  useLayoutEffect(() => {
    pendingEntries.setOwner(me?.id ?? null)
  }, [me?.id])

  // Сессия умерла посреди работы: чистим кэш и идём на вход.
  useEffect(
    () =>
      session.onExpired(() => {
        queryClient.clear()
        navigate(routes.login, {
          replace: true,
          state: { from: location.pathname },
        })
      }),
    [navigate, queryClient, location.pathname],
  )

  // Без сети «me» не обновится, но сохранённый на телефоне — годится.
  if (!hasSession || (isError && !me))
    return (
      <Navigate to={routes.login} replace state={{ from: location.pathname }} />
    )
  if (!me) return <PageState />
  // У тренера своего журнала нет — только кабинет; клиенту кабинет не нужен.
  const inCoach = location.pathname.startsWith(routes.coach)
  if (me.role === 'coach' && !inCoach)
    return <Navigate to={routes.coach} replace />
  if (me.role !== 'coach' && inCoach)
    return <Navigate to={routes.today} replace />
  return <Outlet />
}

/**
 * Тренер открыл клиента: программа и дневник дальше грузятся от его имени.
 * Кэш прежнего клиента выбрасываем, чтобы не мелькнули чужие данные; детей
 * рисуем только после переключения.
 */
export function CoachClientScope() {
  const { clientId = '' } = useParams()
  const queryClient = useQueryClient()
  const [active, setActive] = useState<string | null>(null)

  useLayoutEffect(() => {
    const drop = () => {
      queryClient.removeQueries({ queryKey: programKey })
      queryClient.removeQueries({ queryKey: entriesKey })
    }
    drop()
    actingAs.set(clientId)
    // Дети должны смонтироваться уже после переключения: их запросы стартуют в их эффектах.
    // oxlint-disable-next-line react/set-state-in-effect
    setActive(clientId)
    return () => {
      actingAs.set(null)
      drop()
    }
  }, [clientId, queryClient])

  if (active !== clientId) return <PageState />
  return <Outlet />
}
