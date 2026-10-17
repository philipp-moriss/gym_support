import { useMutation, useQueryClient } from '@tanstack/react-query'
import { coachKeys, type ClientNotes } from '@/entities/coaching'
import { api } from '@/shared/api'

export function useSaveNotes(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (text: string) =>
      api.put<ClientNotes>(`/coach/clients/${clientId}/notes`, { text }),
    onSuccess: (notes) =>
      queryClient.setQueryData(coachKeys.notes(clientId), notes),
  })
}
