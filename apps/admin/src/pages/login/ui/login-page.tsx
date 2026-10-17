import { ShieldCheck } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { LoginForm } from '@/features/auth-by-password'
import { adminToken } from '@/shared/api'
import { routes } from '@/shared/config'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from ?? routes.coaches

  if (adminToken.get()) return <Navigate to={from} replace />

  return (
    <main className="rise mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-accent text-ink">
          <ShieldCheck className="size-8" />
        </span>
        <span className="mono-label text-stage-muted">Журнал тренировок</span>
        <h1 className="display text-[clamp(2.6rem,13vw,4rem)] text-accent">
          Админка
        </h1>
        <p className="text-[17px] text-stage-muted">
          Тренеры, клиенты, промпты и работа ИИ.
        </p>
      </div>
      <LoginForm onSuccess={() => navigate(from, { replace: true })} />
    </main>
  )
}
