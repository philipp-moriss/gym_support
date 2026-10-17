import { LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Card, ErrorText, Field, Input } from '@/shared/ui'
import { loginErrorText, useLogin } from '../model/use-login'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const mutation = useLogin()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate({ login: login.trim(), password }, { onSuccess })
  }

  return (
    <Card>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label="Логин">
          <Input
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
        </Field>
        <Field label="Пароль">
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <ErrorText>
          {mutation.isError && loginErrorText(mutation.error)}
        </ErrorText>
        <Button
          type="submit"
          variant="ink"
          disabled={mutation.isPending || !login.trim() || !password}
        >
          <LogIn />
          {mutation.isPending ? 'Входим…' : 'Войти'}
        </Button>
      </form>
    </Card>
  )
}
