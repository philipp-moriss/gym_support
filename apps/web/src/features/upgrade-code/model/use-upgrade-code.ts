import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQuery, rememberAccount, type AuthResult } from '@/entities/session'
import { api, session } from '@/shared/api'

/**
 * Старый аккаунт (6 цифр + логин) получает 8-значный код для входа без логина.
 * Сервер закрывает прежние сессии и отдаёт новую пару токенов этому устройству.
 */
export function useUpgradeCode() {
  return useMutation({
    mutationFn: () =>
      api.post<AuthResult & { code: string }>('/auth/code/upgrade'),
    onSuccess: (res) => {
      session.set(res)
      rememberAccount(res.user)
    },
  })
}

/** Кэш «me» обновляем, когда код уже сохранён: иначе экран закроется сразу. */
export function useFinishUpgrade() {
  const queryClient = useQueryClient()
  return (user: AuthResult['user']) =>
    queryClient.setQueryData(meQuery().queryKey, user)
}
