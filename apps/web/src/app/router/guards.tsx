import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
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

  if (!hasSession || isError)
    return (
      <Navigate to={routes.login} replace state={{ from: location.pathname }} />
    )
  if (!me) return <PageState />
  return <Outlet />
}
