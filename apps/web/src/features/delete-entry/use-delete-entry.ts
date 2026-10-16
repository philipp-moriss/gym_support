import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  entriesKey,
  isPendingId,
  pendingEntries,
  type Entry,
} from '@/entities/entry'
import { api } from '@/shared/api'

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'always',
    // Неотправленная запись живёт только на телефоне — там её и удаляем.
    mutationFn: async (id: string) =>
      isPendingId(id)
        ? pendingEntries.remove(id)
        : api.delete(`/journal/entries/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: entriesKey })
      const prev = queryClient.getQueryData<Entry[]>(entriesKey)
      queryClient.setQueryData<Entry[]>(entriesKey, (old = []) =>
        old.filter((e) => e.id !== id),
      )
      return { prev }
    },
    onError: (_error, _id, ctx) =>
      queryClient.setQueryData(entriesKey, ctx?.prev),
  })
}
