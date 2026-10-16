import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import {
  draftsKey,
  draftsQuery,
  type Draft,
  type Drafts,
} from '@/entities/entry'
import { api } from '@/shared/api'
import { todayIso } from '@/shared/lib'

/**
 * Черновики правок формы хранятся на сервере. Правка сразу попадает в кэш,
 * а на сервер уходит одним запросом через полсекунды после последнего касания.
 */
let timer: ReturnType<typeof setTimeout> | undefined
let pending: Drafts | null = null

function flush() {
  clearTimeout(timer)
  if (!pending) return
  const body = pending
  pending = null
  void api.put('/journal/drafts', body).catch(() => undefined)
}

// Уход со страницы не теряет последнюю правку.
if (typeof window !== 'undefined') window.addEventListener('pagehide', flush)

/** Черновики живут только в свой день: вчерашние правки сегодня не подставляем. */
const todays = (d: Drafts | undefined) =>
  d?.date === todayIso() ? d.items : {}

export function useDraft(exerciseId: string) {
  const queryClient = useQueryClient()
  const { data } = useQuery(draftsQuery())
  const draft = todays(data)[exerciseId] as Draft | undefined

  useEffect(() => flush, [])

  const write = useCallback(
    (update: (items: Record<string, Draft>) => Record<string, Draft>) => {
      const items = update(todays(queryClient.getQueryData<Drafts>(draftsKey)))
      const next: Drafts = { date: todayIso(), items }
      queryClient.setQueryData(draftsKey, next)
      pending = next
      clearTimeout(timer)
      timer = setTimeout(flush, 500)
    },
    [queryClient],
  )

  const save = useCallback(
    (d: Draft) => write((items) => ({ ...items, [exerciseId]: d })),
    [exerciseId, write],
  )
  const clear = useCallback(
    () =>
      write((items) =>
        Object.fromEntries(
          Object.entries(items).filter(([id]) => id !== exerciseId),
        ),
      ),
    [exerciseId, write],
  )

  return { draft, save, clear }
}
