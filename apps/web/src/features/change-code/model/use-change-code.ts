import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQuery, rememberAccount, type AuthResult } from '@/entities/session'
import { api, session } from '@/shared/api'

/**
 * Смена кода: сервер закрывает все прежние сессии и сразу отдаёт новую пару
 * токенов для этого устройства. Новый код показываем один раз.
 */
export function useChangeCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (currentCode: string) =>
      api.post<AuthResult & { code: string }>('/auth/code', { currentCode }),
    onSuccess: (res) => {
      session.set(res)
      rememberAccount(res.user)
      queryClient.setQueryData(meQuery().queryKey, res.user)
    },
  })
}
