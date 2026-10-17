import type { ReactNode } from 'react'

/** Заголовок страницы: моно-метка, плакатный заголовок, справа — действие. */
export function PageHeader({
  label,
  title,
  description,
  action,
}: {
  label?: string
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          {label && (
            <span className="mono-label text-stage-muted">{label}</span>
          )}
          <h1 className="display text-5xl text-accent sm:text-6xl">{title}</h1>
        </div>
        {action}
      </div>
      {description && (
        <div className="max-w-3xl text-[15px] text-stage-muted">
          {description}
        </div>
      )}
    </header>
  )
}
