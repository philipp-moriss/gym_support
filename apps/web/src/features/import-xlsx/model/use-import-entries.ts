import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entriesKey, type EntryInput } from '@/entities/entry'
import { api } from '@/shared/api'

export function useImportEntries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entries: EntryInput[]) =>
      api.post<{ added: number; skipped: number }>('/journal/entries/import', {
        entries,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entriesKey }),
  })
}
