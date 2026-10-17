import { useMutation, useQueryClient } from '@tanstack/react-query'
import { unseenChangesKey } from '@/entities/coaching'
import { api } from '@/shared/api'

/** «Понятно»: правки тренера просмотрены. */
export function useAckChanges() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/program/changes/seen'),
    onMutate: () => queryClient.setQueryData(unseenChangesKey, []),
  })
}
