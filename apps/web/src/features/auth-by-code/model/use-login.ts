import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQuery, rememberAccount, type AuthResult } from '@/entities/session'
import { api, session } from '@/shared/api'

/**
 * Вход: одним 8-значным кодом или, для старых аккаунтов, логином и 6-значным
 * кодом. После входа устройство помнит аккаунт — дальше сразу экран кода.
 */
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ login, code }: { login?: string; code: string }) =>
      login
        ? api.post<AuthResult>('/auth/login', { login, code })
        : api.post<AuthResult>('/auth/login/code', { code }),
    onSuccess: (res) => {
      queryClient.clear()
      session.set(res)
      rememberAccount(res.user)
      queryClient.setQueryData(meQuery().queryKey, res.user)
    },
  })
}
