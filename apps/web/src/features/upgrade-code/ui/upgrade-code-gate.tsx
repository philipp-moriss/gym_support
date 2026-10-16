import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CredentialsCard, useMe } from '@/entities/session'
import { Button } from '@/shared/ui'
import { useFinishUpgrade, useUpgradeCode } from '../model/use-upgrade-code'

/**
 * Один раз для аккаунтов со старым 6-значным кодом: выдаём код из 8 цифр,
 * дальше вход без логина. Старый код вводить не нужно — пользователь уже вошёл.
 */
export function UpgradeCodeGate() {
  const { data: me } = useMe()
  const upgrade = useUpgradeCode()
  const finish = useFinishUpgrade()
  const [saved, setSaved] = useState(false)
  if (me?.codeDigits !== 6) return null

  // Портал: предки с transform (анимация rise) сломали бы position: fixed.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Новый код для входа"
      className="fixed inset-0 z-30 overflow-y-auto bg-background"
    >
      <div className="rise mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
        {upgrade.data ? (
          <>
            <div className="flex flex-col gap-3">
              <span className="mono-label text-stage-muted">Готово</span>
              <h1 className="display text-5xl text-accent">Твой новый код</h1>
              <p className="text-[15px] text-stage-muted">
                Теперь входишь только по нему — логин вводить не нужно. Старый
                6-значный код больше не подходит. Сохрани новый: больше мы его
                нигде не покажем.
              </p>
            </div>
            <CredentialsCard
              login={upgrade.data.user.login}
              code={upgrade.data.code}
            />
            <label className="flex cursor-pointer items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                className="size-5 accent-[var(--hi-vis-yellow)]"
                checked={saved}
                onChange={(e) => setSaved(e.target.checked)}
              />
              Я сохранил код
            </label>
            <Button
              disabled={!saved}
              className="self-start"
              onClick={() => finish(upgrade.data.user)}
            >
              Продолжить
            </Button>
          </>
        ) : (
          <>
            <span className="grid size-14 place-items-center rounded-full bg-accent text-ink">
              <KeyRound className="size-7" />
            </span>
            <div className="flex flex-col gap-3">
              <h1 className="display text-5xl text-accent">Вход одним кодом</h1>
              <p className="text-[15px] text-stage-muted">
                Логин больше не нужен: выдадим код из 8 цифр, и дальше будешь
                входить только по нему. Все данные остаются на месте.
              </p>
            </div>
            {upgrade.isError && (
              <p className="font-semibold">
                Не получилось. Проверь интернет и попробуй ещё раз.
              </p>
            )}
            <Button
              className="self-start"
              disabled={upgrade.isPending}
              onClick={() => upgrade.mutate()}
            >
              {upgrade.isPending ? 'Выдаю код…' : 'Получить новый код'}
            </Button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
