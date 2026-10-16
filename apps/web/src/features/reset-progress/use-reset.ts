import { useMutation, useQueryClient } from '@tanstack/react-query'
import { draftsKey, entriesKey } from '@/entities/entry'
import { programKey } from '@/entities/program'
import { api } from '@/shared/api'
import { addDays, mondayOf, todayIso } from '@/shared/lib'

/**
 * Переход на неделю n со сбросом подстройки: сегодняшний понедельник
 * становится понедельником n-й недели, старые отметки перестают влиять на веса.
 */
export function useGoToWeek() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (week: number) => {
      const date = todayIso()
      return api.patch('/program/settings', {
        startDate: addDays(mondayOf(date), -(week - 1) * 7),
        resetAt: date,
        swaps: {},
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: programKey }),
  })
}

/** Полный сброс: записи, черновики и цикл. Упражнения и расписание остаются. */
export function useResetAll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete('/journal')
      await api.patch('/program/settings', {
        startDate: mondayOf(todayIso()),
        resetAt: null,
        swaps: {},
      })
    },
    onSettled: () =>
      Promise.all(
        [entriesKey, draftsKey, programKey].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  })
}
