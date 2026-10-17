import { Check, Pencil, X } from 'lucide-react'
import { useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Button } from './button'
import { ErrorText } from './error-text'
import { Input } from './input'

/**
 * Значение в строке таблицы, которое правится на месте: тап по карандашу —
 * поле, Enter — сохранить, Esc — отменить. Ошибку сервера показывает под полем.
 */
export function InlineEdit({
  value,
  display,
  label,
  pending,
  error,
  onSave,
  inputProps,
}: {
  /** Текущее значение для поля ввода. */
  value: string
  /** Как значение выглядит без редактирования. */
  display: ReactNode
  label: string
  pending?: boolean
  error?: string | null
  /** true — сохранилось, поле закрывается. */
  onSave: (value: string) => Promise<boolean>
  inputProps?: ComponentProps<'input'>
}) {
  const [draft, setDraft] = useState<string | null>(null)

  if (draft === null)
    return (
      <span className="inline-flex min-w-0 items-center gap-1">
        <span className="min-w-0 truncate">{display}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          aria-label={`Изменить: ${label}`}
          onClick={() => setDraft(value)}
        >
          <Pencil className="size-3.5!" />
        </Button>
      </span>
    )

  const save = async () => {
    if (draft.trim() === value.trim()) return setDraft(null)
    if (await onSave(draft.trim())) setDraft(null)
  }

  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-1">
        <Input
          autoFocus
          aria-label={label}
          value={draft}
          disabled={pending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save()
            if (e.key === 'Escape') setDraft(null)
          }}
          {...inputProps}
          className={cn('h-9 min-w-24', inputProps?.className)}
        />
        <Button
          variant="ink"
          size="icon"
          className="size-9"
          aria-label="Сохранить"
          disabled={pending}
          onClick={() => void save()}
        >
          <Check />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="Отменить"
          disabled={pending}
          onClick={() => setDraft(null)}
        >
          <X />
        </Button>
      </span>
      <ErrorText>{error}</ErrorText>
    </span>
  )
}
