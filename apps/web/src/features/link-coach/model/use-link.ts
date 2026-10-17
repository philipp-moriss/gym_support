import { useMutation, useQueryClient } from '@tanstack/react-query'
import { myCoachKey, type MyCoach } from '@/entities/coaching'
import { api } from '@/shared/api'

/** Клиент вводит код приглашения тренера. */
export function useLinkCoach() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => api.post<MyCoach>('/coaching/link', { code }),
    onSuccess: (data) => queryClient.setQueryData(myCoachKey, data),
  })
}

export function useLeaveCoach() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/coaching/link'),
    onSuccess: () =>
      queryClient.setQueryData<MyCoach>(myCoachKey, { coach: null }),
  })
}
