import { ArrowRight, Dumbbell, History } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { rememberedLogin } from '@/entities/session'
import { CodeLock, LoginForm } from '@/features/auth-by-code'
import { readLegacy } from '@/features/import-legacy'
import { RegisterFlow } from '@/features/register'
import { session } from '@/shared/api'
import { routes } from '@/shared/config'
import { Button } from '@/shared/ui'

type Step =
  | { kind: 'start' }
  | { kind: 'register' }
  | { kind: 'login' }
  | { kind: 'code'; login: string }

/** Вход: новый аккаунт, ввод логина или сразу экран кода, если логин уже запомнен. */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from ?? routes.today
  const [step, setStep] = useState<Step>(() => {
    const login = rememberedLogin.get()
    return login ? { kind: 'code', login } : { kind: 'start' }
  })
  const [hasLegacy] = useState(() => !!readLegacy())
  const enter = () => navigate(from, { replace: true })

  // Регистрация ставит сессию до экрана с кодом — уводим только с других шагов.
  if (session.hasSession() && step.kind !== 'register')
    return <Navigate to={from} replace />

  return (
    <main className="rise mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 py-10">
      {step.kind === 'start' && (
        <div className="flex w-full flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="grid size-16 place-items-center rounded-full bg-accent text-ink">
              <Dumbbell className="size-8" />
            </span>
            <h1 className="display text-[clamp(2.6rem,13vw,4rem)] text-accent">
              Журнал тренировок
            </h1>
            <p className="text-[17px] text-stage-muted">
              Свой план, веса, которые подстраиваются под самочувствие, награды
              и выгрузка в Excel. Всё хранится в аккаунте.
            </p>
          </div>
          {hasLegacy && (
            <div className="flex items-start gap-3 rounded-md bg-block p-4">
              <History className="mt-0.5 size-5 shrink-0" />
              <p className="text-[15px]">
                В этом браузере есть тренировки из прежней версии. Войди или
                создай аккаунт — предложим их перенести.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setStep({ kind: 'register' })}
              className="h-14 text-lg"
            >
              Создать аккаунт
              <ArrowRight />
            </Button>
            <Button
              variant="highlight"
              onClick={() => setStep({ kind: 'login' })}
              className="h-14 text-lg"
            >
              У меня есть аккаунт
            </Button>
          </div>
        </div>
      )}

      {step.kind === 'register' && (
        <RegisterFlow
          onDone={enter}
          onBack={() => setStep({ kind: 'start' })}
        />
      )}

      {step.kind === 'login' && (
        <LoginForm
          onSubmit={(login) => setStep({ kind: 'code', login })}
          onBack={() => setStep({ kind: 'start' })}
        />
      )}

      {step.kind === 'code' && (
        <CodeLock
          login={step.login}
          onSuccess={enter}
          onSwitchAccount={() => {
            rememberedLogin.clear()
            setStep({ kind: 'start' })
          }}
        />
      )}
    </main>
  )
}
