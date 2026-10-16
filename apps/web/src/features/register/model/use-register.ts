import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQuery, rememberedLogin, type AuthResult } from '@/entities/session'
import { api, session } from '@/shared/api'

export type ProgramTemplate = 'back' | 'empty'

/** Регистрация: сервер выдаёт логин и код, код показываем один раз. */
export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (template: ProgramTemplate) =>
      api.post<AuthResult & { code: string }>('/auth/register', { template }),
    onSuccess: (res) => {
      queryClient.clear()
      session.set(res)
      rememberedLogin.set(res.user.login)
      queryClient.setQueryData(meQuery().queryKey, res.user)
    },
  })
}
