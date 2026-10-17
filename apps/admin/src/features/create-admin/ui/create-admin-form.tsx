import { ShieldPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { errorText } from '@/shared/api'
import { Button, Card, ErrorText, Field, Input } from '@/shared/ui'
import { useCreateAdmin } from '../model/use-create-admin'

const LOGIN_RE = /^[a-zA-Z0-9._-]{3,40}$/

export function CreateAdminForm() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const mutation = useCreateAdmin()

  const loginOk = LOGIN_RE.test(login)
  const passwordOk = password.length >= 10 && password.length <= 200

  const submit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate(
      { login, password },
      {
        onSuccess: () => {
          setLogin('')
          setPassword('')
        },
      },
    )
  }

  return (
    <Card>
      <h2 className="text-lg font-bold">Новый админ</h2>
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
        onSubmit={submit}
      >
        <Field label="Логин" hint="3–40 символов: латиница, цифры, . _ -">
          <Input
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={40}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </Field>
        <Field label="Пароль" hint="Не короче 10 символов">
          <Input
            type="password"
            autoComplete="new-password"
            maxLength={200}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button
          type="submit"
          variant="ink"
          className="sm:mt-6"
          disabled={mutation.isPending || !loginOk || !passwordOk}
        >
          <ShieldPlus />
          {mutation.isPending ? 'Создаём…' : 'Создать'}
        </Button>
      </form>
      <ErrorText>{mutation.isError && errorText(mutation.error)}</ErrorText>
      {mutation.isSuccess && (
        <p className="text-[15px] font-medium">
          Админ {mutation.data.login} создан. Передай ему пароль лично.
        </p>
      )}
    </Card>
  )
}
