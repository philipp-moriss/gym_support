import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  entriesKey,
  pendingEntries,
  type Entry,
  type EntryInput,
} from '@/entities/entry'
import { api, isRetryable } from '@/shared/api'
import { syncPending } from './sync'

/**
 * Запись подхода. В кэш попадает сразу, чтобы карточка отметилась без
 * ожидания сети. Нет сети — запись ложится в очередь на телефоне и уйдёт сама.
 */
export function useLogEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    // Без сети не ждём: очередь сама решит, когда отправить.
    networkMode: 'always',
    mutationFn: async (entry: EntryInput) => {
      try {
        return { saved: await api.post<Entry>('/journal/entries', entry) }
      } catch (error) {
        if (!isRetryable(error)) throw error
        pendingEntries.add(entry)
        return { saved: null }
      }
    },
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
    onSuccess: ({ saved }, _entry, ctx) => {
      queryClient.setQueryData<Entry[]>(entriesKey, (old = []) =>
        saved
          ? old.map((e) => (e.id === ctx?.tempId ? saved : e))
          : // Ушла в очередь: показываем её оттуда, временную убираем.
            old.filter((e) => e.id !== ctx?.tempId),
      )
      // Раз сеть была на секунду недоступна — заодно попробуем отправить старое.
      if (saved) void syncPending(queryClient)
    },
    onError: (_error, _entry, ctx) => {
      queryClient.setQueryData<Entry[]>(entriesKey, (old = []) =>
        old.filter((e) => e.id !== ctx?.tempId),
      )
    },
  })
}
