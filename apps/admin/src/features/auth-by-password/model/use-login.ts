import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQuery, type AdminLoginResult } from '@/entities/admin'
import { adminToken, api, ApiError } from '@/shared/api'

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: { login: string; password: string }) =>
      api.post<AdminLoginResult>('/auth/login', dto),
    onSuccess: (res) => {
      queryClient.clear()
      adminToken.set(res.accessToken)
      queryClient.setQueryData(meQuery().queryKey, res.admin)
    },
  })
}

/** Текст ошибки входа: неверный пароль, блокировка, прочее. */
export function loginErrorText(error: unknown) {
  if (!(error instanceof ApiError))
    return 'Сервер недоступен. Проверь интернет.'
  if (error.status === 401) return 'Неверный логин или пароль'
  if (error.status === 429) {
    const sec = Number(error.body?.retryAfterSec)
    return sec > 0
      ? `Слишком много попыток, попробуйте через ${Math.ceil(sec / 60)} мин`
      : 'Слишком много попыток, попробуйте позже'
  }
  return error.message
}
