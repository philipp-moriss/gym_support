import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useSyncExternalStore } from 'react'
import { pendingEntries } from '@/entities/entry'
import { syncPending } from './sync'

/** Досылает очередь: при запуске, когда появилась сеть и раз в 20 секунд, пока она не пуста. */
export function usePendingSync() {
  const queryClient = useQueryClient()
  const pending = useSyncExternalStore(
    pendingEntries.subscribe,
    pendingEntries.list,
  )

  useEffect(() => {
    if (!pending.length) return
    const sync = () => void syncPending(queryClient)
    sync()
    const timer = setInterval(sync, 20_000)
    window.addEventListener('online', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      clearInterval(timer)
      window.removeEventListener('online', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [pending.length, queryClient])

  return pending.length
}
