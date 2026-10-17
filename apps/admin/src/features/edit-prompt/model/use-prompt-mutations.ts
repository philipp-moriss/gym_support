import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  promptsQuery,
  type PromptInfo,
  type PromptSlot,
} from '@/entities/prompt'
import { api } from '@/shared/api'

/** Ответ сервера сразу кладём в список: редактор видит новый текст без перезапроса. */
function useStorePrompt() {
  const queryClient = useQueryClient()
  return (prompt: PromptInfo) => {
    queryClient.setQueryData(promptsQuery().queryKey, (list) =>
      list?.map((p) => (p.slot === prompt.slot ? prompt : p)),
    )
    void queryClient.invalidateQueries({ queryKey: promptsQuery().queryKey })
  }
}

export function useSavePrompt(slot: PromptSlot) {
  const store = useStorePrompt()
  return useMutation({
    mutationFn: (text: string) =>
      api.put<PromptInfo>(`/prompts/${slot}`, { text }),
    onSuccess: store,
  })
}

/** Вернуть встроенный текст. */
export function useResetPrompt(slot: PromptSlot) {
  const store = useStorePrompt()
  return useMutation({
    mutationFn: () => api.delete<PromptInfo>(`/prompts/${slot}`),
    onSuccess: store,
  })
}
