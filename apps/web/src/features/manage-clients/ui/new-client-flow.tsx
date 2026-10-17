import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { CredentialsCard } from '@/entities/session'
import { Button, Card, Chip, Field, Input } from '@/shared/ui'
import { useCreateClient, type ProgramTemplate } from '../model/use-clients'

/** Новый клиент: имя и шаблон → карточка с кодом входа (показываем один раз). */
export function NewClientFlow({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [template, setTemplate] = useState<ProgramTemplate>('back')
  const create = useCreateClient()

  if (create.data) {
    const { client, code } = create.data
    return (
      <Card className="rise gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="display text-2xl">Клиент создан</h2>
          <p className="text-sm text-muted-foreground">
            Передай код клиенту: он входит им в приложение. Больше код нигде не
            покажется — если потеряется, клиент сменит его сам в «Профиле».
          </p>
        </div>
        <div className="rounded-md bg-ink p-1">
          <CredentialsCard login={client.login} code={code} />
        </div>
        <Button variant="ink" className="self-start" onClick={onClose}>
          Готово
        </Button>
      </Card>
    )
  }

  return (
    <Card className="rise gap-4">
      <h2 className="display text-2xl">Новый клиент</h2>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) create.mutate({ name: name.trim(), template })
        }}
      >
        <Field label="Имя">
          <Input
            value={name}
            maxLength={80}
            autoFocus
            placeholder="Анна"
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="flex flex-col gap-2">
          <span className="mono-label text-muted-foreground">Программа</span>
          <div className="flex flex-wrap gap-2">
            <Chip
              active={template === 'back'}
              onClick={() => setTemplate('back')}
            >
              Готовая для спины
            </Chip>
            <Chip
              active={template === 'empty'}
              onClick={() => setTemplate('empty')}
            >
              С нуля
            </Chip>
          </div>
        </div>
        {create.isError && (
          <p className="text-sm text-destructive">
            Не получилось создать: {create.error.message}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="ink"
            disabled={!name.trim() || create.isPending}
          >
            <UserPlus />
            Создать
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </form>
    </Card>
  )
}
