import { useQuery } from '@tanstack/react-query'
import { Check, HeartPulse } from 'lucide-react'
import { useState } from 'react'
import { clientNotesQuery } from '@/entities/coaching'
import { Button, Card, Spinner, Textarea } from '@/shared/ui'
import { useSaveNotes } from '../model/use-save-notes'

/** Карточка клиента: болезни, травмы, ограничения, цели. ИИ учитывает её в анализе. */
export function NotesEditor({ clientId }: { clientId: string }) {
  const notes = useQuery(clientNotesQuery(clientId))
  return (
    <Card className="gap-3">
      <div className="flex items-center gap-2">
        <HeartPulse className="size-5" />
        <h2 className="display text-2xl">Здоровье и цели</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Болезни, травмы, ограничения, цели — своими словами. ИИ строго учитывает
        это в анализе.
      </p>
      {notes.data ? (
        <Editor key={clientId} clientId={clientId} initial={notes.data.text} />
      ) : notes.isError ? (
        <p className="text-sm text-destructive">Не получилось загрузить.</p>
      ) : (
        <Spinner className="size-5" />
      )}
    </Card>
  )
}

function Editor({ clientId, initial }: { clientId: string; initial: string }) {
  const [text, setText] = useState(initial)
  const save = useSaveNotes(clientId)
  const dirty = text.trim() !== initial.trim()
  return (
    <div className="flex flex-col gap-3">
      <Textarea
        value={text}
        maxLength={4000}
        rows={5}
        placeholder="Например: грыжа L5–S1, без осевой нагрузки; цель — убрать боль и укрепить спину"
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <Button
          variant="ink"
          size="sm"
          disabled={!dirty || save.isPending}
          onClick={() => save.mutate(text)}
        >
          Сохранить
        </Button>
        {save.isSuccess && !dirty && (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Check className="size-4" /> Сохранено
          </span>
        )}
        {save.isError && (
          <span className="text-sm text-destructive">{save.error.message}</span>
        )}
      </div>
    </div>
  )
}
