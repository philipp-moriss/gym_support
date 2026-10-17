import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type {
  Analysis,
  ClientNotes,
  CoachClient,
  MyCoach,
  ProgramChange,
} from '../model/types'

export const coachKeys = {
  all: ['coach'] as const,
  clients: () => [...coachKeys.all, 'clients'] as const,
  client: (id: string) => [...coachKeys.all, 'client', id] as const,
  notes: (id: string) => [...coachKeys.client(id), 'notes'] as const,
  changes: (id: string) => [...coachKeys.client(id), 'changes'] as const,
  analyses: (id: string) => [...coachKeys.client(id), 'analyses'] as const,
  analysis: (id: string, aid: string) =>
    [...coachKeys.analyses(id), aid] as const,
}

export const coachClientsQuery = () =>
  queryOptions({
    queryKey: coachKeys.clients(),
    queryFn: () => api.get<CoachClient[]>('/coach/clients'),
  })

export const coachClientQuery = (id: string) =>
  queryOptions({
    queryKey: coachKeys.client(id),
    queryFn: () => api.get<CoachClient>(`/coach/clients/${id}`),
  })

export const clientNotesQuery = (id: string) =>
  queryOptions({
    queryKey: coachKeys.notes(id),
    queryFn: () => api.get<ClientNotes>(`/coach/clients/${id}/notes`),
  })

export const clientChangesQuery = (id: string) =>
  queryOptions({
    queryKey: coachKeys.changes(id),
    queryFn: () => api.get<ProgramChange[]>(`/coach/clients/${id}/changes`),
  })

export const analysesQuery = (id: string) =>
  queryOptions({
    queryKey: coachKeys.analyses(id),
    queryFn: () => api.get<Analysis[]>(`/coach/clients/${id}/analyses`),
  })

/** Пока анализ идёт — опрашиваем раз в 3 секунды. */
export const analysisQuery = (id: string, aid: string) =>
  queryOptions({
    queryKey: coachKeys.analysis(id, aid),
    queryFn: () => api.get<Analysis>(`/coach/clients/${id}/analyses/${aid}`),
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? 3000 : false),
  })

/** Для клиента: кто его тренер. */
export const myCoachKey = ['coaching', 'coach'] as const
export const myCoachQuery = () =>
  queryOptions({
    queryKey: myCoachKey,
    queryFn: () => api.get<MyCoach>('/coaching/coach'),
  })

/** Для клиента: правки тренера, которые он ещё не видел. */
export const unseenChangesKey = ['program', 'changes', 'unseen'] as const
export const unseenChangesQuery = () =>
  queryOptions({
    queryKey: unseenChangesKey,
    queryFn: () => api.get<ProgramChange[]>('/program/changes?unseen=true'),
  })
