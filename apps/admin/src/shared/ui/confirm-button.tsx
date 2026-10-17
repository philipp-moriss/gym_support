import { useState, type ReactNode } from 'react'
import { Button, type ButtonProps } from './button'
import { Dialog } from './dialog'
import { ErrorText } from './error-text'

/**
 * Кнопка опасного действия: сначала окно с вопросом, потом действие.
 * Окно закрывается, когда действие удалось; ошибку показывает в окне.
 */
export function ConfirmButton({
  title,
  text,
  confirmLabel,
  danger,
  pending,
  error,
  onConfirm,
  onOpen,
  children,
  ...buttonProps
}: Omit<ButtonProps, 'onClick'> & {
  title: string
  text: ReactNode
  confirmLabel: string
  danger?: boolean
  pending?: boolean
  error?: string | null
  /** true — получилось, окно закрывается. */
  onConfirm: () => Promise<boolean>
  /** Окно открылось: например, сбросить прошлую ошибку. */
  onOpen?: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        {...buttonProps}
        onClick={() => {
          onOpen?.()
          setOpen(true)
        }}
      >
        {children}
      </Button>
      {open && (
        <Dialog title={title} onClose={() => !pending && setOpen(false)}>
          <div className="text-[15px]">{text}</div>
          <ErrorText>{error}</ErrorText>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={danger ? 'destructive' : 'ink'}
              size="sm"
              disabled={pending}
              onClick={async () => {
                if (await onConfirm()) setOpen(false)
              }}
            >
              {confirmLabel}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
          </div>
        </Dialog>
      )}
    </>
  )
}
