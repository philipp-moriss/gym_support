import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entriesKey, type EntryInput } from '@/entities/entry'
import {
  programKey,
  type Exercise,
  type ExerciseInput,
} from '@/entities/program'
import { api } from '@/shared/api'

/**
 * Загрузка записей. Если выбраны новые упражнения, сначала они добавляются
 * в программу, и записи с этими названиями сразу привязываются к ним.
 */
export function useImportEntries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      entries,
      newExercises = [],
    }: {
      entries: EntryInput[]
      /** source — название в файле, на него ссылаются записи. */
      newExercises?: { source: string; input: ExerciseInput }[]
    }) => {
      const ids = new Map<string, Exercise>()
      for (const { source, input } of newExercises) {
        ids.set(source, await api.post<Exercise>('/program/exercises', input))
      }
      const linked = entries.map((e) => {
        const ex = !e.exerciseId ? ids.get(e.exercise) : undefined
        return ex ? { ...e, exerciseId: ex.id, exercise: ex.name } : e
      })
      return api.post<{ added: number; skipped: number }>(
        '/journal/entries/import',
        { entries: linked },
      )
    },
    onSettled: () =>
      Promise.all(
        [entriesKey, programKey].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  })
}
