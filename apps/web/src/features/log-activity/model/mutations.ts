import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  activitiesKey,
  type Activity,
  type ActivityInput,
  type ActivityPatch,
} from '@/entities/activity'
import { api } from '@/shared/api'

/** Пока сервер не ответил, запись живёт с временным id и сразу видна в списке. */
export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActivityInput) =>
      api.post<Activity>('/journal/activities', input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: activitiesKey })
      const tempId = `temp-${crypto.randomUUID()}`
      const temp: Activity = {
        id: tempId,
        createdAt: new Date().toISOString(),
        date: input.date,
        kind: input.kind,
        poolLength: input.poolLength ?? null,
        laps: input.laps ?? null,
        distanceM:
          input.kind === 'swim'
            ? (input.poolLength ?? 0) * (input.laps ?? 0)
            : (input.distanceM ?? 0),
        durationSec: input.durationSec,
        notes: input.notes ?? '',
      }
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) => [
        temp,
        ...old,
      ])
      return { tempId }
    },
    onSuccess: (saved, _input, ctx) =>
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) =>
        old.map((a) => (a.id === ctx?.tempId ? saved : a)),
      ),
    // Убираем только свою временную запись: правки, сделанные тем временем, не откатываем.
    onError: (_error, _input, ctx) =>
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) =>
        old.filter((a) => a.id !== ctx?.tempId),
      ),
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ActivityPatch }) =>
      api.patch<Activity>(`/journal/activities/${id}`, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: activitiesKey })
      const prev = queryClient.getQueryData<Activity[]>(activitiesKey)
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) =>
        old.map((a) => {
          if (a.id !== id) return a
          const next = { ...a, ...patch }
          // Пока сервер не ответил, дистанцию бассейна считаем сами.
          return next.kind === 'swim'
            ? { ...next, distanceM: (next.poolLength ?? 0) * (next.laps ?? 0) }
            : next
        }),
      )
      return { prev }
    },
    onSuccess: (saved) =>
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) =>
        old.map((a) => (a.id === saved.id ? saved : a)),
      ),
    onError: (_error, _vars, ctx) =>
      queryClient.setQueryData(activitiesKey, ctx?.prev),
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/journal/activities/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: activitiesKey })
      const prev = queryClient.getQueryData<Activity[]>(activitiesKey)
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) =>
        old.filter((a) => a.id !== id),
      )
      return { prev }
    },
    onError: (_error, _id, ctx) =>
      queryClient.setQueryData(activitiesKey, ctx?.prev),
  })
}
