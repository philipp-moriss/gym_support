import { Dumbbell, Shuffle, Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'
import { CredentialsCard } from '@/entities/session'
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
    title: 'Для спины',
    text: '13 упражнений без осевой нагрузки, правила безопасности. Веса растут сами по повторам и самочувствию.',
    icon: Dumbbell,
  },
  {
    id: 'upper-lower',
    title: 'Верх / низ, 4 дня',
    text: 'Сплит: пн и чт — верх тела, вт и пт — ноги и ягодицы. 12 упражнений, 3×8–12 и 3×12–15.',
    icon: Shuffle,
  },
  {
    id: 'full-body',
    title: 'Всё тело, 3 дня',
    text: 'Пн, ср, пт: по упражнению на каждую группу мышц. Хороший старт для новичка.',
    icon: Zap,
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

  if (register.data) {
    const { user, code } = register.data
    return (
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="mono-label text-stage-muted">Аккаунт создан</span>
          <h1 className="display text-5xl text-accent">Запиши это</h1>
          <p className="text-[15px] text-stage-muted">
            Входить будешь только по этому коду из 8 цифр. Больше мы его нигде
            не покажем и не восстановим — сохрани в заметках или сделай
            скриншот.
          </p>
        </div>
        <CredentialsCard login={user.login} code={code} />
        <label className="flex cursor-pointer items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            className="size-5 accent-[var(--hi-vis-yellow)]"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
          />
          Я сохранил код
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
          Придумаем логин и код из 8 цифр — без почты и паролей. Дальше входишь
          одним кодом.
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
