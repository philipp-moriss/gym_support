import { useQuery } from '@tanstack/react-query'
import { ClipboardList, NotebookPen, Pencil, UserMinus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { clientName, coachClientQuery } from '@/entities/coaching'
import { useEntries } from '@/entities/entry'
import { CYCLE_WEEKS, useProgram } from '@/entities/program'
import { NotesEditor } from '@/features/edit-client-notes'
import { useRenameClient, useUnlinkClient } from '@/features/manage-clients'
import { routes, useScopedRoutes } from '@/shared/config'
import { formatDay, plural } from '@/shared/lib'
import {
  Button,
  Card,
  Confirm,
  Input,
  MenuLink,
  PageHeader,
  PageState,
} from '@/shared/ui'
import { AiAnalysisPanel } from '@/widgets/ai-analysis-panel'
import { ClientChanges } from '@/widgets/client-changes'
import { ClientProgress } from '@/widgets/client-progress'

/** Клиент глазами тренера: здоровье, ИИ-анализ, прогресс, план и дневник. */
export function CoachClientPage() {
  const { clientId = '' } = useParams()
  const client = useQuery(coachClientQuery(clientId))
  const program = useProgram()
  const journal = useEntries()
  const scoped = useScopedRoutes()

  if (
    (client.isError && !client.data) ||
    (program.isError && !program.data) ||
    (journal.isError && !journal.data)
  )
    return (
      <PageState
        error
        onRetry={() => {
          void client.refetch()
          void program.refetch()
          void journal.refetch()
        }}
      />
    )
  if (!client.data || !program.data || !journal.data) return <PageState />
  const c = client.data
  const { entries } = journal
  const exercises = program.data.exercises

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        label={`Неделя ${Math.min(c.week, CYCLE_WEEKS)} из ${CYCLE_WEEKS}${c.week > CYCLE_WEEKS ? ` (идёт ${c.week}-я)` : ''}`}
        title={clientName(c)}
        back={{ to: routes.coach, label: 'Клиенты' }}
      />
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="Последняя"
          value={
            c.lastWorkout
              ? formatDay(c.lastWorkout, { weekday: undefined, month: 'short' })
              : '—'
          }
        />
        <Stat label="За 7 дней" value={`${c.workouts7d} трен.`} />
      </div>
      <nav className="flex flex-col gap-2" aria-label="Клиент">
        <MenuLink
          to={scoped.plan}
          icon={ClipboardList}
          color="var(--hi-vis-yellow)"
          title="План"
          hint={`${exercises.length} ${plural(exercises.length, ['упражнение', 'упражнения', 'упражнений'])} · веса, дни, цикл, правила`}
        />
        <MenuLink
          to={scoped.journal}
          icon={NotebookPen}
          color="var(--bubblegum-pink)"
          title="Дневник"
          hint={
            entries.length
              ? `${entries.length} ${plural(entries.length, ['запись', 'записи', 'записей'])}`
              : 'Пока пусто'
          }
        />
      </nav>
      <NotesEditor clientId={clientId} />
      <AiAnalysisPanel clientId={clientId} exercises={exercises} />
      <ClientProgress entries={entries} exercises={exercises} />
      <ClientChanges clientId={clientId} />
      <ClientSettings
        clientId={clientId}
        alias={c.alias ?? ''}
        login={c.login}
      />
    </div>
  )
}

function ClientSettings({
  clientId,
  alias,
  login,
}: {
  clientId: string
  alias: string
  login: string
}) {
  const navigate = useNavigate()
  const rename = useRenameClient(clientId)
  const unlink = useUnlinkClient(clientId)
  const [name, setName] = useState(alias)
  const [confirm, setConfirm] = useState(false)
  return (
    <Card className="gap-3">
      <span className="mono-label text-muted-foreground">
        Логин клиента: <span className="font-mono">{login}</span>
      </span>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          rename.mutate(name.trim() || null)
        }}
      >
        <Input
          value={name}
          maxLength={80}
          placeholder="Как ты его называешь"
          aria-label="Имя клиента"
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={name.trim() === alias || rename.isPending}
        >
          <Pencil />
          Имя
        </Button>
      </form>
      {confirm ? (
        <Confirm
          text="Клиент останется со своей программой и дневником, но ты больше не увидишь его."
          danger
          onCancel={() => setConfirm(false)}
        >
          <Button
            variant="destructive"
            size="sm"
            disabled={unlink.isPending}
            onClick={() =>
              unlink.mutate(undefined, {
                onSuccess: () => navigate(routes.coach, { replace: true }),
              })
            }
          >
            Отвязать
          </Button>
        </Confirm>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="self-start text-destructive"
          onClick={() => setConfirm(true)}
        >
          <UserMinus />
          Отвязать клиента
        </Button>
      )}
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-block p-3 sm:p-4">
      <span className="mono-label text-stage-muted">{label}</span>
      <span className="display truncate text-2xl sm:text-3xl">{value}</span>
    </div>
  )
}
