import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entriesKey, type Entry, type EntryInput } from '@/entities/entry'
import { api } from '@/shared/api'

/** Запись подхода. В кэш попадает сразу, чтобы карточка отметилась без ожидания сети. */
export function useLogEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entry: EntryInput) =>
      api.post<Entry>('/journal/entries', entry),
    onMutate: async (entry) => {
      await queryClient.cancelQueries({ queryKey: entriesKey })
      const temp: Entry = {
        ...entry,
        id: `temp-${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<Entry[]>(entriesKey, (old = []) => [
        temp,
        ...old,
      ])
      return { tempId: temp.id }
    },
    onSuccess: (saved, _entry, ctx) => {
      queryClient.setQueryData<Entry[]>(entriesKey, (old = []) =>
        old.map((e) => (e.id === ctx?.tempId ? saved : e)),
      )
    },
    onError: (_error, _entry, ctx) => {
      queryClient.setQueryData<Entry[]>(entriesKey, (old = []) =>
        old.filter((e) => e.id !== ctx?.tempId),
      )
    },
  })
}
