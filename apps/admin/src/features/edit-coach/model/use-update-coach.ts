import { useMutation, useQueryClient } from '@tanstack/react-query'
import { coachesQuery, type CoachAccount } from '@/entities/coach'
import { clientsQuery } from '@/entities/client'
import { api } from '@/shared/api'

export interface CoachPatch {
  name?: string
  disabled?: boolean
  /** null — общий лимит по умолчанию. */
  aiDailyLimit?: number | null
}

export function useUpdateCoach(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: CoachPatch) =>
      api.patch<CoachAccount>(`/coaches/${id}`, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coachesQuery().queryKey })
      // Имя тренера видно и в списке клиентов.
      void queryClient.invalidateQueries({ queryKey: clientsQuery().queryKey })
    },
  })
}
