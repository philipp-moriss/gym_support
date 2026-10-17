import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  coachKeys,
  type CoachClient,
  type Invite,
  type NewClient,
} from '@/entities/coaching'
import { api } from '@/shared/api'

export type ProgramTemplate = 'back' | 'empty'

/** Тренер заводит клиента: аккаунт с программой, код входа — в ответе один раз. */
export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; template: ProgramTemplate }) =>
      api.post<NewClient>('/coach/clients', input),
    onSuccess: ({ client }) =>
      queryClient.setQueryData<CoachClient[]>(coachKeys.clients(), (list) =>
        list ? [...list, client] : list,
      ),
  })
}

/** Код-приглашение для клиента, у которого уже есть аккаунт. */
export function useCreateInvite() {
  return useMutation({
    mutationFn: () => api.post<Invite>('/coach/invites'),
  })
}

export function useRenameClient(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alias: string | null) =>
      api.patch<CoachClient>(`/coach/clients/${id}`, { alias }),
    onSuccess: (client) => {
      queryClient.setQueryData(coachKeys.client(id), client)
      void queryClient.invalidateQueries({ queryKey: coachKeys.clients() })
    },
  })
}

export function useUnlinkClient(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/coach/clients/${id}`),
    onSuccess: () => {
      queryClient.setQueryData<CoachClient[]>(coachKeys.clients(), (list) =>
        list?.filter((c) => c.id !== id),
      )
      queryClient.removeQueries({ queryKey: coachKeys.client(id) })
    },
  })
}
