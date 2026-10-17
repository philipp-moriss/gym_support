import { useMutation, useQueryClient } from '@tanstack/react-query'
import { coachesQuery } from '@/entities/coach'
import { api } from '@/shared/api'

/** Новый код тренеру: старый перестаёт работать, сессии закрываются. */
export function useResetCode(coachId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ code: string }>(`/coaches/${coachId}/code`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: coachesQuery().queryKey }),
  })
}
