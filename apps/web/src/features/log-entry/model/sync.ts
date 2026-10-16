import type { QueryClient } from '@tanstack/react-query'
import { entriesKey, pendingEntries, type Entry } from '@/entities/entry'
import { api, isRetryable } from '@/shared/api'

let running: Promise<void> | null = null

/**
 * Отправка записей, сделанных без сети, по одной и по порядку. Сеть пропала —
 * остановились, остальное дождётся следующей попытки. Запись, которую сервер
 * не принимает (4xx), выбрасываем: иначе очередь застрянет навсегда.
 */
export function syncPending(queryClient: QueryClient) {
  running ??= (async () => {
    for (const item of pendingEntries.list()) {
      try {
        const saved = await api.post<Entry>('/journal/entries', item.input)
        pendingEntries.remove(item.id)
        queryClient.setQueryData<Entry[]>(entriesKey, (old) =>
          old ? [saved, ...old] : old,
        )
      } catch (error) {
        if (isRetryable(error)) break
        pendingEntries.remove(item.id)
      }
    }
  })().finally(() => {
    running = null
  })
  return running
}
