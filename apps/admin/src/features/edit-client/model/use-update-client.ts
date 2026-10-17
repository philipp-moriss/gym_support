import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsQuery } from '@/entities/client'
import { api } from '@/shared/api'

export interface ClientPatch {
  disabled?: boolean
  /** null — убрать имя, останется логин. */
  name?: string | null
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: ClientPatch) => api.patch(`/clients/${id}`, patch),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clientsQuery().queryKey }),
  })
}
