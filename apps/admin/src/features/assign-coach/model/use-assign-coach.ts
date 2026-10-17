import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsQuery } from '@/entities/client'
import { coachesQuery } from '@/entities/coach'
import { api } from '@/shared/api'

/** Закрепить клиента за тренером; null — без тренера. */
export function useAssignCoach(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (coachId: string | null) =>
      api.put<void>(`/clients/${clientId}/coach`, { coachId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsQuery().queryKey })
      // У тренеров меняется число клиентов.
      void queryClient.invalidateQueries({ queryKey: coachesQuery().queryKey })
    },
  })
}
