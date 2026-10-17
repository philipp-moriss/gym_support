import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './button'

/**
 * Окно поверх страницы: подтверждения из строк таблицы и одноразовый код.
 * Плоская кремовая карточка на затемнённой сцене, закрывается по Esc и фону.
 * Рисуется в body: анимация страницы (transform) не сдвигает окно.
 */
export function Dialog({
  title,
  onClose,
  closeOnBackdrop = true,
  children,
}: {
  title: string
  onClose: () => void
  closeOnBackdrop?: boolean
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4"
      onClick={(e) =>
        closeOnBackdrop && e.target === e.currentTarget && onClose()
      }
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rise flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-md bg-card p-5 text-card-foreground"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl leading-tight font-bold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="-mt-2 -mr-2"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
