import { useMutation, useQueryClient } from '@tanstack/react-query'
import { draftsKey, entriesKey, type Drafts } from '@/entities/entry'
import { programKey } from '@/entities/program'
import { api } from '@/shared/api'
import { todayIso } from '@/shared/lib'
import { legacySettingsPatch, type LegacyData } from './legacy'

/** Перенос в аккаунт: записи, настройки цикла, базовые веса и сегодняшние черновики. */
export function useImportLegacy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: LegacyData) => {
      const result = data.entries.length
        ? await api.post<{ added: number; skipped: number }>(
            '/journal/entries/import',
            { entries: data.entries },
          )
        : { added: 0, skipped: 0 }
      if (data.settings) {
        const patch = legacySettingsPatch(data.settings)
        if (Object.keys(patch).length)
          await api.patch('/program/settings', patch)
        if (data.settings.bases && Object.keys(data.settings.bases).length) {
          await api.post('/program/bases', { bases: data.settings.bases })
        }
      }
      if (Object.keys(data.drafts).length) {
        const current = await api.get<Drafts>('/journal/drafts')
        const items = current.date === todayIso() ? current.items : {}
        await api.put('/journal/drafts', {
          date: todayIso(),
          items: { ...data.drafts, ...items },
        })
      }
      return result
    },
    onSettled: () =>
      Promise.all(
        [entriesKey, draftsKey, programKey].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  })
}
