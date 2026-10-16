import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { pendingEntries } from '@/entities/entry'
import { useMe } from '@/entities/session'
import { session } from '@/shared/api'
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
  return <Outlet />
}
