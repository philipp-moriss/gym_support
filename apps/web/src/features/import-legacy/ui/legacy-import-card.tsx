import { History } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { plural } from '@/shared/lib'
import { Button } from '@/shared/ui'
import { legacyFlag, readLegacy } from '../model/legacy'
import { useImportLegacy } from '../model/use-import-legacy'

/**
 * Предложение перенести данные старой версии из этого браузера. Показывается,
 * пока пользователь не перенёс или не отказался. Старые данные не удаляются.
 */
export function LegacyImportCard({
  userId,
  excelSlot,
}: {
  userId: string
  excelSlot?: ReactNode
}) {
  const [legacy] = useState(() =>
    legacyFlag.get(userId) ? null : readLegacy(),
  )
  const [hidden, setHidden] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const importLegacy = useImportLegacy()

  if (done)
    return (
      <p className="pop-in rounded-md bg-matcha-cream px-4 py-3 font-semibold text-ink">
        {done}
      </p>
    )
  if (!legacy || hidden) return null

  const n = legacy.entries.length
  const days = new Set(legacy.entries.map((e) => e.date)).size
  return (
    <div className="rise flex flex-col gap-4 rounded-md bg-card p-[17px] text-card-foreground">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sky">
          <History className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="display text-2xl">Нашли старые тренировки</h2>
          <p className="text-[15px] text-muted-foreground">
            {n > 0
              ? `В этом браузере ${n} ${plural(n, ['запись', 'записи', 'записей'])} за ${days} ${plural(days, ['день', 'дня', 'дней'])}`
              : 'В этом браузере есть настройки'}
            {legacy.settings ? ', рабочие веса и дата старта' : ''} из прежней
            версии. Перенести в аккаунт?
          </p>
        </div>
      </div>
      {importLegacy.isError && (
        <p className="text-sm font-semibold text-destructive">
          Не получилось перенести. Попробуй ещё раз.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ink"
          disabled={importLegacy.isPending}
          onClick={() =>
            importLegacy.mutate(legacy, {
              onSuccess: ({ added }) => {
                legacyFlag.set(userId, 'imported')
                setDone(
                  `Готово: перенесли ${added} ${plural(added, ['запись', 'записи', 'записей'])} и настройки.`,
                )
              },
            })
          }
        >
          {importLegacy.isPending ? 'Переношу…' : 'Перенести'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            legacyFlag.set(userId, 'dismissed')
            setHidden(true)
          }}
        >
          Не нужно
        </Button>
      </div>
      {excelSlot && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">
            Или загрузи выгрузку из Excel:
          </span>
          {excelSlot}
        </div>
      )}
    </div>
  )
}
