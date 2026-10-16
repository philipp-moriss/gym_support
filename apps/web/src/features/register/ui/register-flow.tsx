import { Check, ClipboardCopy, Dumbbell, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui'
import { useRegister, type ProgramTemplate } from '../model/use-register'

const templates: {
  id: ProgramTemplate
  title: string
  text: string
  icon: typeof Dumbbell
}[] = [
  {
    id: 'back',
    title: 'Готовая программа',
    text: '4 недели для спины: 13 упражнений, веса 55–85%, правила безопасности. Всё можно поменять.',
    icon: Dumbbell,
  },
  {
    id: 'empty',
    title: 'С нуля',
    text: 'Пустая программа: сам добавишь упражнения, веса, подходы и дни тренировок.',
    icon: Sparkles,
  },
]

/** Выбор шаблона → аккаунт → экран с логином и кодом (показываем один раз). */
export function RegisterFlow({
  onDone,
  onBack,
}: {
  onDone: () => void
  onBack: () => void
}) {
  const [template, setTemplate] = useState<ProgramTemplate>('back')
  const register = useRegister()
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  if (register.data) {
    const { user, code } = register.data
    const text = `Журнал тренировок\nЛогин: ${user.login}\nКод: ${code}`
    return (
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="mono-label text-stage-muted">Аккаунт создан</span>
          <h1 className="display text-5xl text-accent">Запиши это</h1>
          <p className="text-[15px] text-stage-muted">
            Код больше нигде не покажем и не восстановим. Сохрани его в заметках
            или сделай скриншот.
          </p>
        </div>
        <div className="flex flex-col gap-4 rounded-md bg-card p-5 text-card-foreground">
          <div className="flex flex-col gap-1">
            <span className="mono-label text-muted-foreground">Логин</span>
            <span className="display text-3xl" data-testid="new-login">
              {user.login}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="mono-label text-muted-foreground">Код</span>
            <span
              className="display font-mono text-5xl tracking-[0.18em]"
              data-testid="new-code"
            >
              {code}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => {
              void navigator.clipboard
                ?.writeText(text)
                .then(() => setCopied(true))
            }}
          >
            {copied ? <Check /> : <ClipboardCopy />}
            {copied ? 'Скопировано' : 'Скопировать'}
          </Button>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            className="size-5 accent-[var(--hi-vis-yellow)]"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
          />
          Я сохранил логин и код
        </label>
        <Button disabled={!saved} onClick={onDone} className="self-start">
          Начать тренироваться
        </Button>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="mono-label text-stage-muted">Новый аккаунт</span>
        <h1 className="display text-5xl text-accent">С чего начнём?</h1>
        <p className="text-[15px] text-stage-muted">
          Логин и 6-значный код придумаем сами — без почты и паролей.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplate(t.id)}
            aria-pressed={template === t.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border-[3px] p-4 text-left transition-colors',
              template === t.id
                ? 'border-accent bg-card text-card-foreground'
                : 'border-transparent bg-block',
            )}
          >
            <t.icon className="mt-0.5 size-6 shrink-0" />
            <span className="flex flex-col gap-1">
              <span className="text-lg font-bold">{t.title}</span>
              <span
                className={cn(
                  'text-sm',
                  template === t.id
                    ? 'text-muted-foreground'
                    : 'text-stage-muted',
                )}
              >
                {t.text}
              </span>
            </span>
          </button>
        ))}
      </div>
      {register.isError && (
        <p className="font-semibold">
          Не получилось создать аккаунт. Попробуй ещё раз.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => register.mutate(template)}
          disabled={register.isPending}
        >
          {register.isPending ? 'Создаю…' : 'Создать аккаунт'}
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Назад
        </Button>
      </div>
    </div>
  )
}
