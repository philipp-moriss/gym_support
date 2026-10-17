import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  programKey,
  type Exercise,
  type ExerciseInput,
  type Program,
} from '@/entities/program'
import { api } from '@/shared/api'

function usePatchCache() {
  const queryClient = useQueryClient()
  return {
    queryClient,
    async optimistic(update: (p: Program) => Program) {
      await queryClient.cancelQueries({ queryKey: programKey })
      const prev = queryClient.getQueryData<Program>(programKey)
      if (prev) queryClient.setQueryData(programKey, update(prev))
      return { prev }
    },
    rollback: (ctx?: { prev?: Program }) =>
      queryClient.setQueryData(programKey, ctx?.prev),
    refetch: () => queryClient.invalidateQueries({ queryKey: programKey }),
  }
}

export function useCreateExercise() {
  const cache = usePatchCache()
  return useMutation({
    mutationFn: (input: ExerciseInput) =>
      api.post<Exercise>('/program/exercises', input),
    onSuccess: (created) =>
      cache.queryClient.setQueryData<Program>(programKey, (p) =>
        p ? { ...p, exercises: [...p.exercises, created] } : p,
      ),
  })
}

export function useUpdateExercise() {
  const cache = usePatchCache()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<ExerciseInput>
    }) => api.patch<Exercise>(`/program/exercises/${id}`, patch),
    onMutate: ({ id, patch }) =>
      cache.optimistic((p) => ({
        ...p,
        // Рабочий вес задан руками — сразу точка отсчёта, как сделает сервер.
        exercises: p.exercises.map((e) =>
          e.id === id
            ? {
                ...e,
                ...patch,
                ...(patch.base !== undefined && {
                  baseSetAt: new Date().toISOString(),
                }),
              }
            : e,
        ),
      })),
    onError: (_e, _v, ctx) => cache.rollback(ctx),
    onSuccess: (saved) =>
      cache.queryClient.setQueryData<Program>(programKey, (p) =>
        p
          ? {
              ...p,
              exercises: p.exercises.map((e) =>
                e.id === saved.id ? saved : e,
              ),
            }
          : p,
      ),
  })
}

export function useDeleteExercise() {
  const cache = usePatchCache()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/program/exercises/${id}`),
    onMutate: (id) =>
      cache.optimistic((p) => ({
        ...p,
        exercises: p.exercises.filter((e) => e.id !== id),
      })),
    onError: (_e, _v, ctx) => cache.rollback(ctx),
    // Сервер мог снять замены и привязки альтернатив — берём свежую программу.
    onSettled: () => cache.refetch(),
  })
}

/** Порядок упражнений целиком: [id, …]. */
export function useReorderExercises() {
  const cache = usePatchCache()
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.put<Program>('/program/exercises/order', { ids }),
    onMutate: (ids) =>
      cache.optimistic((p) => ({
        ...p,
        exercises: ids.map((id, position) => ({
          ...p.exercises.find((e) => e.id === id)!,
          position,
        })),
      })),
    onError: (_e, _v, ctx) => cache.rollback(ctx),
    onSuccess: (program) => cache.queryClient.setQueryData(programKey, program),
  })
}

/** Новые «последние веса» разом: { bench: 55, … }. */
export function useSetBases() {
  const cache = usePatchCache()
  return useMutation({
    mutationFn: (bases: Record<string, number>) =>
      api.post<Program>('/program/bases', { bases }),
    onSuccess: (program) => cache.queryClient.setQueryData(programKey, program),
  })
}
