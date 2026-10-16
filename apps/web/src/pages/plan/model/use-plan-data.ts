import { useEntries } from '@/entities/entry'
import { useProgram } from '@/entities/program'

/** Программа и дневник для страниц «Плана»; ready — оба загружены. */
export function usePlanData() {
  const program = useProgram()
  const journal = useEntries()
  return {
    program: program.data,
    entries: journal.entries,
    ready: !!program.data && !!journal.data,
    // Ошибка — только если показать нечего: сохранённые данные лучше пустого экрана.
    error:
      (program.isError && !program.data) || (journal.isError && !journal.data),
    retry: () => void Promise.all([program.refetch(), journal.refetch()]),
  }
}
