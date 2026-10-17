import { Check, ClipboardCopy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, Spinner } from '@/shared/ui'
import { useCreateInvite } from '../model/use-clients'

/** Код-приглашение: клиент вводит его у себя в «Профиле» → «Мой тренер». */
export function InviteCard({ onClose }: { onClose: () => void }) {
  const invite = useCreateInvite()
  const [copied, setCopied] = useState(false)
  const { mutate } = invite
  // Один код на открытие карточки, и в StrictMode тоже.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    mutate()
  }, [mutate])

  return (
    <Card className="rise gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="display text-2xl">Приглашение</h2>
        <p className="text-sm text-muted-foreground">
          Клиент открывает «Профиль» → «Мой тренер» и вводит код. Код
          одноразовый.
        </p>
      </div>
      {invite.data ? (
        <div className="flex flex-col gap-1">
          <span
            className="display font-mono text-5xl tracking-[0.2em]"
            data-testid="invite-code"
          >
            {invite.data.code}
          </span>
          <span className="text-sm text-muted-foreground">
            Действует до{' '}
            {new Date(invite.data.expiresAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </div>
      ) : invite.isError ? (
        <p className="text-sm text-destructive">{invite.error.message}</p>
      ) : (
        <Spinner className="size-6" />
      )}
      <div className="flex flex-wrap gap-2">
        {invite.data && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void navigator.clipboard
                ?.writeText(
                  `Журнал тренировок: код тренера ${invite.data.code} — «Профиль» → «Мой тренер»`,
                )
                .then(() => setCopied(true))
            }
          >
            {copied ? <Check /> : <ClipboardCopy />}
            {copied ? 'Скопировано' : 'Скопировать'}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onClose}>
          Закрыть
        </Button>
      </div>
    </Card>
  )
}
