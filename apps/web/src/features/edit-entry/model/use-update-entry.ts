import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  entriesKey,
  isPendingId,
  pendingEntries,
  type Entry,
  type EntryInput,
} from '@/entities/entry'
import { api } from '@/shared/api'

export type EntryPatch = Partial<
  Pick<
    EntryInput,
    'weight' | 'sets' | 'reps' | 'setReps' | 'pain' | 'effort' | 'notes'
  >
>

/** Исправить запись дневника. Неотправленную (без сети) — прямо в очереди на телефоне. */
export function useUpdateEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'always',
    mutationFn: async ({ id, patch }: { id: string; patch: EntryPatch }) => {
      if (isPendingId(id)) {
        pendingEntries.update(id, patch)
        return null
      }
      return api.patch<Entry>(`/journal/entries/${id}`, patch)
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: entriesKey })
      const prev = queryClient.getQueryData<Entry[]>(entriesKey)
      queryClient.setQueryData<Entry[]>(entriesKey, (old = []) =>
        old.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      )
      return { prev }
    },
    onSuccess: (saved) => {
      if (saved)
        queryClient.setQueryData<Entry[]>(entriesKey, (old = []) =>
          old.map((e) => (e.id === saved.id ? saved : e)),
        )
    },
    onError: (_error, _vars, ctx) =>
      queryClient.setQueryData(entriesKey, ctx?.prev),
  })
}
