import { UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { coachName } from '@/entities/coach'
import { errorText } from '@/shared/api'
import { Button, Card, ErrorText, Field, Input, OneTimeCode } from '@/shared/ui'
import { useCreateCoach } from '../model/use-create-coach'

/** Новый тренер: имя → аккаунт и код входа, который виден только здесь. */
export function CreateCoachForm() {
  const [name, setName] = useState('')
  const mutation = useCreateCoach()
  const created = mutation.data

  const submit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate(name.trim(), { onSuccess: () => setName('') })
  }

  return (
    <Card>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={submit}
      >
        <Field label="Новый тренер" className="flex-1">
          <Input
            placeholder="Имя и фамилия"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Button
          type="submit"
          variant="ink"
          disabled={mutation.isPending || !name.trim()}
        >
          <UserPlus />
          {mutation.isPending ? 'Создаём…' : 'Создать'}
        </Button>
      </form>
      <ErrorText>{mutation.isError && errorText(mutation.error)}</ErrorText>
      {created && (
        <div className="flex flex-col gap-3">
          <OneTimeCode
            title={`${coachName(created.coach)} · логин ${created.coach.login}`}
            code={created.code}
          />
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => mutation.reset()}
          >
            Код записан, скрыть
          </Button>
        </div>
      )}
    </Card>
  )
}
