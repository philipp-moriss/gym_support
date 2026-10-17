import { useQuery } from '@tanstack/react-query'
import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { myCoachQuery } from '@/entities/coaching'
import { Button, Card, Confirm, Input } from '@/shared/ui'
import { useLeaveCoach, useLinkCoach } from '../model/use-link'

/** «Мой тренер»: кто ведёт, код приглашения, отвязка. */
export function MyCoachCard() {
  const { data } = useQuery(myCoachQuery())
  const link = useLinkCoach()
  const leave = useLeaveCoach()
  const [code, setCode] = useState('')
  const [confirm, setConfirm] = useState(false)
  if (!data) return null
  const { coach } = data

  return (
    <Card className="gap-3">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-matcha-cream">
          <GraduationCap className="size-6" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="mono-label text-muted-foreground">Мой тренер</span>
          <span className="truncate text-lg font-bold">
            {coach ? coach.name : 'Нет'}
          </span>
        </div>
      </div>
      {coach ? (
        <>
          <p className="text-sm text-muted-foreground">
            Тренер видит дневник и может менять программу — правки появятся на
            «Сегодня» с объяснением.
          </p>
          {confirm ? (
            <Confirm
              text="Тренер перестанет видеть дневник и менять программу."
              danger
              onCancel={() => setConfirm(false)}
            >
              <Button
                variant="destructive"
                size="sm"
                disabled={leave.isPending}
                onClick={() =>
                  leave.mutate(undefined, {
                    onSuccess: () => setConfirm(false),
                  })
                }
              >
                Отвязаться
              </Button>
            </Confirm>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setConfirm(true)}
            >
              Отвязаться от тренера
            </Button>
          )}
        </>
      ) : (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (code.trim()) link.mutate(code.trim())
          }}
        >
          <span className="text-sm text-muted-foreground">
            Есть код от тренера? Введи его — тренер увидит твой дневник и сможет
            вести программу.
          </span>
          <div className="flex gap-2">
            <Input
              value={code}
              maxLength={20}
              autoCapitalize="characters"
              placeholder="K7MX2P"
              className="font-mono uppercase"
              onChange={(e) => setCode(e.target.value)}
            />
            <Button
              type="submit"
              variant="ink"
              disabled={!code.trim() || link.isPending}
            >
              Привязать
            </Button>
          </div>
          {link.isError && (
            <span className="text-sm text-destructive">
              {link.error.message === 'Invalid invite code'
                ? 'Код не подошёл или уже использован'
                : link.error.message}
            </span>
          )}
        </form>
      )}
    </Card>
  )
}
