import { useMutation, useQueryClient } from '@tanstack/react-query'
import { programKey, type Program, type Settings } from '@/entities/program'
import { api } from '@/shared/api'

/** Настройки цикла, расписание, правила. Применяются сразу, сервер подтверждает. */
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<Settings>) =>
      api.patch<Settings>('/program/settings', patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: programKey })
      const prev = queryClient.getQueryData<Program>(programKey)
      if (prev)
        queryClient.setQueryData<Program>(programKey, {
          ...prev,
          settings: { ...prev.settings, ...patch },
        })
      return { prev }
    },
    onError: (_e, _patch, ctx) =>
      queryClient.setQueryData(programKey, ctx?.prev),
    onSuccess: (settings) =>
      queryClient.setQueryData<Program>(programKey, (old) =>
        old ? { ...old, settings } : old,
      ),
  })
}
