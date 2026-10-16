import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo, useSyncExternalStore } from 'react'
import { api } from '@/shared/api'
import { pendingAsEntry, pendingEntries } from '../model/pending'
import type { Drafts, Entry } from '../model/types'

export const entriesKey = ['journal', 'entries'] as const
export const draftsKey = ['journal', 'drafts'] as const

export const entriesQuery = () =>
  queryOptions({
    queryKey: entriesKey,
    queryFn: () => api.get<Entry[]>('/journal/entries'),
  })

export const draftsQuery = () =>
  queryOptions({
    queryKey: draftsKey,
    queryFn: () => api.get<Drafts>('/journal/drafts'),
    // Черновики правит только этот клиент: кэш — источник правды до перезагрузки.
    staleTime: Infinity,
  })

const EMPTY: Entry[] = []

/** Записи с сервера и ещё не отправленные (сделанные без сети) — вместе. */
export function useEntries() {
  const query = useQuery(entriesQuery())
  const pending = useSyncExternalStore(
    pendingEntries.subscribe,
    pendingEntries.list,
  )
  const entries = useMemo(
    () =>
      pending.length
        ? [...pending.map(pendingAsEntry), ...(query.data ?? EMPTY)]
        : (query.data ?? EMPTY),
    [pending, query.data],
  )
  return { ...query, entries }
}
