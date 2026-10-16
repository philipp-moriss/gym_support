import { CloudOff } from 'lucide-react'
import { plural } from '@/shared/lib'
import { usePendingSync } from '../model/use-pending-sync'

/** Плашка «не отправлено: N» и фоновая досылка очереди. Пустая очередь — ничего. */
export function PendingBadge() {
  const count = usePendingSync()
  if (!count) return null
  return (
    <div className="pop-in flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-ink-foreground">
      <CloudOff className="size-4 shrink-0 text-accent" />
      Без сети: {count}{' '}
      {plural(count, ['запись ждёт', 'записи ждут', 'записей ждут'])} отправки
    </div>
  )
}
