import { CircleAlert } from 'lucide-react'
import { cn } from '@/shared/lib'

/** Ошибка под формой или в строке таблицы. */
export function ErrorText({
  children,
  className,
}: {
  children?: string | false | null
  className?: string
}) {
  if (!children) return null
  return (
    <p
      role="alert"
      className={cn(
        'flex items-start gap-2 text-sm font-medium text-destructive',
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
