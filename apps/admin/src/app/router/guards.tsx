import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useMe } from '@/entities/admin'
import { adminToken, errorText } from '@/shared/api'
import { routes } from '@/shared/config'
import { PageState } from '@/shared/ui'

/** Пускает дальше только вошедшего админа; иначе — на экран входа. */
export function RequireAdmin() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: me, isError, error, refetch } = useMe()

  // Любой 401: токен истёк (12 ч) или админа нет — чистим кэш и на вход.
  useEffect(
    () =>
      adminToken.onExpired(() => {
        queryClient.clear()
        navigate(routes.login, {
          replace: true,
          state: { from: location.pathname },
        })
      }),
    [navigate, queryClient, location.pathname],
  )

  if (!adminToken.get())
    return (
      <Navigate to={routes.login} replace state={{ from: location.pathname }} />
    )
  if (isError && !me)
    return (
      <PageState
        error
        message={errorText(error)}
        onRetry={() => void refetch()}
      />
    )
  if (!me) return <PageState />
  return <Outlet />
}
