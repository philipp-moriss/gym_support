import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ActivityLine, useActivities } from '@/entities/activity'
import { todayIso } from '@/shared/lib'
import { Button, Card } from '@/shared/ui'
import { useDeleteActivity } from '../model/mutations'
import { ActivityForm } from './activity-form'

/** «Сегодня»: бассейн и велик за день — дополнение к залу, не часть программы. */
export function TodayActivities() {
  const { data, isError, refetch } = useActivities()
  const remove = useDeleteActivity().mutate
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const today = todayIso()
  const items = (data ?? []).filter((a) => a.date === today)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 pt-2">
        <h2 className="display text-2xl whitespace-nowrap">Доп. тренировки</h2>
        <span className="mono-label shrink-0 text-right text-stage-muted">
          бассейн, велик
        </span>
      </div>

      {isError && !data && (
        <div className="flex items-center gap-3 text-sm text-stage-muted">
          Не удалось загрузить доп. тренировки.
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Повторить
          </Button>
        </div>
      )}

      {items.map((a) => (
        <Card key={a.id} className="gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex min-w-0 flex-1 cursor-pointer"
              aria-expanded={editing === a.id}
              disabled={a.id.startsWith('temp-')}
              onClick={() => setEditing(editing === a.id ? null : a.id)}
            >
              <ActivityLine activity={a} />
            </button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Удалить доп. тренировку"
              disabled={a.id.startsWith('temp-')}
              onClick={() => remove(a.id)}
            >
              <Trash2 />
            </Button>
          </div>
          {editing === a.id && (
            <ActivityForm
              activity={a}
              date={today}
              onDone={() => setEditing(null)}
            />
          )}
        </Card>
      ))}

      {editing === 'new' ? (
        <Card>
          <ActivityForm date={today} onDone={() => setEditing(null)} />
        </Card>
      ) : (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => setEditing('new')}
        >
          <Plus />
          Доп. тренировка
        </Button>
      )}
    </section>
  )
}
