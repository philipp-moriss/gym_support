import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { useState } from 'react'
import { ChangeRow, clientChangesQuery } from '@/entities/coaching'
import { Button, Card } from '@/shared/ui'

const PAGE = 8

/** История правок программы клиента: руками тренера и по ИИ. */
export function ClientChanges({ clientId }: { clientId: string }) {
  const { data } = useQuery(clientChangesQuery(clientId))
  const [shown, setShown] = useState(PAGE)
  if (!data?.length) return null
  return (
    <Card className="gap-2">
      <div className="flex items-center gap-2">
        <History className="size-5" />
        <h2 className="display text-2xl">История правок</h2>
      </div>
      <ul className="flex flex-col">
        {data.slice(0, shown).map((c) => (
          <ChangeRow key={c.id} change={c} />
        ))}
      </ul>
      {data.length > shown && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => setShown((n) => n + PAGE * 2)}
        >
          Показать ещё
        </Button>
      )}
    </Card>
  )
}
