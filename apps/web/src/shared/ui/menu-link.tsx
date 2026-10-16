import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

/** Строка меню раздела: иконка в цветном кружке, название, подпись, стрелка. */
export function MenuLink({
  to,
  icon: Icon,
  title,
  hint,
  color = 'var(--lilac)',
}: {
  to: string
  icon: LucideIcon
  title: string
  hint?: string
  color?: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-md bg-card p-4 text-card-foreground transition-transform active:scale-[0.99]"
    >
      <span
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink"
        style={{ background: color }}
      >
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[17px] leading-tight font-bold">{title}</span>
        {hint && (
          <span className="truncate text-sm text-muted-foreground">{hint}</span>
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}
