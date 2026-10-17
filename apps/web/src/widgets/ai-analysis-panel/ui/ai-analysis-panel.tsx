import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Lightbulb,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import {
  analysesQuery,
  analysisQuery,
  type Analysis,
  type Trend,
} from '@/entities/coaching'
import type { Exercise } from '@/entities/program'
import {
  ChangesPicker,
  limitMinutes,
  useStartAnalysis,
} from '@/features/ai-analysis'
import { cn } from '@/shared/lib'
import { Button, Card, Chip, Spinner } from '@/shared/ui'

const trendIcon: Record<Trend, typeof ArrowRight> = {
  up: ArrowUpRight,
  flat: ArrowRight,
  down: ArrowDownRight,
}

const when = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * ИИ-анализ клиента: кнопка, статус, отчёт по дневнику, правки программы
 * галочками. Последний анализ открыт, прошлые — по датам.
 */
export function AiAnalysisPanel({
  clientId,
  exercises,
}: {
  clientId: string
  exercises: Exercise[]
}) {
  const list = useQuery(analysesQuery(clientId))
  const start = useStartAnalysis(clientId)
  const [picked, setPicked] = useState<string | null>(null)
  const currentId = picked ?? start.data?.id ?? list.data?.[0]?.id ?? null
  const limit = limitMinutes(start.error)

  return (
    <Card className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5" />
          <h2 className="display text-2xl">ИИ-анализ</h2>
        </div>
        <Button
          variant="ink"
          size="sm"
          disabled={start.isPending}
          onClick={() =>
            start.mutate(undefined, { onSuccess: () => setPicked(null) })
          }
        >
          <Sparkles />
          Анализировать
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        ИИ разбирает дневник за 12 недель, затем программу — с учётом карточки
        здоровья. Правки применяешь ты.
      </p>
      {limit !== null ? (
        <p className="text-sm text-destructive">
          Лимит анализов на сегодня исчерпан — снова можно через {limit} мин.
        </p>
      ) : (
        start.isError && (
          <p className="text-sm text-destructive">{start.error.message}</p>
        )
      )}

      {list.data && list.data.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.data.map((a) => (
            <Chip
              key={a.id}
              active={a.id === currentId}
              className="h-8 shrink-0 px-3 text-xs"
              onClick={() => setPicked(a.id)}
            >
              {when(a.createdAt)}
            </Chip>
          ))}
        </div>
      )}

      {currentId && (
        <AnalysisView
          key={currentId}
          clientId={clientId}
          analysisId={currentId}
          exercises={exercises}
        />
      )}
    </Card>
  )
}

function AnalysisView({
  clientId,
  analysisId,
  exercises,
}: {
  clientId: string
  analysisId: string
  exercises: Exercise[]
}) {
  const { data } = useQuery(analysisQuery(clientId, analysisId))
  if (!data || data.status === 'pending')
    return (
      <div className="flex items-center gap-3 rounded-md bg-muted p-4">
        <Spinner className="size-5" />
        <span className="text-sm">ИИ анализирует — обычно до минуты…</span>
      </div>
    )
  if (data.status === 'failed' || !data.result)
    return (
      <div className="flex items-start gap-3 rounded-md bg-bubblegum-pink p-4 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>
          ИИ не ответил, попробуйте позже.
          {data.error && (
            <span className="block text-muted-foreground">{data.error}</span>
          )}
        </span>
      </div>
    )
  return <Report analysis={data} clientId={clientId} exercises={exercises} />
}

function Report({
  analysis,
  clientId,
  exercises,
}: {
  analysis: Analysis
  clientId: string
  exercises: Exercise[]
}) {
  const { journal, program } = analysis.result!
  const names = new Map(exercises.map((e) => [e.id, e.short || e.name]))
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h3 className="mono-label text-muted-foreground">Дневник</h3>
        <p className="text-[15px]">{journal.summary}</p>
        {journal.progress.length > 0 && (
          <ul className="flex flex-col gap-2">
            {journal.progress.map((p) => {
              const Icon = trendIcon[p.trend]
              return (
                <li key={p.exerciseId} className="flex gap-2 text-sm">
                  <Icon
                    className={cn(
                      'mt-0.5 size-4 shrink-0',
                      p.trend === 'down' && 'text-destructive',
                    )}
                    strokeWidth={3}
                  />
                  <span>
                    <b>{names.get(p.exerciseId) ?? p.exerciseId}</b>
                    {p.note && ` — ${p.note}`}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {journal.concerns.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-md bg-bubblegum-pink p-3 text-sm">
            {journal.concerns.map((c) => (
              <li key={c} className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="mono-label text-muted-foreground">Программа</h3>
        <p className="text-[15px]">{program.summary}</p>
        <ChangesPicker
          clientId={clientId}
          analysisId={analysis.id}
          changes={program.changes}
          applied={!!analysis.appliedAt}
        />
        {program.ideas.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-md bg-muted p-3 text-sm">
            {program.ideas.map((idea) => (
              <li key={idea} className="flex gap-2">
                <Lightbulb className="mt-0.5 size-4 shrink-0" />
                {idea}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
