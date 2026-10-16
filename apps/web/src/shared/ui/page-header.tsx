import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

/**
 * Заголовок страницы: моно-метка, плакатный заголовок, справа — действие.
 * У вложенных страниц сверху ссылка «назад» к разделу.
 */
export function PageHeader({
  label,
  title,
  back,
  action,
}: {
  label?: string
  title: string
  back?: { to: string; label: string }
  action?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-3">
      {back && (
        <Link
          to={back.to}
          className="-ml-1 inline-flex items-center gap-1 self-start font-bold text-stage-muted transition-colors hover:text-bone-white"
        >
          <ChevronLeft className="size-5" />
          {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          {label && (
            <span className="mono-label text-stage-muted">{label}</span>
          )}
          <h1 className="display text-5xl text-accent sm:text-6xl">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  )
}
