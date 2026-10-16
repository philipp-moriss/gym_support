import { Download, Plus, Share, Smartphone, X } from 'lucide-react'
import { useState } from 'react'
import { storage } from '@/shared/lib'
import { Button } from '@/shared/ui'
import { usePwaInstall } from '../model/install'

const DISMISS_KEY = 'gym.install-dismissed'

/**
 * Поставить приложение на телефон. Android и Chrome — системное окно установки,
 * iPhone — короткая инструкция: в Safari установка только через «Поделиться».
 */
export function InstallCard({ dismissible }: { dismissible?: boolean }) {
  const { canPrompt, installed, platform, prompt } = usePwaInstall()
  const [hidden, setHidden] = useState(
    () => !!dismissible && !!storage.get(DISMISS_KEY),
  )

  if (installed || hidden) return null
  // На компьютере без системного окна подсказывать нечего.
  if (!canPrompt && platform === 'other') return null

  return (
    <div className="rise relative flex flex-col gap-3 rounded-md bg-card p-[17px] text-card-foreground">
      {dismissible && (
        <button
          type="button"
          aria-label="Скрыть"
          className="absolute top-2 right-2 grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-ink/5"
          onClick={() => {
            storage.set(DISMISS_KEY, true)
            setHidden(true)
          }}
        >
          <X className="size-4" />
        </button>
      )}
      <div className="flex items-start gap-3 pr-8">
        <img
          src="/apple-touch-icon.png"
          alt=""
          className="size-12 shrink-0 rounded-[12px]"
        />
        <div className="flex flex-col gap-1">
          <h2 className="display text-2xl">Поставь на телефон</h2>
          <p className="text-[15px] text-muted-foreground">
            Иконка на экране «Домой», открывается на весь экран, как обычное
            приложение.
          </p>
        </div>
      </div>

      {canPrompt ? (
        <Button
          variant="ink"
          className="self-start"
          onClick={() => void prompt()}
        >
          <Download />
          Установить
        </Button>
      ) : platform === 'ios' ? (
        <ol className="flex flex-col gap-2 text-[15px]">
          <li className="flex items-center gap-3">
            <Step n={1} />
            <span>
              Открой сайт в <b>Safari</b> и нажми{' '}
              <Share className="inline size-4 align-[-2px]" />{' '}
              <b>«Поделиться»</b>
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Step n={2} />
            <span>
              Выбери <Plus className="inline size-4 align-[-2px]" />{' '}
              <b>«На экран „Домой“»</b> и нажми «Добавить»
            </span>
          </li>
        </ol>
      ) : (
        <p className="flex items-center gap-3 text-[15px]">
          <Smartphone className="size-5 shrink-0" />
          <span>
            В меню браузера <b>⋮</b> выбери <b>«Установить приложение»</b> или{' '}
            <b>«Добавить на главный экран»</b>.
          </span>
        </p>
      )}
    </div>
  )
}

function Step({ n }: { n: number }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs font-bold text-ink-foreground">
      {n}
    </span>
  )
}
