import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQuery, rememberedLogin, type AuthResult } from '@/entities/session'
import { api, session } from '@/shared/api'

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: { login: string; code: string }) =>
      api.post<AuthResult>('/auth/login', dto),
    onSuccess: (res) => {
      queryClient.clear()
      session.set(res)
      rememberedLogin.set(res.user.login)
      queryClient.setQueryData(meQuery().queryKey, res.user)
    },
  })
}
