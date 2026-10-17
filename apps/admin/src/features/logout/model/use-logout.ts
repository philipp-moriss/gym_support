import { useQueryClient } from '@tanstack/react-query'
import { adminToken } from '@/shared/api'

/** Выход: refresh-токена нет, достаточно забыть токен и кэш. */
export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    adminToken.clear()
    queryClient.clear()
  }
}
