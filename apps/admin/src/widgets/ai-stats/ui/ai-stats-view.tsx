import { useQuery } from '@tanstack/react-query'
import { aiStatsQuery, type AiStats } from '@/entities/ai-stats'
import { errorText } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import { Card, DataTable, PageState, type Column } from '@/shared/ui'

type CoachRow = AiStats['byCoach'][number]
type Failure = AiStats['failures'][number]

const num = 'text-right font-mono tabular-nums'

const coachColumns: Column<CoachRow>[] = [
  {
    key: 'coach',
    header: 'Тренер',
    primary: true,
    cell: (r) => <span className="font-bold">{r.coachName}</span>,
  },
  { key: 'total', header: 'Всего', className: num, cell: (r) => r.total },
  { key: 'ready', header: 'Готово', className: num, cell: (r) => r.ready },
  {
    key: 'failed',
    header: 'Ошибки',
    className: num,
    cell: (r) => (
      <span className={r.failed ? 'font-bold text-destructive' : undefined}>
        {r.failed}
      </span>
    ),
  },
]

const failureColumns: Column<Failure>[] = [
  {
    key: 'when',
    header: 'Когда',
    primary: true,
    className: 'whitespace-nowrap',
    cell: (f) => formatDateTime(f.createdAt),
  },
  { key: 'coach', header: 'Тренер', cell: (f) => f.coachName },
  { key: 'client', header: 'Клиент', cell: (f) => f.clientName },
  {
    key: 'error',
    header: 'Ошибка',
    className: 'w-1/2',
    cell: (f) => (
      <span className="block font-mono text-xs break-words whitespace-pre-wrap text-destructive">
        {f.error}
      </span>
    ),
  },
]

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-2">
      <span className="mono-label text-muted-foreground">{label}</span>
      <span className="display text-4xl tabular-nums">{value}</span>
    </Card>
  )
}

/** Сводка анализов ИИ за 30 дней: итоги, по тренерам, последние ошибки. */
export function AiStatsView() {
  const { data, isPending, isError, error, refetch } = useQuery(aiStatsQuery())
  if (isPending) return <PageState />
  if (isError)
    return (
      <PageState
        error
        message={errorText(error)}
        onRetry={() => void refetch()}
      />
    )

  const sum = (key: 'total' | 'ready' | 'failed') =>
    data.byCoach.reduce((n, r) => n + r[key], 0)

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Всего" value={sum('total')} />
        <Stat label="Готово" value={sum('ready')} />
        <Stat label="Ошибки" value={sum('failed')} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">По тренерам</h2>
        <DataTable
          columns={coachColumns}
          rows={data.byCoach}
          rowKey={(r) => r.coachId}
          empty="За 30 дней анализов не было."
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Ошибки</h2>
        <DataTable
          columns={failureColumns}
          rows={data.failures}
          rowKey={(f) => f.id}
          empty="Ошибок нет."
        />
      </section>
    </div>
  )
}
