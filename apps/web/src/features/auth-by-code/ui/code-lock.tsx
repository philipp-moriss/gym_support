import { LockKeyhole } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ApiError } from '@/shared/api'
import { plural } from '@/shared/lib'
import { PinPad } from '@/shared/ui'
import { useLogin } from '../model/use-login'

/**
 * Экран кода как на iPhone: точки, круглые кнопки, тряска при ошибке.
 * Без логина — 8-значный код; с логином — старый 6-значный.
 */
export function CodeLock({
  login,
  footer,
  onSuccess,
}: {
  login?: string
  /** Ссылки под клавиатурой: «Создать аккаунт», «Старый вход по логину». */
  footer?: ReactNode
  onSuccess: () => void
}) {
  const codeLength = login ? 6 : 8
  const [code, setCode] = useState('')
  const [shake, setShake] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const { mutate, isPending } = useLogin()

  function submit(value: string) {
    mutate(
      { login, code: value },
      {
        onSuccess,
        onError: (error) => {
          setShake((n) => n + 1)
          setCode('')
          if (error instanceof ApiError && error.status === 429) {
            const sec = Number(error.body?.retryAfterSec ?? 60)
            const min = Math.max(1, Math.ceil(sec / 60))
            setMessage(
              `Слишком много попыток. Попробуй через ${min} ${plural(min, ['минуту', 'минуты', 'минут'])}.`,
            )
          } else if (error instanceof ApiError && error.status === 401) {
            setMessage('Неверный код')
          } else {
            setMessage('Нет связи с сервером. Попробуй ещё раз.')
          }
        },
      },
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-block">
          <LockKeyhole className="size-7" />
        </span>
        <h1 className="display text-4xl text-accent">Введи код</h1>
        <p className="font-mono text-sm text-stage-muted">
          {login ?? `${codeLength} цифр, которые выдали при регистрации`}
        </p>
      </div>

      <PinPad
        value={code}
        onChange={(v) => {
          setMessage(null)
          setCode(v)
          if (v.length === codeLength) submit(v)
        }}
        length={codeLength}
        shakeKey={shake}
        disabled={isPending}
      />

      <p className="min-h-6 text-center text-[15px] font-semibold" role="alert">
        {message}
      </p>

      {footer && (
        <div className="flex flex-wrap justify-center gap-2">{footer}</div>
      )}
    </div>
  )
}
