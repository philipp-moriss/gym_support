import { useQuery } from '@tanstack/react-query'
import { GraduationCap } from 'lucide-react'
import { ChangeRow, unseenChangesQuery } from '@/entities/coaching'
import { Button, Card } from '@/shared/ui'
import { useAckChanges } from '../model/use-ack'

/** На «Сегодня»: что тренер поменял в программе с прошлого раза. */
export function CoachChangesCard() {
  const { data } = useQuery(unseenChangesQuery())
  const ack = useAckChanges()
  if (!data?.length) return null
  return (
    <Card className="gap-2 border-2 border-accent">
      <div className="flex items-center gap-2">
        <GraduationCap className="size-5" />
        <h2 className="display text-2xl">Тренер изменил программу</h2>
      </div>
      <ul className="flex flex-col">
        {data.slice(0, 20).map((c) => (
          <ChangeRow key={c.id} change={c} />
        ))}
      </ul>
      <Button
        variant="ink"
        size="sm"
        className="self-start"
        disabled={ack.isPending}
        onClick={() => ack.mutate()}
      >
        Понятно
      </Button>
    </Card>
  )
}
