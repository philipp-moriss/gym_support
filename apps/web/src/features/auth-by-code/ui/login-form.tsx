import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from '@/shared/ui'

/** Шаг перед кодом: логин, который выдали при регистрации. */
export function LoginForm({
  onSubmit,
  onBack,
}: {
  onSubmit: (login: string) => void
  onBack: () => void
}) {
  const [login, setLogin] = useState('')
  const value = login.trim().toLowerCase()
  return (
    <form
      className="flex w-full max-w-sm flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (value) onSubmit(value)
      }}
    >
      <div className="flex flex-col gap-3">
        <span className="mono-label text-stage-muted">Вход</span>
        <h1 className="display text-5xl text-accent">Твой логин</h1>
        <p className="text-[15px] text-stage-muted">
          Для аккаунтов со старым 6-значным кодом. После входа выдадим код из 8
          цифр — и логин больше не понадобится.
        </p>
      </div>
      <Input
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="otter-4821"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        className="h-14 font-mono text-lg"
        aria-label="Логин"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!value}>
          Дальше
          <ArrowRight />
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Назад
        </Button>
      </div>
    </form>
  )
}
