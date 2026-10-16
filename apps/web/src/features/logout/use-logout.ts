import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, session } from '@/shared/api'

/** Закрыть сессию на сервере и забыть токены. Логин остаётся: вход снова — сразу по коду. */
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const refreshToken = session.refreshToken
      if (refreshToken)
        await api.post('/auth/logout', { refreshToken }).catch(() => undefined)
    },
    onSettled: () => {
      session.clear()
      queryClient.clear()
    },
  })
}
