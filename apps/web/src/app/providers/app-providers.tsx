import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { ReactNode } from 'react'
import { CACHE_MAX_AGE, queryClient } from '@/shared/api'

/**
 * Кэш запросов сохраняется на телефоне: приложение открывается и показывает
 * программу и дневник даже без сети (в подвальном зале). При выходе кэш
 * очищается вместе с queryClient.clear().
 */
const persister = createSyncStoragePersister({
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  key: 'gym.cache',
  throttleTime: 1000,
})

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE,
        // Новая версия формата данных — старый кэш не подхватываем.
        buster: 'v1',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
