import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api'
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

export function useEntries() {
  const query = useQuery(entriesQuery())
  return { ...query, entries: query.data ?? EMPTY }
}
