import { Check, ClipboardCopy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/ui'

/** «1234 5678»: восемь цифр читаются и переписываются легче двумя группами. */
const groupCode = (code: string) =>
  code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code

/** Код крупно (и логин мелко, на всякий случай) с кнопкой «Скопировать». Код показываем один раз. */
export function CredentialsCard({
  login,
  code,
}: {
  login: string
  code: string
}) {
  const [copied, setCopied] = useState(false)
  const text = `Журнал тренировок\nКод для входа: ${code}\nЛогин: ${login}`
  return (
    <div className="flex flex-col gap-4 rounded-md bg-card p-5 text-card-foreground">
      <div className="flex flex-col gap-1">
        <span className="mono-label text-muted-foreground">Код для входа</span>
        <span
          className="display font-mono text-[clamp(2.2rem,11vw,3rem)] tracking-[0.12em] whitespace-nowrap"
          data-testid="new-code"
        >
          {groupCode(code)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="mono-label text-muted-foreground">
          Логин — на всякий случай
        </span>
        <span className="font-mono text-lg font-bold" data-testid="new-login">
          {login}
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
