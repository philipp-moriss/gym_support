import { CloudOff } from 'lucide-react'
import { Button } from './button'
import { Spinner } from './spinner'

/** Пока грузятся данные страницы, и если не загрузились. */
export function PageState({
  error,
  onRetry,
}: {
  error?: boolean
  onRetry?: () => void
}) {
  if (!error) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-7 text-stage-muted" />
      </div>
    )
  }
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <CloudOff className="size-10" />
      <p className="max-w-xs text-stage-muted">
        Не получилось загрузить данные. Проверь интернет.
      </p>
      {onRetry && <Button onClick={onRetry}>Попробовать ещё раз</Button>}
    </div>
  )
}
