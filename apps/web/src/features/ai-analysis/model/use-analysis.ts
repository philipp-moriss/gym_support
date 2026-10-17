import { useMutation, useQueryClient } from '@tanstack/react-query'
import { coachKeys, type Analysis, type ChangeInput } from '@/entities/coaching'
import { programKey, type Program } from '@/entities/program'
import { ApiError, api } from '@/shared/api'

/** Запуск анализа: сервер отвечает сразу (pending), дальше — опрос. */
export function useStartAnalysis(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<Analysis>(`/coach/clients/${clientId}/analyses`),
    onSuccess: (analysis) => {
      queryClient.setQueryData(
        coachKeys.analysis(clientId, analysis.id),
        analysis,
      )
      void queryClient.invalidateQueries({
        queryKey: coachKeys.analyses(clientId),
        exact: true,
      })
    },
  })
}

/** Лимит анализов на сутки исчерпан: через сколько минут можно снова. */
export const limitMinutes = (error: unknown) =>
  error instanceof ApiError && error.status === 429
    ? Math.ceil(Number(error.body?.retryAfterSec ?? 60) / 60)
    : null

/**
 * Выбранные правки ИИ — все разом. Тренер открыт «от имени» клиента, так что
 * кэш программы — программа клиента: кладём в него ответ.
 */
export function useApplyChanges(clientId: string, analysisId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes: ChangeInput[]) =>
      api.post<Program>(
        `/coach/clients/${clientId}/analyses/${analysisId}/apply`,
        { changes },
      ),
    onSuccess: (program) => {
      queryClient.setQueryData(programKey, program)
      void queryClient.invalidateQueries({
        queryKey: coachKeys.client(clientId),
      })
    },
  })
}
