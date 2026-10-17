import { Sparkles, UserRound } from 'lucide-react'
import { changeFieldLabel } from '../model/labels'
import type { ProgramChange } from '../model/types'

/** Одна правка программы: что, было → стало, почему. */
export function ChangeRow({ change }: { change: ProgramChange }) {
  const Icon = change.source === 'ai' ? Sparkles : UserRound
  return (
    <li className="flex gap-3 border-t border-border py-3 first:border-t-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-semibold">
          {change.exercise ? `${change.exercise}: ` : ''}
          {changeFieldLabel(change).toLowerCase()}
        </span>
        {(change.before || change.after) && (
          <span className="font-mono text-sm break-words whitespace-pre-line text-muted-foreground">
            {change.before ?? '—'} → {change.after ?? '—'}
          </span>
        )}
        {change.reason && <span className="text-sm">{change.reason}</span>}
        <span className="text-xs text-muted-foreground">
          {change.source === 'ai' ? 'По анализу ИИ · ' : ''}
          {new Date(change.createdAt).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </li>
  )
}
