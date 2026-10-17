import { useState } from 'react'
import type { Coach } from '@/entities/coach'
import { errorText } from '@/shared/api'
import { attempt } from '@/shared/lib'
import { InlineEdit } from '@/shared/ui'
import { useUpdateCoach } from '../model/use-update-coach'

/** Лимит анализов ИИ в сутки: число 0…1000, пусто — по умолчанию. */
export function CoachLimitEdit({ coach }: { coach: Coach }) {
  const mutation = useUpdateCoach(coach.id)
  const [invalid, setInvalid] = useState(false)
  const error = invalid
    ? 'Целое число от 0 до 1000 или пусто'
    : mutation.isError
      ? errorText(mutation.error)
      : null

  return (
    <InlineEdit
      label="лимит анализов ИИ в сутки"
      value={coach.aiDailyLimit === null ? '' : String(coach.aiDailyLimit)}
      display={
        coach.aiDailyLimit === null ? (
          <span className="text-muted-foreground">по умолчанию</span>
        ) : (
          <span className="font-mono tabular-nums">
            {coach.aiDailyLimit}
            <span className="text-muted-foreground"> / сут</span>
          </span>
        )
      }
      pending={mutation.isPending}
      error={error}
      inputProps={{
        inputMode: 'numeric',
        placeholder: 'по умолчанию',
        className: 'w-32',
      }}
      onSave={async (raw) => {
        mutation.reset()
        const limit = raw === '' ? null : Number(raw)
        const ok =
          limit === null || (/^\d+$/.test(raw) && limit >= 0 && limit <= 1000)
        setInvalid(!ok)
        if (!ok) return false
        return attempt(() => mutation.mutateAsync({ aiDailyLimit: limit }))
      }}
    />
  )
}
