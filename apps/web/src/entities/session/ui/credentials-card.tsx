import { Check, ClipboardCopy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/ui'

/** Логин и код крупно с кнопкой «Скопировать»: код показываем один раз. */
export function CredentialsCard({
  login,
  code,
}: {
  login: string
  code: string
}) {
  const [copied, setCopied] = useState(false)
  const text = `Журнал тренировок\nЛогин: ${login}\nКод: ${code}`
  return (
    <div className="flex flex-col gap-4 rounded-md bg-card p-5 text-card-foreground">
      <div className="flex flex-col gap-1">
        <span className="mono-label text-muted-foreground">Логин</span>
        <span className="display text-3xl" data-testid="new-login">
          {login}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="mono-label text-muted-foreground">Код</span>
        <span
          className="display font-mono text-5xl tracking-[0.18em]"
          data-testid="new-code"
        >
          {code}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => setCopied(true))
        }}
      >
        {copied ? <Check /> : <ClipboardCopy />}
        {copied ? 'Скопировано' : 'Скопировать'}
      </Button>
    </div>
  )
}
