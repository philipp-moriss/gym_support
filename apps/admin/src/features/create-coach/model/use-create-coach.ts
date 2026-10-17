import { useMutation, useQueryClient } from '@tanstack/react-query'
import { coachesQuery, type CreatedCoach } from '@/entities/coach'
import { api } from '@/shared/api'

export function useCreateCoach() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.post<CreatedCoach>('/coaches', { name }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: coachesQuery().queryKey }),
  })
}
