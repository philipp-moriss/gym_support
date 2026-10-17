import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from './button'

/** Код входа, который сервер отдаёт один раз: крупно, с копированием. */
export function OneTimeCode({
  code,
  title,
  hint = 'Код показывается один раз. Тренер входит этим кодом в приложение.',
}: {
  code: string
  title?: string
  hint?: string
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Буфер обмена недоступен (не https) — код всё равно виден на экране.
    }
  }

  return (
    <div className="rise flex flex-col gap-3 rounded-md border-2 border-ink bg-accent p-4 text-accent-foreground">
      {title && <span className="text-sm font-bold">{title}</span>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className="font-mono text-4xl font-bold tracking-[0.18em] tabular-nums select-all"
          aria-label={`Код: ${code.split('').join(' ')}`}
        >
          {code.slice(0, 4)} {code.slice(4)}
        </span>
        <Button variant="ink" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Скопирован' : 'Копировать'}
        </Button>
      </div>
      <p className="text-[15px] font-medium">{hint}</p>
    </div>
  )
}
