import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { coachName, type Coach } from '@/entities/coach'
import { errorText } from '@/shared/api'
import { Button, Dialog, ErrorText, OneTimeCode } from '@/shared/ui'
import { useResetCode } from '../model/use-reset-code'

/** «Новый код»: подтверждение, потом код в том же окне — один раз. */
export function ResetCodeButton({ coach }: { coach: Coach }) {
  const [open, setOpen] = useState(false)
  const mutation = useResetCode(coach.id)
  const close = () => {
    if (mutation.isPending) return
    setOpen(false)
    mutation.reset()
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3"
        onClick={() => setOpen(true)}
      >
        <KeyRound />
        Новый код
      </Button>
      {open && (
        <Dialog
          title={`Новый код: ${coachName(coach)}`}
          onClose={close}
          // Код показан один раз: случайный клик мимо окна его не прячет.
          closeOnBackdrop={!mutation.data}
        >
          {mutation.data ? (
            <>
              <OneTimeCode
                title={`Логин ${coach.login}`}
                code={mutation.data.code}
              />
              <Button
                variant="ink"
                size="sm"
                className="self-start"
                onClick={close}
              >
                Код записан, закрыть
              </Button>
            </>
          ) : (
            <>
              <p className="text-[15px]">
                Старый код перестанет работать, тренер выйдет на всех
                устройствах.
              </p>
              <ErrorText>
                {mutation.isError && errorText(mutation.error)}
              </ErrorText>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending ? 'Создаём…' : 'Выдать новый код'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={mutation.isPending}
                  onClick={close}
                >
                  Отмена
                </Button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </>
  )
}
