import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CredentialsCard, useMe } from '@/entities/session'
import { ApiError } from '@/shared/api'
import { plural } from '@/shared/lib'
import { Button, PinPad } from '@/shared/ui'
import { useChangeCode } from '../model/use-change-code'

/**
 * Полноэкранно поверх приложения: текущий код на PinPad → новый код (один раз).
 * Старый код и другие устройства перестают работать сразу после смены.
 */
export function ChangeCodeFlow({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('')
  const [shake, setShake] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const change = useChangeCode()
  // Текущий код: 6 цифр у старых аккаунтов, 8 — у новых.
  const codeLength = useMe().data?.codeDigits ?? 8

  function submit(value: string) {
    change.mutate(value, {
      onError: (error) => {
        setShake((n) => n + 1)
        setCode('')
        if (error instanceof ApiError && error.status === 429) {
          const sec = Number(error.body?.retryAfterSec ?? 60)
          const min = Math.max(1, Math.ceil(sec / 60))
          setMessage(
            `Слишком много попыток. Попробуй через ${min} ${plural(min, ['минуту', 'минуты', 'минут'])}.`,
          )
        } else if (error instanceof ApiError && error.status === 403) {
          setMessage('Неверный код')
        } else {
          setMessage('Нет связи с сервером. Попробуй ещё раз.')
        }
      },
    })
  }

  // Портал: предки с transform (анимация rise) сломали бы position: fixed.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Смена кода"
      className="fixed inset-0 z-30 overflow-y-auto bg-background"
    >
      <div className="rise mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 py-10">
        {change.data ? (
          <div className="flex w-full max-w-sm flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="mono-label text-stage-muted">Код изменён</span>
              <h1 className="display text-5xl text-accent">Новый код</h1>
              <p className="text-[15px] text-stage-muted">
                Старый код больше не подходит, на других устройствах нужно войти
                заново — одним этим кодом. Больше мы его нигде не покажем,
                сохрани его.
              </p>
            </div>
            <CredentialsCard
              login={change.data.user.login}
              code={change.data.code}
            />
            <label className="flex cursor-pointer items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                className="size-5 accent-[var(--hi-vis-yellow)]"
                checked={saved}
                onChange={(e) => setSaved(e.target.checked)}
              />
              Я сохранил новый код
            </label>
            <Button disabled={!saved} onClick={onClose} className="self-start">
              Готово
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-block">
                <KeyRound className="size-7" />
              </span>
              <h1 className="display text-4xl text-accent">Текущий код</h1>
              <p className="text-[15px] text-stage-muted">
                Введи код, которым входишь сейчас
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
              disabled={change.isPending}
            />

            <p
              className="min-h-6 text-center text-[15px] font-semibold"
              role="alert"
            >
              {message}
            </p>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={change.isPending}
            >
              Отмена
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
