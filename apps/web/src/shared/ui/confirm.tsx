import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Button } from './button'

/** Встроенное подтверждение опасного действия: текст, кнопки действия и «Отмена». */
export function Confirm({
  text,
  danger,
  onCancel,
  children,
}: {
  text: string
  danger?: boolean
  onCancel: () => void
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rise flex flex-col gap-3 rounded-md p-3',
        danger ? 'bg-bubblegum-pink' : 'bg-muted',
      )}
    >
      <p className="text-[15px]">{text}</p>
      <div className="flex flex-wrap gap-2">
        {children}
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
