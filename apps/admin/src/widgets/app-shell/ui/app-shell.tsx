import {
  Bot,
  Dumbbell,
  FileText,
  LogOut,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useMe } from '@/entities/admin'
import { useLogout } from '@/features/logout'
import { routes } from '@/shared/config'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui'

const sections = [
  { to: routes.coaches, label: 'Тренеры', icon: UserRound },
  { to: routes.clients, label: 'Клиенты', icon: Users },
  { to: routes.prompts, label: 'Промпты', icon: FileText },
  { to: routes.ai, label: 'ИИ', icon: Bot },
  { to: routes.admins, label: 'Админы', icon: ShieldCheck },
]

/**
 * Каркас админки: на широком экране — меню слева, на телефоне — шапка
 * и прокручиваемая вбок полоса разделов (прокручивается только она).
 */
export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { data: me } = useMe()
  const logout = useLogout()
  const mobileNav = useRef<HTMLElement>(null)

  // На телефоне полоса разделов уже экрана: текущий раздел держим на виду.
  useEffect(() => {
    mobileNav.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [pathname])

  const exit = () => {
    logout()
    navigate(routes.login, { replace: true })
  }

  const account = (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex min-w-0 flex-col">
        <span className="mono-label text-stage-muted">Админ</span>
        <span className="truncate font-bold">{me?.login}</span>
      </span>
      <Button variant="highlight" size="sm" className="ml-auto" onClick={exit}>
        <LogOut />
        Выйти
      </Button>
    </div>
  )

  const link = (s: (typeof sections)[number]) => (
    <NavLink
      key={s.to}
      to={s.to}
      className={({ isActive }) =>
        cn(
          'flex h-11 shrink-0 items-center gap-2.5 rounded-full px-4 text-[15px] font-bold transition-[background-color,color] duration-200',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-bone-white/75 hover:bg-bone-white/10 hover:text-bone-white',
        )
      }
    >
      <s.icon className="size-5" />
      {s.label}
    </NavLink>
  )

  const logo = (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-ink">
        <Dumbbell className="size-5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="hidden leading-tight font-black lg:inline">
          Журнал тренировок
        </span>
        <span className="mono-label hidden text-stage-muted lg:inline">
          админка
        </span>
        <span className="text-lg font-black lg:hidden">Админка</span>
      </span>
    </span>
  )

  return (
    <div className="lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 bg-block p-5 lg:flex">
        {logo}
        <nav className="flex flex-col gap-1">{sections.map(link)}</nav>
        <div className="mt-auto">{account}</div>
      </aside>

      <header className="sticky top-0 z-30 flex flex-col gap-3 bg-block px-4 pt-3 pb-2 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          {logo}
          <div className="min-w-0 shrink">{account}</div>
        </div>
        <nav
          ref={mobileNav}
          className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
        >
          {sections.map(link)}
        </nav>
      </header>

      <main
        key={pathname}
        className="rise mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6 px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-10"
      >
        <Outlet />
      </main>
    </div>
  )
}
