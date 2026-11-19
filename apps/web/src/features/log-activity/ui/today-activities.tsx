import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  ACTIVITY_KINDS,
  ActivityIcon,
  ActivityLine,
  useActivities,
} from '@/entities/activity'
import { haptic, todayIso } from '@/shared/lib'
import { Button, Card } from '@/shared/ui'
import { useDeleteActivity } from '../model/mutations'
import { ActivityForm } from './activity-form'

/** «Сегодня»: бассейн, велик и пилатес за день — дополнение к залу, не часть программы. */
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
          вне программы
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
        <button
          type="button"
          onClick={() => {
            haptic()
            setEditing('new')
          }}
          className="flex cursor-pointer items-center gap-3 rounded-md border-2 border-dashed border-stage-border p-4 text-left transition-[border-color,transform] hover:border-foreground active:scale-[0.98]"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <Plus className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-bold">Доп. тренировка</span>
            <span className="text-sm text-stage-muted">
              Бассейн, велосипед или пилатес
            </span>
          </span>
          <span className="flex -space-x-2" aria-hidden>
            {ACTIVITY_KINDS.map((k) => (
              <ActivityIcon
                key={k}
                kind={k}
                className="size-8 ring-2 ring-background [&_svg]:size-4"
              />
            ))}
          </span>
        </button>
      )}
    </section>
  )
}
